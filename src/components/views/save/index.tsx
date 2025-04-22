import MockExplorerTree from "@/components/mockExplorer/MockExplorerTree";
import { useMockExplorer } from "@/lib/mockExplorerStore";
import { twMerge } from "tailwind-merge";

function Save (props:any) {
    const { mockExplorerTree } = useMockExplorer();
    const scrollbarStyles = '[&::-webkit-scrollbar]:w-2 [&::-webkit-scrollbar]:h-2 [&::-webkit-scrollbar-thumb]:rounded-full [&::-webkit-scrollbar-track]:transparent [&::-webkit-scrollbar-thumb]:bg-secondary-text dark:[&::-webkit-scrollbar-thumb]:bg-secondary-text';

    return (
        <div class="flex flex-col">
            <h1 class="flex justify-center w-full">Mock Explorer</h1>
            <div class={twMerge('h-full', scrollbarStyles)}>
                <MockExplorerTree data={mockExplorerTree} />
            </div>
        </div>
    )
}

export default Save;