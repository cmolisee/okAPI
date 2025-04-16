
import Button from '@/components/button';
import MockExplorerTree from '@/components/mockExplorer/MockExplorerTree';
import SideMenu from '@/components/sideMenu';
import TabContentView from '@/components/tabContentView';
import Tabs from '@/components/tabs';
import ThemeSwitcher from '@/components/themeSwitcher';
import Workspace from '@/components/views/workspace';
import { useMockExplorer } from '@/lib/mockExplorerStore';
import WorkspaceStore from '@/lib/workspaceStore';
import { useNavigate } from '@solidjs/router';
import { VsSave, VsSaveAll } from 'solid-icons/vs';
import { twMerge } from 'tailwind-merge';

function Sidepanel() {
  const { mockExplorerTree } = useMockExplorer();
  const navigate = useNavigate();
  // On open and on update pull the data from local and update the provider
  //      wrap the provider around main.tsx

  // TODO
  // add toggle to enable all should have a lable to describe it
  // add hover tooltip to toggles
  // add label to individual mock toggle to describe it and move the toggle to its own row above the method and uri
  //    let the method/uri field expand full row

  const testMesseging = async () => {
    // const res = await internalMessenger.sendMessage('toBackground', { msg: 'message from sidepanel component' });

    // console.log("response from sending message internalMessenger::toBackground", res);
    workspaceDataStorage.removeValue();
  };

  const containerStyles = 'h-full w-full bg-primary-bg text-md text-primary-text';
  const containerDarkStyles = 'dark:bg-primary-bg dark:text-primary-text';


  return (
    <div class={twMerge(containerStyles, containerDarkStyles)}>
      {/* Title Bar */}
      <div class='flex flex-row justify-between'>
        <SideMenu>
          <MockExplorerTree data={mockExplorerTree} />
        </SideMenu>
        <h1 class='flex items-center mx-4 text-lg font-bold'>OkApi: API Mocking Tool</h1>
        <ThemeSwitcher />
      </div>
      {/* Primary UI Space */}
      <div class='mx-4 bg-gray-300'>
        <Workspace />
      </div>
      <Button onClickCallback={() => navigate('/saveAll', { replace: true })}><VsSaveAll stroke="currentColor" size={24} class="vs text-secondary-text dark:text-secondary-text" /></Button>
      <Button onClickCallback={() => navigate('/save', { replace: true })}><VsSave stroke="currentColor" size={24} class="vs text-secondary-text dark:text-secondary-text" /></Button>
    </div>
  );
}

export default Sidepanel;
