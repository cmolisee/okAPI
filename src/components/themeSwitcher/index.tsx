import { useTheme } from "@/lib/theme";
import { FiMoon, FiSun } from "solid-icons/fi";
import { twMerge } from "tailwind-merge";

function ThemeSwitcher() {
    const { theme, toggleTheme } = useTheme();
    const themeIcons = {
        light: FiSun,
        dark: FiMoon,
    };

    return (
        <div class="flex items-center justify-end p-2">
            <button on:click={toggleTheme}
                class={twMerge(
                    "bg-secondary-bg p-1 m-1 rounded-md transition-okapi duration-300",
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