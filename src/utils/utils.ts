export function safeParse(obj: any) {
    try {
        return JSON.parse(obj);
    } catch (e: any) {
        return obj;
    }
}

export const mockExplorerDataStorage = storage.defineItem<ApiMockNode>(
    'local:mockExplorerData',
);

export const workspaceDataStorage = storage.defineItem<WorkspaceData>(
    'local:workspaceData',
    {
        fallback: { data: [] } as WorkspaceData,
    }
);

export const getUniqueId = () => new Date().valueOf().toString(36);