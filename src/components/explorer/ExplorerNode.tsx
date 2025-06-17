import { VsAdd, VsBracketDot, VsFolder, VsTriangleDown, VsTriangleRight } from "solid-icons/vs";
import { twMerge } from "tailwind-merge";
import { useMenuContext } from "@/lib/contextMenuProvider";
import { useExplorer } from "@/lib/explorerStore";
import { useNotifications } from "@/lib/notificationProvider";
import AddFolder from "./AddFolder";
import { pathBuilder } from "@/utils/utils";

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

        const newId = getUniqueId();
        addMock(
            props.node?.metadata.id, 
            {
                name: `newFolder_${newId}`,
                description: '',
                method: 'GET',
                uri: '',
                body: '',
                params: {},
                children: {},
                metadata: {
                    id: newId,
                    type: 'folder',
                    isEditing: false,
                    isEnabled: false,
                    isExpanded: false,
                    path: pathBuilder(props.node?.metadata?.path, `newFolder_${newId}`),
                    hasEdits: false,

                }
            });
        handleCloseContextMenu();
        updateExpandedState(props.node?.metadata?.id, true);
        return;
    }

    const handleRemoveFolder = (e: MouseEvent) => {
        e.preventDefault();
        e.stopPropagation();

        const nodesFromPath = props.node?.metadata?.path?.split('/');
        const parentId = nodesFromPath[nodesFromPath.length - 2];

        removeMock(parentId, props.node?.metadata?.id);
        handleCloseContextMenu();
        return;
    }

    const removeFolderNotification = (e: MouseEvent) => {
        handleCloseContextMenu();
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
        updateMockName(props.node?.metadata?.path, value);
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
        if (props.node?.metadata?.type === "folder") {
            updateExpandedState(props.node?.metadata?.id, !props.node?.metadata?.isExpanded);
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

    createEffect(() => {
        if (editName()) {
            const editNameField = document.getElementById('editNameField') as HTMLInputElement;
            editNameField?.focus();
            editNameField?.select();
        }
    });

    return (
        <div>
            <Show when={props.node?.metadata?.type !== 'root'}>
                <div class={twMerge("flex items-center pl-[12px] py-2 cursor-pointer", props.level > 0 ? "border-l-2" : "")}
                    style={{ "margin-left": `${props.level * 32}px` }}
                    onClick={props.node?.metadata?.type !== "mock" ? toggleExpand : undefined}
                    ondblclick={handleEditName}
                    onContextMenu={contextHandler} >
                    <span class="mr-2">
                        <Dynamic component={explorerIcons[props.node?.metadata?.type as keyof typeof explorerIcons]} />
                    </span>
                    <span class={props.node?.metadata?.type !== "mock" ? "font-semibold" : "italic"}>
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
                    <Show when={props.node?.metadata?.isExpanded}>
                        <span class="mr-2">
                            <VsTriangleDown size={18} class="text-secondary-text dark:text-secondary-text" />
                        </span>
                    </Show>
                    <Show when={!props.node?.metadata?.isExpanded}>
                        <span class="mr-2">
                            <VsTriangleRight size={18} class="text-secondary-text dark:text-secondary-text" />
                        </span>
                    </Show>
                </div>
            </Show>
            <Show when={props.node?.metadata?.isExpanded}>
                <div class="children">
                    <For each={Object.values(props.node?.children)}>
                        {(child) => (
                            <ExplorerNode
                                node={child}
                                level={props.level + 1}
                            />
                        )}
                    </For>
                    <AddFolder path={props.node?.metadata?.path} 
                        parentId={props.node?.metadata?.id} 
                        nestLevel={props.level + 1} />
                </div>
            </Show>
        </div>
    );
}

export default ExplorerNode;