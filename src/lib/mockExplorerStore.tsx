import { deepCopyAndUnproxy, mockExplorerDataStorage } from "@/utils/utils";
import { trackStore } from "@solid-primitives/deep";
import createDebounce from "./debounce";

const mockExplorerContext = createContext<MockExplorerContext>({ 
    mockExplorerTree: {},
    mockExplorerTreeTransaction: () => {},
    findNodeByPath: (tree: ApiMockNode, path: string) => null,
    addNode: (parentPath: string, node: ApiMockNode) => null,
    removeNode: (path: string) => {},
    updateNodeName: () => {},
    moveNode: () => {},
});

export const useMockExplorer = () => {
    const context = useContext(mockExplorerContext);
    if (!context) {
        throw Error("mockExplorerContext does not exist.");
    }
    return context;
}

function MockExplorerStore(props: any) {
    const [mockExplorerTree, mockExplorerTreeTransaction] = createStore<ApiMockNode>({});

    const findNodeByPath = (tree: ApiMockNode, path: string): ApiMockNode|null => {
        if (tree.path === path) {
            return tree;
        }

        if (tree.children) {
            for (let node of tree.children) {
                const found = findNodeByPath(node, path);
                if (found) {
                    return found;
                }
            }
        }

        return null;
    };

    const addNode = (parentPath: string, node: ApiMockNode) => {
        mockExplorerTreeTransaction(produce((draft: ApiMockNode) => {
            const parent = findNodeByPath(draft, parentPath);

            if (!parent) {
                throw Error(`unable to add node. node at ${parentPath} not found.`);
            }

            if (!parent.children) {
                parent.children = [];
            }

            parent.children.push(node);
        }));
    };

    const removeNode = (path: string) => {
        mockExplorerTreeTransaction(produce((draft: ApiMockNode) => {
            if (draft.path === path) {
                return; // can't remove root node.
            }
    
            const parent = findNodeByPath(draft, path.slice(0, path.lastIndexOf('/')));
            parent!.children = parent!.children!.filter((c) => c.path !== path);
        }));
    };

    const updateNodeName = (path: string, name: string) => {
        mockExplorerTreeTransaction(produce((draft: ApiMockNode) => {
            const node = findNodeByPath(draft, path);
            if (!node) {
                return;
            }

            node.name = name;
            node.path = node.path?.slice(0, node.path?.lastIndexOf('/')) + '/' + name
        }));
    };

    // todo: implmement this
    const moveNode = () => console.log('implement');

    const handleSaveExplorerEdits = createDebounce((proxyData: ApiMockNode) => {
        const data = deepCopyAndUnproxy(proxyData)
        mockExplorerDataStorage.setValue(data)
            .catch((e: any) => console.debug("Error saving data: ", e));
    });

    onMount(async () => {
        const data: ApiMockNode = await mockExplorerDataStorage.getValue();
        mockExplorerTreeTransaction(() => deepCopyAndUnproxy(data));
    });

    createEffect(on(
        () => trackStore(mockExplorerTree),
        (proxyData: ApiMockNode) => handleSaveExplorerEdits(proxyData),
        { defer: true }
    ));

    return (
        <mockExplorerContext.Provider value={{
            mockExplorerTree,
            mockExplorerTreeTransaction,
            findNodeByPath,
            addNode,
            removeNode,
            updateNodeName,
            moveNode,
        }}>
            {props.children}
        </mockExplorerContext.Provider>
    );
}

export default MockExplorerStore;