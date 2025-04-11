// import { StateEffect, StateField, Transaction } from "@codemirror/state";
// import { EditorView, Panel, showPanel } from "@codemirror/view";


// const editorPanelEffect = StateEffect.define<EditorPanelState>();

// function createEditorPanelState(initialDoc: string, onSaveCallback: (doc: string) => void) {
//     return StateField.define<EditorPanelState>({
//         create: () => ({
//             initialDoc: initialDoc,
//             saveCallback: onSaveCallback,
//             change: false,
//         }),
//         update(value: any, transaction: Transaction) {
//             const currentDoc = transaction.newDoc.toString();
//             const change = currentDoc !== value.initialDoc;

//             // skip unnecessary updates
//             if (!transaction.docChanged) {
//                 return value;
//             }

//             // find/update the existing effect
//             for (let e of transaction.effects) {
//                 if (e.is(editorPanelEffect)) {
//                     return {
//                         initialDoc: value.initialDoc,
//                         saveCallback: value.saveCallback,
//                         change,
//                     }
//                 }
//             }

//             // if an existing effect is not found
//             return {
//                 initialDoc: value.initialDoc,
//                 saveCallback: value.saveCallback,
//                 change,
//             }
//         },
//         provide: (field: StateField<EditorPanelState>) => {
//             return showPanel.from(field, ({ change }) => {
//                 return change ? createEditorPanel(field) : null;
//             });
//         }
//     });
// }

// const createEditorPanel = (editorPanelState: StateField<EditorPanelState>) => (view: EditorView) => {
//     const editorState = view.state.field<EditorPanelState>(editorPanelState);

//     if (!editorState.change) {
//         return { dom: {} as HTMLElement } as Panel;
//     }

//     const div = document.createElement('div');
//     div.className = 'cm-editor-panel flex justify-end gap-8 mx-4 font-bold text-[var(--borderColor)]';

//     const save = document.createElement('button');
//     save.className = 'hover:no-underline hover:text-[var(--buttonHoverColor)] hover:border-[var(--buttonHoverColor)]';
//     save.innerText = 'Save';
//     save.onclick = (e: any) => {
//         e.preventDefault();
//         e.stopPropagation();
//         view && editorState?.saveCallback(view.state.doc.toString());
//     };
    
//     const cancel = document.createElement('button');
//     cancel.className = 'hover:no-underline hover:text-[var(--buttonHoverColor)] hover:border-[var(--buttonHoverColor)]';
//     cancel.innerText = 'Cancel';
//     cancel.onclick = (e: any) => {
//         e.preventDefault();
//         e.stopPropagation();

//         view?.dispatch({
//             changes: {
//                 from: 0,
//                 to: view?.state?.doc?.length ?? 0,
//                 insert: editorState.initialDoc,
//             }
//         });
//     };

//     div.append(save, cancel);

//     return { dom: div } as Panel;
// }

// export function editorPanel(initialDoc: string, onSaveCallback: any) {
//     const editorPanelState = createEditorPanelState(initialDoc, onSaveCallback);
//     return [editorPanelState];
// }