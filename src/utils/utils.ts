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

// solidjs will sometimes return proxy objects.
// This function can create a deep copy and unproxy those objects so we 
// can invoke functions without error (i.e. proxy arrays don't have find(), push(), etc...).
export const deepCopyAndUnproxy = (obj: any) => {
    if (obj === null || typeof obj !== 'object') {
        return obj;
    }

    const isArray = Array.isArray(obj) || typeof obj === 'object' && Object.prototype.toString.call(obj) === '[object Array]';
    const target = isArray ? [] : {};
    const keys = Object.keys(obj);

    if (isArray) {
        (target as []).length = obj.length;
    }

    for (let i = 0; i < keys.length; ++i) {
        //@ts-ignore
        target[keys[i]] = deepCopyAndUnproxy(obj[keys[i]]);
    }

    return target;
}