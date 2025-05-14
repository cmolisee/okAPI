import { deepCopy, explorerDataStorage } from "@/utils/utils";
import { trackStore } from "@solid-primitives/deep";
import createDebounce from "./debounce";

const ExplorerContext = createContext<ExplorerContext>({ 
    explorerTree: null,
    explorerTreeTransaction: () => {},
    findMockByPath: () => null,
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
        if (mock.metadta.id === id) {
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

    const removeMock = (parentId: string, id: string) => {
        explorerTreeTransaction(produce((draft: OkMock) => {
            try {
                const parent = findMockById(draft, parentId);
                delete parent!.children[id]
            } catch {
                return; // node DNE
            }
        }));
    };

    const _updateTreePaths = (mock: OkMock) => {
        for (const child in mock.children) {
            mock.children[child].metadta.path = `${mock.metadta.path}/${mock.children[child].name}`;
            _updateTreePaths(mock.children[child]);
        }
    };

    const updateMockName = (path: string, name: string) => {
        const treeCopy = JSON.parse(JSON.stringify(explorerTree));
        const node = findMockByPath(treeCopy, path);

        if (!node) {
            return;
        }

        node.name = name;
        node.path = node.path?.slice(0, node.path?.lastIndexOf('/')) + '/' + name;
        _updateTreePaths(node);

        explorerTreeTransaction(treeCopy);
    };

    const _treeExpand = (target: OkMock, tree: OkMock) => {
        let node: OkMock|null = target;
        while (node && node.path !== '/root') {
            node.expandedState = true;
            node = findMockByPath(tree, node.path?.slice(0, node.path?.lastIndexOf('/')) ?? '');
        }
    };

    const _treeCollapse = (root: OkMock) => {
        root.expandedState = false;
        root?.children?.forEach((c) => {
            c.expandedState = false;
            _treeCollapse(c);
        });
    };

    const updateExpandedState = (path: string, expanded: boolean) => {
        const treeCopy = JSON.parse(JSON.stringify(explorerTree));
        let node = findMockByPath(treeCopy, path);

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
        node?.children?.forEach((c) => {
            c.expandedState = expanded;
            _updateTreeExpandedState(c, expanded);
        });
    };

    const toggleAllExpandedState = (expanded: boolean) => {
        const treeCopy = JSON.parse(JSON.stringify(explorerTree));
        const node = findMockByPath(treeCopy, '/root');

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
        () => trackStore(explorerTree),
        (proxyData: OkMock) => handleSaveExplorerEdits(proxyData),
        { defer: true }
    ));

    return (
        <ExplorerContext.Provider value={{
            explorerTree,
            explorerTreeTransaction,
            findMockByPath,
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