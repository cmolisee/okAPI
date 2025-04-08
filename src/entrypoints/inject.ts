export default defineUnlistedScript(() => {
    try {
        customEventMessenger.onMessage('toInject', (data: any) => {
            console.log('message receieved from custom event messenger in inject', data.msg);
            return { status: 200 };
        });

        browser.tabs.onActivated.addListener(async (activeInfo) => {
            console.log("active info: ", activeInfo);
          });
    } catch (e) {
        console.debug(e);
    }
});