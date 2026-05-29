import * as Chromium from '../lib/interceptor/chromium';
import * as Firefox  from '../lib/interceptor/firefox';
import type {
  Message,
  AttachPayload,
  DetachPayload,
  OverridePayload,
  PassthroughPayload,
  PausedPayload,
  StatusPayload,
  DecisionPayload,
} from '../lib/interceptor/types';

/**
 * todo:
 * MV3 service workers can be killed by the browser at any time after ~30s
 * of inactivity, then restarted on the next event. All state that must
 * survive a restart is persisted in browser.storage.session.
 *
 * In-memory port references (Map<tabId, Port>) are intentionally kept in
 * memory only — ports cannot be serialised, and when the SW restarts the
 * DevTools panel automatically reconnects, repopulating the map.
 */

/**
 * MV3 service workers are not persistant.
 * all memory/state that must survive restarting a sw should be placed in browser.storage.session
 * 
 * ports cannot be serialised and it is intended for the port map to be repopulated on every restart.
 */
export default defineBackground(() => {
  type Engine = 'chromium' | 'firefox' | 'safari';
  const ENGINE: Engine =
    import.meta.env.BROWSER === 'firefox' ? 'firefox'
    : import.meta.env.BROWSER === 'safari'  ? 'safari'
    : 'chromium';
  const SESSION_KEY = 'interceptor_attached_tabs';
  const panelPorts = new Map<number, Browser.runtime.Port>();

  async function getAttachedTabs(): Promise<Set<number>> {
    const result: any = await browser.storage.session.get(SESSION_KEY);
    return new Set<number>(result[SESSION_KEY] ?? []);
  }

  async function setTabAttached(tabId: number, attached: boolean): Promise<void> {
    const tabs = await getAttachedTabs();
    attached ? tabs.add(tabId) : tabs.delete(tabId);
    await browser.storage.session.set({ [SESSION_KEY]: [...tabs] });
  }

  function getTabIdFromPortName(name: string): number | null {
    const match = name.match(/^devtools-(\d+)$/);
    return match ? parseInt(match[1], 10) : null;
  }

  function sendToPanel(tabId: number, msg: Message): void {
    panelPorts.get(tabId)?.postMessage(msg);
  }

  // firefox blocks webRequest
  // override rules are registered per-request by panl
  if (ENGINE === 'firefox') {
      Firefox.enable((msg: Message<PausedPayload>) => {
      // map request back to the correct port.
      const tabId = Firefox.getLastCapturedTabId();
      if (tabId !== null) sendToPanel(tabId, msg);
      });
  }

  // chrome even listeners must be registered at top level of service worker
  // to be correctly re-registered on every startup
  if (ENGINE === 'chromium') {
    browser.debugger.onEvent.addListener(async (source, method, params) => {
      const tabId = source.tabId;
      if (!tabId) return;
      await Chromium.onCDPEvent(
        source,
        method,
        params as Record<string, unknown>,
        (msg) => sendToPanel(tabId, msg),
      );
    });

    browser.debugger.onDetach.addListener(async (source, _reason) => {
      if (!source.tabId) return;
      // clear state so we don't attempt to re-attach on restart
      await setTabAttached(source.tabId, false);
      panelPorts.delete(source.tabId);
    });
  }

  // safari message bus from content-script to panel
  if (ENGINE === 'safari') {
    browser.runtime.onMessage.addListener((msg: Message, sender) => {
      if (msg.type !== 'CONTENT_REQUEST_CAPTURED') return;
      const tabId = sender.tab?.id;
      if (tabId) {
        sendToPanel(tabId, {
          type:    'REQUEST_PAUSED',
          payload: { request: { ...msg.payload as any, pendingDecision: true } },
        });
      }
    });
  }

  browser.runtime.onConnect.addListener(async (port) => {
    const tabId = getTabIdFromPortName(port.name);
    if (!tabId) return;

    panelPorts.set(tabId, port);

    // on restart, re-attach the debugger
    if (ENGINE === 'chromium') {
      const attached = await getAttachedTabs();
      if (attached.has(tabId)) {
        try {
          await Chromium.attach(tabId);
          sendToPanel(tabId, {
            type:    'INTERCEPTOR_STATUS',
            payload: { tabId, attached: true, strategy: 'chromium-cdp' } satisfies StatusPayload,
          });
        } catch {
          // tab was closed or already re-attached
          await setTabAttached(tabId, false);
        }
      }
    }

    port.onDisconnect.addListener(async () => {
      panelPorts.delete(tabId);
      if (ENGINE === 'chromium') {
        await Chromium.detach(tabId).catch(() => {});
        await setTabAttached(tabId, false);
      }
    });

    port.onMessage.addListener(async (msg: Message) => {
      switch (msg.type) {
        case 'INTERCEPTOR_ATTACH': {
          const { tabId: t } = msg.payload as AttachPayload;
          let strategy = 'none';
          try {
            if (ENGINE === 'chromium') {
              await Chromium.attach(t);
              await setTabAttached(t, true);
              strategy = 'chromium-cdp';
            } else if (ENGINE === 'firefox') {
              strategy = 'firefox-filter';
            } else {
              strategy = 'safari-patch';
            }
          } catch (err) {
            console.error('[background] attach failed', err);
          }
          sendToPanel(t, {
            type:    'INTERCEPTOR_STATUS',
            payload: { tabId: t, attached: true, strategy } satisfies StatusPayload,
          });
          break;
        }
        case 'INTERCEPTOR_DETACH': {
          const { tabId: t } = msg.payload as DetachPayload;
          if (ENGINE === 'chromium') {
            await Chromium.detach(t).catch(() => {});
            await setTabAttached(t, false);
          }
          sendToPanel(t, {
            type:    'INTERCEPTOR_STATUS',
            payload: { tabId: t, attached: false, strategy: 'none' } satisfies StatusPayload,
          });
          break;
        }
        case 'RESPONSE_OVERRIDE': {
          const { override } = msg.payload as OverridePayload;
          if (ENGINE === 'chromium') {
            await Chromium.override(tabId, override).catch(console.error);
          } else if (ENGINE === 'firefox') {
            Firefox.setOverrideRule(override);
          }
          break;
        }
        case 'RESPONSE_PASSTHROUGH': {
          const { requestId } = msg.payload as PassthroughPayload;
          if (ENGINE === 'chromium') {
            await Chromium.passthrough(tabId, requestId).catch(console.error);
          }
          break;
        }
        
        // safari message bus
        // panel to injected script to resolve suspended promise
        case 'REQUEST_DECISION': {
          const { decision } = msg.payload as DecisionPayload;
          browser.tabs.sendMessage(tabId, {
            type:    'REQUEST_DECISION',
            payload: { decision },
          }).catch(() => {
            // content script might not be present on startup
          });
          break;
        }
        default: console.debug('[background] unkown message type', msg); break;
      }
    });
  });

});