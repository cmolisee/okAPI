// ─── Core data shapes ────────────────────────────────────────────────────────

export type InterceptedRequest = {
  id: string;
  url: string;
  method: string;
  requestHeaders: Record<string, string>;
  requestBody: string | null;
  responseHeaders: Record<string, string>;
  responseBody: string | null;
  statusCode: number | null;
  timestamp: number;
  source: 'chromium-cdp' | 'firefox-filter' | 'safari-patch';
    // Safari: pause request and wait for panel to respond
  pendingDecision?: boolean;
}

export type ResponseOverride = {
  requestId: string;
  statusCode?: number;
  headers?: Record<string, string>;
  body?: string;
}

// Safari: panel decision to pending intercepted request
export type RequestDecision = {
  requestId: string;
  action:
    | 'passthrough' // send original request unmodified
    | 'block' // block original; return synthetic response
    | 'modify'; // send original modified
  // block or modify
  syntheticStatus?:  number;
  syntheticHeaders?: Record<string, string>;
  syntheticBody?:    string;
  // modify only
  modifiedUrl?:     string;
  modifiedMethod?:  string;
  modifiedHeaders?: Record<string, string>;
  modifiedBody?:    string;
}

// --- MESSAGE BUS ---
// messaging between background service worker, devtools panel, and content script

export type MessageType =
  | 'INTERCEPTOR_ATTACH' // panel → background: start intercepting tab
  | 'INTERCEPTOR_DETACH' // panel → background: stop intercepting tab
  | 'REQUEST_PAUSED' // background → panel: request/response is paused
  | 'RESPONSE_OVERRIDE' // panel → background: apply override and resume
  | 'RESPONSE_PASSTHROUGH' // panel → background: resume without modification
  | 'CONTENT_REQUEST_CAPTURED' // content script → background: safari monkey-patch capture
  | 'REQUEST_DECISION' // panel → background → content → page: safari decision
  | 'INTERCEPTOR_STATUS' // background → panel: current attach status
  | 'SAFARI_REQUEST_INTERCEPTED'; // page → content: intercepted request on safari

export type Message<T = unknown> = {
  type: MessageType;
  payload: T;
}

export type AttachPayload = { tabId: number }
export type DetachPayload = { tabId: number }
export type StatusPayload = { tabId: number; attached: boolean; strategy: string }
export type PausedPayload = { request: InterceptedRequest }
export type OverridePayload = { override: ResponseOverride }
export type PassthroughPayload = { requestId: string }
export type DecisionPayload = { decision: RequestDecision }
export type XMLRequestOpen