import { storage } from "wxt/utils/storage";
export type Theme = 'light' | 'dark' | 'system';
export type StorageKeys = 
    'local:settings.theme' |
    'local:settings.notificationsEnabled' |
    'local:settings.mockingEnabled' |
    'local:settings.networkViewerEnabled';

// --- storage definitions ---
export const themeSetting = storage.defineItem<Theme>('local:settings.theme', {
    fallback: 'system',
});
export const notificationsEnabledSetting = storage.defineItem<boolean>('local:settings.notificationsEnabled', {
    fallback: false,
});
export const mockingEnabledSetting = storage.defineItem<boolean>('local:settings.mockingEnabled', {
    fallback: false,
});
export const networkViewerEnabled = storage.defineItem<boolean>('local:settings.networkViewerEnabled', {
    fallback: false,
});

// --- getters ---
export const getThemeSetting = async (): Promise<Theme> => await themeSetting.getValue();
export const getNotificationsEnabledSetting = async (): Promise<boolean> => await notificationsEnabledSetting.getValue();
export const getMockingEnabledSetting = async (): Promise<boolean> => await mockingEnabledSetting.getValue();
export const getNetworkViewerEnabledSetting = async (): Promise<boolean> => await networkViewerEnabled.getValue();

// --- setters ---
export const setThemeSetting = async (t: Theme): Promise<void> => await themeSetting.setValue(t);
export const setNotificationsEnabledSetting = async (b: boolean): Promise<void> => await notificationsEnabledSetting.setValue(b);
export const setMockingEnabledSetting = async (b: boolean): Promise<void> => await mockingEnabledSetting.setValue(b);
export const setNetworkViewerEnabledSetting = async (b: boolean): Promise<void> => await networkViewerEnabled.setValue(b);

// --- utils ---
export const resetThemeSetting = async (): Promise<void> => await themeSetting.setValue('system');
export const resetNotificationsEnabledSetting = async (): Promise<void> => await notificationsEnabledSetting.setValue(false);
export const resetMockingEnabledSetting = async (): Promise<void> => await mockingEnabledSetting.setValue(false);
export const resetNetworkViewerEnabledSetting = async (): Promise<void> => await networkViewerEnabled.setValue(false);

/**
 * Watches for changes to the specified storage key. Returns function to remove watcher (e.g. unwatch()).
 */
export const watch = (
    key: StorageKeys,
    callback?: (newValue: boolean | Theme | null, oldValue: boolean | Theme | null) => void,
): () => void => {
    return storage.watch<Theme | boolean>(key, (newValue, oldValue) => {
        if (callback) callback(newValue, oldValue);
        logging('storage', `${key} changed from ${oldValue} to ${newValue}`);
    });
}