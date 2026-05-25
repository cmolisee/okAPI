/**
 * Firefox interceptor — uses browser.webRequest.filterResponseData()
 *
 * MV3 compatibility:
 *   Chrome removed blocking webRequest in MV3. Firefox deliberately kept it.
 *   With the "webRequestBlocking" permission, filterResponseData works in
 *   Firefox MV3 — no --mv2 build flag needed.
 *
 * Background persistence:
 *   Firefox MV3 uses a persistent background script (event page), not a
 *   killable service worker like Chrome MV3. In-memory state (overrideRules,
 *   lastCapturedTabId) survives for the browser session without needing
 *   chrome.storage.session. This is a deliberate Firefox MV3 design choice.
 *
 * Request pause limitation:
 *   Unlike CDP, filterResponseData cannot pause a request and wait for panel
 *   input — the filter stream must be resolved within the callback. Override
 *   rules must be registered in advance via setOverrideRule(). The panel
 *   should provide a "rule-based" mode for Firefox where overrides are
 *   configured before a request fires, rather than pause-and-edit.
 *
 * Flow:
 *   1. Panel calls setOverrideRule() before the request fires
 *   2. onBeforeRequest fires → filter created
 *   3. Response chunks collected in filter.ondata
 *   4. filter.onstop: body decoded → matching rule applied → written back
 *   5. REQUEST_PAUSED sent to panel (informational — request already resolved)
 */

import type { InterceptedRequest, ResponseOverride, Message, PausedPayload } from './types';

// ─── State ────────────────────────────────────────────────────────────────────

/** Pre-registered overrides. Key is requestId or URL prefix. */
const overrideRules = new Map<string, ResponseOverride>();

/** Most recently captured tabId — used by background.ts to route to the right panel port. */
let lastCapturedTabId: number | null = null;

let onCapture: ((msg: Message<PausedPayload>) => void) | null = null;

// ─── Public API ───────────────────────────────────────────────────────────────

export function enable(
  callback: (msg: Message<PausedPayload>) => void,
): void {
  onCapture = callback;

  browser.webRequest.onBeforeRequest.addListener(
    handleRequest,
    { urls: ['<all_urls>'], types: ['xmlhttprequest', 'other'] },
    ['blocking'],
  );

  console.log('[firefox] filterResponseData listener registered (MV3)');
}

export function disable(): void {
  browser.webRequest.onBeforeRequest.removeListener(handleRequest);
  onCapture = null;
}

export function setOverrideRule(rule: ResponseOverride): void {
  overrideRules.set(rule.requestId, rule);
}

export function clearOverrideRule(requestId: string): void {
  overrideRules.delete(requestId);
}

/** Called by background.ts to route captured requests to the correct panel port. */
export function getLastCapturedTabId(): number | null {
  return lastCapturedTabId;
}

// ─── Internal ─────────────────────────────────────────────────────────────────

function handleRequest(
  details: Browser.webRequest.OnBeforeRequestDetails,
): Browser.webRequest.BlockingResponse {
  // Track the tab so background.ts can route the message to the right panel.
  if (details.tabId > 0) lastCapturedTabId = details.tabId;

  const filter = browser.webRequest.filterResponseData(
    details.requestId,
  ) as FirefoxFilter;

  const chunks: ArrayBuffer[] = [];

  filter.ondata = (event: { data: ArrayBuffer }) => {
    chunks.push(event.data);
  };

  filter.onstop = () => {
    const combined  = mergeChunks(chunks);
    const rawBody   = new TextDecoder('utf-8').decode(combined);
    const rule      = findRule(details.url, details.requestId);
    const finalBody = rule?.body !== undefined ? rule.body : rawBody;

    filter.write(new TextEncoder().encode(finalBody));
    filter.close();

    const intercepted: InterceptedRequest = {
      id:              details.requestId,
      url:             details.url,
      method:          details.method,
      requestHeaders:  {},
      requestBody:     extractRequestBody(details),
      responseHeaders: {},
      responseBody:    finalBody,
      statusCode:      null,
      timestamp:       Date.now(),
      source:          'firefox-filter',
    };

    onCapture?.({ type: 'REQUEST_PAUSED', payload: { request: intercepted } });
  };

  filter.onerror = () => {
    console.warn('[firefox] filter error for', details.url);
  };

  return {};
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function mergeChunks(chunks: ArrayBuffer[]): Uint8Array {
  const total  = chunks.reduce((n, c) => n + c.byteLength, 0);
  const result = new Uint8Array(total);
  let offset   = 0;
  for (const chunk of chunks) {
    result.set(new Uint8Array(chunk), offset);
    offset += chunk.byteLength;
  }
  return result;
}

function findRule(url: string, requestId: string): ResponseOverride | undefined {
  if (overrideRules.has(requestId)) return overrideRules.get(requestId);
  for (const [key, rule] of overrideRules) {
    if (url.startsWith(key)) return rule;
  }
  return undefined;
}

function extractRequestBody(
  details: Browser.webRequest._OnBeforeRequestDetails,
): string | null {
  const rb = details.requestBody;
  if (!rb) return null;
  if (rb.raw) {
    const bytes = rb.raw.flatMap(r =>
      Array.from(new Uint8Array(r.bytes ?? new ArrayBuffer(0)))
    );
    return new TextDecoder().decode(new Uint8Array(bytes));
  }
  if (rb.formData) return JSON.stringify(rb.formData);
  return null;
}

// ─── Firefox filter type ──────────────────────────────────────────────────────

interface FirefoxFilter {
  ondata:  ((event: { data: ArrayBuffer }) => void) | null;
  onstop:  (() => void) | null;
  onerror: (() => void) | null;
  write(data: ArrayBuffer | Uint8Array): void;
  close(): void;
}