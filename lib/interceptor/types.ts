export type Source = 'chromium-cdp' | 'firefox-filter' | 'safari-patch';
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
  source: Source
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
export type Response = {
  data: InterceptedRequest | ResponseOverride | RequestDecision | undefined;
  metaData?: Record<string, string>;
}
export type RequestWrapper = {
  type: MessageRegistry['type'];
  target: MessageSource;
  id?: string;
  tabId?: number;
  from?: MessageSource;
  data: MessageRegistry['payload'];
}
export type ResponseWrapper = { 
  ok: true;
  sender?: Browser.runtime.MessageSender;
  data: Response;
  metaData?: Record<string, string>;
} | {
  ok: false;
  error: string;
  metaData?: Record<string, string>;
}
export type MessageRegistry =
  // content script → background: safari monkey-patch capture    
  | { type: 'CONTENT_REQUEST_CAPTURED'; payload: {} }
  // panel → background: start intercepting tab
  | { type: 'INTERCEPTOR_ATTACH'; payload: {} }
  // panel → background: stop intercepting tab
  | { type: 'INTERCEPTOR_DETACH'; payload: {} }
  // background → panel: current attach status
  | { type: 'INTERCEPTOR_STATUS'; payload: {} }
  // panel → background → content → page: safari decision
  | { type: 'REQUEST_DECISION'; payload: {} }
  // background → panel: request/response is paused
  | { type: 'REQUEST_PAUSED'; payload: {} }
  // panel → background: apply override and resume
  | { type: 'RESPONSE_OVERRIDE'; payload: {} }
  // panel → background: resume without modification
  | { type: 'RESPONSE_PASSTHROUGH'; payload: {} }
  // page → content: intercepted request on safari
  | { type: 'SAFARI_REQUEST_INTERCEPTED'; payload: {} }
  | { type: 'PING'; payload: void };
export type MessageSource = 
  | 'background'
  | 'content'
  | 'popup'
  | 'options'
  | 'devtools'
  | 'injected';
export type MessageSubscriber = (payload: MessageRegistry['payload']) => Response | Promise<Response>;
