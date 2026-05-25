// /**
//  * Safari content script — monkey-patches window.fetch and XMLHttpRequest.
//  *
//  * ⚠️  Scope limitation: this ONLY intercepts requests made by JavaScript
//  *     running in the page. Requests from browser internals, other extensions,
//  *     or <img>/<script> tags are NOT captured. Make this limitation clear
//  *     in your DevTools panel UI.
//  *
//  * Architecture:
//  *   - This script is injected into the page's `main` world (not isolated world)
//  *     so it can replace window.fetch and XMLHttpRequest on the page itself.
//  *   - Captured request/response data is posted to the extension background via
//  *     window.postMessage → content bridge → runtime.sendMessage.
//  *   - Overrides are received via the same bridge in reverse.
//  *
//  * This file is the content script entry point. It injects a <script> tag
//  * into the page to run the actual monkey-patch in the page's JS context.
//  */

// // ─── Inject the page-world script ────────────────────────────────────────────
// // Content scripts run in an isolated world. To patch window.fetch we must
// // inject a script element into the actual page DOM.
// injectScript('/injected.js');
// // const script = document.createElement('script');
// // script.src   = browser.runtime.getURL('injected.js');
// // script.type  = 'module';
// // (document.head ?? document.documentElement).appendChild(script);
// // script.remove(); // clean up the element after src is loaded

// // ─── Bridge: page → extension ────────────────────────────────────────────────

// window.addEventListener('message', (event) => {
//   if (event.source !== window) return;
//   if (event.data?.type !== 'SAFARI_INTERCEPTED') return;

//   // Forward to background service worker
//   browser.runtime.sendMessage({
//     type:    'CONTENT_REQUEST_CAPTURED',
//     payload: event.data.payload,
//   }).catch(() => {
//     // Background may not be ready yet — silently ignore
//   });
// });

// // ─── Bridge: extension → page ────────────────────────────────────────────────

// browser.runtime.onMessage.addListener((message) => {
//   if (message.type === 'RESPONSE_OVERRIDE') {
//     // Relay the override rule down to the injected page script
//     window.postMessage({ type: 'SAFARI_OVERRIDE', payload: message.payload }, '*');
//   }
// });