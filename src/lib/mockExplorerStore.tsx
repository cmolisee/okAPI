import { getPathsArray, mockExplorerDataStorage } from "@/utils/utils";

const mockExplorerContext = createContext<MockExplorerContext>({ 
    mockExplorerTree: {},
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
// export const mockExplorerContext = createContext<MockExplorerContext>({ 
//     mockExplorerData: {}, 
//     mockExplorerDataTransaction: () => {},
//     addNode: () => {},
//     removeNode: () => {}
// });
function MockExplorerStore(props: any) {
    let mockExplorerTree = createMutable<ApiMockNode>({});

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
        const parent = findNodeByPath(mockExplorerTree, parentPath);

        if (!parent) {
            throw Error(`unable to add node. node at ${parentPath} not found.`);
        }

        if (!parent.children) {
            parent.children = [];
        }

        parent.children.push(node);
        return node;
    };

    const removeNode = (path: string) => {
        if (mockExplorerTree.path === path) {
            return; // can't remove root node.
        }

        const parent = findNodeByPath(mockExplorerTree, path.slice(0, path.lastIndexOf('/')));
        parent!.children = parent!.children!.filter((c) => c.path !== path);
        return;
    };

    const updateNodeName = () => console.log('implement');
    const moveNode = () => console.log('implement');

    onMount(async () => {
        await mockExplorerDataStorage.getValue()
            .then(data => {
                console.log("getting mockExplorerDataStorage data", data);
                Object.assign(mockExplorerTree, data);
            })
            .catch(error => console.debug('Could not get mockExplorerData at this time', error));

        onCleanup(async () => {
            await mockExplorerDataStorage.setValue(mockExplorerTree)
                .then(() => true)
                .catch((error) => {
                    console.debug('Failed to save mockExplorerData to mockExplorerDataStorage:', error);
                    return false
                });
        });
    });

    return (
        <mockExplorerContext.Provider value={{
            mockExplorerTree,
            findNodeByPath,
            addNode,
            removeNode,
            updateNodeName,
            moveNode,
        }}>
            {props.children}
        </mockExplorerContext.Provider>
    )

    // const [mockExplorerData, mockExplorerDataTransaction] = createStore<ApiMockNode>({});

    // const addNode = (nodePath: string, newNode: ApiMockNode) => {
    //     console.log('adding node', [
    //         mockExplorerData,
    //         nodePath,
    //         newNode,
    //     ]);
    //     const paths = getPathsArray(nodePath);
    //     const treeCopy = JSON.parse(JSON.stringify(mockExplorerData));
    //     let node = treeCopy;
    //     for (const path of paths.slice(1)) {
    //         node = node.children.find((c: any) => c.path === path);
    //     }
    //     if (!node.children?.length) {
    //         node.children = [];
    //     }

    //     node.children.push(newNode);
    //     mockExplorerDataTransaction(treeCopy);
    //     // mockExplorerDataTransaction((draft: ApiMockNode) => {
    //     //     const updated = JSON.parse(JSON.stringify(draft));
    //     //     let node = updated
    //     //     for (const path of paths.slice(1)) {
    //     //         node = node.children?.find((c: any) => c.path === path)!;
    //     //     }

    //     //     if (node.children?.length) {
    //     //         node.children.push(newNode);
    //     //     } else {
    //     //         node.children = [newNode];
    //     //     }
    //     //     return updated;
    //     // });
    //     return;
    // };

    // const removeNode = (nodePath: string) => {
    //     const paths = getPathsArray(nodePath);
    //     mockExplorerDataTransaction(produce((draft: ApiMockNode) => {
    //         let node = draft;
    //         for (const path of paths.slice(1, paths.length - 1)) {
    //             node = draft.children?.find((c) => c.path === path)!;
    //         }

    //         node.children = [...node.children?.filter((c) => c.path !== nodePath) ?? []]
    //     }));
    //     return;
    // }

    // return (
    //     <mockExplorerContext.Provider value={{ mockExplorerData, mockExplorerDataTransaction, addNode, removeNode }}>
    //         {props.children}
    //     </mockExplorerContext.Provider>
    // )
}

export default MockExplorerStore;