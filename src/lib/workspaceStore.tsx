import { trackDeep } from "@solid-primitives/deep";
import createDebounce from "./debounce";

const defaultWorkspaceData: WorkspaceData = { data: [] };
export const WorkspaceStoreContext = createContext<WorkspaceStoreContext>({
    workspaceData: defaultWorkspaceData,
    workspaceDataTransaction: () => { },
});
function WorkspaceStore(props: any) {
    const [workspaceData, workspaceDataTransaction] = createStore<WorkspaceData>(defaultWorkspaceData);

    const debounce = createDebounce((update: WorkspaceData) => {
        // 'update' is a proxy object and was not storing the correct values
        // to ensure .data is always an array we should spread it like this.
        workspaceDataStorage.setValue({ data: [ ...update.data ]})
            .catch((e: any) => console.debug("Error saving workspace: ", e));
    });

    onMount(async () => {
        const savedWorkspace: WorkspaceData = await workspaceDataStorage.getValue();
        workspaceDataTransaction(savedWorkspace);
    });

    createEffect(on(
        () => trackDeep(workspaceData),
        (update: WorkspaceData) => debounce(update),
        { defer: true }
    ));

    return (
        <WorkspaceStoreContext.Provider value={{ workspaceData, workspaceDataTransaction }}>
            {props.children}
        </WorkspaceStoreContext.Provider>
    )
}

export default WorkspaceStore;