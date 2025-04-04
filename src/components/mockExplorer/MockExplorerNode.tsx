import { VsBracketDot, VsFolder } from "solid-icons/vs";
import { twMerge } from "tailwind-merge";

function MockExplorerNode(props: { item: ApiMockNode; level: number }) {
    const [expanded, setExpanded] = createSignal(false);
    const nodeIcons = {
        folder: () => <VsFolder size={18} class="text-secondary-text dark:text-secondary-text" />,
        file: () => <VsBracketDot size={18} class="text-secondary-text dark:text-secondary-text" />,
    }

    const toggleExpand = () => {
        setExpanded(!expanded());
    };

    return (
        <div>
            <div class={twMerge("flex items-center pl-[12px] py-2 cursor-pointer", props.level > 0 ? "border-l-2" : "")}
                style={{ "margin-left": `${props.level * 32}px` }}
                onClick={props.item.type === "folder" ? toggleExpand : undefined} >
                <span class="mr-2">
                    <Dynamic component={nodeIcons[props.item.type as keyof typeof nodeIcons]} />
                </span>
                <span class={props.item.type === "folder" ? "font-semibold" : "italic"}>
                    {props.item.name}
                </span>
            </div>
            <Show when={props.item.type === "folder" && expanded()}>
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