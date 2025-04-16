import TabContentView from "@/components/tabContentView";
import Tabs from "@/components/tabs";
import WorkspaceStore from "@/lib/workspaceStore";

function Workspace (props: any) {
    return (
        <WorkspaceStore>
            <div class='flex flex-col h-full'>
                <Tabs />
                <div class='p-2 h-full border border-primary-border rounded-md'>
                    <TabContentView />
                </div>
            </div>
        </WorkspaceStore>
    )
}

export default Workspace;