import { VsAdd, VsClose } from "solid-icons/vs";
import Button from "../button";
import { WorkspaceStoreContext } from "@/lib/workspaceStore";
import { getUniqueId } from "@/utils/utils";
import { twMerge } from "tailwind-merge";

function Tabs() {
    const { workspaceData, workspaceDataTransaction } = useContext(WorkspaceStoreContext);
    
    const handleAddTab = () => {
        const newTabId = getUniqueId();

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

                const newActiveItem = draft.data[newActiveIndex];
                newActiveItem.isEditing = true;
            })
        );
    };

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
                            <div
                                on:click={setActiveTab}
                                class={twMerge("group relative flex justify-center mx-[0.125rem] mb-1 text-sm font-medium text-gray-900 bg-white rounded-sm border border-gray-200 focus:ring-1 focus:ring-okPurple-500", thisTab.isEditing ? 'border-2 border-okPurple-500' : '')}>
                                <div>
                                    <span class="size-fit m-2">{thisTab.method}</span>
                                    <span class="mx-2 text-ellipsis">{`${thisTab.uri ? thisTab.uri : 'untitled'}`}</span>
                                </div>
                                <div class='absolute w-full h-full rounded-sm z-10 hidden group-hover:flex'>
                                    <div class="w-full h-full bg-[rgba(0,0,0,0.1)] border border-[rgba(0,0,0,0.1)]" />
                                    <button on:click={removeTab}
                                        class='w-[2rem] h-full bg-okRed-600 border border-okRed-600 flex justify-center items-center'>
                                        <VsClose size={24} class="vs text-[#fff]" />
                                    </button>
                                </div>
                            </div>
                        );
                    }}
                </For>
                <div class="tab_item flex mb-[-1px]">
                    <Button styles="addButton" onClickCallback={() => handleAddTab()}>
                        <VsAdd size={18} color="currentColor" class="vs text-okPurple-500 dark:text-okGreen-500" />
                    </Button>
                </div>
            </div>
            
        </div>
    );
}

export default Tabs;