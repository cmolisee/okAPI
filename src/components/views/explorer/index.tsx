import ExplorerNode from "@/components/explorer/ExplorerNode";
import ExplorerTree from "@/components/explorer/ExplorerTree";
import { useExplorer } from "@/lib/explorerStore";
import { trackStore } from "@solid-primitives/deep";
import { twMerge } from "tailwind-merge";

function Explorer (props:any) {
    const { explorerTree } = useExplorer();
    const scrollbarStyles = '[&::-webkit-scrollbar]:w-2 [&::-webkit-scrollbar]:h-2 [&::-webkit-scrollbar-thumb]:rounded-full [&::-webkit-scrollbar-track]:transparent [&::-webkit-scrollbar-thumb]:bg-secondary-text dark:[&::-webkit-scrollbar-thumb]:bg-secondary-text';

    // 1. each mock should have a save button
    // if not previously saved then it should prompt to save in explorer thingy

    // 2. explorer 
    // indicator that a specific mock is in the workspace
    // option to add a mock to the workspace

    // 3. prompt on remove folder to confirm

    // 4. click and drag to move folder or mock
    // this would need to update all the children

    // 5. right click context menu option to move
    // prompt user for path to move too

    // 6. right click context menu to copy
    // prompt location to copy it too
    // prepends with copy-

    // 7. right click context menu to add new
    // creates new mock at location of the right click
    
    const handleExplorerCleanup = () => {
        const data: OkMock = trackStore(explorerTree);

        if (Object.keys(explorerTree).length) {    
            explorerDataStorage.setValue(deepCopyAndUnproxy(data));
        }
    };

    onMount(() => {
        window.addEventListener('beforeunload', handleExplorerCleanup);
        document.addEventListener('visibilitychange', handleExplorerCleanup);

        onCleanup(() => {
            window.removeEventListener('beforeunload', handleExplorerCleanup);
            document.removeEventListener('visibilitychange', handleExplorerCleanup);
        })
    });

    return (
        <div class={twMerge('h-full', scrollbarStyles)}>
            <ExplorerTree>
                <ExplorerNode node={explorerTree} level={props.level ?? -1} />
            </ExplorerTree>
        </div>
    )
}

export default Explorer;