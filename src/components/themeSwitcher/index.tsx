import { useTheme } from "@/lib/theme";
import { FiMoon, FiSun } from "solid-icons/fi";
import { twMerge } from "tailwind-merge";

function ThemeSwitcher() {
    const { theme, toggleTheme } = useTheme();
    const themeIcons = {
        light: () => <FiSun stroke="currentColor" size={18} class="text-secondary-text dark:text-secondary-text" />,
        dark: () => <FiMoon stroke="currentColor" size={18} class="text-secondary-text dark:text-secondary-text" />,
    };

    return (
        <div class="flex items-center justify-end p-2">
            <button on:click={toggleTheme}
                class={twMerge(
                    "bg-secondary-bg p-1 m-1 rounded-md transition-color duration-300",
                    "dark:bg-secondary-bg"
                )}
                aria-label="Toggle Theme">
                <Dynamic component={themeIcons[theme()]} />
                <span class="sr-only">
                    Current theme: {theme()}
                </span>
            </button>
        </div>
    );
}

export default ThemeSwitcher;