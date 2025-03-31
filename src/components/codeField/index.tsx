import { EditorView } from "codemirror";
import { json } from "@codemirror/lang-json";
import createEditor, { getJSONErrorPosition } from "@/components/createEditor";
import { Diagnostic, linter, lintGutter, lintKeymap } from '@codemirror/lint';
import { crosshairCursor, drawSelection, dropCursor, highlightActiveLine, highlightActiveLineGutter, highlightSpecialChars, keymap, lineNumbers, rectangularSelection } from "@codemirror/view";
import { EditorState } from "@codemirror/state";
import { autocompletion, closeBrackets, closeBracketsKeymap, completionKeymap } from "@codemirror/autocomplete";
import { defaultKeymap, history, historyKeymap } from "@codemirror/commands";
import { bracketMatching, defaultHighlightStyle, foldGutter, foldKeymap, indentOnInput, indentUnit, syntaxHighlighting } from "@codemirror/language";
import { highlightSelectionMatches, searchKeymap } from "@codemirror/search";
import createDebounce from "@/lib/debounce";


function CodeField(props: any) {
    let editorRef: HTMLDivElement | undefined;
    const handleDebouncedChange = createDebounce((doc: string) => {
        props.setValue(doc);
    });

    // GET THE CURSOR POSITION...
    
    const editorLinter = linter((view: EditorView): Diagnostic[] => {
        try {
            JSON.parse(view.state.doc.toString());
        } catch (e) {
            if (!(e instanceof SyntaxError)) {
                throw e;
            }

            const pos = getJSONErrorPosition(e, view.state.doc);
            const line = view.state.doc.lineAt(pos);

            return [{
                from: line.from,
                message: e.message,
                severity: 'error',
                to: line.to
            }];
        }

        return [];
    });

    onMount(() => {
        const { extension, updateDoc } = createEditor(
            { 
                doc: props.value,
                onValueChange: handleDebouncedChange,
            },
            () => editorRef
        );

        extension(lineNumbers());
        extension(highlightActiveLineGutter());
        extension(highlightSpecialChars());
        extension(history());
        extension(foldGutter());
        extension(drawSelection());
        extension(dropCursor());
        extension(EditorState.allowMultipleSelections.of(true));
        extension(indentOnInput());
        extension(syntaxHighlighting(defaultHighlightStyle, { fallback: true }));
        extension(bracketMatching());
        extension(closeBrackets());
        extension(autocompletion());
        extension(rectangularSelection());
        extension(crosshairCursor());
        extension(highlightActiveLine());
        extension(highlightSelectionMatches());
        extension(keymap.of([
            ...closeBracketsKeymap,
            ...defaultKeymap,
            ...searchKeymap,
            ...historyKeymap,
            ...foldKeymap,
            ...completionKeymap,
            ...lintKeymap,
        ]));
        extension(EditorView.lineWrapping);
        extension(json());
        extension(indentUnit.of('    '));
        extension(lintGutter());
        extension(editorLinter);

        // todo: configure custom theme
        // const reconfigureTheme = extension(getEditorTheme(theme()));

        // reconfigure doc value on data update
        createEffect(on(() => props.value, (doc: string) => updateDoc(doc)));

        // reconfigure theme on theme update
        // configure custom theme...
        // createEffect(on(theme, () => reconfigureTheme(getEditorTheme(theme()))));
    });

    return (
		<div ref={editorRef} />
	);
}

export default CodeField;