const container = document.getElementById('resize-container')! as HTMLDivElement;
const topPane = document.getElementById('top-pane')! as HTMLDivElement;
const botPane = document.getElementById('bottom-pane')! as HTMLDivElement;
const bar = document.getElementById('resize-bar')! as HTMLDivElement;
const MIN_HEIGHT = 100;
let dragging = false;
let startY = 0;
let startFlex = 0;
let totalH = 0;
let frameId = 0;


// set drag flag and cursor for document vs only for hover on bar
function onMouseDownBar(event: MouseEvent) {
  event.preventDefault();
  dragging = true;
  startY = event.clientY;
  totalH = container.getBoundingClientRect().height - bar.offsetHeight;
  startFlex = topPane.getBoundingClientRect().height / totalH
  document.body.style.cursor = 'row-resize';
  document.body.style.userSelect = 'none';
}

// from document instead of bar to ensure correct behavior
// mouse may not stay directly over bar during click-and-drag behavior
function onMouseMove(event: MouseEvent) {
  if (!dragging) return;

  cancelAnimationFrame(frameId);
  frameId = requestAnimationFrame(() => {
    const totalH = container.getBoundingClientRect().height - bar.offsetHeight;
    const newTopPaneHeight = Math.min(Math.max(startFlex * totalH + (event.clientY - startY), MIN_HEIGHT), totalH - MIN_HEIGHT);
    const ratio = newTopPaneHeight / totalH
    topPane.style.flex = `${ratio} 1 0`;
    botPane.style.flex = `${1 - ratio} 1 0`;
  });
}

function onMouseUp() {
  if (dragging) {
    dragging = false;
    document.body.style.cursor = '';
    document.body.style.userSelect = '';
  }
}

bar.removeEventListener('mousedown', onMouseDownBar);
document.removeEventListener('mousemove', onMouseMove);
document.removeEventListener('mouseup', onMouseUp);

bar.addEventListener('mousedown', onMouseDownBar);
window.addEventListener('mousemove', onMouseMove);
window.addEventListener('mouseup', onMouseUp);