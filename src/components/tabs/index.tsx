import { VsAdd, VsClose } from "solid-icons/vs";
import { twMerge } from "tailwind-merge";
import Button from "../button";
import { createUniqueId } from "solid-js";
import { WorkspaceStoreContext } from "@/lib/workspaceStore";
// import { mockExplorerContext } from "@/lib/mockExplorerStore";

function Tabs() {
    // const { mockExplorerData, mockExplorerDataTransaction } = useContext(mockExplorerContext);
    const { workspaceData, workspaceDataTransaction } = useContext(WorkspaceStoreContext);
    
    const handleAddTab = () => {
        const newTabId = createUniqueId();

        workspaceDataTransaction(produce((draft:WorkspaceData) => {
            if (draft.data.length) {
                draft.data.find((t: WorkspaceDataItem) => t.isEditing)!.isEditing = false;
            }

            draft.data.push({ dataPath: null, id: newTabId, isEditing: true, isEnabled: false, method: 'GET' });
        }));
    };

    const handleRemoveTab = (tabIdToRemove: string) => {
        workspaceDataTransaction(produce((draft: WorkspaceData) => {
                if (draft.data.length === 1) {
                    draft.data = [];
                    return;
                }

                const newActiveIndex = Math.max(0, Math.min(draft.data.findIndex((t: ApiMock) => t.isEditing), draft.data.length - 2));
                draft.data = draft.data.filter((w: WorkspaceDataItem) => w.id !== tabIdToRemove);
                draft.data[newActiveIndex].isEditing = true;
            })
        );
    };

    // TODO:
        // create field to save individual mocks to a specific path
        // this will need to include the logic to call mockExploereDataTransaction with an update to 
            // create that "path" if it DNE
            // add the mock to the path if it does exist
        // this will also need to include logic to call workspaceDataTransaction to update the workspace items 
            // dataPath to the corresponding mockExplorerData path.

    return (
        <div class="flex flex-col gap-2 ">
            <div class="flex flex-wrap flex-row items-center w-full">
                <For each={workspaceData.data}>
                    {(thisTab) =>{
                        const setActiveTab = () => {
                            if (thisTab.isEditing) {
                                return;
                            }

                            workspaceDataTransaction(produce((draft: WorkspaceData) => {
                                draft.data = draft.data.reduce((updatedTabs: WorkspaceDataItem[], currentTab: WorkspaceDataItem) => {
                                    updatedTabs.push({ ...currentTab, isEditing: currentTab.id === thisTab.id });
                                    return updatedTabs;
                                }, []);
                            }));
                        };

                        const removeTab = () => handleRemoveTab(thisTab.id as string);

                        return (
                            <Show when={thisTab.id}>
                                <div class={twMerge('flex flex-wrap items-center cursor-pointer rounded-md border-okPurple-500 dark:border-okGreen-500', thisTab.isEditing ? 'border-2' : '')}>
                                    <div on:click={setActiveTab}>
                                        <span class="size-fit m-2">{thisTab.method}</span>
                                        <span class="mx-1 text-ellipsis">{`${thisTab.uri ? thisTab.uri : 'untitled'}`}</span>
                                    </div>
                                    <Button onClickCallback={removeTab}><VsClose size={18} class="vs text-okRed-500" /></Button>
                                </div>
                            </Show>
                        )
                    }}
                </For>
                <div class="tab_item flex mb-[-1px]">
                    <Button styles="addButton" onClickCallback={() => handleAddTab()}>
                        <VsAdd size={18} color="currentColor" class="vs text-okPurple-500 dark:text-okGreen-500" />
                    </Button>
                </div>
            </div>
            
        </div>
    )
}

export default Tabs;