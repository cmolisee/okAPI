export default defineContentScript({
  matches:  ['<all_urls>'],
  runAt:    'document_start',

  main() {
    if (import.meta.env.BROWSER !== 'safari') return;
    injectScript('/injected.js');

    // listen for messages from injected.ts (webpage)
    window.addEventListener('message', (event) => {
      if (event.source !== window) return;
      if (event.data?.type !== 'SAFARI_INTERCEPTED') return;

      browser.runtime.sendMessage({
        type:    'CONTENT_REQUEST_CAPTURED',
        payload: event.data.payload,
      }).catch(() => {
        // silently drop if service worker isn't ready yet
      });
    });

    // pass messages from extension to injected.ts (webpage)
    browser.runtime.onMessage.addListener((message) => {
      if (message.type === 'REQUEST_DECISION') {
        window.postMessage({ type: 'SAFARI_DECISION', payload: message.payload }, '*');
      }
    });
  },
});