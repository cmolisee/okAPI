import { BADGE_ACTIVE, BADGE_INACTIVE, BadgeManager, getActiveTabId } from "@/utils/shared";
import { getThemeSetting, setThemeSetting, TabStore, Theme } from "../../utils/storage";

(async () => {
    const tabId = await getActiveTabId();
    if (!tabId) return;

    if (!await TabStore.has(tabId)) {
        Promise.all([
            TabStore.set(tabId, 'isNotificationsEnabled', false),
            TabStore.set(tabId, 'isNetworkViewerEnabled', false),
            TabStore.set(tabId, 'isMockingEnabled', false),
            TabStore.set(tabId, 'engineType', undefined),
            TabStore.set(tabId, 'isAttached', false),
            TabStore.set(tabId, 'capturedRequests', []),
            TabStore.set(tabId, 'mockedRequests', []),
            TabStore.set(tabId, 'panelUIState', { tab: 'networkView' }),
        ])
    }

    const themeSelect = document.getElementById('theme-select') as HTMLSelectElement | null;
    const enableNotificationsCheckbox = document.getElementById('enableNotifications') as HTMLInputElement | null;
    const enableMockingCheckbox = document.getElementById('enableMocking') as HTMLInputElement | null;
    const enableNetworkViewerCheckbox = document.getElementById('enableNetworkViewer') as HTMLInputElement | null;

    const themeChangeListener = (event: Event) => {
        const target = event.currentTarget as HTMLSelectElement;
        if (target) setThemeSetting(target.value as Theme);
    }

    const notifcationsEnabledChangeListener = (event: Event) => {
        const target = event.target as HTMLInputElement;
        if (target) TabStore.set(tabId, 'isNotificationsEnabled', target.checked);
    }

    const mockingEnabledChangeListener = async (event: Event) => {
        const target = event.target as HTMLInputElement;
        if (!target) return;
        TabStore.set(tabId, 'isMockingEnabled', target.checked);

        if (target.checked) {
            await BadgeManager.background(tabId, BADGE_ACTIVE.background);
            await BadgeManager.color(tabId, BADGE_ACTIVE.text);
            if (!(await BadgeManager.get(tabId))) {
            await BadgeManager.set(tabId, '0');
            }
        } else {
            await BadgeManager.background(tabId, BADGE_INACTIVE.background);
            await BadgeManager.color(tabId, BADGE_INACTIVE.text);
        }
    }

    const networkViewerChangeListener = async (event: Event) => {
        const target = event.target as HTMLInputElement;
        if (!target) return;
        TabStore.set(tabId, 'isNetworkViewerEnabled', target.checked);
        
        if (target.checked) {
            await BadgeManager.background(tabId, BADGE_ACTIVE.background);
            await BadgeManager.color(tabId, BADGE_ACTIVE.text);
        } else {
            await BadgeManager.background(tabId, BADGE_INACTIVE.background);
            await BadgeManager.color(tabId, BADGE_INACTIVE.text);
        }
    }

    themeSelect!.value = await getThemeSetting();
    themeSelect!.removeEventListener('change', themeChangeListener);
    themeSelect!.addEventListener('change', themeChangeListener);
    watchThemeSetting((nv: Theme|null ) => themeSelect!.value = nv ?? 'system')

    enableNotificationsCheckbox!.checked = await TabStore.get(tabId, 'isNotificationsEnabled') ?? false;
    enableNotificationsCheckbox!.removeEventListener('change', notifcationsEnabledChangeListener);
    enableNotificationsCheckbox!.addEventListener('change', notifcationsEnabledChangeListener);
    TabStore.watch(tabId, 'isNotificationsEnabled', (nv: boolean|null) => enableNotificationsCheckbox!.checked = nv ?? false);
    
    enableMockingCheckbox!.checked = await TabStore.get(tabId, 'isMockingEnabled') ?? false;
    enableMockingCheckbox!.removeEventListener('change', mockingEnabledChangeListener);
    enableMockingCheckbox!.addEventListener('change', mockingEnabledChangeListener);
    TabStore.watch(tabId, 'isMockingEnabled', (nv: boolean|null) => enableMockingCheckbox!.checked = nv ?? false);
    
    enableNetworkViewerCheckbox!.checked = await TabStore.get(tabId, 'isNetworkViewerEnabled') ?? false;
    enableNetworkViewerCheckbox!.removeEventListener('change', networkViewerChangeListener);
    enableNetworkViewerCheckbox!.addEventListener('change', networkViewerChangeListener);
    TabStore.watch(tabId, 'isNetworkViewerEnabled', (nv: boolean|null) => enableNetworkViewerCheckbox!.checked = nv ?? false);
})();