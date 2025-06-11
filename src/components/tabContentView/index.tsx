import Button from "@/components/inputs/button";
import CodeField from "@/components/codeField";
import Dropdown from "@/components/inputs/dropdown";
import Text from '@/components/inputs/text';
import Toggle from "@/components/inputs/toggle";
import { useWorkspace } from "@/lib/workspaceStore";
import { getUniqueId } from "@/utils/utils";
import { useNavigate } from "@solidjs/router";
import { ImNotification } from "solid-icons/im";
import { VsAdd, VsTrash } from "solid-icons/vs";
import { trackDeep } from "@solid-primitives/deep";

function TabContentView() {
    const navigate = useNavigate();
    const { workspaceData, workspaceDataTransaction } = useWorkspace();

    const Fallback = <div class="m-4">Click the <span class="text-lg text-okPurple-500 dark:text-okGreen-500">+</span> button to create a new mock.</div>;

    const handleMethodUpdate = (e: Event) => {
        const value = (e.target as HTMLSelectElement).value as MethodType;
        workspaceDataTransaction(produce((draft: ObjectArray<OkMock>) => {
            for (const mock of Object.values(draft)) {
                if (mock.metadata.isEditing) {
                    mock.method = value;
                    return;
                }
            }
        }));
    };

    const handleUriUpdate = (e: Event) => {
        const value = (e.target as HTMLInputElement).value;
        workspaceDataTransaction(produce((draft: ObjectArray<OkMock>) => {
            for (const mock of Object.values(draft)) {
                if (mock.metadata.isEditing) {
                    mock.uri = value;
                    return;
                }
            }
        }));
    };

    const handleIsEnabledUpdate = (e: Event) => {
        const value = (e.target as HTMLInputElement).checked;
        workspaceDataTransaction(produce((draft: ObjectArray<OkMock>) => {
            for (const mock of Object.values(draft)) {
                if (mock.metadata.isEditing) {
                    mock.metadata.isEnabled = value;
                    return;
                }
            }
        }));
    };
    
    const handleBodyUpdate = (doc: string) => {
        workspaceDataTransaction(produce((draft: ObjectArray<OkMock>) => {
            for (const mock of Object.values(draft)) {
                if (mock.metadata.isEditing) {
                    mock.body = doc;
                    return;
                }
            }
        }));
    };

    // individual param add, delete, update is handled in <For />
    const handleAddParam = () => {
        workspaceDataTransaction(produce((draft: ObjectArray<OkMock>) => {
            for (const mock of Object.values(draft)) {
                if (mock.metadata.isEditing) {
                    const paramId = getUniqueId();
                    const emptyParam: OkParam = {
                        id: paramId,
                        active: false,
                        key: '',
                        value: '',
                    }

                    mock.params[paramId] = emptyParam;
                    return;
                }
            }
        }));
    };

    const handleRemoveParam = (paramIdToRemove: string) => {
        workspaceDataTransaction(
            produce((draft: ObjectArray<OkMock>) => {
                for (const mock of Object.values(draft)) {
                    if (mock.metadata.isEditing) {
                        delete mock.params[paramIdToRemove];
                        return;
                    }
                }
            })
        );
    };

    const handleSaveMock = () => {
        navigate('/save', { replace: true });
    };

    const isShow = createMemo(() => {
        for (const mock of Object.values(workspaceData)) {
            if (mock.metadata.isEditing) {
                return mock;
            }
        }
    })

    createEffect(() => {
        const data = trackDeep(workspaceData);
        console.log('tabContentView: ', data);
    });

    return (
        <Show when={isShow()} fallback={Fallback} keyed>
            {(tab: OkMock) => (
                <div class="flex flex-col gap-4">
                    <Show when={!tab.metadata.path} fallback={<></>}>
                        <div class="flex flex-row p-[0.375rem] rounded-md items-center my-2 bg-okRed-200">
                            <ImNotification stroke="currentColor" size={18} class="vs mr-2 text-okRed-500 cursor-pointer" />
                            <span class="italic">
                                This mock has not been saved. <span class="text-okBlue-500 italic hover:underline cursor-pointer" on:click={handleSaveMock}>Click here</span> to save this mock.
                            </span>
                        </div>
                    </Show>
                    <div class="flex flex-row justify-between gap-2 align-center">
                        <Dropdown class={'border-solid'} name={'method'} handleChange={handleMethodUpdate}>
                            <option value="GET" selected={tab.method === 'GET'}>GET</option>
                            <option value="POST" selected={tab.method === 'POST'}>POST</option>
                            <option value="PUT" selected={tab.method === 'PUT'}>PUT</option>
                            <option value="DELETE" selected={tab.method === 'DELETE'}>DELETE</option>
                        </Dropdown>
                        <Text class='border-solid' id={'uri'} value={tab.uri} placeholder={'URI'} handleBlur={handleUriUpdate} />
                        <Toggle toggleSize="m" checked={tab.metadata.isEnabled} changeCallback={handleIsEnabledUpdate} />
                    </div>
                    <div>
                        <div class="grid grid-cols-[5fr_7fr] grid-rows-2 gap-2">
                            {/* header */}
                            <div class="text-center border">Key</div>
                            <div class="text-center border">Value</div>
                            {/* defined params */}
                            <For each={Object.values(tab.params)}>
                                {(thisParam) => {
                                    const onActiveChange = (e: Event) => {
                                        const value = (e.target as HTMLInputElement).checked;
                                        workspaceDataTransaction(
                                            produce((draft: ObjectArray<OkMock>) => {
                                                for (const mock of Object.values(draft)) {
                                                    if (mock.metadata.isEditing) {
                                                        const paramToUpdate = mock.params[thisParam.id];
                                                        paramToUpdate.active = value;
                                                        return;
                                                    }
                                                }       
                                            }
                                        ));
                                    }

                                    const onKeyBlur = (e: Event) => {
                                        const value = (e.target as HTMLInputElement).value;
                                        workspaceDataTransaction(
                                            produce((draft: ObjectArray<OkMock>) => {
                                                for (const mock of Object.values(draft)) {
                                                    if (mock.metadata.isEditing) {
                                                        const paramToUpdate = mock.params[thisParam.id];
                                                        paramToUpdate.key = value;
                                                        return;
                                                    }
                                                }       
                                            }
                                        ));
                                    }
                                
                                    const onValueBlur = (e: Event) => {
                                        const value = (e.target as HTMLInputElement).value;
                                        workspaceDataTransaction(
                                            produce((draft: ObjectArray<OkMock>) => {
                                                for (const mock of Object.values(draft)) {
                                                    if (mock.metadata.isEditing) {
                                                        const paramToUpdate = mock.params[thisParam.id];
                                                        paramToUpdate.value = value;
                                                        return;
                                                    }
                                                }       
                                            }
                                        ));
                                    }

                                    const removeParam = () => handleRemoveParam(thisParam.id);

                                    return (
                                        <>
                                            <div class="flex">
                                                <Toggle toggleSize={'s'} checked={thisParam.active} changeCallback={onActiveChange} />
                                                <Button styles="addButton" onClickCallback={removeParam}><VsTrash size={18} class="vs text-okRed-500 dark:text-okRed-500" /></Button>
                                                <Text value={thisParam.key} placeholder={'Key'} handleBlur={onKeyBlur} />
                                            </div>
                                            <Text value={thisParam.value} placeholder={'value'} handleBlur={onValueBlur} />
                                        </>
                                    )
                                }}
                            </For>
                            <div/>
                            <div class="flex justify-end">
                                <Button styles="addButton" onClickCallback={handleAddParam}><VsAdd size={18} class="vs text-okPurple-500 dark:text-okGreen-500" /></Button>
                            </div>
                        </div>
                    </div>
                    <div>
                        <CodeField value={tab?.body ?? '{}'} setValue={handleBodyUpdate} />
                    </div>
                </div>
            )}
        </Show>
    );
}

export default TabContentView;