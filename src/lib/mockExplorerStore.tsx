import { mockExplorerDataStorage } from "@/utils/utils";

export const mockExplorerContext = createContext<MockExplorerContext>({ mockExplorerData: {}, mockExplorerDataTransaction: () => {} });
function MockExplorerStore(props: any) {
    const [mockExplorerData, mockExplorerDataTransaction] = createStore<ApiMockNode>({});

    onMount(async () => {
        await mockExplorerDataStorage.getValue()
            .then(data => {
                console.log("getting mockExplorerDataStorage data", data);
                // idk if this will work as i expect...
                mockExplorerDataTransaction(reconcile(data ? data : { name: "root", type: "folder" }));
            })
            .catch(error => console.debug('Could not get mockExplorerData at this time', error));

        onCleanup(async () => {
            await mockExplorerDataStorage.setValue(mockExplorerData)
                .then(() => true)
                .catch((error) => {
                    console.debug('Failed to save mockExplorerData to mockExplorerDataStorage:', error);
                    return false
                });
        });
    });

    return (
        <mockExplorerContext.Provider value={{ mockExplorerData, mockExplorerDataTransaction }}>
            {props.children}
        </mockExplorerContext.Provider>
    )
}

export default MockExplorerStore;