import Button from "@/components/inputs/button";
import ContextMenu from "@/components/contextMenu/CustomContextMenu";

export const contextMenuContext = createContext<ContextMenuContext>({
    showContextMenu: () => { },
    position: () => { },
    contextMenuChildren: () => { },
    setContextMenuRef: () => { },
    setContextMenuChildren: () => { },
    handleContextMenu: () => { },
    handleCloseContextMenu: () => { },
});

export const useMenuContext = () => {
    const context = useContext(contextMenuContext);
    if (!context) {
        throw Error("contextMenuContext does not exist.");
    }
    return context;
};

function ContextMenuProvider(props: any) {
    const [showContextMenu, setShowContextMenu] = createSignal(false);
    const [position, setPosition] = createSignal<Pos>({ x: 0, y: 0 });
    const [contextMenuRef, setContextMenuRef] = createSignal<ContextMenuRef>();
    const [contextMenuChildren, setContextMenuChildren] = createSignal<{ text: string, callback: () => void }[]>();

    // This should be applied to the solidjs onContextMenu handler of a div element
    const handleContextMenu = (e: MouseEvent, ...children: any[]) => {
        if (!showContextMenu()) {
            e.preventDefault();
            e.stopPropagation();
            setContextMenuChildren(children);
            setPosition({ x: e.clientX, y: e.clientY });
            setShowContextMenu(true);
        }
    };

    const handleCloseContextMenu = () => {
        setShowContextMenu(false);
        setContextMenuRef(undefined);
    };

    function hasMatchingParent(target: HTMLElement|null|undefined) {
        if (!contextMenuRef() || !target) {
            return false;
        }

        if (contextMenuRef()!.id === target?.id) {
            return true;
        }

        return hasMatchingParent(target?.parentElement);
    }

    const contextMenuOutsideClickHandler = (e: MouseEvent) => {
        if (showContextMenu() && contextMenuRef() && !hasMatchingParent(e.target as HTMLElement)) {
            setShowContextMenu(false);
            setContextMenuRef(undefined);
        }
    };

    createEffect(() => {
        const contextMenuGlobalOutsideClickHandler = (e: MouseEvent) => {
            contextMenuOutsideClickHandler(e);
        };

        document.addEventListener('mousedown', contextMenuGlobalOutsideClickHandler);

        onCleanup(() => {
            document.removeEventListener('mousedown', contextMenuGlobalOutsideClickHandler);
        });
    });

    return (
        <contextMenuContext.Provider value={{
            showContextMenu,
            position,
            contextMenuChildren,
            setContextMenuRef,
            setContextMenuChildren,
            handleContextMenu,
            handleCloseContextMenu,
        }}>
            {props.children}
            <Show when={showContextMenu()}>
                <Portal>
                    <ContextMenu>
                        <ul>
                            <For each={contextMenuChildren()}>
                                {(child) => (<li><Button onClickCallback={child.callback}>{child.text}</Button></li>)}
                            </For>
                        </ul>
                    </ContextMenu>
                </Portal>
            </Show>
        </contextMenuContext.Provider>
    )
}

export default ContextMenuProvider;