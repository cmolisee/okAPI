import { trackStore } from "@solid-primitives/deep";
import createDebounce from "./debounce";

const defaultWorkspaceData: WorkspaceData = { data: [] };
export const WorkspaceStoreContext = createContext<WorkspaceStoreContext>({
    workspaceData: defaultWorkspaceData,
    workspaceDataTransaction: () => { },
});
function WorkspaceStore(props: any) {
    const [workspaceData, workspaceDataTransaction] = createStore<WorkspaceData>(defaultWorkspaceData);

    const debounce = createDebounce((proxyData: WorkspaceData) => {
        // SolidJs is returning a Proxy(Object) where arrays are interpreted as objects .
        // convert back to array by making a deep copy.
        const unproxifiedData = JSON.parse(JSON.stringify(proxyData));
        unproxifiedData.data.map((d: WorkspaceDataItem) => JSON.parse(JSON.stringify(d)));

        workspaceDataStorage.setValue(unproxifiedData)
            .catch((e: any) => console.debug("Error saving workspace: ", e));
    });

    onMount(async () => {
        const savedWorkspace: WorkspaceData = await workspaceDataStorage.getValue();
        workspaceDataTransaction(savedWorkspace);
    });

    createEffect(on(
        () => trackStore(workspaceData),
        (proxyData: WorkspaceData) => debounce(proxyData),
        { defer: true }
    ));

    return (
        <WorkspaceStoreContext.Provider value={{ workspaceData, workspaceDataTransaction }}>
            {props.children}
        </WorkspaceStoreContext.Provider>
    )
}

export default WorkspaceStore;