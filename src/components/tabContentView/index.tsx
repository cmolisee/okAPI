import { VsTrash, VsAdd, VsSave } from "solid-icons/vs";
import Button from "../button";
import Toggle from "../toggle";
import { useWorkspace } from "@/lib/workspaceStore";
import CodeField from "../codeField";
import { getUniqueId } from "@/utils/utils";
import { ImNotification } from "solid-icons/im";
import { useNotifications } from "@/lib/notificationProvider";
import SaveWindow from "../saveWindow";
import Explorer from "../explorer/Explorer";
import { useNavigate } from "@solidjs/router";

function TabContentView() {
    const navigate = useNavigate();
    const { workspaceData, workspaceDataTransaction } = useWorkspace();
    // const { setNotificationContent, setShowNotification } = useNotifications();

    const Fallback = <div class="m-4">Click the <span class="text-lg text-okPurple-500 dark:text-okGreen-500">+</span> button to create a new mock.</div>;

    const handleMethodUpdate = (e: Event) => {
        const value = (e.target as HTMLSelectElement).value as MethodType;
        workspaceDataTransaction(produce((draft: WorkspaceData) => {
            const workspaceItem = draft.data.find((t: WorkspaceDataItem) => t.isEditing);
            if (workspaceItem) {
                workspaceItem.method = value;
            }
        }));
    };

    const handleUriUpdate = (e: Event) => {
        const value = (e.target as HTMLInputElement).value;
        workspaceDataTransaction(produce((draft: WorkspaceData) => {
            const workspaceItem = draft.data.find((t: WorkspaceDataItem) => t.isEditing);
            if (workspaceItem) {
                workspaceItem.uri = value;
            }
        }));
    };

    const handleIsEnabledUpdate = (e: Event) => {
        const value = (e.target as HTMLInputElement).checked;
        workspaceDataTransaction(produce((draft: WorkspaceData) => {
            const workspaceItem = draft.data.find((t: WorkspaceDataItem) => t.isEditing);
            if (workspaceItem) {
                workspaceItem.isEnabled = value;
            }
        }));
    };
    
    const handleBodyUpdate = (doc: string) => {
        workspaceDataTransaction(produce((draft: WorkspaceData) => {
            const workspaceItem = draft.data.find((t: WorkspaceDataItem) => t.isEditing);
            if (workspaceItem) {
                workspaceItem.body = doc;
            }
        }));
    };

    // individual param add, delete, update is handled in <For />
    const handleAddParam = () => {
        workspaceDataTransaction(produce((draft: WorkspaceData) => {
            const workspaceItem = draft.data.find((t: WorkspaceDataItem) => t.isEditing);
            if (workspaceItem) {
                workspaceItem.params = workspaceItem?.params?.length 
                    ? [ ...workspaceItem.params, { id: getUniqueId() }]
                    : [{ id: getUniqueId() }];
            }
        }));
    };

    const handleRemoveParam = (paramIdToRemove: string) => {
        workspaceDataTransaction(
            produce((draft: WorkspaceData) => {
                const workspaceItem = draft.data.find((t: WorkspaceDataItem) => t.isEditing);

                if (workspaceItem) {
                    workspaceItem.params = workspaceItem.params?.filter((p: MockParam) => p.id !== paramIdToRemove);
                }
            })
        );
    };

    interface ApiMockNode {
        name?: string;
        path?: string;
        type?: "mock" | "folder" | "root";
        // todo: add description to describe folder, flow, etc...
        children?: ApiMockNode[];
        mock?: ApiMock;
    }

    interface ApiMock {
        // TODO: add alias to replace method+uri
        // todo: add description to describe mock
        id?: string;
        isEditing?: boolean;
        isEnabled: boolean;
        method: MethodType;
        uri?: string;
        body?: string;
        params?: MockParam[];
    }

    // workspace 
        // Array of ApiMock objects
        // also has dataPath which is null if it hasn't previously been saved...

    // explorer
        // ApiMockNode

    const handleSaveMock = () => {
        if (!workspaceData.data.find((t: WorkspaceDataItem) => t.isEditing)?.dataPath) {
            navigate('/save', { replace: true });
        }
    }

    return (
        <Show when={workspaceData.data.find((t: WorkspaceDataItem) => t.isEditing)} fallback={Fallback} keyed>
            {(tab: WorkspaceDataItem) => (
                <div>
                    <Show when={!tab.dataPath} fallback={<></>}>
                        <div class="flex flex-row p-[0.375rem] rounded-md items-center my-2 bg-okRed-200">
                            <ImNotification stroke="currentColor" size={18} class="vs mr-2 text-okRed-500 cursor-pointer" />
                            <span class="italic">
                                This mock has not been saved. <span class="text-okBlue-500 italic hover:underline cursor-pointer" on:click={handleSaveMock}>Click here</span> to save this mock.
                            </span>
                        </div>
                    </Show>
                    <div class="flex flex-row justify-between align-center my-2">
                        <div class="flex flex-row border border-solid rounded-sm w-[85%]">
                            <div class="mr-4">
                                <select class="border-none bg-primary-bg dark:bg-primary-bg text-primary-text dark:text-primary-text" name="method" on:change={handleMethodUpdate}>
                                    <option value="GET" selected={tab.method === 'GET'}>GET</option>
                                    <option value="POST" selected={tab.method === 'POST'}>POST</option>
                                    <option value="PUT" selected={tab.method === 'PUT'}>PUT</option>
                                    <option value="DELETE" selected={tab.method === 'DELETE'}>DELETE</option>
                                </select>
                            </div>
                            <input id="uri" class="bg-primary-bg dark:bg-primary-bg text-primary-text dark:text-primary-text w-full  border-l px-2" type="text" value={tab.uri ?? ''} placeholder="URI" on:blur={handleUriUpdate} /> 
                        </div>
                        <Toggle toggleSize="m" checked={tab.isEnabled} changeCallback={handleIsEnabledUpdate} />
                    </div>
                    <div class="my-2">
                        <div class="grid grid-cols-[5fr_7fr] grid-rows-2 gap-1">
                            {/* header */}
                            <div class="text-center border">Key</div>
                            <div class="text-center border">Value</div>
                            {/* defined params */}
                            <For each={tab.params}>
                                {(thisParam) => {
                                    const onActiveChange = (e: Event) => {
                                        const value = (e.target as HTMLInputElement).checked;
                                        workspaceDataTransaction(produce((draft: WorkspaceData) => {
                                            const workspaceItem = draft.data.find((t: WorkspaceDataItem) => t.isEditing);
                                            if (workspaceItem) {
                                                const updatedParams = [...workspaceItem?.params ?? []];
                                                updatedParams.find((p: MockParam) => p.id === thisParam.id).active = value;
                                            }
                                        }));
                                    }

                                    const onKeyBlur = (e: Event) => {
                                        const value = (e.target as HTMLInputElement).value;
                                        workspaceDataTransaction(produce((draft: WorkspaceData) => {
                                            const workspaceItem = draft.data.find((t: WorkspaceDataItem) => t.isEditing);
                                            if (workspaceItem) {
                                                const updatedParams = [...workspaceItem?.params ?? []];
                                                updatedParams.find((p: MockParam) => p.id === thisParam.id).key = value;
                                            }
                                        }));
                                    }
                                
                                    const onValueBlur = (e: Event) => {
                                        const value = (e.target as HTMLInputElement).value;
                                        workspaceDataTransaction(produce((draft: WorkspaceData) => {
                                            const workspaceItem = draft.data.find((t: WorkspaceDataItem) => t.isEditing);
                                            if (workspaceItem) {
                                                const updatedParams = [...workspaceItem?.params ?? []];
                                                updatedParams.find((p: MockParam) => p.id === thisParam.id).value = value;
                                            }
                                        }));
                                    }

                                    const removeParam = () => handleRemoveParam(thisParam.id);

                                    return (
                                        <>
                                            <div class="flex">
                                                <Toggle toggleSize="m" checked={thisParam.active} changeCallback={onActiveChange} />
                                                <Button styles="addButton" onClickCallback={removeParam}><VsTrash size={18} class="vs text-okRed-500 dark:text-okRed-500" /></Button>
                                                <input class="bg-primary-bg dark:bg-primary-bg text-primary-text dark:text-primary-text w-full px-2 border " type="text" value={thisParam.key || ''} placeholder="Key" on:blur={onKeyBlur}/>
                                            </div>
                                            <input class="bg-primary-bg dark:bg-primary-bg text-primary-text dark:text-primary-text w-full px-2 border" type="text" value={thisParam.value || ''} placeholder="Value" on:blur={onValueBlur}/>
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
                    <div class="my-2">
                        <CodeField value={tab?.body ?? '{}'} setValue={handleBodyUpdate} />
                    </div>
                </div>
            )}
        </Show>
    );
}

export default TabContentView;