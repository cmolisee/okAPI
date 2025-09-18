import { VsAdd, VsBracketDot, VsFolder, VsTriangleDown, VsTriangleRight } from "solid-icons/vs";
import { twMerge } from "tailwind-merge";
import { useMenuContext } from "@/lib/contextMenuProvider";
import { useMockApiTree } from "@/lib/mockApiTreeProvider";
import { useNotifications } from "@/lib/notificationProvider";
import AddFolder from "./AddFolderButton";
import { pathBuilder } from "@/utils/utils";
import CustomContextMenu from "../contextMenu/CustomContextMenu";

function ExplorerNode(props: any) {
    const { insert, remove, forEach } = useMockApiTree();
    // const { handleContextMenu, handleCloseContextMenu } = useMenuContext();
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
        insert(
            props.node?.id, 
            {
                name: `newFolder_${newId}`,
                id: newId,
                children: {},
                data: {
                    body: '',
                    description: '',
                    hasEdits: false,
                    isEditing: false,
                    isEnabled: false,
                    isExpanded: false,
                    method: 'GET',
                    params: {},
                    path: pathBuilder(props.node?.metadata?.path, `newFolder_${newId}`),
                    type: 'folder',
                    uri: '',

                }
            });
        // handleCloseContextMenu();
        forEach((node) => {
            node.data.isExpanded = node.id === props.node.id;
            return true;
        });

        return;
    }

    const handleRemoveFolder = (e: MouseEvent) => {
        e.preventDefault();
        e.stopPropagation();

        remove(props.node.id);
        // handleCloseContextMenu();
        return;
    }

    const removeFolderNotification = (e: MouseEvent) => {
        // handleCloseContextMenu();
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
        // handleCloseContextMenu();
        return;
    }

    const handleEditNameOnBlur = (e: Event) => {
        e.preventDefault();
        e.stopPropagation();

        const value = (e.target as HTMLInputElement).value;
        forEach((node) => {
            if (node.id === props.node.id) {
                node.name = value;
                return false;
            }
            return true;
        });
        setEditName(false);
    }

    const handleEditNameKeyDown = (e: KeyboardEvent) => {
        if (e.key === 'Enter') {
            e.preventDefault();
            e.stopPropagation();
    
            const value = (e.target as HTMLInputElement).value;
            forEach((node) => {
                if (node.id === props.node.id) {
                    node.name = value;
                    return false;
                }
                return true;
            });
            setEditName(false);
        }
        return;
    };

    const toggleExpand = () => {
        if (props.node?.metadata?.type === "folder") {
            forEach((node) => {
                if (node.id !== props.node.id) {
                    return true;
                }
                node.data.isExpanded = true;
                return false;
            });
        }
    };

    // const contextHandler = (e: MouseEvent) => {
    //     e.preventDefault();
    //     e.stopPropagation();
        
    //     handleContextMenu(e, 
    //         { text: 'Add Folder', callback: handleAddFolder }, 
    //         { text: 'Remove Folder', callback: removeFolderNotification },
    //         { text: 'Edit Folder Name', callback: handleEditName },
    //     );
    // };

    const contextMenuItems = [
        { text: 'Add Folder', callback: handleAddFolder }, 
        { text: 'Remove Folder', callback: removeFolderNotification },
        { text: 'Edit Folder Name', callback: handleEditName },
    ]

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
                <CustomContextMenu title={props.node?.name} menuItems={contextMenuItems}/>
                {/* <div class={twMerge("flex items-center pl-[12px] py-2 cursor-pointer", props.level > 0 ? "border-l-2" : "")}
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
                </div> */}
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
                        parentId={props.node?.id} 
                        nestLevel={props.level + 1} />
                </div>
            </Show>
        </div>
    );
}

export default ExplorerNode;