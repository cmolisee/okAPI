import CustomContextMenu from "@/components/contextMenu/CustomContextMenu";
import TabContentView from "@/components/tabContentView";
import Tabs from "@/components/tabs";
import { useWorkspace } from "@/lib/workspaceStore";
import { trackDeep } from "@solid-primitives/deep";
import { twMerge } from "tailwind-merge";

function Workspace (props: any) {
    const { workspaceData } = useWorkspace();
    const scrollbarStyles = '[&::-webkit-scrollbar]:w-2 [&::-webkit-scrollbar]:h-2 [&::-webkit-scrollbar-thumb]:rounded-full [&::-webkit-scrollbar-track]:transparent [&::-webkit-scrollbar-thumb]:bg-secondary-text dark:[&::-webkit-scrollbar-thumb]:bg-secondary-text';

    const handleWorkspaceCleanup = () => {
        const data: ObjectArray<OkMock> = trackDeep(workspaceData);

        if (Object.keys(data).length) {
            workspaceDataStorage.setValue(deepCopy(data));
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
        <div class='flex flex-col h-full'>
            <CustomContextMenu text={'some text'} menuItems={[{text: 'one', callback: () => console.log('one')}]} />
            <Tabs />
            <div class={twMerge('p-2 h-full border border-primary-border rounded-md overflow-y-auto', scrollbarStyles)}>
                <TabContentView />
            </div>
            
        </div>
    );
}

export default Workspace;