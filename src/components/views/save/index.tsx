import ExplorerTree from "@/components/explorer/ExplorerTree";
import { useExplorer } from "@/lib/explorerStore";
import { twMerge } from "tailwind-merge";
import Explorer from "../explorer";

function Save (props:any) {
    const { explorerTree } = useExplorer();
    const scrollbarStyles = '[&::-webkit-scrollbar]:w-2 [&::-webkit-scrollbar]:h-2 [&::-webkit-scrollbar-thumb]:rounded-full [&::-webkit-scrollbar-track]:transparent [&::-webkit-scrollbar-thumb]:bg-secondary-text dark:[&::-webkit-scrollbar-thumb]:bg-secondary-text';

    return (
        <div class="flex flex-col">
            <h1 class="flex justify-center w-full">Mock Explorer</h1>
            <div class={twMerge('h-full', scrollbarStyles)}>
                <Explorer/>
            </div>
        </div>
    )
}

export default Save;