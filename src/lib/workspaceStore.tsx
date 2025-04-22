import { trackStore } from "@solid-primitives/deep";
import createDebounce from "./debounce";

const defaultWorkspaceData: WorkspaceData = { data: [] };
const WorkspaceStoreContext = createContext<WorkspaceStoreContext>({
    workspaceData: defaultWorkspaceData,
    workspaceDataTransaction: () => { },
});

export const useWorkspace = () => {
    const context = useContext(WorkspaceStoreContext);
    if (!context) {
        throw Error("workspaceStoreContext does not exist.");
    }
    return context;
}

function WorkspaceStore(props: any) {
    const [workspaceData, workspaceDataTransaction] = createStore<WorkspaceData>(defaultWorkspaceData);

    const handleSaveWorkspace = createDebounce((proxyData: WorkspaceData) => {
        const data = deepCopyAndUnproxy(proxyData)
        workspaceDataStorage.setValue(data)
            .catch((e: any) => console.debug("Error saving data: ", e));
    });

    onMount(async () => {
        const savedWorkspace: WorkspaceData = await workspaceDataStorage.getValue();
        workspaceDataTransaction(deepCopyAndUnproxy(savedWorkspace));
    });

    createEffect(on(
        () => trackStore(workspaceData),
        (proxyData: WorkspaceData) => handleSaveWorkspace(proxyData),
        { defer: true }
    ));

    return (
        <WorkspaceStoreContext.Provider value={{ workspaceData, workspaceDataTransaction }}>
            {props.children}
        </WorkspaceStoreContext.Provider>
    )
}

export default WorkspaceStore;