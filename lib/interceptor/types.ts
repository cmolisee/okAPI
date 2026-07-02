import { MockEndpoint } from "@/utils/db";
import Protocol from "devtools-protocol";

export type Engine = 'chrome' | 'firefox' | 'safari';
export type InterceptedRequest = {
  requestId: string;
  url: string;
  method: string;
  requestHeaders: Protocol.Network.Headers;
  requestBody: Protocol.Network.PostDataEntry[] | undefined;
  responseHeaders: Protocol.Fetch.HeaderEntry[] | undefined;
  responseBody: string | null;
  statusCode: number;
  timestamp: number;
  source: Engine;
    // Safari: pause request and wait for panel to respond
  pendingDecision?: boolean;
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
// panel -> service worker (background)
// attach interceptor for a specific tab and engineType
// export type InterceptorAttach = {
//   type: Uppercase<'interceptor_attach'>,
//   payload: { engineType: Engine }
// }
// panel -> service worker (background)
// detach service worker interceptor for a specific tab and engineType
// should be called whenever both network_view and mocking are disabled
// export type InterceptorDetach = {
//   type: Uppercase<'interceptor_detach'>,
//   payload: { engineType: Engine }
// }
export type GetRequests = {
  type: Uppercase<'get_request_list'>,
  payload: {}
}
export type GetMocks = {
  type: Uppercase<'get_mock_list'>,
  payload?: {}
}
export type PanelContent = {
  type: Uppercase<'panel_content'>,
  payload: {requests?: Array<InterceptedRequest & Partial<{isMocked: boolean}>>, mocks?: Array<MockEndpoint>}
}
// panel or popup -> service worker (background)
// interceptor should already be attached
// enables debugger with static patterns for network_view feature
export type EnableNetworkView = {
  type: Uppercase<'enable_network_view'>,
  payload: { engineType: Engine }
}
export type DisableNetworkView = {
  type: Uppercase<'disable_network_view'>,
  payload: { engineType: Engine }
}
export type FailedEnableNetworkView = {
  type: Uppercase<'failed_enable_network_view'>,
  payload?: {}
}
// panel or popup -> service worker (background)
// interceptor should already be attached
// enables debugger with patterns built from enabled mocks
export type EnableMocking = {
  type: Uppercase<'enable_mocking'>,
  payload: { engineType: Engine }
}
export type DisableMocking = {
  type: Uppercase<'disable_mocking'>,
  payload: { engineType: Engine }
}
export type FailedEnableMocking = {
  type: Uppercase<'failed_enable_mocking'>,
  payload?: {}
}
// panel -> service worker (background)
// interceptor should already be attached. only when mock is enabled/disabled from panel.
// disables the debugger then
// re-enables debugger with patterns built from enabled mocks
export type UpdateMockPatterns = {
  type: Uppercase<'update_mock_patterns'>,
  payload: { engineType: Engine }
}
export type FailedUpdateMockPatterns = {
  type: Uppercase<'failed_update_mock_pattern'>,
  payload?: {}
}
export type RequestIntercepted = {
  type: Uppercase<'intercepted_request'>,
  payload: { interceptedRequests: InterceptedRequest[] }
}
export type UpdateInterceptedRequests = {
  type: Uppercase<'update_intercepted_requests'>,
  payload: { requests: Array<InterceptedRequest & Partial<{isMocked: boolean}>> }
}
export type UpdateMocks = {
  type: Uppercase<'update_mocks'>,
  payload: { mocks: Array<MockEndpoint> }
}

export type PanelToServiceWorker = 
  | GetRequests
  | GetMocks
  | EnableNetworkView
  | DisableNetworkView
  | EnableMocking
  | DisableMocking
  | UpdateMockPatterns;

export type ServiceWorkerToPanel =
  | PanelContent
  | FailedEnableNetworkView
  | FailedEnableMocking
  | FailedUpdateMockPatterns
  | UpdateInterceptedRequests
  | UpdateMocks;