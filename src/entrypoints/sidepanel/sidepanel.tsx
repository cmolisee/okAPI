
import MockExplorerTree from '@/components/mockExplorer/MockExplorerTree';
import SideMenu from '@/components/sideMenu';
import TabContentView from '@/components/tabContentView';
import Tabs from '@/components/tabs';
import ThemeSwitcher from '@/components/themeSwitcher';
import { mockExplorerContext } from '@/lib/mockExplorerStore';
import WorkspaceStore from '@/lib/workspaceStore';

function Sidepanel() {
  const { mockExplorerData } = useContext(mockExplorerContext)

  // const sendMessageUpdate = async (c: number) => await extensionMessenger.sendMessage('sendMessageToWebpage', `count is now: ${c}`);

  onMount(async () => {
    const notifyWebpage = async (msg: string) => await extensionMessenger.sendMessage('sendMessageToWebpage', msg);
    await notifyWebpage('sidepanel is mounted...').catch(e => console.debug);

    onCleanup(async () => {
      await notifyWebpage('sidepanel is being unmounted...').catch(e => console.debug);
    });
  });

  // On open and on update pull the data from local and update the provider
  //      wrap the provider around main.tsx

  // TODO
  // add toggle to enable all should have a lable to describe it
  // add hover tooltip to toggles
  // add label to individual mock toggle to describe it and move the toggle to its own row above the method and uri
  //    let the method/uri field expand full row

  return (
    <div class='h-full bg-primary-bg dark:bg-primary-bg text text-primary-text dark:text-primary-text'>
      <div class='flex flex-row justify-between'>
        <SideMenu>
          <MockExplorerTree data={mockExplorerData} />
        </SideMenu>
        <h1 class='flex items-center mx-4 text-lg font-bold'>OkApi: API Mocking Tool</h1>
        <ThemeSwitcher />
      </div>
      <div class='mx-4'>
        <WorkspaceStore>
          <Tabs />
          <TabContentView />
        </WorkspaceStore>
      </div>
    </div>
  );
}

export default Sidepanel;
