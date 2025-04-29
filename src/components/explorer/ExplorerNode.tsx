import { VsAdd, VsBracketDot, VsFolder, VsTriangleDown, VsTriangleRight } from "solid-icons/vs";
import { twMerge } from "tailwind-merge";
import { contextMenuContext } from "@/lib/contextMenuProvider";
import { useExplorer } from "@/lib/explorerStore";

function ExplorerNode(props: any) {
    const { addNode, removeNode, updateNodeName, updateExpandedState } = useExplorer();
    const { handleContextMenu, handleCloseContextMenu } = useContext(contextMenuContext);
    // const [expanded, setExpanded] = createSignal(false);
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
        updateExpandedState(props.item.path, true);
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
            updateExpandedState(props.item.path, !props.item.expandedState);
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

    const NoFoldersFallback = () => {
        return (
            <Show when={!props.item?.children?.length}>
                <div class='flex'>
                    Click here to create a folder 
                    <VsAdd size={18} color="currentColor" class="vs text-okPurple-500 dark:text-okGreen-500 mx-2" on:click={handleAddFolder} />
                </div>
            </Show>
        )
    }

    createEffect(() => {
        if (editName()) {
            const editNameField = document.getElementById('editNameField') as HTMLInputElement;
            editNameField?.focus();
            editNameField?.select();
        }
    });

    // Do not show the root node
    if (props.level === -1) {
        return (
            <For each={props.item?.children}>
                {(child) => (
                    <ExplorerNode
                        item={child}
                        level={props.level + 1}
                    />
                )}
            </For>
        )
    }

    return (
        <div>
            <Show when={props.item.type !== 'root'} fallback={<NoFoldersFallback />}>
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
                    <Show when={props.item.children?.length > 0 && props.item.expandedState}>
                        <span class="mr-2">
                            <VsTriangleDown size={18} class="text-secondary-text dark:text-secondary-text" />
                        </span>
                    </Show>
                    <Show when={props.item.children?.length > 0 && !props.item.expandedState}>
                        <span class="mr-2">
                            <VsTriangleRight size={18} class="text-secondary-text dark:text-secondary-text" />
                        </span>
                    </Show>
                </div>
            </Show>
            <Show when={props.item.expandedState}>
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