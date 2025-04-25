import TabContentView from "@/components/tabContentView";
import Tabs from "@/components/tabs";
import WorkspaceStore, { useWorkspace } from "@/lib/workspaceStore";
import { trackDeep } from "@solid-primitives/deep";
import { twMerge } from "tailwind-merge";

function Workspace (props: any) {
    const { workspaceData } = useWorkspace();
    const scrollbarStyles = '[&::-webkit-scrollbar]:w-2 [&::-webkit-scrollbar]:h-2 [&::-webkit-scrollbar-thumb]:rounded-full [&::-webkit-scrollbar-track]:transparent [&::-webkit-scrollbar-thumb]:bg-secondary-text dark:[&::-webkit-scrollbar-thumb]:bg-secondary-text';

    const handleWorkspaceCleanup = () => {
        const data: WorkspaceData = trackDeep(workspaceData);

        if (Object.keys(data).length) {
            workspaceDataStorage.setValue(deepCopyAndUnproxy(data));
        }
    }

    onMount(() => {
        window.addEventListener('beforeunload', handleWorkspaceCleanup);
        document.addEventListener('visibilitychange', handleWorkspaceCleanup);

        onCleanup(() => {
            window.removeEventListener('beforeunload', handleWorkspaceCleanup);
            document.removeEventListener('visibilitychange', handleWorkspaceCleanup);
        })
    });

    return (
        <WorkspaceStore>
            <div class='flex flex-col h-full'>
                <Tabs />
                <div class={twMerge('p-2 h-full border border-primary-border rounded-md overflow-y-auto', scrollbarStyles)}>
                    <TabContentView />
                </div>
            </div>
        </WorkspaceStore>
    );
}

export default Workspace;