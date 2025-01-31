export default defineUnlistedScript(() => {
    try {
        webpageMessenger.onMessage('receiveMessageFromExtension', (message: any) => {
            console.log(message.data);
            return true;
        });

        webpageMessenger.sendMessage('sendMessageToExtension', 'inject.js has been injected...')
    } catch (e) {
        console.debug(e);
    }
});