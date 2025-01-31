export default defineBackground(async () => {
  try {
    /** Ensure the sidepanel opens when the extension icon is clicked */
    browser.sidePanel.setPanelBehavior({ openPanelOnActionClick: true });

    /** testing messaging from webpage */
    extensionMessenger.onMessage('receiveMessageFromWebpage', (message) => {
      console.log(message);
      return true;
    });
  } catch (e) {
    console.debug(e);
  }
});
