import { defineExtensionMessaging } from "@webext-core/messaging";

/** Messaging between components and to/from components to background.ts */
export const internalMessenger = defineExtensionMessaging<InternalMessengerProtocolMap>();

/** Messaging between background.ts and content.ts */
export const backgroundMessenger = defineExtensionMessaging<BackgroundMessengerProtocolMap>();