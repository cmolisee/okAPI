import { trackStore } from "@solid-primitives/deep";
import createDebounce from "./debounce";
import { deepCopy } from "@/utils/utils";

const WorkspaceStoreContext = createContext<WorkspaceStoreContext>({
    workspaceData: {},
    workspaceDataTransaction: () => {},
    addWorkspaceItem: () => {},
    removeWorkspaceItem: () => {},
    setEditingWorkspaceItem: () => {},
});

export const useWorkspace = () => {
    const context = useContext(WorkspaceStoreContext);
    if (!context) {
        throw Error("workspaceStoreContext does not exist.");
    }
    return context;
}

function WorkspaceStore(props: any) {
    const [workspaceData, workspaceDataTransaction] = createStore<ObjectArray<OkMock>>({});

    const addWorkspaceItem = (newItem: OkMock) => {
        workspaceDataTransaction(produce((draft: ObjectArray<OkMock>) => {
            for (const mockIndex in draft) {
                draft[mockIndex].metadta.isEditing = false;
            }

            newItem.metadta.isEditing = true;
            draft[newItem.metadta.id] = newItem;
        }));
    };

    const removeWorkspaceItem = (id: string) => {
        workspaceDataTransaction(produce((draft: ObjectArray<OkMock>) => {
            for (const mockIndex in draft) {
                if (mockIndex === id) {
                    delete draft[mockIndex];
                }
            }
        }));
    };

    const setEditingWorkspaceItem = (id: string) => {
        workspaceDataTransaction(produce((draft: ObjectArray<OkMock>) => {
            for (const mockIndex in draft) {
                draft[mockIndex].metadta.isEditing = mockIndex === id;
            }
        }));
    };

    const handleSaveWorkspace = createDebounce((data: ObjectArray<OkMock>) => {
        workspaceDataStorage.setValue(deepCopy(data))
            .catch((e: any) => console.debug("Error saving workspace data: ", e));
    });

    onMount(async () => {
        const savedWorkspace: ObjectArray<OkMock> = await workspaceDataStorage.getValue();
        workspaceDataTransaction(deepCopy(savedWorkspace));
    });

    createEffect(on(
        () => trackStore(workspaceData),
        (data: ObjectArray<OkMock>) => handleSaveWorkspace(data),
        { defer: true }
    ));

    return (
        <WorkspaceStoreContext.Provider value={{
            workspaceData, 
            workspaceDataTransaction,
            addWorkspaceItem,
            removeWorkspaceItem,
            setEditingWorkspaceItem,
        }}>
            {props.children}
        </WorkspaceStoreContext.Provider>
    )
}

export default WorkspaceStore;