type MethodType = 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';
type ContextMenuRef = HTMLElement | undefined;

interface Pos {
    x: number;
    y: number;
}

// we use this to overcome the issue of solidjs converting arrays to a proxy object
interface ObjectArray<T> {
    [key: string]: T;
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
    metadta: OkMetadata;
}

interface WorkspaceStoreContext {
    workspaceData: ObjectArray<OkMock>;
    workspaceDataTransaction: SetStoreFunction<ObjectArray<OkMock>>;
    addWorkspaceItem: (newItem: OkMock) => void;
    removeWorkspaceItem: (id: string) => void;
    setEditingWorkspaceItem: (id: string) => void;
}

interface ExplorerContext {
    explorerTree: OkMock|null;
    explorerTreeTransaction: SetStoreFunction<OkMock>;
    findMockByPath: (tree: OkMock, path: string) => OkMock|null;
    addMock: (parentPath: string, node: OkMock) => void;
    removeMock: (path: string) => void;
    updateMockName: (path: string, name: string) => void;
    updateExpandedState: (path: string, expanded: boolean) => void;
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