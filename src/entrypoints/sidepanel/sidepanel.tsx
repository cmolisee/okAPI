import FileSystemTree from '@/components/FileSystemExplorer';
import TabContentView from '@/components/tabContentView';
import Tabs from '@/components/tabs';
import ThemeSwitcher from '@/components/themeSwitcher';
import TabStore from '@/lib/tabStore';
import { createSignal } from 'solid-js';

function Sidepanel() {
  const [count, setCount] = createSignal(0);

  const sendMessageUpdate = async (c: number) => await extensionMessenger.sendMessage('sendMessageToWebpage', `count is now: ${c}`);

  onMount(async () => {
    const notifyWebpage = async (msg: string) => await extensionMessenger.sendMessage('sendMessageToWebpage', msg);

    await notifyWebpage('sidepanel is mounted...').catch(e => console.debug);

    onCleanup(async () => {
      await notifyWebpage('sidepanel is being unmounted...').catch(e => console.debug);
    });
  })

  return (
    <div class='h-full bg-primary-bg dark:bg-primary-bg text text-primary-text dark:text-primary-text'>
      <div class='flex flex-row justify-between'>
        <h1 class='flex items-center mx-4 text-lg font-bold'>OkApi: API Mocking Tool</h1>
        <ThemeSwitcher />
      </div>
      <div class='mx-4'>
        <TabStore>
          <Tabs />
          <TabContentView />
        </TabStore>
        <FileSystemTree data={{
            name: "Root",
            type: "folder",
            children: [
              { name: "file1.txt", type: "file" },
              { 
                name: "Folder1", 
                type: "folder",
                children: [
                  { name: "file2.txt", type: "file" }
                ]
              }
            ]
          }} />
      </div>
    </div>
  );
}

export default Sidepanel;
