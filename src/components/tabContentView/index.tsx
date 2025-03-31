import { VsTrash, VsAdd } from "solid-icons/vs";
import { createUniqueId } from "solid-js";
import Button from "../button";
import Toggle from "../toggle";
import { TabContext } from "@/lib/tabStore";
import CodeField from "../codeField";
import createDebounce from "@/lib/debounce";

function TabContentView() {
    const { store, transaction } = useContext(TabContext);

    const handleMethodUpdate = (e: Event) => {
        const value = (e.target as HTMLSelectElement).value as MethodType;
        transaction(produce((draft: any) => {
            const tab = draft.tabs.find((t: ApiMock) => t.isActive);
            if (tab) {
                tab.method = value;
            }
        }));
    };

    const handleUriUpdate = (e: Event) => {
        const value = (e.target as HTMLInputElement).value;
        transaction(produce((draft: any) => {
            const tab = draft.tabs.find((t: ApiMock) => t.isActive);
            if (tab) {
                tab.uri = value;
            }
        }));
    };

    const handleIsEnabledUpdate = (e: Event) => {
        const value = (e.target as HTMLInputElement).checked;
        transaction(produce((draft: any) => {
            const tab = draft.tabs.find((t: ApiMock) => t.isActive);
            if (tab) {
                tab.isEnabled = value;
            }
        }));
    };
    
    const handleBodyUpdate = (doc: string) => {
        transaction(produce((draft: any) => {
            const tab = draft.tabs.find((t: ApiMock) => t.isActive);
            if (tab) {
                tab.body = doc;
            }
        }));
    };

    // individual param add, delete, update is handled in <For />
    const handleAddParam = () => {
        transaction(produce((draft: any) => {
            const tab = draft.tabs.find((t: ApiMock) => t.isActive);
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
                const tab = draft.tabs.find((t: ApiMock) => t.isActive);

                if (tab) {
                    tab.params = tab.params.filter((p: MockParam) => p.id !== paramIdToRemove);
                }
            })
        );
    };

    return (
        <Show when={store.tabs.find((t: ApiMock) => t.isActive)} fallback={<div></div>} keyed>
            {(tab: ApiMock) => (
                <div class="mt-2">
                    <div class="flex flex-row justify-between align-centermy-2">
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
                        <Toggle toggleSize="medium" checked={tab.isEnabled} changeCallback={handleIsEnabledUpdate} />
                    </div>
                    <div class="my-2">
                        {/* <textarea id="body" class="w-full bg-primary-bg dark:bg-primary-bg text-primary-text dark:text-primary-text" name="body" cols="50" placeholder="{}" on:blur={handleBodyUpdate}/> */}
                        <CodeField value={tab?.body ?? '{}'} setValue={handleBodyUpdate} />
                    </div>
                    <div class="my-2">
                        <div class="grid grid-cols-[6%_6%_25%_63%] grid-rows-2 gap-1">
                            {/* header */}
                            <div class="text-center"></div>
                            <div class="text-center"></div>
                            <div class="text-center border">Key</div>
                            <div class="text-center border">Value</div>
                            {/* defined params */}
                            <For each={tab.params}>
                                {(thisParam) => {
                                    const onActiveChange = (e: Event) => {
                                        const value = (e.target as HTMLInputElement).checked;
                                        transaction(produce((draft: any) => {
                                            const tab = draft.tabs.find((t: ApiMock) => t.isActive);
                                            if (tab) {
                                                const updatedParams = [...tab.params];
                                                updatedParams.find((p: MockParam) => p.id === thisParam.id).active = value;
                                            }
                                        }));
                                    }

                                    const onKeyBlur = (e: Event) => {
                                        const value = (e.target as HTMLInputElement).value;
                                        transaction(produce((draft: any) => {
                                            const tab = draft.tabs.find((t: ApiMock) => t.isActive);
                                            if (tab) {
                                                const updatedParams = [...tab.params];
                                                updatedParams.find((p: MockParam) => p.id === thisParam.id).key = value;
                                            }
                                        }));
                                    }
                                
                                    const onValueBlur = (e: Event) => {
                                        const value = (e.target as HTMLInputElement).value;
                                        transaction(produce((draft: any) => {
                                            const tab = draft.tabs.find((t: ApiMock) => t.isActive);
                                            if (tab) {
                                                const updatedParams = [...tab.params];
                                                updatedParams.find((p: MockParam) => p.id === thisParam.id).value = value;
                                            }
                                        }));
                                    }

                                    const removeParam = () => handleRemoveParam(thisParam.id);

                                    return (
                                        <>
                                            <Toggle toggleSize="small" checked={thisParam.active} changeCallback={onActiveChange} />
                                            <Button styles="addButton" onClickCallback={removeParam}><VsTrash size={18} color="#db436c" /></Button>
                                            <input class="bg-primary-bg dark:bg-primary-bg text-primary-text dark:text-primary-text w-full px-2 border " type="text" value={thisParam.key || ''} placeholder="Key" on:blur={onKeyBlur}/>
                                            <input class="bg-primary-bg dark:bg-primary-bg text-primary-text dark:text-primary-text w-full px-2 border" type="text" value={thisParam.value || ''} placeholder="Value" on:blur={onValueBlur}/>
                                        </>
                                    )
                                }}
                            </For>
                            <div></div>
                            <div></div>
                            <div></div>
                            <div class="flex justify-end">
                                <Button styles="addButton" onClickCallback={handleAddParam}><VsAdd size={18} class="text-okPurple-700 dark:text-okGreen-700" /></Button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </Show>
    );
}

export default TabContentView;