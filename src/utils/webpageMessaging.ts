import { defineCustomEventMessaging } from "@webext-core/messaging/page";
/** Messaging between content.ts, inj ect.ts, and the webpage 
 * This is essentially a wrapper around CustomEvent.
 * Note: This has to be in its own file to avoid importing incompatible code to the webpage context.
*/
export const customEventMessenger = defineCustomEventMessaging<CustomEventMessengerProtocolMap>({
    namespace: 'okapi-extension',
});