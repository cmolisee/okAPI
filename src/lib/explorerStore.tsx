import { explorerDataStorage } from "@/utils/utils";
import { trackStore } from "@solid-primitives/deep";
import createDebounce from "./debounce";

const ExplorerContext = createContext<ExplorerContext>({ 
    explorerTree: {},
    explorerTreeTransaction: () => {},
    findMockById: () => null,
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
    const [explorerTree, explorerTreeTransaction] = createStore<OkMock|object>({});

    const findMockById = (mock: OkMock, id: string): OkMock|null => {
        if (mock.metadata.id === id) {
            return mock;
        }

        if (mock.children) {
            for (let child in mock.children) {
                const found = findMockById(mock.children[child], id);

                if (found) {
                    return found;
                }
            }
        }

        throw Error(`unable to find mock with 'id': ${id}.`);
    };

    const addMock = (id: string, newMock: OkMock) => {
        explorerTreeTransaction(produce((draft: OkMock) => {
            const parent = findMockById(draft, id);

            parent!.children[newMock.metadta.id] = newMock;
        }));
    };

    const removeMock = (parentId: string, targetId: string) => {
        explorerTreeTransaction(produce((draft: OkMock) => {
            try {
                const parent = findMockById(draft, parentId);
                delete parent!.children[targetId]
            } catch {
                return; // node DNE
            }
        }));
    };

    const _updateTreePaths = (mock: OkMock) => {
        for (const child in mock.children) {
            mock.children[child].metadata.path = `${mock.metadata.path}/${mock.children[child].name}`;
            _updateTreePaths(mock.children[child]);
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

    const _treeExpand = (target: OkMock, tree: OkMock) => {
        let node: OkMock|null = target;
        while (node && node?.metadata?.path !== '/root') {
            node.metadata.isExpanded = true;
            node = findMockById(tree, node?.metadata?.id);
        }
    };

    const _treeCollapse = (root: OkMock) => {
        root.metadata.isExpanded = false;
        for (const childKey in root?.children) {
            const child = root.children[childKey];
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

    const _updateTreeExpandedState = (node: OkMock, expanded: boolean) => {
        for (const childKey in node?.children) {
            const child = node.children[childKey];
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

    const handleSaveExplorerEdits = createDebounce((proxyData: OkMock) => {
        const data = deepCopyAndUnproxy(proxyData)
        explorerDataStorage.setValue(data)
            .catch((e: any) => console.debug("Error saving data: ", e));
    });

    onMount(async () => {
        const data: OkMock = await explorerDataStorage.getValue();
        explorerTreeTransaction(() => deepCopyAndUnproxy(data));
    });

    createEffect(on(
        () => trackStore(explorerTree as OkMock),
        (proxyData: OkMock) => handleSaveExplorerEdits(proxyData),
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