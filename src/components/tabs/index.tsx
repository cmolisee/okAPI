import { VsAdd, VsClose, VsTrash } from "solid-icons/vs";
import { twMerge } from "tailwind-merge";
import "~/assets/tailwind.css";
import Button from "../button";
import { createUniqueId } from "solid-js";
import { SetStoreFunction } from "solid-js/store";
import "./styles.css";

export type MethodType = 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';
export interface Param {
    id: string;
    active?: boolean;
    key?: string;
    value?: string;
}
export interface Mock {
    id: string;
    isActive: boolean;
    isEnabled: boolean;
    uri?: string;
    method: MethodType;
    params?: Param[];
    body?: string;
}

export interface TabStore {
    tabs: Mock[];
}

export interface TabContext {
    store: TabStore;
    transaction: SetStoreFunction<TabStore>;
}

const TabContext = createContext<TabContext>({ store: { tabs: [] }, transaction: () => {} });
export function TabStore(props: any) {
    const [store, transaction] = createStore<TabStore>({
        tabs: [],
    });

    return (
        <TabContext.Provider value={{ store, transaction }}>
            {props.children}
        </TabContext.Provider>
    )
}

export function Tabs() {
    const { store, transaction } = useContext(TabContext);
    
    const handleAddTab = () => {
        const newTabId = createUniqueId();

        transaction(produce((draft: any) => {
            if (draft?.tabs?.length) {
                draft.tabs.find((t: Mock) => t.isActive).isActive = false;
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

                const activeIndex = Math.max(0, Math.min(draft.tabs.findIndex((t: Mock) => t.isActive), draft.tabs.length - 2));
                draft.tabs = draft.tabs.reduce((updatedTabs: Mock[], currentTab: Mock, i: number) => {
                    if (currentTab.id !== tabIdToRemove) {
                        updatedTabs.push({ ...currentTab, isActive: i === activeIndex});
                    }
                    
                    return updatedTabs;
                }, []);
            })
        );
    };

    return (
        <div class="flex flex-col gap-2">
            <div class="flex flex-wrap flex-row items-center w-full">
                <For each={store.tabs}>
                    {(thisTab) =>{
                        const setActiveTab = () => {
                            if (thisTab.isActive) {
                                return;
                            }

                            transaction(produce((draft: any) => {
                                draft.tabs = draft.tabs.reduce((updatedTabs: Mock[], currentTab: Mock) => {
                                    updatedTabs.push({ ...currentTab, isActive: currentTab.id === thisTab.id });
                                    return updatedTabs;
                                }, []);
                            }));
                        };

                        const removeTab = () => handleRemoveTab(thisTab.id);

                        return (
                            <Show when={thisTab.id}>
                                <div class={twMerge('flex flex-wrap items-center cursor-pointer rounded-md border-[#98e5c7] p-2 m-2', thisTab.isActive ? 'border-2' : '')}>
                                    <div on:click={setActiveTab}>
                                        <span class="size-fit">{thisTab.method}</span>
                                        <span class="mx-1 text-ellipsis">{`${thisTab.uri ? thisTab.uri : 'untitled'}`}</span>
                                    </div>
                                    <Button onClickCallback={removeTab}><VsClose size={18} /></Button>
                                </div>
                            </Show>
                        )
                    }}
                </For>
                <div class="tab_item flex mb-[-1px]"><Button styles="addButton" onClickCallback={() => handleAddTab()}><VsAdd size={18} color="#98e5c7" /></Button></div>
            </div>
            
        </div>
    )
}

export function TabContentView(props: any) {
    const { store, transaction } = useContext(TabContext);

    const handleMethodUpdate = (e: Event) => {
        const value = (e.target as HTMLSelectElement).value as MethodType;
        transaction(produce((draft: any) => {
            const tab = draft.tabs.find((t: Mock) => t.isActive);
            if (tab) {
                tab.method = value;
            }
        }));
    };

    const handleUriUpdate = (e: Event) => {
        const value = (e.target as HTMLInputElement).value;
        transaction(produce((draft: any) => {
            const tab = draft.tabs.find((t: Mock) => t.isActive);
            if (tab) {
                tab.uri = value;
            }
        }));
    };

    const handleIsEnabledUpdate = (e: Event) => {
        const value = (e.target as HTMLInputElement).checked;
        transaction(produce((draft: any) => {
            const tab = draft.tabs.find((t: Mock) => t.isActive);
            if (tab) {
                tab.isEnabled = value;
            }
        }));
    };

    const handleBodyUpdate = (e: Event) => {
        const value = (e.target as HTMLTextAreaElement).value;
        transaction(produce((draft: any) => {
            const tab = draft.tabs.find((t: Mock) => t.isActive);
            if (tab) {
                tab.body = value;
            }
        }));
    };
    
    // individual param add, delete, update is handled in <For />
    const handleAddParam = () => {
        transaction(produce((draft: any) => {
            const tab = draft.tabs.find((t: Mock) => t.isActive);
            if (tab) {
                tab.params = tab?.params?.length 
                    ? [ ...tab.params, { id: createUniqueId() }]
                    : [{ id: createUniqueId() }];
            }
        }));
    };

    const handleRemoveParam = (paramIdToRemove: string) => {
        transaction(
            produce((draft: any) => {
                const tab = draft.tabs.find((t: Mock) => t.isActive);

                if (tab) {
                    tab.params = tab.params.filter((p: Param) => p.id !== paramIdToRemove);
                }
            })
        );
    };

    return (
        <Show when={store.tabs.find((t: Mock) => t.isActive)} fallback={<div></div>} keyed>
            {(tab) => (
                <div class="m-2">
                    <div class="flex flex-row justify-between align-centermy-2">
                        <div class="flex flex-row border border-solid rounded-sm w-[85%]">
                            <div class="mr-4">
                                <select class="border-none" name="method" on:change={handleMethodUpdate}>
                                    <option value="GET" selected={tab.method === 'GET'}>GET</option>
                                    <option value="POST" selected={tab.method === 'POST'}>POST</option>
                                    <option value="PUT" selected={tab.method === 'PUT'}>PUT</option>
                                    <option value="DELETE" selected={tab.method === 'DELETE'}>DELETE</option>
                                </select>
                            </div>
                            <input id="uri" class="bg-stone-100 w-full  border-l px-2" type="text" value={tab.uri ?? ''} placeholder="URI" on:blur={handleUriUpdate} /> 
                        </div>
                        <input type="checkbox" id="isEnabled" name="isEnabled" checked={tab.isEnabled} aria-checked={tab.isEnabled} on:change={handleIsEnabledUpdate} />
                    </div>
                    <div class="my-2">
                        <textarea id="body" class="w-full" name="body" cols="50" placeholder="{}" on:blur={handleBodyUpdate}/>
                    </div>
                    <div class="my-2">
                        <div class="grid grid-cols-[6%_6%_25%_63%] grid-rows-2 gap-1">
                            {/* header */}
                            <div class="text-center border"></div>
                            <div class="text-center border"></div>
                            <div class="text-center border">Key</div>
                            <div class="text-center border">Value</div>
                            {/* defined params */}
                            <For each={tab.params}>
                                {(thisParam) => {
                                    const onActiveChange = (e: Event) => {
                                        const value = (e.target as HTMLInputElement).checked;
                                        transaction(produce((draft: any) => {
                                            const tab = draft.tabs.find((t: Mock) => t.isActive);
                                            if (tab) {
                                                const updatedParams = [...tab.params];
                                                updatedParams.find((p: Param) => p.id === thisParam.id).active = value;
                                            }
                                        }));
                                    }

                                    const onKeyBlur = (e: Event) => {
                                        const value = (e.target as HTMLInputElement).value;
                                        transaction(produce((draft: any) => {
                                            const tab = draft.tabs.find((t: Mock) => t.isActive);
                                            if (tab) {
                                                const updatedParams = [...tab.params];
                                                updatedParams.find((p: Param) => p.id === thisParam.id).key = value;
                                            }
                                        }));
                                    }
                                
                                    const onValueBlur = (e: Event) => {
                                        const value = (e.target as HTMLInputElement).value;
                                        transaction(produce((draft: any) => {
                                            const tab = draft.tabs.find((t: Mock) => t.isActive);
                                            if (tab) {
                                                const updatedParams = [...tab.params];
                                                updatedParams.find((p: Param) => p.id === thisParam.id).value = value;
                                            }
                                        }));
                                    }

                                    const removeParam = () => handleRemoveParam(thisParam.id);

                                    return (
                                        <>
                                            <input class="border" type="checkbox" checked={thisParam.active} aria-checked={thisParam.active} on:change={onActiveChange}/>
                                            <Button styles="addButton" onClickCallback={removeParam}><VsTrash size={18} color="#db436c" /></Button>
                                            <input class="bg-stone-100 w-full px-2 border" type="text" value={thisParam.key || ''} placeholder="Key" on:blur={onKeyBlur}/>
                                            <input class="bg-stone-100 w-full px-2 border" type="text" value={thisParam.value || ''} placeholder="Value" on:blur={onValueBlur}/>
                                        </>
                                    )
                                }}
                            </For>
                            <div></div>
                            <div></div>
                            <div></div>
                            <div class="flex justify-end">
                                <Button styles="addButton" onClickCallback={handleAddParam}><VsAdd size={18} color="#98e5c7" /></Button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </Show>
    );
}



export default Tabs;