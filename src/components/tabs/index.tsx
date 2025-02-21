import "~/assets/tailwind.css";

type MethodType = 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';
interface Param {
    active?: boolean;
    key?: string;
    value?: string;
}
interface Mock {
    isEnabled: boolean;
    uri?: string;
    method: MethodType;
    params?: Param[];
    body?: string;
}

function TabButton(props: any) {
    return (<button class="inline size-fit mx-2" on:click={props.onClickCallback}>{props.text}</button>);
}

function TabContent(props: any) {
    const [tab, setTab] = createSignal<Mock>(props.tab);

    const getTab = createMemo(() => {
        return tab();
    });

    function hanldeMethodUpdate(e: Event) {
        const target: HTMLSelectElement = e.target as HTMLSelectElement;
        const value = target?.value ?? 'GET';

        props.updateTab({
            ...tab(),
            method: value
        });
    }

    function handleUriUpdate(e: Event) {
        const target: HTMLInputElement = e.target as HTMLInputElement;
        const value = target?.value ?? '';

        props.updateTab({
            ...tab(),
            uri: value
        });
    }

    function handleIsEnabledUpdate(e: Event) {
        const target: HTMLInputElement = e.target as HTMLInputElement;
        const checked = target?.checked ?? false;

        props.updateTab({
            ...tab(),
            isEnabled: checked
        });
    }

    function handleBodyUpdate(e: FocusEvent) {
        const target: HTMLTextAreaElement = e.target as HTMLTextAreaElement;
        const value = target?.value ?? '';

        props.updateTab({
            ...tab(),
            body: value
        });
    }

    function handleParamUpdate(paramUpdate: Param, index: number) {
        if (tab()?.params !== undefined && tab().params!.length > 0) {
            props.updateTab({
                ...JSON.parse(JSON.stringify(tab())),
                params: tab().params!.map((param, i) => i === index ? paramUpdate : param)
            });
        } else {
            props.updateTab({
                ...JSON.parse(JSON.stringify(tab())),
                params: [paramUpdate]
            });
        }
    }

    function onKeyBlur(e: Event, index: number) {
        const target: HTMLInputElement = e.target as HTMLInputElement;
        const value = target?.value ?? '';

        const param = tab()?.params?.[index] ?? { active: true };

        handleParamUpdate({ ...param, key: value }, index)
    }

    function onValueBlur(e: Event, index: number) {
        const target: HTMLInputElement = e.target as HTMLInputElement;
        const value = target?.value ?? '';

        const param = tab()?.params?.[index] ?? { active: true };

        handleParamUpdate({ ...param, value: value }, index)
    }

    function onActiveChange(e: Event, index: number) {
        const target: HTMLInputElement = e.target as HTMLInputElement;
        const checked = target?.checked ?? false;

        const param = tab()?.params?.[index] ?? { active: true };

        handleParamUpdate({ ...param, active: checked }, index)
    }

    function handleNewKey(e: Event) {
        const target: HTMLInputElement = e.target as HTMLInputElement;
        const value = target?.value ?? '';
        const newParam = { active: true, key: value };
        const updatedParams = [ ...tab()?.params ?? [], newParam]

        target.value = '';
        props.updateTab({
            ...tab(),
            params: updatedParams,
        });
    }

    function handleNewValue(e: Event) {
        const target: HTMLInputElement = e.target as HTMLInputElement;
        const value = target?.value ?? '';
        const newParam = { active: true, value: value };
        const updatedParams = [ ...tab()?.params ?? [], newParam]

        target.value = '';
        props.updateTab({
            ...tab(),
            params: updatedParams,
        });
    }

    // createEffect(() => {
    //     if (props?.tab && JSON.stringify(props.tab) !== JSON.stringify(tab)) {
    //         setTab(props.tab);
    //     }

    //     console.log('create effect', tab());
    // });

    return (
        <div class="tabContent m-2">
            <div class="tabContent_topBar flex flex-row justify-between align-centermy-2">
                <div class="tabContent_uriBar flex flex-row border border-solid rounded-sm w-[75%]">
                    <div class="mr-4">
                        <select class="border-none" name="method" on:change={hanldeMethodUpdate}>
                            <option value="GET">GET</option>
                            <option value="POST">POST</option>
                            <option value="PUT">PUT</option>
                            <option value="DELETE">DELETE</option>
                        </select>
                    </div>
                    <input id="uri" class="bg-stone-100 w-full  border-l px-2" type="text" value={tab()?.uri ?? ''} placeholder="URI" on:blur={handleUriUpdate} /> 
                </div>
                <input type="checkbox" id="isEnabled" name="isEnabled" checked={tab().isEnabled} aria-checked={tab().isEnabled} on:change={handleIsEnabledUpdate} />
            </div>
            <div class="tabContent_body my-2">
                <textarea id="body" class="w-full" name="body" cols="50" placeholder="{}" on:blur={handleBodyUpdate}/>
            </div>
            <div class="tabContent_params my-2">
                <div class="grid grid-cols-[6%_25%_69%] grid-rows-2">
                    {/* header */}
                    <div class="text-center border"></div>
                    <div class="text-center border">Key</div>
                    <div class="text-center border">Value</div>
                    {/* defined params */}
                    <For each={getTab().params}>
                        {(param, i) => {
                            return (
                                <>
                                    <input id={`active_${i}`} class="border" type="checkbox" name={`active_${i}`} checked={param.active} aria-checked={param.active} on:change={(e) => onActiveChange(e, i())}/>
                                    <input id={`key_${i}`} class="bg-stone-100 w-full px-2 border" type="text" value={param.key || ''} placeholder="Key" on:blur={(e) => onKeyBlur(e, i())}/>
                                    <input id={`value_${i}`} class="bg-stone-100 w-full px-2 border" type="text" value={param.value || ''} placeholder="Value" on:blur={(e) => onValueBlur(e, i())}/>
                                </>
                            )
                        }}
                    </For>
                    {/* default */}
                    <span class="border"/>
                    <input id="defaultKey" class="bg-stone-100 w-full px-2 border" type="text" placeholder="Key" on:blur={handleNewKey} />
                    <input id="defaultValue" class="bg-stone-100 w-full px-2 border" type="text" placeholder="Value" on:blur={handleNewValue} />
                </div>
            </div>
        </div>
    )
}

function Tabs(props: any) {
    const [activeTabIndex, setActiveTabIndex] = createSignal(props?.activeIndex ?? -1);
    const [tabs, setTabs] = createSignal<Mock[]>(props?.tabs ?? []);

    const activeTab = createMemo(() => {
        const currentTabs = tabs();
        const currentIndex = activeTabIndex();

        return currentIndex >= 0 && currentIndex< currentTabs.length
            ? currentTabs[currentIndex]
            : undefined;
    });
    
    function handleAddTab() {
        setTabs((prev) => [...prev, { isEnabled: false, method: 'GET' }]);
        setActiveTabIndex(tabs().length - 1);
    }

    function handleRemoveTab(index: number) {
        const newTabs = tabs().filter((_, i) => i !== index);
        setTabs(newTabs);

        if (newTabs.length === 0) {
            setActiveTabIndex(-1);
        } else if (index <= activeTabIndex()) {
            const newIndex = Math.min(activeTabIndex() - 1, newTabs.length - 1);
            setActiveTabIndex(Math.max(0, newIndex));
        }
    }

    function handleUpdateTab(index: number, updatedTab: Mock) {
        setTabs((prev) => prev.map((tab, i) => i == index ? { ...tab, ...updatedTab } : tab));
    }

    return (
        <div class="tab_container flex flex-col gap-2">
            <div class="tab_list flex flex-wrap flex-row align-items w-full">
                <For each={tabs()}>
                    {(tab, i) => (
                        <div class="tab_item flex flex-wrap mx-2" on:click={() => setActiveTabIndex(i())}>
                            <span class="size-fit">{tab.method}</span>
                            <span class="mx-1 text-ellipsis">{`${tab.uri ? tab.uri : 'untitled'}`}</span>
                            <TabButton onClickCallback={() => handleRemoveTab(i())} text={'X'}/>
                        </div>
                    )}
                </For>
                <div class="tab_item"><TabButton onClickCallback={() => handleAddTab()} text={'+'}/></div>
            </div>
            <div class="tab_content">
                <Show when={activeTab()} fallback={<div class="m-8">Click '+' to create a new mock.</div>}>
                    {(tab) => (
                        <TabContent
                            tab={tab}
                            updateTab={(updatedTab: Mock) => handleUpdateTab(activeTabIndex(), updatedTab)} />
                    )}
                </Show>
            </div>
        </div>
    )
}

export default Tabs;