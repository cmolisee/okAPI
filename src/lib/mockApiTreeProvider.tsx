import { explorerDataStorage } from "@/utils/utils";
import { trackStore } from "@solid-primitives/deep";
import createDebounce from "./debounce";

const MockApiTreeContext = createContext<MockApiTreeContext>();

export const useMockApiTree = () => {
    const context = useContext(MockApiTreeContext);
    if (!context) {
        throw Error("explorerContext does not exist.");
    }
    return context;
}

function MockApiTreeStore(props: any) {
    const [tree, treeTransaction] = createStore<MockApiNode|EmptyObject>({});

    const _bfs = (root: MockApiNode, callback: any) => {
        if (!root || !root?.id) {
            return null;
        }

        const queue = [root];

        while (queue.length > 0) {
            const currentNode = queue.shift();

            if (callback && callback(currentNode)) {
                return currentNode;
            }

            if (currentNode?.children) {
                for (const child of Object.values(currentNode.children)) {
                    queue.push(child);
                }
            }
        }

        return null;
    }

    const find = (id: string) => {
        return _bfs(tree as MockApiNode, (node: MockApiNode) => node?.id === id);
    }

    const remove = (id: string) => {
        if (id === 'root') {
            return null;
        }

        const treeCopy = JSON.parse(JSON.stringify(tree));
        return _bfs(treeCopy, (node: MockApiNode) => {
            for (const key in Object.keys(node.children)) {
                if (key === id) {
                    delete node.children[key];
                    treeTransaction(treeCopy);
                    return true;
                }
            }

            return false;
        });
    }

    const insert = (parentNodeId: string, newNode: MockApiNode) => {
        if (!newNode?.id) {
            return null;
        }

        const treeCopy = JSON.parse(JSON.stringify(tree));
        return _bfs(treeCopy, (node: MockApiNode) => {
            if (node?.id === parentNodeId) {
                node.children[newNode.id] = newNode;
                treeTransaction(treeCopy);
                return true;
            }

            return false;
        });
    }

    // callback to run on each node.
    // true indicates continue, false indicates stop.
    const forEach = (callback: any) => {
        const treeCopy = JSON.parse(JSON.stringify(tree));
        _bfs(treeCopy, (node: MockApiNode) => {
            // continue as long as callback returns true.
            return !callback(node);
        });

        treeTransaction(treeCopy);
        return true;
    }

    const handleSaveTreeEdits = createDebounce((proxyData: MockApiNode|EmptyObject) => {
        const data = deepCopy(proxyData)
        explorerDataStorage.setValue(data)
            .catch((e: any) => console.debug("Error saving data: ", e));
    });

    onMount(async () => {
        const data: MockApiNode|EmptyObject = await explorerDataStorage.getValue();
        treeTransaction(() => deepCopy(data));
    });

    createEffect(on(
        () => trackStore(tree as MockApiNode|EmptyObject),
        (proxyData: MockApiNode|EmptyObject) => handleSaveTreeEdits(proxyData),
        { defer: true }
    ));

    return (
        <MockApiTreeContext.Provider value={{
            find,
            forEach,
            insert,
            remove,
            tree,
            treeTransaction,
        }}>
            {props.children}
        </MockApiTreeContext.Provider>
    );
}

export default MockApiTreeStore;