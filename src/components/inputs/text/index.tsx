import { twMerge } from "tailwind-merge";

function Text(props: any) {
    const styles = 'bg-primary-bg dark:bg-primary-bg text-primary-text dark:text-primary-text w-full px-2';

    return (
        <input class={twMerge(styles, props.class)}
            id={props?.id ?? ''} 
            type="text" 
            value={props?.value ?? ''} 
            placeholder={props?.placeholder ?? ''} 
            on:blur={props?.handleBlur} /> 
    );
}

export default Text;