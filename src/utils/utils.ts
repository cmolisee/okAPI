export function safeParse(obj: any) {
    try {
        return JSON.parse(obj);
    } catch (e: any) {
        return obj;
    }
}

export const explorerDataStorage = storage.defineItem<OkMock>(
    'local:explorerData',
    {
        fallback: { name: "Root", path: "/root", type: "root", id: "root" } as OkMock,
    }
);

export const workspaceDataStorage = storage.defineItem<ObjectArray<OkMock>>(
    'local:workspaceData',
    {
        fallback: {} as ObjectArray<OkMock>,
    }
);

export const getUniqueId = () => new Date().valueOf().toString(36);
export const createUniqueFolderName = () => `newFolder_${getUniqueId()}`;

export const deepCopy = (obj: any) => {
    return JSON.parse(JSON.stringify(obj));
}