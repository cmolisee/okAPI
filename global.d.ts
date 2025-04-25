type MethodType = 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';

interface ApiMockNode {
    name?: string;
    path?: string;
    type?: "mock" | "folder" | "root";
    // todo: add description to describe folder, flow, etc...
    children?: ApiMockNode[];
    mock?: ApiMock;
}

interface ApiMock {
    // TODO: add alias to replace method+uri
    // todo: add description to describe mock
    id?: string;
    isEditing?: boolean;
    isEnabled: boolean;
    method: MethodType;
    uri?: string;
    body?: string;
    params?: Param[];
}

interface MockParam {
    id: string;
    active?: boolean;
    key?: string;
    value?: string;
}

interface ExplorerContext {
    explorerTree: ApiMockNode;
    explorerTreeTransaction: SetStoreFunction<ApiMockNode>;
    findNodeByPath: (tree: ApiMockNode, path: string) => void;
    addNode: (parentPath: string, node: ApiMockNode) => void;
    removeNode: (path: string) => void;
    updateNodeName: (path: string, name: string) => void;
    moveNode: () => void;
}

// same as api mock except the dataPath will correspond to the 
// mocks path in mockData from storage or null if its not saved.
interface WorkspaceDataItem extends ApiMock {
    dataPath: string|null;
}

interface WorkspaceData {
    data: WorkspaceDataItem[];
}

interface WorkspaceStoreContext {
    workspaceData: WorkspaceData;
    workspaceDataTransaction: SetStoreFunction<WorkspaceData>;
}

interface EditorPanelState {
    initialDoc: string;
    saveCallback: (doc: string) => void;
    change: boolean;
}

interface MessengerResponse {
    status: number;
    error?: string;
    description?: string;
}

/** Protocol for internalMessenger */
interface InternalMessengerProtocolMap {
    toBackground(data: any): MessengerResponse;
}

/** Protocol for backgroundMessenger */
interface BackgroundMessengerProtocolMap {
    toContent(data: any): MessengerResponse;
    fromContent(data: any): MessengerResponse;
}

/** Protocol for customEventMessenger */
interface CustomEventMessengerProtocolMap {
    toInject(data: any): MessengerResponse;
    fromInject(data: any): MessengerResponse;
    toBackground(data: any): MessengerResponse;
}

interface Pos {
    x: number;
    y: number;
}

type ContextMenuRef = HTMLElement | undefined;

interface ContextMenuContext {
    showContextMenu: Accessor<boolean>;
    position: Accessor<Pos>;
    contextMenuChildren: Accessor<any>;
    setContextMenuRef: Setter<ContextMenuRef>;
    setContextMenuChildren: Setter<any>;
    handleContextMenu: (e: MouseEvent, ...children: {text:string,callback:(e:MouseEvent)=>void}[]) => void;
    handleCloseContextMenu: () => void;
}

type NotificationContent = HTMLElement|HTMLElement[]|null;

interface NotificationContext {
    setShowNotification: Setter<boolean>;
    setNotificationContent: Setter<NotificationContent>;
}