export function safeParse(obj: any) {
    try {
        return JSON.parse(obj);
    } catch (e: any) {
        return obj;
    }
}

export const mockExplorerDataStorage = storage.defineItem<ApiMockNode>(
    'local:mockExplorerData',
);

export const workspaceDataStorage = storage.defineItem<WorkspaceData>(
    'local:workspaceData',
    {
        fallback: { data: [] } as WorkspaceData,
    }
);

export async function getActiveTab() {
    let queryOptions = { active: true, lastFocusedWindow: true };
    // `tab` will either be a `tabs.Tab` instance or `undefined`.
    let [tab] = await chrome.tabs.query(queryOptions);
    return tab;
  }

  export async function getTabs() {
    return await chrome.tabs.query({});
  }