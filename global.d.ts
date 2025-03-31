type MethodType = 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';

interface ApiMock {
    id: string;
    isActive: boolean;
    isEnabled: boolean;
    uri?: string;
    method: MethodType;
    params?: Param[];
    body?: string;
}

interface MockParam {
    id: string;
    active?: boolean;
    key?: string;
    value?: string;
}

interface TabStore {
    tabs: Mock[];
}

interface TabContext {
    store: TabStore;
    transaction: SetStoreFunction<TabStore>;
}

interface EditorPanelState {
    initialDoc: string;
    saveCallback: (doc: string) => void;
    change: boolean;
}