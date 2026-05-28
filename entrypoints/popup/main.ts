import { setSettings, setTheme, Theme } from "../../utils/storage";

(() => {
    const enableNotificationsCheckbox = document.getElementById('enableNotifications');
    const themeSelect = document.getElementById('theme-select');

    const notificationChangeEventListener = (event: Event) => {
        const target = event.target as HTMLInputElement;
        if (target) setSettings({ notificationsEnabled: target.checked, syncInterval: 15 })
    }

    const themeSelectEventListener = (event: Event) => {
        const target = event.currentTarget as HTMLSelectElement;
        if (target) setTheme(target.value as Theme);
    }

    enableNotificationsCheckbox?.removeEventListener('change', notificationChangeEventListener);
    enableNotificationsCheckbox?.addEventListener('change', notificationChangeEventListener);

    themeSelect?.removeEventListener('change', themeSelectEventListener);
    themeSelect?.addEventListener('change', themeSelectEventListener);
})();