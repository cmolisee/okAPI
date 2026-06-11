import { setThemeSetting, Theme } from "./storage";

/**
 * manually toggle theme via data attribute in DOM.
 * update/save theme in storage.
 * @param theme - dark, light, system
 */
export const toggleTheme = (theme: Theme) => {
    document.documentElement.setAttribute('data-theme', theme);
    setThemeSetting(theme);
};

/**
 * wrapper to debug console based on Mode.
 * @param msg - string message to display
 * @param data - any data to pair with the messaging
 */
export function logging(ctx: string, msg: string, data?: object) {
    if (import.meta.env.MODE === 'development') {
        console.debug(`[${ctx}] ${msg}`, data);
    }
}

/**
 * Attempts to format JSON serializable string
 * @param text JSON string to try and format
 * @returns formatted string or original string
 */
export function tryPrettyPrint(text: string): string {
    try { return JSON.stringify(JSON.parse(text), null, 2); } catch { return text; }
}