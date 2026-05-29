import { getMockingEnabledSetting, getNetworkViewerEnabledSetting, getNotificationsEnabledSetting, getThemeSetting, setMockingEnabledSetting, setNetworkViewerEnabledSetting, setNotificationsEnabledSetting, setThemeSetting, Theme } from "../../utils/storage";

(async () => {
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
        if (target) setNotificationsEnabledSetting(target.checked);
    }

    const mockingEnabledChangeListener = (event: Event) => {
        const target = event.target as HTMLInputElement;
        if (target) setMockingEnabledSetting(target.checked);
    }

    const networkViewerChangeListener = (event: Event) => {
        const target = event.target as HTMLInputElement;
        if (target) setNetworkViewerEnabledSetting(target.checked);
    }

    if (themeSelect) {
        themeSelect.value = await getThemeSetting();
        themeSelect.removeEventListener('change', themeChangeListener);
        themeSelect.addEventListener('change', themeChangeListener);
    }

    if (enableNotificationsCheckbox) {
        enableNotificationsCheckbox.checked = await getNotificationsEnabledSetting();
        enableNotificationsCheckbox.removeEventListener('change', notifcationsEnabledChangeListener);
        enableNotificationsCheckbox.addEventListener('change', notifcationsEnabledChangeListener);
    }

    if (enableMockingCheckbox) {
        enableMockingCheckbox.checked = await getMockingEnabledSetting();
        enableMockingCheckbox.removeEventListener('change', mockingEnabledChangeListener);
        enableMockingCheckbox.addEventListener('change', mockingEnabledChangeListener);
    }

    if (enableNetworkViewerCheckbox) {
        enableNetworkViewerCheckbox.checked = await getNetworkViewerEnabledSetting();
        enableNetworkViewerCheckbox.removeEventListener('change', networkViewerChangeListener);
        enableNetworkViewerCheckbox.addEventListener('change', networkViewerChangeListener);
    }
})();