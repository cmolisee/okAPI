import { twMerge } from "tailwind-merge"

function Button(props: any) {
    return (
        <button id={props.id} class={twMerge("inline size-fit mx-2", props.styles)} on:click={props.onClickCallback}>
            {props.children}
        </button>
    );
}

export default Button;