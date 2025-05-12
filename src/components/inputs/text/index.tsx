import { twMerge } from "tailwind-merge";

function Text(props: any) {
    const styles = 'bg-primary-bg dark:bg-primary-bg text-primary-text dark:text-primary-text w-full px-2';

    return (
        <input class={twMerge(styles, props.class)}
            id={props?.id ?? ''} 
            type="text" 
            value={props?.value ?? ''} 
            placeholder={props?.placeholder ?? ''}
            on:focus={props?.handleFocus}
            on:blur={props?.handleBlur}
            on:change={props?.handleChange}
            on:keydown={props?.handleKeyDown}
            on:keyup={props?.handleKeyUp} /> 
    );
}

export default Text;