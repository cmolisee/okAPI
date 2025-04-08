import { ScriptPublicPath } from "wxt/client";
// runs in an isolated context on the webpage
//    unable to use most api's
//    unable to use most variables and functions in webpage script

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

      backgroundMessenger.onMessage('toContent', async (data: any) => {
        console.log('message receieved from background in content', data.msg);
        return await customEventMessenger.sendMessage('toInject', { msg: 'message from content to inject. ' + data.msg })
          .then((res) => {
            console.log("response from sending message customEventMessenger::toInject", res);
            return { status: 200 };
          })
          .catch((e) => {
            console.error(e);
            return { status: 400 };
          });
        
      });

      browser.tabs.onActivated.addListener(async (activeInfo) => {
        console.log("active info: ", activeInfo);
      });

      // webpageMessenger.onMessage('sidePanelClosing', async () => {
      //   console.log('test : content.ts');
      //   return await webpageMessenger.sendMessage('sidePanelClosing', undefined);
      // });

      // webpageMessenger.onMessage('sendMessageToExtension', async (message) => {
      //   console.log('forward to extension: ', message);
      //   return await extensionMessenger.sendMessage('receiveMessageFromWebpage', message.data)
      //     .then(() => true)
      //     .catch((error) => {
      //       console.debug(error);
      //       return false;
      //     });
      // });

      // extensionMessenger.onMessage('sendMessageToWebpage', async (message) => {
      //   console.log('forward to webpage: ', message);
      //   return await webpageMessenger.sendMessage('receiveMessageFromExtension', message.data)
      //     .then(() => true)
      //     .catch((error) => {
      //       console.debug(error);
      //       return false;
      //     });
      // });

      init();
    } catch (e) {
      console.debug(e);
    }
  },
});
