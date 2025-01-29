import { defineExtensionMessaging } from "@webext-core/messaging";
import { defineWindowMessaging } from "@webext-core/messaging/page";

/** Protocol for extension messages */
interface ExtensionProtocolMap {
    sendMessageToWebpage(msg: string): boolean; // this is just an example
}

/** Protocol for webpage (window) messaging. */
export interface WebpageProtocolMap {
    sendMessageToExtension(msg: string): boolean; // this is just an example
};

/** messaging from extension */
export const extensionMessenger = defineExtensionMessaging<ExtensionProtocolMap>();

/** messaging from webpage (window) */
export const webpageMessenger = defineWindowMessaging<WebpageProtocolMap>({
    namespace: '@okapi/messaging/webpage',
});