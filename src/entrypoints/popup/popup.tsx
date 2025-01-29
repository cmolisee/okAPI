import { extensionMessenger } from '@/utils/messaging';
import { createSignal } from 'solid-js';

function Popup() {
  const [count, setCount] = createSignal(0);

  const sendMessageUpdate = async (c: number) => await extensionMessenger.sendMessage('sendMessageToWebpage', `count is now: ${c}`);

  onMount(() => {
    const notifyWebpage = async (msg: string) => await extensionMessenger.sendMessage('sendMessageToWebpage', msg);

    notifyWebpage('popup is mounted...');

    onCleanup(() => {
      notifyWebpage('popup is being unmounted...');
    });
  })

  return (
    <>
      <div>
      </div>
      <h1>okAPI</h1>
      <div class="card">
        <button onClick={() => setCount((count) => count + 1)}>
          count is {count()}
        </button>
        <button onClick={() => sendMessageUpdate(count())}>
          send count to webpage
        </button>
        <a href='/options'>to the options page</a>
      </div>
    </>
  );
}

export default Popup;
