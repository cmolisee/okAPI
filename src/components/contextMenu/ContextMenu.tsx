import { contextMenuContext } from "@/lib/contextMenuProvider";

function ContextMenu(props: any) {
    const { position, setContextMenuRef } = useContext(contextMenuContext);

    return (
        <div id={'contextMenu'} 
            class="border-2 bg-primary-bg dark:bg-primary-bg text-primary-text dark:text-primary-text border-primary-text dark:border-primary-text z-20"
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