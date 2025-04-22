import MockExplorerTree from "@/components/mockExplorer/MockExplorerTree";
import { useMockExplorer } from "@/lib/mockExplorerStore";
import { trackStore } from "@solid-primitives/deep";
import { twMerge } from "tailwind-merge";

function Explorer (props:any) {
    const { mockExplorerTree } = useMockExplorer();
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
        const data: ApiMockNode = trackStore(mockExplorerTree);

        if (Object.keys(mockExplorerTree).length) {    
            mockExplorerDataStorage.setValue(deepCopyAndUnproxy(data));
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
            <MockExplorerTree data={mockExplorerTree} />
        </div>
    )
}

export default Explorer;