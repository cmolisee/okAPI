import { setThemeVariables } from "./theme-variables";

type Theme = 'light' | 'dark';

export function useTheme() {
    const [theme, setTheme] = createSignal<Theme>(
        (localStorage.getItem('theme') as Theme) || // user set theme
        window.matchMedia('(prefers-color-scheme: dark)').matches || // system theme
        'light' // default
    );

    createEffect(() => {
        const currentTheme = theme();
        localStorage.setItem('theme', currentTheme);

        if (currentTheme === 'dark') {
            setThemeVariables('dark');
            document.documentElement.classList.add('dark');
        } else {
            setThemeVariables('light');
            document.documentElement.classList.remove('dark');
        }
    });

    const toggleTheme = () => {
        const themes: Theme[] = ['light', 'dark'];
        const currentIndex = themes.indexOf(theme());
        const nextTheme = themes[(currentIndex + 1) % themes.length];
        setTheme(nextTheme);
    };

    return { theme, toggleTheme };
}