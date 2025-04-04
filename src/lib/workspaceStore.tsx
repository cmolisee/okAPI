import { workspaceDataStorage } from "@/utils/utils";

const defaultWorkspaceData: WorkspaceData = { data: [] };
export const WorkspaceStoreContext = createContext<WorkspaceStoreContext>({ workspaceData: defaultWorkspaceData, workspaceDataTransaction: () => {} });
function WorkspaceStore(props: any) {
    const [workspaceData, workspaceDataTransaction] = createStore<WorkspaceData>(defaultWorkspaceData);

    onMount(async () => {
        await workspaceDataStorage.getValue()
            .then((data: WorkspaceData|null) => {
                console.log("getting workspaceDataStorage data", data);
                // idk if this will work as i expect...
                workspaceDataTransaction(reconcile(data?.data?.length ? data : defaultWorkspaceData));
            })
            .catch(error => console.debug('Could not get workspaceData at this time', error));

        onCleanup(async () => {
            console.log("value of workspace data on cleanup", workspaceData);
            const notifyWebpage = async (msg: string) => await extensionMessenger.sendMessage('sendMessageToWebpage', msg);
            await notifyWebpage("value of workspace data on cleanup: " + JSON.stringify(workspaceData)).catch(e => console.debug);
            await workspaceDataStorage.setValue(workspaceData)
                .then(() => true)
                .catch((error) => {
                    console.debug('Failed to save workspaceData to workspaceDataStorage:', error);
                    return false
                });
        });
    });

    return (
        <WorkspaceStoreContext.Provider value={{ workspaceData, workspaceDataTransaction }}>
            {props.children}
        </WorkspaceStoreContext.Provider>
    )
}

export default WorkspaceStore;