import { Engine, InterceptedRequest } from "@/lib/interceptor/types";
import { storage, Unwatch } from "wxt/utils/storage";
import { MockEndpoint } from "./db";
export type Theme = 'light' | 'dark' | 'system';
export type WatchCallback<T> = (newValue: T | null, oldValue: T | null) => void
export const EXT_LOCAL_THEME_KEY = 'local:settings.theme';

export const themeSetting = storage.defineItem<Theme>('local:settings.theme', {
    fallback: 'system',
});

export const getThemeSetting = async (): Promise<Theme> => await themeSetting.getValue();
export const setThemeSetting = async (t: Theme): Promise<void> => await themeSetting.setValue(t);
export const resetThemeSetting = async (): Promise<void> => await themeSetting.setValue('system');
export const watchThemeSetting = (callback?: WatchCallback<Theme>) => {
    return storage.watch<Theme>(EXT_LOCAL_THEME_KEY, (nv, ov) => { if (callback) callback(nv, ov); });
}

export type TabStoreMap = {
    isNotificationsEnabled: boolean,
    isNetworkViewerEnabled: boolean,
    isMockingEnabled: boolean,
    engineType: Engine|undefined,
    isAttached: boolean,
    capturedRequests: Array<InterceptedRequest>,
    mockedRequests: Array<MockEndpoint>,
    panelUIState: { tab: 'networkView'|'mockView' },
}
/**
 * Utility class to interact with session specific data.
 * Keys are generated from `type TabStoreMap` in the format: `session:ok-api.tab.${tabId}:${keyof TabStoreMap}.
 */
export class TabStore {
    // generate the correct session key for the provided tab and TabStoreMap key
    private static getKey(tabId: number, key: keyof TabStoreMap): `session:${string}` {
        return `session:ok-api.tab.${tabId}:${key}`
    }

    /**
     * Get the value of the key for the target tab.
     * 
     * @param tabId Unique identifier of the target tab.
     * @param key Identifier of item to get.
     * @returns Value of the specified key for target tab or undefined.
     */
    static async get<T extends keyof TabStoreMap>(tabId: number, key: T): Promise<TabStoreMap[T]|undefined> {
        return (await storage.getItem<TabStoreMap[T]>(this.getKey(tabId, key))) || undefined;
    }

    static async has(tabId: number): Promise<boolean> {
        const allKeys = await browser.storage.session.getKeys();
        const prefix = `session:ok-api.tab.${tabId}:`;
        return allKeys.some(k => k.startsWith(prefix));
    }

    /**
     * Set the value of the key for the target tab.
     * 
     * Maintain a circular cap of 500 requests if 'capturedRequests' or 'mockedRequests'.
     * 
     * @param tabId Unique identifier of the target tab.
     * @param key Identifier of the item to set.
     * @param data Value to set for this item.
     */
    static async set<T extends keyof TabStoreMap>(tabId: number, key: T, data: TabStoreMap[T]): Promise<void> {
        if (key === 'capturedRequests' || key === 'mockedRequests') {
            const n = Math.max((data as Array<InterceptedRequest|MockEndpoint>).length - 500, 0);
            await storage.setItem(this.getKey(tabId, key), (data as Array<InterceptedRequest|MockEndpoint>).slice(n));
        }
        await storage.setItem(this.getKey(tabId, key), data);
    }

    /**
     * Create a listener that runs the provided callback any time the target item is changed.
     * Returns the cleanup function to remove the listener.
     * 
     * @param tabId Unique identifier of the target tab.
     * @param key Identifier of the item to set.
     * @param callback Function to invoke whenever a change is captured.
     * @returns The corresponding cleanup function for the created listener.
     */
    static watch<T extends keyof TabStoreMap>(tabId: number, key: T, callback?: WatchCallback<TabStoreMap[T]>): Unwatch | null {
        return storage.watch<TabStoreMap[T]>(this.getKey(tabId, key), (nv, ov) => { if (callback) callback(nv, ov); });
    }

    /**
     * Clear all storage in the session for the target tab.
     * 
     * @param tabId Unique identifier of the target tab.
     */
    static async clear(tabId: number) {
        const allKeys = await browser.storage.session.getKeys();
        const prefix = `session:ok-api.tab.${tabId}:`;
        const keysToRemove = allKeys.filter(k => k.startsWith(prefix));
        Promise.all(keysToRemove.map(k => storage.removeItem(`session:${k}`)));
    }
}