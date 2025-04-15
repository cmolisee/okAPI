import { VsClose, VsMenu } from "solid-icons/vs";
import Button from "../button";
import { twMerge } from "tailwind-merge";

function SideMenu(props: any) {
    const [expanded, setExpanded] = createSignal(false);
    const scrollbarStyles = '[&::-webkit-scrollbar]:w-2 [&::-webkit-scrollbar]:h-2 [&::-webkit-scrollbar-thumb]:rounded-full [&::-webkit-scrollbar-track]:transparent [&::-webkit-scrollbar-thumb]:bg-secondary-text dark:[&::-webkit-scrollbar-thumb]:bg-secondary-text';

    return (
        <>
            <Button styles="flex items-center m-2 p-2" onClickCallback={() => setExpanded(true)}><VsMenu size={18} color="currentColor" class="vs text-primary-text dark:text-primary-text" /></Button>
            <Show when={expanded()}>
                <div class="absolute h-screen w-screen z-10 bg-secondary-bg border-r-1 border-secondary-border dark:bg-secondary-bg dark:border-secondary-border">
                    <div class="flex flex-row justify-end m-2 p-2">
                        <Button onClickCallback={() => setExpanded(false)}><VsClose stroke="currentColor" size={24} class="vs text-secondary-text dark:text-secondary-text" /></Button>
                    </div>
                    <div class={twMerge('overflow-auto h-[calc(100%-3.5rem)] p-2', scrollbarStyles)}>
                        {props.children}
                    </div>
                </div>
            </Show>
        </>
    )
}

export default SideMenu;