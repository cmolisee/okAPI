import { VsClose, VsMenu } from "solid-icons/vs";
import Button from "../button";
import { twMerge } from "tailwind-merge";

function SideMenu(props: any) {
    const [expanded, setExpanded] = createSignal(false);

    onMount(() => {
        const closeMenuEventHandler = () => setExpanded(false);
        document.addEventListener('customCloseMenu', closeMenuEventHandler);

        onCleanup(() => document.removeEventListener('customCloseMenu', closeMenuEventHandler));
    });
    
    return (
        <>
            <Button styles="flex items-center p-2" onClickCallback={() => setExpanded(true)}><VsMenu size={18} color="currentColor" class="vs text-primary-text dark:text-primary-text" /></Button>
            <Show when={expanded()}>
                <div class="fixed inset-0 bg-[#000] bg-opacity-50 z-10 transition-opacity duration-300" />
            </Show>
            <div class={twMerge("absolute top-0 left-0 h-screen z-20 bg-okPurple-600 w-12 flex flex-col items-center py-4 transform transition-all duration-300 ease-in-out", expanded() ? 'translate-y-0 opacity-100' : '-translate-y-full opacity-0')}>
                <button type='button' on:click={() => setExpanded(false)} class="mb-6">
                    <VsClose stroke="currentColor" size={32} class="vs text-[#fff]" />
                </button>
                {props.children}
            </div>
        </>
    )
}

export default SideMenu;