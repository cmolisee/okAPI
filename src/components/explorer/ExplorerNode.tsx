import { VsAdd, VsBracketDot, VsFolder, VsTriangleDown, VsTriangleRight } from "solid-icons/vs";
import { twMerge } from "tailwind-merge";
import { useMenuContext } from "@/lib/contextMenuProvider";
import { useExplorer } from "@/lib/explorerStore";
import { useNotifications } from "@/lib/notificationProvider";
import { createUniqueFolderName } from "@/utils/utils";

function ExplorerNode(props: any) {
    const { addMock, removeMock, updateMockName, updateExpandedState } = useExplorer();
    const { handleContextMenu, handleCloseContextMenu } = useMenuContext();
    const { setNotificationConfig, setShowNotification } = useNotifications();
    const [editName, setEditName] = createSignal(false);
    const explorerIcons = {
        root: () => <VsFolder size={18} class="text-secondary-text dark:text-secondary-text" />,
        folder: () => <VsFolder size={18} class="text-secondary-text dark:text-secondary-text" />,
        mock: () => <VsBracketDot size={18} class="text-secondary-text dark:text-secondary-text" />,
    };

    const handleAddFolder = (e: MouseEvent) => {
        e.preventDefault();
        e.stopPropagation();

        const folderName = createUniqueFolderName();
        addMock(
            props.node?.path, 
            {
                name: folderName, 
                path: props.node?.path + '/' + folderName, 
                type: 'folder'
            });
        handleCloseContextMenu();
        updateExpandedState(props.node?.path, true);
        return;
    }

    const handleRemoveFolder = (e: MouseEvent) => {
        e.preventDefault();
        e.stopPropagation();

        removeMock(props.node?.path);
        handleCloseContextMenu();
        return;
    }

    const removeFolderNotification = (e: MouseEvent) => {
        setNotificationConfig({
            continueCallback: () => handleRemoveFolder(e),
            content: <div>Are you sure you want to delete this folder and all its content?</div>,
        });
        setShowNotification(true);
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
        updateMockName(props.node?.path, value);
        setEditName(false);
    }

    const handleEditNameKeyDown = (e: KeyboardEvent) => {
        if (e.key === 'Enter') {
            e.preventDefault();
            e.stopPropagation();
    
            const value = (e.target as HTMLInputElement).value;
            updateMockName(props.node?.path, value);
            setEditName(false);
        }
        return;
    };

    const toggleExpand = () => {
        if (props.node?.type !== "mock") {
            updateExpandedState(props.node?.path, !props.node?.expandedState);
        }
    };

    const contextHandler = (e: MouseEvent) => {
        e.preventDefault();
        e.stopPropagation();
        
        handleContextMenu(e, 
            { text: 'Add Folder', callback: handleAddFolder }, 
            { text: 'Remove Folder', callback: removeFolderNotification },
            { text: 'Edit Folder Name', callback: handleEditName },
        );
    };

    const AddFolder = () => {
        return (
            <div class='flex items-center italic pl-[12px] py-2 cursor-pointer text-sm font-thin' 
                style={{ "margin-left": `${(props.level + 1) * 32}px` }}
                on:click={handleAddFolder}>
                Add Folder
                <VsAdd size={16} color="currentColor" class="vs text-okPurple-500 dark:text-okGreen-500 mx-2 cursor-pointer" />
            </div>
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
            <>
                <For each={props.node?.children} fallback={<AddFolder />}>
                    {(child) => (
                        <ExplorerNode
                            node={child}
                            level={props.level + 1}
                        />
                    )}
                </For>
                <AddFolder />
            </>
        )
    }

    return (
        <div>
            <Show when={props.node?.type !== 'root'}>
                <div class={twMerge("flex items-center pl-[12px] py-2 cursor-pointer", props.level > 0 ? "border-l-2" : "")}
                    style={{ "margin-left": `${props.level * 32}px` }}
                    onClick={props.node?.type !== "mock" ? toggleExpand : undefined}
                    ondblclick={handleEditName}
                    onContextMenu={contextHandler} >
                    <span class="mr-2">
                        <Dynamic component={explorerIcons[props.node?.type as keyof typeof explorerIcons]} />
                    </span>
                    <span class={props.node?.type !== "mock" ? "font-semibold" : "italic"}>
                        <Show when={!editName()}>
                            {props.node?.name}
                        </Show>
                        <Show when={editName()}>
                            <input id='editNameField'
                                type="text" 
                                value={props.node?.name} 
                                on:keydown={handleEditNameKeyDown}
                                on:blur={handleEditNameOnBlur} />
                        </Show>
                    </span>
                    <Show when={props.node?.expandedState}>
                        <span class="mr-2">
                            <VsTriangleDown size={18} class="text-secondary-text dark:text-secondary-text" />
                        </span>
                    </Show>
                    <Show when={!props.node?.expandedState}>
                        <span class="mr-2">
                            <VsTriangleRight size={18} class="text-secondary-text dark:text-secondary-text" />
                        </span>
                    </Show>
                </div>
            </Show>
            <Show when={props.node?.expandedState}>
                <div class="children">
                    <For each={props.node?.children}>
                        {(child) => (
                            <ExplorerNode
                                node={child}
                                level={props.level + 1}
                            />
                        )}
                    </For>
                    <AddFolder />
                </div>
            </Show>
        </div>
    );
}

export default ExplorerNode;