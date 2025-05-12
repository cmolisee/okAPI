import { twMerge } from "tailwind-merge";

const ToggleSize = {
    xl: { label: "w-[76px] min-w-[76px] h-[44px]", span: "before:size-[32px] before:left-[6px] before:top-[calc(50%-16px)] before:translate-y-[calc(-50%+16px)] peer-checked:before:translate-x-[32px]" },
    l: { label: "w-[56px] min-w-[56px] h-[32px]", span: "before:size-[24px] before:left-[4px] before:top-[calc(50%-12px)] before:translate-y-[calc(-50%+12px)] peer-checked:before:translate-x-[24px]" },
    m: { label: "w-[40px] min-w-[40px] h-[22px]", span: "before:size-[18px] before:left-[2px] before:top-[calc(50%-9px)] before:translate-y-[calc(-50%+9px)] peer-checked:before:translate-x-[18px]" },
    s: { label: "w-[28px] min-w-[28px] h-[16px]", span: "before:size-[12px] before:left-[2px] before:top-[calc(50%-6px)] before:translate-y-[calc(-50%+6px)] peer-checked:before:translate-x-[12px]" },
}

function Toggle(props: any) {
    const { label, span } = ToggleSize[props?.toggleSize as keyof typeof ToggleSize ?? 'm'];

    const labelStyles = 'relative cursor-pointer';
    const transitionStyles = 'transition-all ease-in-out';
    const sliderStyles = 'block w-full h-full cursor-pointer rounded-sm';
    const toggleOffColor = 'bg-[#ccc]';
    const toggleOnColor = 'peer-checked:bg-okGreen-200'
    const sliderBeforeStyles = 'before:absolute before:content-[""] before:rounded-sm';
    const sliderColor = 'before:bg-[#fff]';
    return (
        <label class={twMerge(labelStyles, label)}>
            <input type="checkbox" class="peer sr-only" checked={props.checked} aria-checked={props.checked} on:change={props.changeCallback} />
            <span class={twMerge(sliderStyles, toggleOffColor, toggleOnColor, sliderBeforeStyles, sliderColor, span, transitionStyles)}></span>
        </label>
    );
}

export default Toggle;