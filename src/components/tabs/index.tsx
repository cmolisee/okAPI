import { VsAdd, VsClose } from "solid-icons/vs";
import { twMerge } from "tailwind-merge";
import Button from "../button";
import { createUniqueId } from "solid-js";
import { TabContext } from "@/lib/tabStore";

function Tabs() {
    const { store, transaction } = useContext(TabContext);
    
    const handleAddTab = () => {
        const newTabId = createUniqueId();

        transaction(produce((draft: any) => {
            if (draft?.tabs?.length) {
                draft.tabs.find((t: ApiMock) => t.isActive).isActive = false;
            }

            draft.tabs.push({ id: newTabId, isActive: true, isEnabled: false, method: 'GET' });
        }));
    };

    const handleRemoveTab = (tabIdToRemove: string) => {
        transaction(
            produce((draft: any) => {
                if (draft.tabs.length === 1) {
                    draft.tabs = []
                }

                const activeIndex = Math.max(0, Math.min(draft.tabs.findIndex((t: ApiMock) => t.isActive), draft.tabs.length - 2));
                draft.tabs = draft.tabs.reduce((updatedTabs: ApiMock[], currentTab: ApiMock, i: number) => {
                    if (currentTab.id !== tabIdToRemove) {
                        updatedTabs.push({ ...currentTab, isActive: i === activeIndex});
                    }
                    
                    return updatedTabs;
                }, []);
            })
        );
    };

    return (
        <div class="flex flex-col gap-2 ">
            <div class="flex flex-wrap flex-row items-center w-full">
                <For each={store.tabs}>
                    {(thisTab) =>{
                        const setActiveTab = () => {
                            if (thisTab.isActive) {
                                return;
                            }

                            transaction(produce((draft: any) => {
                                draft.tabs = draft.tabs.reduce((updatedTabs: ApiMock[], currentTab: ApiMock) => {
                                    updatedTabs.push({ ...currentTab, isActive: currentTab.id === thisTab.id });
                                    return updatedTabs;
                                }, []);
                            }));
                        };

                        const removeTab = () => handleRemoveTab(thisTab.id);

                        return (
                            <Show when={thisTab.id}>
                                <div class={twMerge('flex flex-wrap items-center cursor-pointer rounded-md border-okPurple-700 dark:border-okGreen-700', thisTab.isActive ? 'border-2' : '')}>
                                    <div on:click={setActiveTab}>
                                        <span class="size-fit m-2">{thisTab.method}</span>
                                        <span class="mx-1 text-ellipsis">{`${thisTab.uri ? thisTab.uri : 'untitled'}`}</span>
                                    </div>
                                    <Button onClickCallback={removeTab}><VsClose size={18} class="text-okRed-800" /></Button>
                                </div>
                            </Show>
                        )
                    }}
                </For>
                <div class="tab_item flex mb-[-1px]">
                    <Button styles="addButton" onClickCallback={() => handleAddTab()}>
                        <VsAdd size={18} color="currentColor" class="text-okPurple-700 dark:text-okGreen-700" />
                    </Button>
                </div>
            </div>
            
        </div>
    )
}

export default Tabs;