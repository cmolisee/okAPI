import { twMerge } from "tailwind-merge";

function Checkbox(props: any) {
    // const labelStyles = `block cursor-pointer transition-all duration-[0.2s] ease-[ease] rounded-md border-2 border-solid border-[${props.color}] active:rounded-xl active:scale-105`;
    // const pathStyles = `fill-none stroke-[${props.color}] stroke-[4px] transition-all duration-[250ms] ease-[cubic-bezier(1,0,0.37,0.91)]`;
    const labelStyles = 'relative flex justify-center items-center';
    const checkboxStyles = 'peer size-4 border border-[#333] bg-transparent appearance-none';
    const spanStyles = 'absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 block size-2 bg-okGreen-500 opacity-60 scale-[0] transition-all duration-200 ease-in-out'
    const checkedStyles = 'peer-checked:scale-[1]'
    return (
       <label class={labelStyles}>
         <input type="checkbox" 
            name="checkbox"
            class={checkboxStyles}
            checked={props.checked} 
            aria-checked={props.checked} 
            on:change={props.changeCallback} />
        <span class={twMerge(spanStyles, checkedStyles)}/>
        {props.label}
       </label>
    );
}

export default Checkbox;
