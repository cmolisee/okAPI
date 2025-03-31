export const TabContext = createContext<TabContext>({ store: { tabs: [] }, transaction: () => {} });
function TabStore(props: any) {
    const [store, transaction] = createStore<TabStore>({
        tabs: [],
    });

    return (
        <TabContext.Provider value={{ store, transaction }}>
            {props.children}
        </TabContext.Provider>
    )
}

export default TabStore;