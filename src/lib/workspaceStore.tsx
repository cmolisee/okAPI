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
        const explorer = deepCopyAndUnproxy(proxyData)

        workspaceDataStorage.setValue(explorer)
            .catch((e: any) => console.debug("Error saving workspace: ", e));
    });

    onMount(async () => {
        const savedWorkspace: WorkspaceData = await workspaceDataStorage.getValue();
        workspaceDataTransaction(deepCopyAndUnproxy(savedWorkspace));
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