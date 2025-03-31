import { Compartment, EditorState, Extension, StateEffect } from "@codemirror/state";
import { EditorView } from "codemirror";
import { Accessor } from "solid-js";

function createEditor( props: any, ref: Accessor<HTMLDivElement|undefined>) {
    let view: EditorView | undefined;

    onMount(() => {
        const state = EditorState.create({
            doc: props.doc,
        });

        view = new EditorView({
            state,
            parent: ref(),
            dispatch: (tr): void => {
                view?.update([tr]);

                if (tr?.docChanged) {
                    const change = tr.newDoc.sliceString(0, tr.newDoc.length);
                    props.onValueChange?.(change);
                }
            }
        });

        props.onEditorMount?.(view);

        onCleanup(() => {
            view?.destroy();
        });
    });

    createEffect(
        on(
            () => props.doc,
            (doc) => {
                if (doc === view?.state.doc.toString()) {
                    return;
                }

                view?.dispatch({
                    changes: {
                        from: 0,
                        to: view?.state?.doc?.length ?? 0,
                        insert: doc,
                    },
                });
            },
            { defer: true },
        )
    );
    
    function extension(ext: Extension) {
        const compartment = new Compartment();

        onMount(() => {
            view?.dispatch({ effects: StateEffect.appendConfig.of(compartment.of(ext)) });
        });

        return function reconfigure(ext: Extension) {
            view?.dispatch({ effects: compartment.reconfigure(ext) });
        }
    }

    function updateDoc(doc: string) {
        // track cursor to ensure doc updates don't force cursor to jump
        const cursorPos = view?.state.selection.ranges[0].from || 0;
        view?.dispatch({
            selection: { anchor: cursorPos, head: cursorPos },
            changes: {
                from: 0,
                to: view?.state?.doc?.length ?? 0,
                insert: doc,
            },
        });
    }

    return { extension, updateDoc };
}

export function getJSONErrorPosition(error: SyntaxError, doc: any): number {
    const pos = error.message.match(/at position (\d+)/);
    if (pos) {
        return Math.min(+pos[1], doc?.length ?? 0);
    }

    const lineCol = error.message.match(/at line (\d+) column (\d+)/);
    if (lineCol) {
        return Math.min(doc.line(+lineCol[1]).from + (+lineCol[2]) - 1, doc?.length ?? 0);
    }

    return 0;
}

export default createEditor;