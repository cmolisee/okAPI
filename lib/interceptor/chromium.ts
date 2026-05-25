/**
 * Chromium interceptor — uses browser.debugger + Chrome DevTools Protocol.
 *
 * Flow:
 *   1. attach() → CDP Fetch.enable (pauses every matching request at response stage)
 *   2. onEvent fires with "Fetch.requestPaused"
 *   3. We decode the response body and emit it to the DevTools panel
 *   4. Panel calls either override() or passthrough() to resume the request
 */

import type {
  InterceptedRequest,
  ResponseOverride,
  Message,
  PausedPayload,
} from './types';

// ─── State ────────────────────────────────────────────────────────────────────

// No in-memory state needed here. Attach state is persisted in
// chrome.storage.session by background.ts (SW-restart-safe).
// The CDP session itself is owned by the browser, not this module.

// ─── Public API ───────────────────────────────────────────────────────────────

export async function attach(tabId: number): Promise<void> {
  await browser.debugger.attach({ tabId }, '1.3');

  await browser.debugger.sendCommand({ tabId }, 'Fetch.enable', {
    patterns: [
      {
        // Intercept at the Response stage so we can read + modify the body
        requestStage: 'Response',
        // Match all URLs — the DevTools panel can filter by URL pattern
        urlPattern: '*',
        resourceType: 'XHR',
      },
      {
        requestStage: 'Response',
        urlPattern: '*',
        resourceType: 'Fetch',
      },
    ],
  });

//   pendingRequests.set(tabId, new Map());
  console.log(`[chromium] Attached to tab ${tabId}`);
}

export async function detach(tabId: number): Promise<void> {
  try {
    await browser.debugger.sendCommand({ tabId }, 'Fetch.disable', {});
    await browser.debugger.detach({ tabId });
  } catch {
    // Tab may have been closed already
  }
//   pendingRequests.delete(tabId);
  console.log(`[chromium] Detached from tab ${tabId}`);
}

/**
 * Wire this up in background.ts:
 *   browser.debugger.onEvent.addListener(onCDPEvent);
 */
export async function onCDPEvent(
  source: Browser.debugger.Debuggee,
  method: string,
  params: Record<string, unknown>,
  sendToPanel: (msg: Message<PausedPayload>) => void,
): Promise<void> {
  if (method !== 'Fetch.requestPaused') return;

  const tabId    = source.tabId!;
  const p        = params as unknown as CDPRequestPaused;
  const isResponse = p.responseStatusCode !== undefined;

  if (!isResponse) {
    // We only asked for Response-stage — just pass through request-stage events
    await browser.debugger.sendCommand({ tabId }, 'Fetch.continueRequest', {
      requestId: p.requestId,
    });
    return;
  }

  // Fetch the response body from CDP
  let responseBody = '';
  let bodyBase64   = false;
  try {
    const bodyResult = await browser.debugger.sendCommand(
      { tabId },
      'Fetch.getResponseBody',
      { requestId: p.requestId },
    ) as { body: string; base64Encoded: boolean };
    responseBody = bodyResult.body;
    bodyBase64   = bodyResult.base64Encoded;
  } catch {
    // Body unavailable (e.g. redirect, empty response)
  }

  const decodedBody = bodyBase64
    ? atob(responseBody)
    : responseBody;

  const intercepted: InterceptedRequest = {
    id:              p.requestId,
    url:             p.request.url,
    method:          p.request.method,
    requestHeaders:  headersToRecord(p.request.headers),
    requestBody:     p.request.postData ?? null,
    responseHeaders: headersListToRecord(p.responseHeaders ?? []),
    responseBody:    decodedBody,
    statusCode:      p.responseStatusCode ?? null,
    timestamp:       Date.now(),
    source:          'chromium-cdp',
  };

  // Hold the request paused — panel must call override() or passthrough()
  sendToPanel({ type: 'REQUEST_PAUSED', payload: { request: intercepted } });
}

export async function override(tabId: number, o: ResponseOverride): Promise<void> {
  const headers = o.headers
    ? Object.entries(o.headers).map(([name, value]) => ({ name, value }))
    : undefined;

  await browser.debugger.sendCommand({ tabId }, 'Fetch.fulfillRequest', {
    requestId:      o.requestId,
    responseCode:   o.statusCode ?? 200,
    responseHeaders: headers,
    // CDP expects base64-encoded body
    body: o.body !== undefined ? btoa(unescape(encodeURIComponent(o.body))) : undefined,
  });
}

export async function passthrough(tabId: number, requestId: string): Promise<void> {
  await browser.debugger.sendCommand({ tabId }, 'Fetch.continueResponse', {
    requestId,
  });
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function headersToRecord(headers: Record<string, string>): Record<string, string> {
  return headers ?? {};
}

function headersListToRecord(
  list: Array<{ name: string; value: string }>,
): Record<string, string> {
  return Object.fromEntries(list.map(({ name, value }) => [name.toLowerCase(), value]));
}

// ─── CDP types (minimal) ─────────────────────────────────────────────────────

interface CDPRequestPaused {
  requestId: string;
  request: {
    url: string;
    method: string;
    headers: Record<string, string>;
    postData?: string;
  };
  responseStatusCode?: number;
  responseHeaders?: Array<{ name: string; value: string }>;
}