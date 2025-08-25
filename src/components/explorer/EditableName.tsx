import { Editable, useEditable } from "@ark-ui/solid";

function EditableName(props: any) {
    // edit,invalid,oneditchange,value, onvaluechange,onvaluerevert,onvaluecommit
    const editable = useEditable({ placeholder: props.value, activationMode: 'dblclick', maxLength: 48 });

    return (
        <Editable.RootProvider class={'flex gap-2'} value={editable}>
            <Editable.Area on:click={(e) => e.stopPropagation()}>
                <Editable.Input class={'max-w-[24em]'} />
                <Editable.Preview />
            </Editable.Area>
            <Editable.Context>
                {(editable) => (
                    <Editable.Control class={'flex gap-2'}>
                        <Show when={editable().editing}>
                            <Editable.SubmitTrigger>Save</Editable.SubmitTrigger>
                            <Editable.CancelTrigger>Cancel</Editable.CancelTrigger>
                        </Show>
                    </Editable.Control>
                )}
            </Editable.Context>
        </Editable.RootProvider>
    )
}

export default EditableName;