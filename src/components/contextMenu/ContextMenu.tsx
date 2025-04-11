import { contextMenuContext } from "@/lib/contextMenuProvider";
import { twMerge } from "tailwind-merge";

function ContextMenu(props: any) {
    const { position, setContextMenuRef } = useContext(contextMenuContext);
    const styles = "border-2 bg-primary-bg text-primary-text border-primary-text z-20";
    const darkStyles = "dark:bg-primary-bg dark:text-primary-text dark:border-primary-text"

    return (
        <div id={'contextMenu'} 
            class={twMerge(styles, darkStyles)}
            ref={setContextMenuRef}
            style={{
                "position": "fixed",
                "top": `${position().y}px`,
                "left": `${position().x}px`,
            }} >
            {props.children}
        </div>
    )
}

export default ContextMenu