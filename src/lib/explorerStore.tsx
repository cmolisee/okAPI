import { defaultMock, explorerDataStorage } from "@/utils/utils";
import { trackStore } from "@solid-primitives/deep";
import createDebounce from "./debounce";

const ExplorerContext = createContext<ExplorerContext>({ 
    explorerTree: {},
    explorerTreeTransaction: () => {},
    findMockById: () => defaultMock,
    addMock: () => {},
    removeMock: () => {},
    updateMockName: () => {},
    updateExpandedState: () => {},
    toggleAllExpandedState: () => {},
    moveMock: () => {},
});

export const useExplorer = () => {
    const context = useContext(ExplorerContext);
    if (!context) {
        throw Error("explorerContext does not exist.");
    }
    return context;
}

function ExplorerStore(props: any) {
    const [explorerTree, explorerTreeTransaction] = createStore<OkMock|EmptyObject>({});

    const findMockById = (mock: OkMock|EmptyObject, id: string): OkMock => {
        if (mock.metadata.id === id) {
            return mock as OkMock;
        }

        if (mock.children) {
            for (const child of Object.values(mock.children)) {
                const found = findMockById(child, id);

                if (found) {
                    return found;
                }
            }
        }

        throw Error(`unable to find mock with 'id': ${id}.`);
    };

    const addMock = (id: string, newMock: OkMock) => {
        explorerTreeTransaction(produce((draft: OkMock|EmptyObject) => {
            const parent = findMockById(draft, id);

            parent!.children[newMock.metadata.id] = newMock;
        }));
    };

    const removeMock = (parentId: string, targetId: string) => {
        explorerTreeTransaction(produce((draft: OkMock|EmptyObject) => {
            try {
                const parent = findMockById(draft, parentId);
                delete parent!.children[targetId]
            } catch {
                return; // node DNE
            }
        }));
    };

    const _updateTreePaths = (mock: OkMock|EmptyObject) => {
        for (const child of Object.values(mock.children)) {
            child.metadata.path = `${mock.metadata.path}/${child.name}`;
            _updateTreePaths(child);
        }
    };

    const updateMockName = (id: string, name: string) => {
        const treeCopy = JSON.parse(JSON.stringify(explorerTree));
        const node = findMockById(treeCopy, id);

        if (!node) {
            return;
        }

        node.name = name;
        node.metadata.path = node?.metadata?.path?.slice(0, node?.metadata?.path?.lastIndexOf('/')) + '/' + name;
        _updateTreePaths(node);

        explorerTreeTransaction(treeCopy);
    };

    const _treeExpand = (target: OkMock|EmptyObject, tree: OkMock|EmptyObject) => {
        let node = target;
        while (node && node?.metadata?.path !== '/root') {
            node.metadata.isExpanded = true;
            node = findMockById(tree, node?.metadata?.id);
        }
    };

    const _treeCollapse = (root: OkMock|EmptyObject) => {
        root.metadata.isExpanded = false;
        for (const child of Object.values(root.children)) {
            child.metadata.isExpanded = false;
            _treeCollapse(child);
        }
    };

    const updateExpandedState = (id: string, expanded: boolean) => {
        const treeCopy = JSON.parse(JSON.stringify(explorerTree));
        let node = findMockById(treeCopy, id);

        if (!node) {
            return;
        }

        if (expanded) {
            _treeExpand(node, treeCopy);
        } else {
            _treeCollapse(node)
        }

        explorerTreeTransaction(treeCopy);
    }

    const _updateTreeExpandedState = (node: OkMock|EmptyObject, expanded: boolean) => {
        for (const child of Object.values(node.children)) {
            child.metadata.isExpanded = expanded;
            _updateTreeExpandedState(child, expanded);
        }
    };

    const toggleAllExpandedState = (expanded: boolean) => {
        const treeCopy = JSON.parse(JSON.stringify(explorerTree));
        const node = findMockById(treeCopy, 'root');

        if (!node) {
            return;
        }

        _updateTreeExpandedState(node, expanded);
        explorerTreeTransaction(treeCopy);
    }

    // todo: implmement this
    const moveMock = () => console.log('implement');

    const handleSaveExplorerEdits = createDebounce((proxyData: OkMock|EmptyObject) => {
        const data = deepCopy(proxyData)
        explorerDataStorage.setValue(data)
            .catch((e: any) => console.debug("Error saving data: ", e));
    });

    onMount(async () => {
        const data: OkMock|EmptyObject = await explorerDataStorage.getValue();
        explorerTreeTransaction(() => deepCopy(data));
    });

    createEffect(on(
        () => trackStore(explorerTree as OkMock|EmptyObject),
        (proxyData: OkMock|EmptyObject) => handleSaveExplorerEdits(proxyData),
        { defer: true }
    ));

    return (
        <ExplorerContext.Provider value={{
            explorerTree,
            explorerTreeTransaction,
            findMockById,
            addMock,
            removeMock,
            updateMockName,
            updateExpandedState,
            toggleAllExpandedState,
            moveMock,
        }}>
            {props.children}
        </ExplorerContext.Provider>
    );
}

export default ExplorerStore;