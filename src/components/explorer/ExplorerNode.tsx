import { VsBracketDot, VsFolder, VsTriangleDown, VsTriangleRight } from "solid-icons/vs";
import { twMerge } from "tailwind-merge";
import { contextMenuContext } from "@/lib/contextMenuProvider";
import { useExplorer } from "@/lib/explorerStore";

function ExplorerNode(props: any) {
    const { addNode, removeNode, updateNodeName } = useExplorer();
    const { handleContextMenu, handleCloseContextMenu } = useContext(contextMenuContext);
    const [expanded, setExpanded] = createSignal(false);
    const [editName, setEditName] = createSignal(false);
    const explorerIcons = {
        root: () => <VsFolder size={18} class="text-secondary-text dark:text-secondary-text" />,
        folder: () => <VsFolder size={18} class="text-secondary-text dark:text-secondary-text" />,
        mock: () => <VsBracketDot size={18} class="text-secondary-text dark:text-secondary-text" />,
    };

    const handleAddFolder = (e: MouseEvent) => {
        e.preventDefault();
        e.stopPropagation();

        const contextId = getUniqueId();
        addNode(props.item.path, { name: contextId, path: props.item.path + '/' + contextId, type: 'folder' });
        handleCloseContextMenu();
        setExpanded(true);
        return;
    }

    const handleRemoveFolder = (e: MouseEvent) => {
        e.preventDefault();
        e.stopPropagation();

        removeNode(props.item.path);
        handleCloseContextMenu();
        return;
    }

    const removeFolderNotification = (node: ApiMockNode) => {
        const noChildrenText = 'Are you sure you want to delete this folder?';
        const withChildrenText = 'Are you sure you want to delete this folder and all child folders/nodes?';
        // add yes button
        // add cancel button
    }

    const handleEditName = (e: MouseEvent) => {
        e.preventDefault();
        e.stopPropagation();

        setEditName(true);
        handleCloseContextMenu();
        return;
    }

    const handleEditNameOnBlur = (e: Event) => {
        e.preventDefault();
        e.stopPropagation();

        const value = (e.target as HTMLInputElement).value;
        updateNodeName(props.item.path, value);
        setEditName(false);
    }

    const handleEditNameKeyDown = (e: KeyboardEvent) => {
        if (e.key === 'Enter') {
            e.preventDefault();
            e.stopPropagation();
    
            const value = (e.target as HTMLInputElement).value;
            updateNodeName(props.item.path, value);
            setEditName(false);
        }
        return;
    };

    const toggleExpand = () => {
        if (props.item.type !== "mock") {
            setExpanded(!expanded());
        }
    };

    const contextHandler = (e: MouseEvent) => {
        e.preventDefault();
        e.stopPropagation();
        
        handleContextMenu(e, 
            { text: 'Add Folder', callback: handleAddFolder }, 
            { text: 'Remove Folder', callback: handleRemoveFolder },
            { text: 'Edit Folder Name', callback: handleEditName },
        );
    };

    createEffect(() => {
        if (editName()) {
            const editNameField = document.getElementById('editNameField') as HTMLInputElement;
            editNameField?.focus();
            editNameField?.select();
        }
    });

    return (
        <div>
            <div class={twMerge("flex items-center pl-[12px] py-2 cursor-pointer", props.level > 0 ? "border-l-2" : "")}
                style={{ "margin-left": `${props.level * 32}px` }}
                onClick={props.item.type !== "mock" ? toggleExpand : undefined} 
                ondblclick={handleEditName}
                onContextMenu={contextHandler} >
                <span class="mr-2">
                    <Dynamic component={explorerIcons[props.item.type as keyof typeof explorerIcons]} />
                </span>
                <span class={props.item.type !== "mock" ? "font-semibold" : "italic"}>
                    <Show when={!editName()}>
                        {props.item.name}
                    </Show>
                    <Show when={editName()}>
                        <input id='editNameField'
                            type="text" 
                            value={props.item.name} 
                            on:keydown={handleEditNameKeyDown}
                            on:blur={handleEditNameOnBlur} />
                    </Show>
                </span>
                <Show when={props.item.children?.length > 0 && expanded()}>
                    <span class="mr-2">
                        <VsTriangleDown size={18} class="text-secondary-text dark:text-secondary-text" />
                    </span>
                </Show>
                <Show when={props.item.children?.length > 0 && !expanded()}>
                    <span class="mr-2">
                        <VsTriangleRight size={18} class="text-secondary-text dark:text-secondary-text" />
                    </span>
                </Show>
            </div>
            <Show when={expanded()}>
                <div class="children">
                    <For each={props.item.children}>
                        {(child) => (
                            <ExplorerNode
                                item={child}
                                level={props.level + 1}
                            />
                        )}
                    </For>
                </div>
            </Show>
        </div>
    );
}

export default ExplorerNode;