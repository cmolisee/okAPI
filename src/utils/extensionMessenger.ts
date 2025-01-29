import { defineExtensionMessaging } from "@webext-core/messaging";

/** Protocol for extension messages */
interface ExtensionProtocolMap {
    sendMessageToWebpage(msg: string): boolean; // this is just an example
    receiveMessageFromWebpage(msg: string): boolean; // this is just an example
}

/** messaging from extension */
export const extensionMessenger = defineExtensionMessaging<ExtensionProtocolMap>();
