type MethodType = 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';
type ContextMenuRef = HTMLElement | undefined;
type EmptyObject = Record<string, never>;
// we use this to overcome the issue of solidjs converting arrays to a proxy object
// key should match metadata.id
type ObjectArray<T> = Record<string, T> | EmptyObject;
type AutofillData = { id: string, path: string };

interface Pos {
    x: number;
    y: number;
}

interface MockApiData {
    body: string;
    description: string;
    hasEdits: boolean;
    isEditing: boolean;
    isEnabled: boolean;
    isExpanded: boolean;
    method: MethodType;
    params: ObjectArray<MockApiParam>;
    path: string; // uri path comprised of each nodes name field
    type: "mock" | "folder" | "root";
    uri: string;
}

interface MockApiParam {
    active: boolean;
    id: string;
    key: string;
    value: string;
}

interface MockApiNode {
    children: ObjectArray<MockApiNode>
    data: MockApiData,
    id: string,
    name: string,
}

interface WorkspaceStoreContext {
    addWorkspaceItem: (newItem: MockApiNode) => void;
    removeWorkspaceItem: (id: string) => void;
    setEditingWorkspaceItem: (id: string) => void;
    workspaceData: ObjectArray<MockApiNode>;
    workspaceDataTransaction: SetStoreFunction<ObjectArray<MockApiNode>>;
}

interface MockApiTreeContext {
    find: (id: string) => MockApiNode|null|undefined;
    forEach: (callback: (node: MockApiNode) => boolean) => boolean;
    insert: (parentNodeId: string, node: MockApiNode) => MockApiNode|null|undefined;
    remove: (id: string) => MockApiNode|null|undefined;
    tree: MockApiNode|EmptyObject;
    treeTransaction: SetStoreFunction<MockApiNode|EmptyObject>;
}

interface ContextMenuContext {
    contextMenuChildren: Accessor<any>;
    handleCloseContextMenu: () => void;
    handleContextMenu: (e: MouseEvent, ...children: {text:string,callback:(e:MouseEvent)=>void}[]) => void;
    position: Accessor<Pos>;
    setContextMenuChildren: Setter<any>;
    setContextMenuRef: Setter<ContextMenuRef>;
    showContextMenu: Accessor<boolean>;
}

interface NotificationContext {
    setNotificationConfig: Setter<NotificationConfiguration>;
    setShowNotification: Setter<boolean>;
}

interface NotificationConfiguration {
    cancelCallback?: Function;
    cancelText?: string;
    content?: any;
    continueCallback?: Function;
    continueText?: string;
};

interface EditorPanelState {
    change: boolean;
    initialDoc: string;
    saveCallback: (doc: string) => void;
}

interface InternalMessengerProtocolMap {
    toBackground(data: any): MessengerResponse;
}

interface BackgroundMessengerProtocolMap {
    fromContent(data: any): MessengerResponse;
    toContent(data: any): MessengerResponse;
}

interface CustomEventMessengerProtocolMap {
    fromInject(data: any): MessengerResponse;
    toBackground(data: any): MessengerResponse;
    toInject(data: any): MessengerResponse;
}

interface MessengerResponse {
    description?: string;
    error?: string;
    status: number;
}