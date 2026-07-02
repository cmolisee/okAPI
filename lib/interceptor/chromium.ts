import Protocol from "devtools-protocol";
import { getMatchingMocks, MockEndpoint } from "@/utils/db";
import { TabStore } from "@/utils/storage";
import { getNextMock } from "@/utils/shared";
import { InterceptedRequest } from "./types";
import { portManager } from "@/utils/port-manager";

/**
 * Manages all chrome related interceptor logic.
 * Functions are Idempotent and can be called multiple times without
 * conflict in any entrypoint.
 */
export class ChromeInterceptor {
  private static instance: ChromeInterceptor;
  // event patterns for fetch domain on the chrome debugger
  patterns: Map<number, Set<Protocol.Fetch.RequestPattern>>  = new Map();
  // static response patterns for fetch domain on the chrome debugger 
  static NETWORK_VIEW_PATTERNS: Array<Protocol.Fetch.RequestPattern> = [
    {requestStage: 'Response',urlPattern: '*',resourceType: 'XHR',},
    {requestStage: 'Response',urlPattern: '*',resourceType: 'Fetch',},
  ];

  /**
   * Gets existing instance of ChromeInterceptor or creates a new instance.
   * 
   * @returns Instance of ChromeInterceptor
   */
  static getInstance(): ChromeInterceptor {
    if (!ChromeInterceptor.instance) {
      ChromeInterceptor.instance = new ChromeInterceptor();
    }
    return ChromeInterceptor.instance;
  }

  /**
   * Creates request patterns for the provided mocks.
   * 
   * @param requests Request patterns for fetch domain on the chrome debugger
   * @returns Array of request patterns
   */
  static mockToPattern(...requests: Array<MockEndpoint>): Array<Protocol.Fetch.RequestPattern> {
    return requests.flatMap(p => ([
      { requestStage: 'Request', resourceType: 'Fetch', urlPattern: p.url},
      { requestStage: 'Request', resourceType: 'XHR', urlPattern: p.url}
    ] as Array<Protocol.Fetch.RequestPattern>))
  }

  /**
   * Attach the chrome debugger to a specific tab.
   * Adds the debuggerEventListener.
   * This function is idempotent and can be called multiple times on any entrypoint
   * without conflict.
   * 
   * Errors must be handled when invoked.
   * 
   * @param tabId Identifier for target tab.
   */
  async attach(tabId: number): Promise<void> {
    return new Promise<void>((resolve, reject) => {
      browser.debugger.attach({ tabId }, '1.3', () => {
        if (browser.runtime.lastError) {
          reject(new Error(browser.runtime.lastError.message));
        }
        resolve();
      });
    })
  }

  /**
   * Checks if the target tab already has the debugger attached.
   * 
   * @param tabId Identifier for target tab.
   * @returns True IFF the debugger is already attached to this tab.
   */
  async checkIsAttached(tabId: number): Promise<boolean> {
    const targets = await browser.debugger.getTargets();
    return targets.some(t => t.tabId === tabId && t.attached === true);
  }

  /**
   * Adds patterns for the target tab.
   * 
   * @param tabId Identifier for target tab.
   * @param patterns Array Fetch domain patterns to add
   * @returns Set of all patterns after operation.
   */
  addPattern(tabId: number, ...patterns: Array<Protocol.Fetch.RequestPattern>): Set<Protocol.Fetch.RequestPattern> {
    if (!this.patterns.has(tabId)) {
      this.patterns.set(tabId, new Set());
    }
    patterns.forEach(p => this.patterns.get(tabId)?.add(p));
    return this.patterns.get(tabId)!;
  }

  /**
   * Remove patterns for the target tab.
   * 
   * @param tabId Identifier for target tab.
   * @param patterns Array Fetch domain patterns to add
   * @returns Set of all patterns after operation.
   */
  removePattern(tabId: number, ...patterns: Array<Protocol.Fetch.RequestPattern>): Set<Protocol.Fetch.RequestPattern> {
    if (!this.patterns.has(tabId)) {
      return new Set();
    }

    const updated = Array.from(this.patterns.get(tabId)!).filter(a => !patterns.some(b => this.compare(a,b)));
    this.patterns.set(tabId, new Set(updated));
    return this.patterns.get(tabId)!;
  }

  /**
   * Reset/clear the pattern object.
   * 
   * @param tabId Identifier for target tab.
   */
  clearPatterns(tabId: number): void {
    this.patterns.clear();
  }

  /**
   * Enables events on the fetch domain over the patterns on this target tab.
   * This function is idempotent and can be called multiple times on any entrypoint.
   * Captures runtime.lastError and converts to instanceof Error. Successful calls return
   * void. Errors should be caught/handled at place of invocation.
   * 
   * @param tabId Identifier for target tab.
   */
  async enable(tabId: number): Promise<void> {
    return new Promise<void>((resolve, reject) => {
      browser.debugger.sendCommand(
        { tabId }, 
        'Fetch.enable', { patterns: this.patterns, handleAuthRequests: false},
        () => {
          if (browser.runtime.lastError) {
            reject(new Error(browser.runtime.lastError.message));
          }
          resolve();
        }
      );
    });
  }

  /**
   * Will fulfill a paused request on the fetch domain with the provided mock.
   * Captures runtime.lastError and converts to instanceof Error. Successful calls return
   * void. Errors should be caught/handled at place of invocation.
   * 
   * @param source Debugger session of the event.
   * @param requestId Paused fetch events unique identifier.
   * @param mock The mock to fulfill the request with.
   */
  async fulfill(source: Browser.debugger.DebuggerSession, requestId: string, mock: MockEndpoint): Promise<void> {
    const DEFAULT_CORS_HEADERS = [
      { name: "Content-Type", value: "application/json" },
      { name: "Access-Control-Allow-Origin", value: "*" },
      { name: "Access-Control-Allow-Methods", value: "GET, POST, OPTIONS" },
      { name: "Access-Control-Allow-Headers", value: "Content-Type, Authorization" }
    ];
    const commandParams = { // Protocol.Fetch.FulfillRequestRequest
      requestId: requestId,
      responseCode: Number(mock.response.status),
      responseHeaders: Object.entries(mock.response.headers ?? {}).map(([n,v]) => ({ name: n, value: v} as Protocol.Fetch.HeaderEntry)),
      body: btoa(JSON.stringify(mock.response.body)),
    };

    return new Promise<void>((resolve, reject) => {
      browser.debugger.sendCommand(source, 'Fetch.fulfillRequest', commandParams, () => {
        if (browser.runtime.lastError) {
          reject(new Error(browser.runtime.lastError.message));
        }
        resolve();
      });
    });
  }

  /**
   * Unpause a paused event and allow it to proceed without mocking.
   * Captures runtime.lastError and converts to instanceof Error. Successful calls return
   * void. Errors should be caught/handled at place of invocation.
   * 
   * @param source Debugger session of the event.
   * @param params Event parameters to be passed through.
   */
  async continue(source: Browser.debugger.DebuggerSession, params: object|undefined): Promise<void> {
    return new Promise<void>((resolve, reject) => {
      browser.debugger.sendCommand(source, 'Fetch.continueRequest', { ...params }, () => {
        if (browser.runtime.lastError) {
          reject(new Error(browser.runtime.lastError.message));
        }
        resolve();
      });
    });
  }

  /**
   * Disables events on the fetch domain. This should be used in conjunction with {@link enable}
   * to update a target debuggers patterns.
   * This function is idempotent and can be called multiple times on any entrypoint
   * without conflict.
   * Captures runtime.lastError and converts to instanceof Error. Successful calls return
   * void. Errors should be caught/handled at place of invocation.
   * 
   * @param tabId Identifier for target tab.
   */
  async disable(tabId: number): Promise<void> {
    return new Promise<void>((resolve, reject) => {
      browser.debugger.sendCommand({ tabId }, 'Fetch.disable', {}, () => {
        if (browser.runtime.lastError) {
          reject(new Error(browser.runtime.lastError.message));
        }
        resolve();
      });
    });
  }

  /**
   * Detach the chrome debugger on the target tab.
   * Will also call debugger.onEvent.removeListener() to cleanup event handling.
   * This function is idempotent and can be called multiple times on any entrypoint
   * without conflict.
   * Captures runtime.lastError and converts to instanceof Error. Successful calls return
   * void. Errors should be caught/handled at place of invocation.
   * 
   * @param tabId Identifier for target tab.
   */
  async detach(tabId: number): Promise<void> {
    return new Promise<void>((resolve, reject) => {
      browser.debugger.detach({ tabId }, () => {
        if (browser.runtime.lastError) {
          reject(new Error(browser.runtime.lastError.message));
        }
        browser.debugger.onEvent.removeListener(this.debuggerEventListener);
        resolve();
      });
    });
  }

  // Comparator to determine if two request patterns match
  private compare(a: Protocol.Fetch.RequestPattern, b: Protocol.Fetch.RequestPattern) {
    return a.requestStage === b.requestStage &&
      a.resourceType === b.resourceType &&
      a.urlPattern === b.urlPattern;
  }

  // vvv TODO: might need to add handling of runtime.lastError here if its being logged in the manager vvv
  // 
  // Handle Request and Response events configured for chrome debuggers.
  // Response events are fetch and xhr captured at the response stage. see NETWORK_VIEW_PATTERNS.
  // Events at the request stage are dynamically configured and dependent on which mocks are enabled by the user.
  private async debuggerEventListener (source: Browser.debugger.DebuggerSession, method: string, params?: object): Promise<void> {
    if (!source.tabId) return;
    if (method !== 'Fetch.requestPaused') return;

    async function getResponseBody(tabId: number, requestId: number) {
      let responseBody: string = '';
      let base64Encoded: boolean = false;

      try {
        const responseBodyResponse = await browser.debugger.sendCommand( { tabId }, 'Fetch.getResponseBody', { requestId } ) as Protocol.Network.GetResponseBodyResponse;
        responseBody = responseBodyResponse.body;
        base64Encoded = responseBodyResponse.base64Encoded;
      } catch {} // Body unavailable (e.g. redirect, empty response)

      if (base64Encoded) {
        responseBody = atob(responseBody);
      }

      if (responseBody && responseBody.length > 5000) {
        responseBody = responseBody.slice(0, 5000);
      }

      return responseBody;
    }

    const { responseStatusCode, requestId, request, responseHeaders } = params as Protocol.Fetch.RequestPausedEvent;
    const { url, method: m, headers, postDataEntries } = request;
    const isResponse = responseStatusCode !== undefined;

    // Capture requests to mock at the 'request' stage
    if (!isResponse) {
      const mockedRequests = await TabStore.get(source.tabId, 'mockedRequests') as Array<MockEndpoint>;
      const targetMocks = await getMatchingMocks(url);
      const nextMock = getNextMock(mockedRequests, targetMocks);
      if (nextMock === null) {
        logging('background', 'Error. The paused request indicates we have a mock defined but a matching mock could not be found.');
        await ChromeInterceptor.getInstance().continue(source, params);
        return;
      }

      await ChromeInterceptor.getInstance().fulfill(source, requestId, nextMock);
      mockedRequests.push(nextMock);
      await TabStore.set(source.tabId, 'mockedRequests', mockedRequests);
      return;
    }
    
    // requests for network view are captured at the 'response' stage
    const responseBody = await getResponseBody(source.tabId, Number(requestId));
    const interceptedRequest: InterceptedRequest = {
      requestId: requestId,
      url: url,
      method: m,
      requestHeaders: headers,
      requestBody: postDataEntries,
      responseHeaders: responseHeaders,
      responseBody: responseBody,
      statusCode: responseStatusCode!,
      timestamp: Date.now(),
      source: 'chrome',
    }

    const requests = await TabStore.get(source.tabId, 'capturedRequests') as InterceptedRequest[];
    requests.push(interceptedRequest);
    await TabStore.set(source.tabId, 'capturedRequests', requests);

    portManager.post(source.tabId, {type: 'UPDATE_INTERCEPTED_REQUESTS', payload: { requests: requests }});

    await browser.debugger.sendCommand(source, 'Fetch.continueRequest', { ...params });
  }
}
