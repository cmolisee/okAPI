import { VsClose, VsMenu } from "solid-icons/vs";
import Button from "../button";

function SideMenu(props: any) {
    const [expanded, setExpanded] = createSignal(false);

    return (
        <>
            <Button styles="flex items-center m-2 p-2" onClickCallback={() => setExpanded(true)}><VsMenu size={18} color="currentColor" class="vs text-primary-text dark:text-primary-text" /></Button>
            <Show when={expanded()}>
                <div class="absolute h-screen w-1/2 p-2 z-10 bg-secondary-bg dark:bg-secondary-bg border-r-1 border-secondary-border dark:border-secondary-border">
                    <div class="flex flex-row justify-end">
                        <Button class="m-2 p-2" onClickCallback={() => setExpanded(false)}><VsClose stroke="currentColor" size={24} class="vs text-secondary-text dark:text-secondary-text" /></Button>
                    </div>
                    {props.children}
                </div>
            </Show>
        </>
    )
}

export default SideMenu;