import { MessageRegistry, Response, MessageSubscriber, RequestWrapper } from "@/lib/interceptor/types";
import { browser } from "wxt/browser";


export class MessageBus {
    private subscribers = new Map<string, MessageSubscriber>;
    private ns: string | undefined;
    private _listening: boolean = false;

    constructor(namespace: string | undefined) {
        this.ns = namespace;
    }

    register(type: MessageRegistry['type'], callback: MessageSubscriber): this {
        const key = prefix(this.ns, type);
        this.subscribers.set(key, callback);
        console.debug(`[MessageBus] registered send/receive handler: ${key}`);
        return this;
    }

    remove(type: MessageRegistry['type']): this {
        const key = prefix(this.ns, type);
        this.subscribers.delete(key);
        return this;
    }

    async send<T extends MessageRegistry['type']>(type: T, data: RequestWrapper): Promise<Response> {
        return await browser.runtime.sendMessage({
            ...data,
            type: prefix(this.ns, type),
            id: generateId(),
        });
    }

    async sendToTab<T extends MessageRegistry['type']>(
        tabId: number, 
        type: T, 
        data: RequestWrapper,
        frameId?: number,
    ): Promise<Response> {
        const options: Browser.tabs.MessageSendOptions = frameId !== undefined ? { frameId } : {};
        return await browser.tabs.sendMessage(
            tabId,
            {
                ...data,
                type: prefix(this.ns, type),
                id: generateId(),
            },
            options
        );
    }

    async broadcast<T extends MessageRegistry['type']>(
        type: T, 
        data: RequestWrapper,
        queryInfo: Browser.tabs.QueryInfo = {},
    ): Promise<void> {
        const tabs = await browser.tabs.query(queryInfo);
        await Promise.allSettled(
            tabs
                .filter(t => t.id !== undefined)
                .map(t => browser.tabs.sendMessage(
                    t.id!,
                    {
                        ...data,
                        type: prefix(this.ns, type),
                        id: generateId(),
                    }
                ).catch(() => {})) // tab might be closed during execution
        );
    }

    listen(): () => void {
        if (this._listening) return () => {};

        const listener = (
            message: RequestWrapper,
            sender: Browser.runtime.MessageSender,
            sendResponse: (response?: unknown) => void,
        ): boolean | undefined => {
            // type should be prefixed by this point
            if (!message?.type || !this.subscribers.has(message.type)) return;
            const callback = this.subscribers.get(message.type)!;
            const result = callback(message);

            if (result instanceof Promise) {
                result.then(response => {
                    sendResponse({
                        ok: true,
                        sender: sender,
                        data: response.data,
                        metaData: response.metaData,
                    });
                }).catch(error => {
                    console.error(`[MessageBus] handler error for ${message.type}`, error);
                    sendResponse({ 
                        ok: false, 
                        error: String(error)
                    });
                });
                return true; // keep open for async response
            }

            if (result !== undefined) {
                sendResponse({
                    ok: true,
                    sender: sender,
                    data: result.data,
                    metaData: result.metaData,
                });
            }
        }

        browser.runtime.onMessage.addListener(listener);
        this._listening = true;
        console.debug(`[MessageBus] listener attached`);

        return () => {
            browser.runtime.onMessage.removeListener(listener);
            this._listening = false;
        }
    }
}

let _counter = 0;
function generateId(): string { return `${Date.now()}-${++_counter}` }
function prefix(ns: string | undefined, t: MessageRegistry['type']): string { return `${ns ?? ''}-${t}` }



// export function onMessage(type: MessageType, callback: MessageCallback): () => void {
//     if (!_messageCallbacks.has(type)) _messageCallbacks.set(type, []);
//     const list = _messageCallbacks.get(type)!;
//     list.push(callback);
//     return () => {
//         const idx = list.indexOf(callback);
//         if (idx !== -1) list.splice(idx, 1);
//     }
// }

// export function postTo(
//     portName: string,
//     payload: MessagePayload
// ): boolean {
//     const port = _ports.get(portName);
//     if (!port) return false;
//     port.postMessage(payload);
//     return true;
// }

// export function broadcast(payload: MessagePayload): void {
//     _ports.forEach(p => {
//         try {
//             p.postMessage(payload);
//         } catch {
//             // port was closed during execution
//         }
//     });
// }

// export function reply(
//     port: Browser.runtime.Port,
//     payload: MessagePayload
// ): void {
//     port.postMessage(payload);
// }


// /**
//  * message bus to bridge extension scripts.
//  */
// export class ExtensionMessageBus {
//     static async sendExtensionMessage<T extends MessageType>(
//         type: T,
//         payload: ExtractMessage<T>['payload']
//     ): Promise<ExtractMessage<T> extends { response: infer R } ? R : void> {
//         return browser.runtime.sendMessage({ type, payload });
//     }

//     static createExtensionListener(
//         handlers: {
//             [T in MessageType]?: (
//                 payload: ExtractMessage<T>['payload'],
//                 sender: Browser.runtime.MessageSender
//             ) => Promise<ExtractMessage<T> extends { response: infer R } ? R : any> | any;
//         }
//     ) {
//         const listener = (message: any, sender: Browser.runtime.MessageSender) => {
//             if (message && typeof message === 'object' && 'type' in message) {
//                 const handler = handlers[message.type as MessageType];
//                 if (handler) {
//                     return Promise.resolve(handler(message.payload, sender));
//                 }
//             }
//         };

//         browser.runtime.onMessage.addListener(listener);
//         return () => browser.runtime.onMessage.removeListener(listener);
//     }
// }

// /**
//  * message bus to bridge content script and web page.
//  * window.postMessage
//  */
// export class WindowMessageBus {
//     static sendWindowMessage<T extends MessageType>(type: T, payload: ExtractMessage<T>['payload']) {
//         window.postMessage({ source: 'wxt-bridge', type, payload }, '*');
//     }

//     static listenWindowMessage<T extends MessageType>(
//         type: T,
//         callback: (payload: ExtractMessage<T>['payload']) => void
//     ) {
//         const handleEvent = (event: MessageEvent) => {
//             if (event.data?.source === 'wxt-bridge' && event.data?.type === type) {
//                 callback(event.data.payload);
//             }
//         };
//         window.addEventListener('message', handleEvent);
//         return () => window.removeEventListener('message', handleEvent);
//     }
// }
