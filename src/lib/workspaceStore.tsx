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

// workspace object is expected to reflect the structure of a single level array
function WorkspaceStore(props: any) {
    const [workspaceData, workspaceDataTransaction] = createStore<ObjectArray<MockApiNode>>({});

    const addWorkspaceItem = (newItem: MockApiNode) => {
        workspaceDataTransaction(produce((draft: ObjectArray<MockApiNode>) => {
            for (const mock of Object.values(draft)) {
                mock.data.isEditing = false;
            }

            newItem.data.isEditing = true;
            draft[newItem.id] = newItem;
        }));
    };

    const removeWorkspaceItem = (id: string) => {
        workspaceDataTransaction(produce((draft: ObjectArray<MockApiNode>) => {
            if (id in draft) {
                delete draft[id];
            }
        }));
    };

    const setEditingWorkspaceItem = (id: string) => {
        workspaceDataTransaction(produce((draft: ObjectArray<MockApiNode>) => {
            for (const mock of Object.values(draft)) {
                mock.data.isEditing = mock.id === id;
            }
        }));
    };

    const handleSaveWorkspace = createDebounce((data: ObjectArray<MockApiNode>) => {
        workspaceDataStorage.setValue(deepCopy(data))
            .catch((e: any) => console.debug("Error saving workspace data: ", e));
    });

    onMount(async () => {
        const savedWorkspace: ObjectArray<MockApiNode> = await workspaceDataStorage.getValue();
        workspaceDataTransaction(deepCopy(savedWorkspace));
    });

    createEffect(on(
        () => trackStore(workspaceData),
        (data: ObjectArray<MockApiNode>) => handleSaveWorkspace(data),
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