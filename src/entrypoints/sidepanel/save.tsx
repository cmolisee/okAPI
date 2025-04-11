import Button from "@/components/button";
import ContextMenu from "@/components/contextMenu/ContextMenu";
import MockExplorerTree from "@/components/mockExplorer/MockExplorerTree";
import ContextMenuStore from "@/lib/contextMenuProvider";
import { useMockExplorer } from "@/lib/mockExplorerStore";
import { useNavigate } from "@solidjs/router";

function Save() {
    const { mockExplorerTree } = useMockExplorer();
    const [savePath, setSavePath] = createSignal('root');
    const navigate = useNavigate();

    const onSavePathChange = (e: Event) => {
        const value = (e.target as HTMLInputElement).value;
        setSavePath(value);
    }

    return (
      <ContextMenuStore>
        <div class="h-full bg-primary-bg dark:bg-primary-bg text text-primary-text dark:text-primary-text">
            <div class="p-4">
                <div class="">
                    <MockExplorerTree data={mockExplorerTree} />
                </div>
                <div class="flex flex-row justify-end">
                    <Button styles="bg-primary-bg dark:bg-primary-bg text-primary-text dark:text-primary-text " onClickCallback={() => navigate('/', { replace: true })}>Cancel</Button>
                    <Button styles="bg-primary-bg dark:bg-primary-bg text-primary-text dark:text-primary-text " onClickCallback={() => navigate('/', { replace: true })}>Save</Button>
                </div>
            </div>
        </div>
      </ContextMenuStore>
    );
  }
  
  export default Save;