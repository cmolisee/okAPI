export function safeParse(obj: any) {
    try {
        return JSON.parse(obj);
    } catch (e: any) {
        return obj;
    }
}

export const defaultRootMock: MockApiNode = {
    name: "root",
    id: "root",
    data: {
        description: "",
        method: "GET",
        uri: "",
        body: "",
        params: {},
        hasEdits: false,
        isEditing: false,
        isEnabled: false,
        isExpanded: false,
        path: "",
        type: "root"
    },
    children: {},
};

export const explorerDataStorage = storage.defineItem<MockApiNode>(
    'local:explorerData',
    {
        fallback: defaultRootMock,
    },
);

export const workspaceDataStorage = storage.defineItem<ObjectArray<MockApiNode>>(
    'local:workspaceData',
    {
        fallback: {} as ObjectArray<MockApiNode>,
    }
);

export function getUniqueId(){
    return new Date().valueOf().toString(36);
}

export function deepCopy(obj: any) {
    return JSON.parse(JSON.stringify(obj));
}

export function deepMapObject(obj: any, callback: Function): any {
    if (typeof obj !== 'object' || obj === null) {
        return callback(obj);
    }

    if (Array.isArray(obj)) {
        return obj.map((item: any) => deepMapObject(item, callback));
    }

    const newObj: any = {};
    for (const key in obj) {
        if (Object.prototype.hasOwnProperty.call(obj, key)) {
            newObj[key] = deepMapObject(obj[key], callback);
        }
    }
    return newObj;
}

export function dfsFromTo(from: MockApiNode, to: MockApiNode, nodes: MockApiNode[] = []): MockApiNode[]|null {
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

export function bfsFrom(from: MockApiNode): MockApiNode[] {
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