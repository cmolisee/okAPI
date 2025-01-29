export default defineContentScript({
  matches: ["<all_urls>"],
  main() {
    /** Inject script. */
    async function init() {
        await injectScript('/inject.js', {
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

    init();
  },
});
