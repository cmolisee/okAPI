import { ScriptPublicPath } from "wxt/client";

export default defineContentScript({
  matches: ["<all_urls>"],
  main() {
    try {
      /** Inject script. */
      async function init() {
        await injectScript('/inject.js' as ScriptPublicPath, {
          keepInDom: true,
        });
      }
      /**
       * This is script is like middleware. it primarily facilitates 
       * communication between the extension and the webpage (i.e. background.ts and inject.ts).
       * I am pretty sure this runs at the browser level but does not have direct access to certain 
       * aspects of the webpage.
       */
      console.log('Hello from okapi content.ts');

      webpageMessenger.onMessage('sendMessageToExtension', async (message) => {
        console.log('forward to extension: ', message);
        return await extensionMessenger.sendMessage('receiveMessageFromWebpage', message.data)
          .then(() => true)
          .catch((error) => {
            console.debug(error);
            return false;
          });
      });

      extensionMessenger.onMessage('sendMessageToWebpage', async (message) => {
        console.log('forward to webpage: ', message);
        return await webpageMessenger.sendMessage('receiveMessageFromExtension', message.data)
          .then(() => true)
          .catch((error) => {
            console.debug(error);
            return false;
          });
      });

      init();
    } catch (e) {
      console.debug(e);
    }
  },
});
