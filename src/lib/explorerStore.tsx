import { deepCopyAndUnproxy, explorerDataStorage } from "@/utils/utils";
import { trackStore } from "@solid-primitives/deep";
import createDebounce from "./debounce";

const ExplorerContext = createContext<ExplorerContext>({ 
    explorerTree: {},
    explorerTreeTransaction: () => {},
    findNodeByPath: () => {},
    addNode: () => {},
    removeNode: () => {},
    updateNodeName: () => {},
    updateExpandedState: () => {},
    toggleAllExpandedState: () => {},
    moveNode: () => {},
});

export const useExplorer = () => {
    const context = useContext(ExplorerContext);
    if (!context) {
        throw Error("explorerContext does not exist.");
    }
    return context;
}

function ExplorerStore(props: any) {
    const [explorerTree, explorerTreeTransaction] = createStore<ApiMockNode>({});

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
        explorerTreeTransaction(produce((draft: ApiMockNode) => {
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
        explorerTreeTransaction(produce((draft: ApiMockNode) => {
            if (draft.path === path) {
                return; // can't remove root node.
            }
    
            const parent = findNodeByPath(draft, path.slice(0, path.lastIndexOf('/')));
            parent!.children = parent!.children!.filter((c) => c.path !== path);
        }));
    };

    const _updateTreePaths = (node: ApiMockNode) => {
        node?.children?.forEach((c) => {
            c.path = node.path + '/' + c.name;
            _updateTreePaths(c);
        });
    };

    const updateNodeName = (path: string, name: string) => {
        const treeCopy = JSON.parse(JSON.stringify(explorerTree));
        const node = findNodeByPath(treeCopy, path);

        if (!node) {
            return;
        }

        node.name = name;
        node.path = node.path?.slice(0, node.path?.lastIndexOf('/')) + '/' + name;
        _updateTreePaths(node);

        explorerTreeTransaction(treeCopy);
    };

    const _treeExpand = (root: ApiMockNode) => {
        let node: ApiMockNode|null = root;
        while (node && node.path !== '/root') {
            node.expandedState = true;
            node = findNodeByPath(root, node.path?.slice(0, node.path?.lastIndexOf('/')) ?? '')
        }
    };

    const _treeCollapse = (root: ApiMockNode) => {
        root.expandedState = false;
        root?.children?.forEach((c) => {
            c.expandedState = false;
            _treeCollapse(c);
        });
    };

    const updateExpandedState = (path: string, expanded: boolean) => {
        const treeCopy = JSON.parse(JSON.stringify(explorerTree));
        let node = findNodeByPath(treeCopy, path);

        if (!node) {
            return;
        }

        if (expanded) {
            _treeExpand(node);
        } else {
            _treeCollapse(node)
        }

        explorerTreeTransaction(treeCopy);
    }

    const _updateTreeExpandedState = (node: ApiMockNode, expanded: boolean) => {
        node?.children?.forEach((c) => {
            c.expandedState = expanded;
            _updateTreeExpandedState(c, expanded);
        });
    };

    const toggleAllExpandedState = (expanded: boolean) => {
        const treeCopy = JSON.parse(JSON.stringify(explorerTree));
        const node = findNodeByPath(treeCopy, '/root');

        if (!node) {
            return;
        }

        _updateTreeExpandedState(node, expanded);
        explorerTreeTransaction(treeCopy);
    }

    // todo: implmement this
    const moveNode = () => console.log('implement');

    const handleSaveExplorerEdits = createDebounce((proxyData: ApiMockNode) => {
        const data = deepCopyAndUnproxy(proxyData)
        explorerDataStorage.setValue(data)
            .catch((e: any) => console.debug("Error saving data: ", e));
    });

    onMount(async () => {
        const data: ApiMockNode = await explorerDataStorage.getValue();
        explorerTreeTransaction(() => deepCopyAndUnproxy(data));
    });

    createEffect(on(
        () => trackStore(explorerTree),
        (proxyData: ApiMockNode) => handleSaveExplorerEdits(proxyData),
        { defer: true }
    ));

    return (
        <ExplorerContext.Provider value={{
            explorerTree,
            explorerTreeTransaction,
            findNodeByPath,
            addNode,
            removeNode,
            updateNodeName,
            updateExpandedState,
            toggleAllExpandedState,
            moveNode,
        }}>
            {props.children}
        </ExplorerContext.Provider>
    );
}

export default ExplorerStore;