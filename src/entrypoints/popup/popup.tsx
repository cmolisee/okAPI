import { createSignal } from 'solid-js';

function Popup() {
  const [count, setCount] = createSignal(0);

  return (
    <>
      <div>
      </div>
      <h1>okAPI</h1>
      <div class="card">
        <button onClick={() => setCount((count) => count + 1)}>
          count is {count()}
        </button>
        <a href='/options'>to the options page</a>
      </div>
    </>
  );
}

export default Popup;
