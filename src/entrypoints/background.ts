import { backgroundMessenger, internalMessenger } from "@/utils/extensionMessaging";

export default defineBackground(() => {
  try {
    /** Ensure the sidepanel opens when the extension icon is clicked */
    browser.sidePanel.setPanelBehavior({ openPanelOnActionClick: true });

    internalMessenger.onMessage('toBackground', async (data: any) => {
      console.log('message receieved from internal messanger in background', data.msg);
      const activeTabs = await browser.tabs.query({ active: true });
      return await backgroundMessenger.sendMessage('toContent', { msg: 'message from background to content. ' + data.msg }, activeTabs[0]?.id)
        .then((res) => {
          console.log("response from sending message backgroundMessenger::toContent", res);
          return { status: 200 };
        })
        .catch((e) => {
          console.error(e);
          return { status: 400 };
        })
    });

    // extensionMessenger.onMessage('sidePanelClosing', async () => {
    //   console.log("side panel closing from extensionMessenger via background");
    //   return 
    // })

    // (browser.action ?? browser.browserAction).onClicked.addListener((tab) => {
    //   console.log("action on clicked");
    //   if (isSidepanelOpen) {
    //     extensionMessenger.sendMessage('sidePanelClosing', undefined)
    //       .then((r) => console.log(r))
    //       .catch((e) => console.error("error sending sidePanelClosing msg", e));
    //   } else {
    //     extensionMessenger.sendMessage('sidePanelOpening', undefined)
    //       .then((r) => console.log(r))
    //       .catch((e) => console.error("error sending sidePanelClosing msg", e));
    //   }
    //   isSidepanelOpen = !isSidepanelOpen;
    // });

    

    // /** testing messaging from webpage */
    // extensionMessenger.onMessage('receiveMessageFromWebpage', (message) => {
    //   console.log(message);
    //   return true;
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

    // extensionMessenger.onMessage('testMessaging', async (data) => {
    //   console.log("testMesseging: ", data);
    //   return await webpageMessenger.sendMessage('receiveMessageFromExtension', JSON.stringify(data))
    //     .then(() => true)
    //     .catch((error) => {
    //       console.debug(error);
    //       return false;
    //     });
    // });
  } catch (e) {
    console.debug(e);
  }
});
