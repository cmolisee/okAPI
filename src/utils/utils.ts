export function safeParse(obj: any) {
    try {
        return JSON.parse(obj);
    } catch (e: any) {
        return obj;
    }
}

export const defaultRootMock: OkMock = {
    name: "root",
    description: "",
    method: "GET",
    uri: "",
    body: "",
    params: {},
    children: {},
    metadata: {
        id: "root",
        type: "root",
        isEditing: false,
        isEnabled: false,
        isExpanded: false,
        path: "/root",
        hasEdits: false
    }
};

export const explorerDataStorage = storage.defineItem<OkMock>(
    'local:explorerData',
    {
        fallback: defaultRootMock,
    },
);

export const workspaceDataStorage = storage.defineItem<ObjectArray<OkMock>>(
    'local:workspaceData',
    {
        fallback: {} as ObjectArray<OkMock>,
    }
);

export const getUniqueId = () => new Date().valueOf().toString(36);

export const deepCopy = (obj: any) => {
    return JSON.parse(JSON.stringify(obj));
}