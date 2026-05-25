/**
 * safari: connects main JS context (injected.js) and background service
 * worker.
 * 
 * chrome/edge/firefox: exits immediately.
 * interception logic is at the network layer.
 * no page-level patching.
 */

export default defineContentScript({
  matches:  ['<all_urls>'],
  runAt:    'document_start',

  main() {
    // page-level patch for safari only
    if (import.meta.env.BROWSER !== 'safari') return;

    // inject script into the pages main JS context to patch the fetch()
    injectScript('/injected.js');

    // --- PAGE → EXTENSION ---
    window.addEventListener('message', (event) => {
      if (event.source !== window) return;
      if (event.data?.type !== 'SAFARI_INTERCEPTED') return;
      browser.runtime.sendMessage({
        type:    'CONTENT_REQUEST_CAPTURED',
        payload: event.data.payload,
      }).catch(() => {
        // background service worker might no be ready - silently drop.
      });
    });

    // --- EXTENSION → PAGE ---
    browser.runtime.onMessage.addListener((message) => {
      if (message.type === 'REQUEST_DECISION') {
        window.postMessage({ type: 'SAFARI_DECISION', payload: message.payload }, '*');
      }
    });
  },
});