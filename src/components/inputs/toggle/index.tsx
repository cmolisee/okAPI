import { twMerge } from "tailwind-merge";

const ToggleSize = {
    xl: { label: "w-[76px] h-[44px]", span: "before:size-[32px] before:left-[6px] before:bottom-[6px] peer-checked:before:translate-x-[32px]" },
    l: { label: "w-[56px] h-[32px]", span: "before:size-[24px] before:left-[4px] before:bottom-[4px] peer-checked:before:translate-x-[24px]" },
    m: { label: "w-[40px] h-[20px]", span: "before:size-[18px] before:left-[2px] before:bottom-[2px] peer-checked:before:translate-x-[18px]" },
    s: { label: "w-[18px] h-[10px]", span: "before:size-[8px] before:left-[1px] before:bottom-[1px] peer-checked:before:translate-x-[8px]" },
}

function Toggle(props: any) {
    // const toggleSizeStyles = ToggleSize[props.toggleSize as keyof typeof ToggleSize];
    // const baseStyles = "peer rounded-full bg-secondary-bg after:absolute after:rounded-full after:border after:border-secondary-bg after:bg-okPurple-500 after:transition-all after:content-['']";
    // const focusStyles = "peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-blue-200";
    // const darkStyles = "dark:bg-secondary-bg dark:after:border-secondary-bg dark:peer-focus:ring-white dark:after:bg-okGreen-500 dark:peer-checked:after:border-okGreen-200 dark:peer-checked:bg-okGreen-200";
    // const toggledStyles = "peer-checked:after:border-okPurple-500 peer-checked:bg-okPurple-200";

    const { label, span } = ToggleSize[props?.taggleSize as keyof typeof ToggleSize ?? 'm'];

    const labelStyles = 'relative cursor-pointer';
    const transitionStyles = 'transition-all ease-in-out';
    const sliderStyles = 'absolute cursor-pointer top-0 left-0 bottom-0 right-0 rounded-sm bg-[#ccc]';
    const sliderBeforeStyles = 'before:absolute before:content-[""] before:rounded-sm before:bg-[#fff]';
    return (
        // <label class="relative cursor-pointer">
        //     <input type="checkbox" value="" class="peer sr-only" checked={props.checked} aria-checked={props.checked} on:change={props.changeCallback} />
        //     <div class={twMerge(baseStyles, toggleSizeStyles, focusStyles, darkStyles, toggledStyles)}></div>
        // </label>
        <label class={twMerge(labelStyles, label)}>
            <input type="checkbox" class="peer sr-only" checked={props.checked} aria-checked={props.checked} on:change={props.changeCallback} />
            <span class={twMerge(sliderStyles, sliderBeforeStyles, span, transitionStyles)}></span>
        </label>
    );
}

export default Toggle;