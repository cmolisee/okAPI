export function safeParse(obj: any) {
    try {
        return JSON.parse(obj);
    } catch (e: any) {
        return obj;
    }
}

export const mockExplorerDataStorage = storage.defineItem<ApiMockNode>(
    'local:mockExplorerData',
    {
        fallback: { name: "Saved Mocks", path: "/root", type: "root" } as ApiMockNode,
    }
);

export const workspaceDataStorage = storage.defineItem<WorkspaceData>(
    'local:workspaceData',
    {
        fallback: { data: [] } as WorkspaceData,
    }
);

export const getUniqueId = () => new Date().valueOf().toString(36);

export const getPathsArray = (path: string) => path.split("/").filter(r => r).reduce((paths: string[], path: string, i: number) => {
    paths.push(paths?.[i - 1] ? paths[i - 1] + `/${path}` : `/${path}`);
    return paths;
}, []);

export const getNode = (root: ApiMockNode, path: string) => {
    if (!path || !path.length) {
        return;
    }

    if (root.path === path) {
        return root;
    }

    const paths = getPathsArray(path);
    let targetNode = root;
    for (const nextNodePath of paths.slice(1)) {
        try {
            const node = targetNode.children!.find((c) => c.path === nextNodePath);

            if (!node) {
                throw Error();
            }

            targetNode = node;
        } catch (e) {
            throw Error(`Error. Folder cannot be found at path ${path}.`);
        }
    }

    return targetNode;
}