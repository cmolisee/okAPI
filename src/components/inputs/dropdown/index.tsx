import { twMerge } from "tailwind-merge";

function Dropdown(props: any) {
    const styles = "border-none bg-primary-bg dark:bg-primary-bg text-primary-text dark:text-primary-text";

    return (
        <select class={twMerge(styles, props.class)} name={props?.name ?? ''} on:change={props?.handleChange}>
            {props.children}               
        </select>
    )
}

export default Dropdown;