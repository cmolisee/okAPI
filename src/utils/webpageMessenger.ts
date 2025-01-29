import { defineWindowMessaging } from "@webext-core/messaging/page";

/** Protocol for webpage (window) messaging. */
export interface WebpageProtocolMap {
    sendMessageToExtension(msg: string): boolean; // this is just an example
    receiveMessageFromExtension(msg: string): boolean; // this is just an example
};

/** messaging from webpage (window) */
export const webpageMessenger = defineWindowMessaging<WebpageProtocolMap>({
    namespace: '@okapi/messaging/webpage',
});