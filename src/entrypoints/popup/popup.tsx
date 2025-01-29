import { createSignal } from 'solid-js';

function Popup() {
  const [count, setCount] = createSignal(0);

  const sendMessageUpdate = async (c: number) => await extensionMessenger.sendMessage('sendMessageToWebpage', `count is now: ${c}`);

  onMount(async () => {
    const notifyWebpage = async (msg: string) => await extensionMessenger.sendMessage('sendMessageToWebpage', msg);

    await notifyWebpage('popup is mounted...');
    // console.log('popup mounted...');

    onCleanup(async () => {
      await notifyWebpage('popup is being unmounted...');
      // console.log('popup unmounted...');
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
        <button onClick={async () => await sendMessageUpdate(count())}>
          send count to webpage
        </button>
        <a href='/options'>to the options page</a>
      </div>
    </>
  );
}

export default Popup;
