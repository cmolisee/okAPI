import { twMerge } from "tailwind-merge";

const ToggleSize = {
    small: "h-4 w-8 after:top-[2px] after:left-[2px] after:h-3 after:w-3 peer-checked:after:translate-x-[16px]",
    medium: "h-5 w-9 after:top-[2px] after:left-[2px] after:h-4 after:w-4 peer-checked:after:translate-x-[16px]",
    large: "h-6 w-10 after:top-[2px] after:left-[2px] after:h-5 after:w-5 peer-checked:after:translate-x-[17px]",
}

function Toggle(props: any) {
    const toggleSizeStyles = ToggleSize[props.toggleSize as keyof typeof ToggleSize];
    const baseStyles = "peer rounded-full bg-secondary-bg after:absolute after:rounded-full after:border after:border-secondary-bg after:bg-okPurple-500 after:transition-all after:content-['']";
    const focusStyles = "peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-blue-200";
    const darkStyles = "dark:bg-secondary-bg dark:after:border-secondary-bg dark:peer-focus:ring-white dark:after:bg-okGreen-500 dark:peer-checked:after:border-okGreen-200 dark:peer-checked:bg-okGreen-200";
    const toggledStyles = "peer-checked:after:border-okPurple-500 peer-checked:bg-okPurple-200";
    return (
        <label class="relative cursor-pointer">
            <input type="checkbox" value="" class="peer sr-only" checked={props.checked} aria-checked={props.checked} on:change={props.changeCallback} />
            <div class={twMerge(baseStyles, toggleSizeStyles, focusStyles, darkStyles, toggledStyles)}></div>
        </label>
    );
}

export default Toggle;