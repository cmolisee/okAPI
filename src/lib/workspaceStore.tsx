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
    const [workspaceData, workspaceDataTransaction] = createStore<ObjectArray<OkMock>>({});

    const addWorkspaceItem = (newItem: OkMock) => {
        workspaceDataTransaction(produce((draft: ObjectArray<OkMock>) => {
            for (const mock of Object.values(draft)) {
                mock.metadata.isEditing = false;
            }

            newItem.metadata.isEditing = true;
            draft[newItem.metadata.id] = newItem;
        }));
    };

    const removeWorkspaceItem = (id: string) => {
        workspaceDataTransaction(produce((draft: ObjectArray<OkMock>) => {
            if (id in draft) {
                delete draft[id];
            }
        }));
    };

    const setEditingWorkspaceItem = (id: string) => {
        workspaceDataTransaction(produce((draft: ObjectArray<OkMock>) => {
            for (const mock of Object.values(draft)) {
                mock.metadata.isEditing = mock.metadata.id === id;
            }
        }));
    };

    const handleSaveWorkspace = createDebounce((data: ObjectArray<OkMock>) => {
        workspaceDataStorage.setValue(deepCopy(data))
            .catch((e: any) => console.debug("Error saving workspace data: ", e));
    });

    onMount(async () => {
        const savedWorkspace: ObjectArray<OkMock> = await workspaceDataStorage.getValue();
        console.log('workspaceStore.tsx ln59', [Object.keys(savedWorkspace), Object.entries(savedWorkspace), Object.values(savedWorkspace)]);
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