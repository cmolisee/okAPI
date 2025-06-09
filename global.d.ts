type MethodType = 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';
type ContextMenuRef = HTMLElement | undefined;
type EmptyObject = Record<string, never>;
// we use this to overcome the issue of solidjs converting arrays to a proxy object
// key should match metadata.id
type ObjectArray<T> = Record<string, T> | EmptyObject;

interface Pos {
    x: number;
    y: number;
}

interface OkMetadata {
    id: string;
    type: "mock" | "folder" | "root";
    isEditing: boolean;
    isEnabled: boolean;
    isExpanded: boolean;
    path: string;
    hasEdits: boolean;
}

interface OkParam {
    id: string;
    active: boolean;
    key: string;
    value: string;
}

interface OkMock {
    name: string;
    description: string;
    method: MethodType;
    uri: string;
    body: string;
    params: ObjectArray<OkParam>;
    children: ObjectArray<OkMock>;
    metadata: OkMetadata;
}

interface WorkspaceStoreContext {
    workspaceData: ObjectArray<OkMock>;
    workspaceDataTransaction: SetStoreFunction<ObjectArray<OkMock>>;
    addWorkspaceItem: (newItem: OkMock) => void;
    removeWorkspaceItem: (id: string) => void;
    setEditingWorkspaceItem: (id: string) => void;
}

interface ExplorerContext {
    explorerTree: OkMock|EmptyObject;
    explorerTreeTransaction: SetStoreFunction<OkMock|EmptyObject>;
    findMockById: (tree: OkMock|EmptyObject, id: string) => OkMock;
    addMock: (parentId: string, node: OkMock) => void;
    removeMock: (parentId: string, targetId: string) => void;
    updateMockName: (id: string, name: string) => void;
    updateExpandedState: (id: string, expanded: boolean) => void;
    toggleAllExpandedState: (expanded: boolean) => void;
    moveMock: () => void;
}

interface ContextMenuContext {
    showContextMenu: Accessor<boolean>;
    position: Accessor<Pos>;
    contextMenuChildren: Accessor<any>;
    setContextMenuRef: Setter<ContextMenuRef>;
    setContextMenuChildren: Setter<any>;
    handleContextMenu: (e: MouseEvent, ...children: {text:string,callback:(e:MouseEvent)=>void}[]) => void;
    handleCloseContextMenu: () => void;
}

interface NotificationContext {
    setShowNotification: Setter<boolean>;
    setNotificationConfig: Setter<NotificationConfiguration>;
}

interface NotificationConfiguration {
    cancelText?: string;
    continueText?: string;
    cancelCallback?: Function;
    continueCallback?: Function;
    content?: any;
};

interface EditorPanelState {
    initialDoc: string;
    saveCallback: (doc: string) => void;
    change: boolean;
}

interface InternalMessengerProtocolMap {
    toBackground(data: any): MessengerResponse;
}

interface BackgroundMessengerProtocolMap {
    toContent(data: any): MessengerResponse;
    fromContent(data: any): MessengerResponse;
}

interface CustomEventMessengerProtocolMap {
    toInject(data: any): MessengerResponse;
    fromInject(data: any): MessengerResponse;
    toBackground(data: any): MessengerResponse;
}

interface MessengerResponse {
    status: number;
    error?: string;
    description?: string;
}