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
        path: "",
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

export function getUniqueId(){
    return new Date().valueOf().toString(36);
}

export function deepCopy(obj: any) {
    return JSON.parse(JSON.stringify(obj));
}

export function dfsFromTo(from: OkMock, to: OkMock, nodes: OkMock[] = []): OkMock[]|null {
    if (!from) {
        return null;
    }

    nodes.push(from);

    if (JSON.stringify(from) === JSON.stringify(to)) {
        return [...nodes];
    }

    for (const childNode of Object.values(from.children)) {
        const result = dfsFromTo(childNode, to, [...nodes]);

        // early exit when found
        if (result) {
            return result;
        }
    }

    nodes.pop();
    return null;
}

export function bfsFrom(from: OkMock): OkMock[] {
    if (!from || !from.children || Object.values(from.children).length === 0) {
        return [];
    }

    const result = [];
    for (const childNode of Object.values(from.children)) {
        result.push(childNode);
        result.push(...bfsFrom(childNode, ))
    }

    return result;
}

export function pathBuilder(...args: string[]) {
    return args.filter(Boolean).join('/');
}