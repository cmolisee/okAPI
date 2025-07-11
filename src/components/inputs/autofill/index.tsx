import Text from "../text";

function Autofill(props: any) {
    // list of autofill options
    // value and value setter
    return (
        <Text id={props?.id ?? ''}
            class={props.class}
            value={props?.value ?? ''} 
            placeholder={props?.placeholder ?? ''}
            handleFocus={props?.handleFocus}
            handleBlur={props?.handleBlur}
            handleChange={props?.handleChange}
            handleKeyDown={props?.handleKeyDown}
            handleKeyUp={props?.handleKeyUp} /> 
    );
}

export default Text;