import { PanelToServiceWorker, ServiceWorkerToPanel } from "@/lib/interceptor/types";

type OnMessageFunction = (msg: PanelToServiceWorker, port: Browser.runtime.Port) => Promise<void>
// Registered tabs and their corresponding ports.
// Port closure should be handled carefully to ensure this map is as stable as possible.
// On background service worker sleep/teardown, ports are disconnected and the js context is destroyed
//    effectively clearing/resetting this map.
const connectedPorts: Map<number, Browser.runtime.Port> = new Map();

// TODO: consider ACK on postMessage to queue messages for retry if sw goes idle as message is sent

/**
 * Contains functions for interacting with ports to the background service worker.
 */
export const portManager = {
  /**
   * Register a tab with a connected port.
   * 
   * @param tabId Unique ID for the target tab
   * @param port Port object demonstrating the connection
   * @param callback Cleanup function to be called when port is closed for any reason
   */
  add: (tabId: number, port: Browser.runtime.Port, callback?: Function): void => {
    connectedPorts.set(tabId, port);
    port.onDisconnect.addListener(async () => {
        callback && await callback();
        connectedPorts.delete(tabId);
    });
  },
  /**
   * Check if the tab is registered with a connected port.
   * 
   * @param tabId Unique ID for the target tab
   * @returns true if the tab is registered with a connected port
   */
  has: (tabId: number): boolean => connectedPorts.has(tabId),
  /**
   * Returns the connected port if the tab is registered or undefined.
   * Port may still be undefined if the tab closes or the connection closes at any time.
   * 
   * @param tabId Unique ID for the target tab
   * @returns The connected port or undefined
   */
  get: (tabId: number): Browser.runtime.Port|undefined => connectedPorts.get(tabId),
  /**
   * Get Map of all registered tabs and ports.
   * 
   * @returns All registered ports
   */
  getAll: (): Map<number, Browser.runtime.Port> => connectedPorts,
  /**
   * Send a message to the target Tab.
   * 
   * @param tabId Unique ID for the target tab
   * @param msg The structued message to be sent to the target tab
   * @returns 
   */
  post: (tabId: number, msg: ServiceWorkerToPanel): void => connectedPorts.get(tabId)?.postMessage(msg),
  /**
   * Adds a listener function for message from the target tab.
   * 
   * @param tabId Unique ID for the target tab
   * @param callback Function called when an event is captured
   */
  onMessage: (tabId: number, callback: OnMessageFunction): void => connectedPorts.get(tabId)?.onMessage.addListener(async (msg: PanelToServiceWorker, port: Browser.runtime.Port) => {
    // Super basic message validation, should be coming from the devtools panel
    if (!port.sender?.url || port.sender.url !== '/devtools-panel.html') return;
    callback(msg, port);
  })
};