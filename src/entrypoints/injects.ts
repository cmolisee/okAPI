// import { webpageMessenger } from "@/utils/messaging"

export default defineUnlistedScript(() => {
    /**
     * This script is injected to the webpage and runs directly within the webpage context
     */
    console.log('Hello from okapi inject.ts...')

    // webpageMessenger.onMessage('receiveMessageFromExtension', (message) => {
    //     console.log(message.data);
    //     return true;
    // });

    // webpageMessenger.sendMessage('sendMessageToExtension', 'inject.js has been injected...')
});