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

export default defineBackground(() => {

  // ─── Browser detection ──────────────────────────────────────────────────
  // import.meta.env.BROWSER is replaced at build time by WXT/Vite.
  // Never use globalThis.__BROWSER__ — that is an internal WXT detail.

  type Engine = 'chromium' | 'firefox' | 'safari';
  const ENGINE: Engine =
    import.meta.env.BROWSER === 'firefox' ? 'firefox'
    : import.meta.env.BROWSER === 'safari'  ? 'safari'
    : 'chromium';

  // ─── Storage helpers (SW-restart-safe state) ───────────────────────────
  // browser.storage.session persists for the browser session but not across
  // browser restarts. It survives service worker kill/restart cycles, which
  // is exactly what we need for "is this tab being intercepted?" state.

  const SESSION_KEY = 'interceptor_attached_tabs';

  async function getAttachedTabs(): Promise<Set<number>> {
    const result: any = await browser.storage.session.get(SESSION_KEY);
    return new Set<number>(result[SESSION_KEY] ?? []);
  }

  async function setTabAttached(tabId: number, attached: boolean): Promise<void> {
    const tabs = await getAttachedTabs();
    attached ? tabs.add(tabId) : tabs.delete(tabId);
    await browser.storage.session.set({ [SESSION_KEY]: [...tabs] });
  }

  // ─── In-memory port registry ────────────────────────────────────────────
  // Ports are lost on SW restart, but the panel reconnects automatically on
  // its next message, which re-populates this map.

  const panelPorts = new Map<number, Browser.runtime.Port>();

  function getTabIdFromPortName(name: string): number | null {
    const match = name.match(/^devtools-(\d+)$/);
    return match ? parseInt(match[1], 10) : null;
  }

  function sendToPanel(tabId: number, msg: Message): void {
    panelPorts.get(tabId)?.postMessage(msg);
  }

  // ─── Firefox: register filterResponseData listener once at startup ──────
  // Firefox MV3 retains blocking webRequest (unlike Chrome). The listener is
  // global — override rules are registered per-request by the panel.

    if (ENGINE === 'firefox') {
        Firefox.enable((msg: Message<PausedPayload>) => {
        // Map the captured request back to the correct panel port.
        const tabId = Firefox.getLastCapturedTabId();
        if (tabId !== null) sendToPanel(tabId, msg);
        });
    }

  // ─── Chromium: CDP event listeners ──────────────────────────────────────
  // These must be registered at the top level of the SW — not inside a
  // connect handler — so they are re-registered on every SW startup.

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
      // Debugger detached externally (e.g. user opened DevTools manually).
      // Clear persisted state so we don't try to re-attach on SW restart.
      await setTabAttached(source.tabId, false);
      panelPorts.delete(source.tabId);
    });
  }

  // ─── Safari: relay content-script captures to the panel ─────────────────

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

  // ─── DevTools panel port connections ────────────────────────────────────

  browser.runtime.onConnect.addListener(async (port) => {
    const tabId = getTabIdFromPortName(port.name);
    if (!tabId) return;

    panelPorts.set(tabId, port);

    // SW restart recovery: if this tab was being intercepted before the SW
    // was killed, re-attach the debugger now that a panel has reconnected.
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
          // Tab may have been closed or debugger already attached by DevTools.
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

        // ── Attach ────────────────────────────────────────────────────────
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

        // ── Detach ────────────────────────────────────────────────────────
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

        // ── Override ──────────────────────────────────────────────────────
        case 'RESPONSE_OVERRIDE': {
          const { override } = msg.payload as OverridePayload;
          if (ENGINE === 'chromium') {
            await Chromium.override(tabId, override).catch(console.error);
          } else if (ENGINE === 'firefox') {
            Firefox.setOverrideRule(override);
          }
          break;
        }

        // ── Passthrough ───────────────────────────────────────────────────
        case 'RESPONSE_PASSTHROUGH': {
          const { requestId } = msg.payload as PassthroughPayload;
          if (ENGINE === 'chromium') {
            await Chromium.passthrough(tabId, requestId).catch(console.error);
          }
          break;
        }
        // ── Safari decision (block / passthrough / modify) ────────────────
        // Relay the panel's decision to the content script in the target tab,
        // which posts it to injected.js to resolve the suspended Promise.
        case 'REQUEST_DECISION': {
          const { decision } = msg.payload as DecisionPayload;
          browser.tabs.sendMessage(tabId, {
            type:    'REQUEST_DECISION',
            payload: { decision },
          }).catch(() => {
            // Content script may not be present (e.g. extension pages)
          });
          break;
        }
        default: console.debug('[background] unkown message type', msg); break;
      }
    });
  });

});