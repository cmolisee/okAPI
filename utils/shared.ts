import { setTheme, Theme } from "./storage";

/**
 * Sets theme.
 * system - use the browser preferred theme.
 * dark - manual override to dark theme.
 * light - manual override to light theme.
 */
export const toggleTheme = (theme: Theme) => {
    document.documentElement.setAttribute('data-theme', theme);
    setTheme(theme);
};