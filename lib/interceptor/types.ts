export type Engine = 'chromium-cdp' | 'firefox-filter' | 'safari-patch';
export type Method = "GET" | "POST" | "PUT" | "PATCH" | "DELETE";
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
  source: Engine;
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
export type MessageRegistry =
  // content script → background: safari capture    
  | { type: 'CONTENT_REQUEST_CAPTURED'; payload: {} }
  // panel → background: start intercepting tab
  | { type: 'INTERCEPTOR_ATTACH'; payload: {} }
  // panel → background: stop intercepting tab
  | { type: 'INTERCEPTOR_DETACH'; payload: {} }
  // background → panel: current attach status
  | { type: 'INTERCEPTOR_STATUS'; payload: { attached: boolean; strategy: Engine; } }
  // panel → background → content → page: safari decision
  | { type: 'REQUEST_DECISION'; payload: {} }
  // background → panel: request/response is paused
  | { type: 'REQUEST_PAUSED'; payload: InterceptedRequest }
  // panel → background: apply override and resume
  | { type: 'RESPONSE_OVERRIDE'; payload: {} }
  // panel → background: resume without modification
  | { type: 'RESPONSE_PASSTHROUGH'; payload: { requestId: string } }
  // page → content: intercepted request on safari
  | { type: 'SAFARI_REQUEST_INTERCEPTED'; payload: {} }
  | { type: 'PING'; payload: void };
export type MessageSource = 
  | 'service-worker' // background.ts
  | 'content'
  | 'popup'
  | 'options'
  | 'devtools'
  | 'injected';
export type MessageMetadata = {
    to?: MessageSource;
    from?: MessageSource;
    timestamp?: string;
}
// return void or payload if T is valid Type in MessageRegistry['type']
export type ExtractPayload<T = unknown> = Extract<MessageRegistry, { type: T }> extends never ? void : Extract<MessageRegistry, { type: T }>['payload'];
export type Message<T = unknown> = {
    type: T;
    data: ExtractPayload<T>;
    meta?: MessageMetadata;
}