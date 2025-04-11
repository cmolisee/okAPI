import { twMerge } from "tailwind-merge";

function Seperator(props: any) {
    return (<div class={twMerge("w-full h-[1px] cursor-default m-y-[4px] bg-black", props.styles)} />);
}

export default Seperator;