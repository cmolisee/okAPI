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
    <div class="grid grid-cols-10 grid-rows-1 gap-1">
      <div class="col-span-2">Side Panel</div>
      <div class="col-span-8">
        <p>main content</p>
        <h1>okAPI</h1>
        <div class="card">
          <button onClick={() => setCount((count) => count + 1)}>
            count is {count()}
          </button>
          <button onClick={async () => await sendMessageUpdate(count()).catch(e => console.debug)}>
            send count to webpage
          </button>
          <a href='/options'>to the options page</a>
        </div>
      </div>
    </div>
  );
}

export default Sidepanel;
