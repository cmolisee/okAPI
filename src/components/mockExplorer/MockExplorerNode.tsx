import { VsBracketDot, VsFolder, VsTriangleDown, VsTriangleRight } from "solid-icons/vs";
import { twMerge } from "tailwind-merge";
import { contextMenuContext } from "@/lib/contextMenuProvider";
import { useMockExplorer } from "@/lib/mockExplorerStore";

function MockExplorerNode(props: any) {
    const { addNode, removeNode } = useMockExplorer();
    const { handleContextMenu, handleCloseContextMenu } = useContext(contextMenuContext);
    const [expanded, setExpanded] = createSignal(false);
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

    const toggleExpand = () => {
        if (props.item.type !== "mock") {
            setExpanded(!expanded());
        }
    };

    const contextHandler = (e: MouseEvent) => {
        e.preventDefault();
        e.stopPropagation();
        
        handleContextMenu(e, { text: 'Add Folder', callback: handleAddFolder }, { text: 'Remove Folder', callback: handleRemoveFolder });
    };

    return (
        <div>
            <div class={twMerge("flex items-center pl-[12px] py-2 cursor-pointer", props.level > 0 ? "border-l-2" : "")}
                style={{ "margin-left": `${props.level * 32}px` }}
                onClick={props.item.type !== "mock" ? toggleExpand : undefined} 
                onContextMenu={contextHandler} >
                <span class="mr-2">
                    <Dynamic component={explorerIcons[props.item.type as keyof typeof explorerIcons]} />
                </span>
                <span class={props.item.type !== "mock" ? "font-semibold" : "italic"}>
                    {props.item.name}
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
                            <MockExplorerNode
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

export default MockExplorerNode;