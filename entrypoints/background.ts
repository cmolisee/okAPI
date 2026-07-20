import * as Chromium from '../lib/interceptor/chromium';
// import * as Firefox  from '../lib/interceptor/firefox';
import type { PanelContent, PanelToServiceWorker } from '../lib/interceptor/types';
import { getEnabledMocks, getOrderedMocks, initDb  } from '@/utils/db';
import { TabStore, TabStoreMap } from '@/utils/storage';
import { portManager } from '@/utils/port-manager';

export default defineBackground(async () => {
  initDb().catch((error: unknown) => logging('background', 'failed to init db', error));

  // listen to changes to the network view or mock enabled settings
  // if changed i need to toggle the engines listeners and shit...

  // firefox blocks webRequest
  // override rules are registered per-request by panl
  // if (ENGINE === 'firefox') {
  //     Firefox.enable((msg: Message<PausedPayload>) => {
  //     // map request back to the correct port.
  //     const tabId = Firefox.getLastCapturedTabId();
  //     if (tabId !== null) sendToPanel(tabId, msg);
  //     });
  // }

  // chrome event listeners must be registered at top level of service worker
  // to be correctly re-registered on every startup
  // if (ENGINE === 'chrome') {
  //   browser.debugger.onEvent.addListener(async (source, method, params) => {
  //     const tabId = source.tabId;
  //     if (!tabId) return;
  //     await Chromium.onCDPEvent(
  //       source,
  //       method,
  //       params as Record<string, unknown>,
  //       (msg) => sendToPanel(tabId, msg),
  //     );
  //   });

  //   browser.debugger.onDetach.addListener(async (source, _reason) => {
  //     if (!source.tabId) return;
  //     // clear state so we don't attempt to re-attach on restart
  //     await setTabAttached(source.tabId, false);
  //     panelPorts.delete(source.tabId);
  //   });
  // }

  // safari message bus from content-script to panel
  // if (ENGINE === 'safari') {
  //   browser.runtime.onMessage.addListener((msg: Message, sender) => {
  //     if (msg.type !== 'CONTENT_REQUEST_CAPTURED') return;
  //     const tabId = sender.tab?.id;
  //     if (tabId) {
  //       sendToPanel(tabId, {
  //         type:    'REQUEST_PAUSED',
  //         payload: { request: { ...msg.payload as any, pendingDecision: true } },
  //       });
  //     }
  //   });
  // }

  // Messaging bus between background service worker and tabs
  // Responsibility of the tab to establish/re-establish connections
  browser.runtime.onConnect.addListener(async (connectedPort) => {
    const tabId = connectedPort.sender?.tab?.id;
    if (!tabId) return;
    
    // Always override with most current tabId/Port entry to ensure
    // navigation, reload, HMR, and other scenarios are handled.
    portManager.add(
      tabId, 
      connectedPort, 
      async () => {
      // TODO: clean-up all additional interceptor logic
      try {
        await Chromium.ChromeInterceptor.getInstance().detach(tabId);
      } catch (error: unknown) {
        logging(
          'background', 
          'Error detaching debugger',
          error instanceof Error ? error.message : String(error),
        );
      }
    });

    // Send data to panel for UI when tab connects
    const {tab} = await TabStore.get(tabId, 'panelUIState') ?? { tab: 'networkView' };
    const msg: PanelContent = {type: 'PANEL_CONTENT', payload: {}};
    if (tab === 'networkView') msg.payload = {requests: await TabStore.get(tabId, 'capturedRequests')};
    if (tab === 'mockView') msg.payload = {mocks: await getOrderedMocks()};
    portManager.post(tabId, msg);

    // cleanup
    browser.tabs.onRemoved.addListener(async (tabId) => await TabStore.clear(tabId));

    portManager.onMessage(tabId, portMessageListener);

    // tab is navigating
    // browser.webNavigation.onCommitted.addListener(async (details) => {
    //   const tabId = details.tabId;

    //   // 1. Detach any existing debugger on this tab to handle navigation cleanly
    //   browser.debugger.detach(debuggee, () => {
    //     // Handle lastError if the debugger wasn't attached in the first place
    //     if (browser.runtime.lastError) {
    //       console.log(browser.runtime.lastError.message);
    //     } else {
    //       console.log(`Debugger detached for tab ${details.tabId} due to navigation.`);
    //     }

    //     // 2. Re-attach the debugger if you still need it on the new page
    //     browser.debugger.attach(debuggee, '1.3', () => {
    //       if (!browser.runtime.lastError) {
    //         // Re-enable domains like Network or Page inspection
    //         browser.debugger.sendCommand(debuggee, 'Network.enable');
    //       }
    //     });
    //   });
    // });

    async function evaluateDebuggerStateOnFailure(tabId: number,target: keyof Pick<TabStoreMap, 'isMockingEnabled'|'isNetworkViewerEnabled'>,): Promise<void> {
      const chromeInterceptor = Chromium.ChromeInterceptor.getInstance();
      const nonTarget = target === 'isMockingEnabled' ? 'isNetworkViewerEnabled' : 'isMockingEnabled'
      await TabStore.set(tabId, target, false);

      if (!await chromeInterceptor.checkIsAttached(tabId)) {
        await TabStore.set(tabId, nonTarget, false);
        return;
      }

      if (!await TabStore.get(tabId, nonTarget)) {
        try { await chromeInterceptor.detach(tabId); } catch {} // silently drop error
      }
    }

    async function portMessageListener(msg: PanelToServiceWorker, port: Browser.runtime.Port) {
      const tabId = port.sender?.tab?.id;
      if (!tabId) return;

      switch (msg.type) {
        case 'GET_REQUEST_LIST': {
          const msg: PanelContent = {type: 'PANEL_CONTENT', payload: {}};
          msg.payload = {requests: await TabStore.get(tabId, 'capturedRequests')};
          portManager.post(tabId, msg);
          break;
        }
        case 'GET_MOCK_LIST': {
          const msg: PanelContent = {type: 'PANEL_CONTENT', payload: {}};
          msg.payload = {mocks: await getOrderedMocks()};
          portManager.post(tabId, msg);
          break;
        }
        case 'ENABLE_NETWORK_VIEW': {
          const { engineType } = msg.payload;

          if (engineType === 'chrome') {
            const chromeInterceptor = Chromium.ChromeInterceptor.getInstance();
            chromeInterceptor.addPattern(tabId, ...Chromium.ChromeInterceptor.NETWORK_VIEW_PATTERNS);

            try {
              if (!await chromeInterceptor.checkIsAttached(tabId)) {
                await chromeInterceptor.attach(tabId); 
              }
            } catch (error: unknown) {
              logging('background', 'Error failed to attach debugger', error instanceof Error ? error.message : String(error),);
              evaluateDebuggerStateOnFailure(tabId, 'isNetworkViewerEnabled');
            }

            try { await chromeInterceptor.disable(tabId); } catch {} // silently drop error

            try {
              await chromeInterceptor.enable(tabId);
            } catch (error: unknown) {
              logging('background', 'Error enabling network view', error instanceof Error ? error.message : String(error),);
              evaluateDebuggerStateOnFailure(tabId, 'isNetworkViewerEnabled');
            }
          }
          break;
        }
        case 'DISABLE_NETWORK_VIEW': {
          const { engineType } = msg.payload;
          
          if (engineType === 'chrome') {
            const chromeInterceptor = Chromium.ChromeInterceptor.getInstance();

            if (!await chromeInterceptor.checkIsAttached(tabId)) return;

            chromeInterceptor.clearPatterns(tabId);

            if (!await TabStore.get(tabId, 'isMockingEnabled')) return;

            try { await chromeInterceptor.disable(tabId); } catch {} // silently drop error
            const enabledPatterns = await getEnabledMocks();
            chromeInterceptor.addPattern(
              tabId,
              {requestStage: 'Request',urlPattern: '*',resourceType: 'XHR',},
              {requestStage: 'Request',urlPattern: '*',resourceType: 'Fetch',},
              ...Chromium.ChromeInterceptor.mockToPattern(...enabledPatterns),
            );
            
            try {
              await chromeInterceptor.enable(tabId);
            } catch (error: unknown) {
              logging('background', 'Error enabling mocking', error instanceof Error ? error.message : String(error),);
              evaluateDebuggerStateOnFailure(tabId, 'isMockingEnabled');
            }
          }
          break;
        }
        case 'ENABLE_MOCKING': {
          const { engineType } = msg.payload;
          const enabledPatterns = await getEnabledMocks();

          if (engineType === 'chrome') {
            const chromeInterceptor = Chromium.ChromeInterceptor.getInstance();
            chromeInterceptor.addPattern(tabId, ...Chromium.ChromeInterceptor.mockToPattern(...enabledPatterns));

            try {
              if (!await chromeInterceptor.checkIsAttached(tabId)) {
                await chromeInterceptor.attach(tabId); 
              }
            } catch (error: unknown) {
              logging('background', 'Error failed to attach debugger', error instanceof Error ? error.message : String(error),);
              evaluateDebuggerStateOnFailure(tabId, 'isMockingEnabled');
            }

            try { await chromeInterceptor.disable(tabId); } catch {} // silently drop error

            try {
              await chromeInterceptor.enable(tabId);
            } catch (error: unknown) {
              logging('background', 'Error enabling mocking', error instanceof Error ? error.message : String(error),);
              evaluateDebuggerStateOnFailure(tabId, 'isMockingEnabled');
            } 
          }
          break;
        }
        case 'DISABLE_MOCKING': {
          const { engineType } = msg.payload;
          
          if (engineType === 'chrome') {
            const chromeInterceptor = Chromium.ChromeInterceptor.getInstance();

            if (!await chromeInterceptor.checkIsAttached(tabId)) return;

            chromeInterceptor.clearPatterns(tabId);

            if (!await TabStore.get(tabId, 'isNetworkViewerEnabled')) return;

            try { await chromeInterceptor.disable(tabId); } catch {} // silently drop error
            chromeInterceptor.addPattern(tabId, ...Chromium.ChromeInterceptor.NETWORK_VIEW_PATTERNS);
            
            try {
              await chromeInterceptor.enable(tabId);
            } catch (error: unknown) {
              logging('background', 'Error enabling network view', error instanceof Error ? error.message : String(error),);
              evaluateDebuggerStateOnFailure(tabId, 'isNetworkViewerEnabled');
            }
          }
          break;
        }
        case 'UPDATE_MOCK_PATTERNS': {
          const { engineType } = msg.payload;
          const enabledPatterns = await getEnabledMocks();

          if (engineType === 'chrome') {
            const chromeInterceptor = Chromium.ChromeInterceptor.getInstance();

            if (!await chromeInterceptor.checkIsAttached(tabId)) return;

            chromeInterceptor.addPattern(tabId, ...Chromium.ChromeInterceptor.mockToPattern(...enabledPatterns));

            try { await chromeInterceptor.disable(tabId); } catch {} // silently drop error

            try {
              await chromeInterceptor.enable(tabId);
            } catch (error: unknown) {
              logging('background', 'Error updating patterns', error instanceof Error ? error.message : String(error),);
              evaluateDebuggerStateOnFailure(tabId, 'isMockingEnabled');
            } 
          }
          break;
        }
        // case 'RESPONSE_OVERRIDE': {
          // const { override } = msg.payload as OverridePayload;
          // if (ENGINE === 'chromium') {
          //   await Chromium.override(tabId, override).catch(console.error);
          // } else if (ENGINE === 'firefox') {
          //   Firefox.setOverrideRule(override);
          // }
        //   break;
        // }
        // case 'RESPONSE_PASSTHROUGH': {
          // const { requestId } = msg.payload as PassthroughPayload;
          // if (ENGINE === 'chromium') {
          //   await Chromium.passthrough(tabId, requestId).catch(console.error);
          // }
        //   break;
        // }
        
        // safari message bus
        // panel to injected script to resolve suspended promise
        // case 'REQUEST_DECISION': {
        //   const { decision } = msg.payload as DecisionPayload;
        //   browser.tabs.sendMessage(tabId, {
        //     type:    'REQUEST_DECISION',
        //     payload: { decision },
        //   }).catch(() => {
        //     // content script might not be present on startup
        //   });
        //   break;
        // }
        default: logging('background', 'Unknown message type', msg); break;
      }
    }
  });
});