// import { storage } from '#imports'; // wxt/storage or wxt/utils/storage????

export type Theme = 'light' | 'dark' | 'system';
export type Settings = {
    notificationsEnabled: boolean;
    syncInterval: number;
}
export type ExtensionStorage = {
  theme: Theme;
  settings: Settings;
}

export const DEFAULT_SETTINGS: ExtensionStorage = {
  theme: 'dark',
  settings: {
    notificationsEnabled: true,
    syncInterval: 15,
  }
};

export const theme = async () => await storage.getItem('local:theme'); 
export const settings = async () => await storage.getItem('local:settings');
export const setTheme = async (theme: Theme) => await storage.setItem('local:theme', theme);
export const setSettings = async (settings: Settings) => await storage.setItem('local:settings', settings);
export const remove = async (key: keyof ExtensionStorage) => await storage.removeItem(`local:${key}`);
export const clear = async () => await storage.clear('local');
export const reset = async () => await storage.setItem('local', DEFAULT_SETTINGS);

/**
 * Watches for changes to the specified storage key. Returns function to remove watcher (e.g. unwatch()).
 */
export const watch = (
    key: keyof ExtensionStorage,
    callback?: (newValue: ExtensionStorage[typeof key], oldValue: ExtensionStorage[typeof key]) => void,
    enableLogging: boolean = false,
): () => void => {
    return storage.watch<ExtensionStorage[typeof key]>(`local:${key}`, (newValue: ExtensionStorage[typeof key], oldValue: ExtensionStorage[typeof key]) => {
        if (callback) callback(newValue, oldValue);
        if (enableLogging) console.debug(`Theme changed from ${oldValue} to ${newValue}`);
    });
}