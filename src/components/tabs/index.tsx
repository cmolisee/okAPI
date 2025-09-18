import { VsAdd, VsClose } from "solid-icons/vs";
import Button from "@/components/inputs/button";
import { useWorkspace } from "@/lib/workspaceStore";
import { getUniqueId } from "@/utils/utils";
import { twMerge } from "tailwind-merge";
import { trackDeep } from "@solid-primitives/deep";

function Tabs() {
    const { workspaceData, workspaceDataTransaction, addWorkspaceItem, removeWorkspaceItem } = useWorkspace();
    
    const handleAddTab = () => {
        const newId = getUniqueId();
        addWorkspaceItem({ 
            name: `GET_${newId}`,
            id: newId,
            children: {},
            data: {
                body: '',
                description: '',
                hasEdits: false,
                isEditing: false,
                isEnabled: false,
                isExpanded: false,
                method: 'GET',
                params: {},
                path: '',
                type: 'mock',
                uri: '',
            }
        });
    };

    const handleRemoveTab = (tabIdToRemove: string) => {
        removeWorkspaceItem(tabIdToRemove);
    };

    // force rerender when workspace changes. i think.
    createEffect(() => {
        const data = trackDeep(workspaceData);
    });
    
    return (
        <div class="flex flex-col gap-2 ">
            <div class="flex flex-wrap flex-row items-center w-full">
                <For each={Object.values(workspaceData)}>
                    {(thisTab) =>{
                        const setActiveTab = () => {
                            if (thisTab.data.isEditing) {
                                return;
                            }

                            workspaceDataTransaction(
                                produce((draft: ObjectArray<MockApiNode>) => {
                                    for (const mock of Object.values(draft)) {
                                        mock.data.isEditing = mock.id === thisTab.id;
                                    }
                                }
                            ));
                        };

                        const removeTab = () => handleRemoveTab(thisTab.id);

                        return (
                            <div
                                on:click={setActiveTab}
                                class={twMerge("group relative flex justify-center mx-[0.125rem] mb-1 text-sm font-medium text-gray-900 bg-white rounded-sm border border-gray-200 focus:ring-1 focus:ring-okPurple-500", thisTab.data.isEditing ? 'border-2 border-okPurple-500' : '')}>
                                <Show when={thisTab.name}>
                                    <div>
                                        <span class="mx-2 text-ellipsis">{thisTab.name}</span>
                                    </div>
                                </Show>
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