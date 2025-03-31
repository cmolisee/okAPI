export function setThemeVariables(theme: 'light' | 'dark') {
    const root = document.documentElement;

    const lightTheme = {
        '--color-primary-bg': '#F8FAFC',
        '--color-primary-text': '#9AA6B2',
        '--color-primary-border': '#D9EAFD',

        '--color-secondary-bg': '#D9EAFD',
        '--color-secondary-text': '#9AA6B2',
        '--color-secondary-border': '#9AA6B2',
    };

    const darkTheme = {
        '--color-primary-bg': '#201E43',
        '--color-primary-text': '#EEEEEE',
        '--color-primary-border': '#134B70',

        '--color-secondary-bg': '#508C9B',
        '--color-secondary-text': '#EEEEEE',
        '--color-secondary-border': '#134B70',
    };

    const themeVariables = theme === 'light' ? lightTheme : darkTheme;

    Object.entries(themeVariables).forEach(([key, value]) => {
        root.style.setProperty(key, value);
    });
}