export default defineBackground(async () => {
  /**
   * This script runs for the extension. it runs in the extension context and
   * is viewable in the dev tools for the extension.
   * 
   * browser is an abstraction by WXT. It abstracts the browser specific api's 
   * for virtual all the available api's. That way we don't have to manually differentiate between
   * chrome.runtime.id or safari.runtime.id, etc....
   */
  console.log('Hello from okapi background.ts!', { id: browser.runtime.id });

  /** testing messaging from webpage */
  extensionMessenger.onMessage('receiveMessageFromWebpage', (message) => {
    console.log(message);
    return true;
  });
});
