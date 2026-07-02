type PendingDecisionMap = Map<string, (decision: object) => void>;

// This script is only for Safari
export default defineUnlistedScript(() => {
	(() => {
		'use strict';

		const DECISION_TIMEOUT_MS = 10_000;
		const pendingDecisions: PendingDecisionMap = new Map();

		// messaging from content script
		window.addEventListener('message', (event) => {
			console.error('todo: remove after typed', event);
			if (event.source !== window) return;
			if (event.data?.type !== 'SAFARI_DECISION') return;

			const {
				requestId,
				action,
				syntheticStatus,
				syntheticHeaders,
				syntheticBody,
				modifiedUrl,
				modifiedMethod,
				modifiedHeaders,
				modifiedBody,
			} = event.data.payload ?? {};

			const resolve = pendingDecisions.get(requestId);
			if (!resolve) return;
			pendingDecisions.delete(requestId);
			resolve({
				action,
				syntheticStatus,
				syntheticHeaders,
				syntheticBody,
				modifiedUrl,
				modifiedMethod,
				modifiedHeaders,
				modifiedBody,
			});
		});

		function uid() {
			return `safari-${Date.now()}-${Math.random().toString(36).slice(2)}`;
		}

		function headersToRecord(headers: any) {
			console.error('todo: remove after typed', headers);
			const out: any = {};
			if (headers && typeof headers.forEach === 'function') {
				headers.forEach((v: any, k: any) => {
					out[k.toLowerCase()] = v;
				});
			} else if (headers && typeof headers === 'object') {
				Object.entries(headers).forEach(([k, v]) => {
					out[k.toLowerCase()] = String(v);
				});
			}
			return out;
		}

		function awaitDecision(requestId: any, details: any) {
			console.error('todo: remove after typed', requestId);
			console.error('todo: remove after typed', details);
			return new Promise((resolve) => {
				pendingDecisions.set(requestId, resolve);

				window.postMessage(
					{
						type: 'SAFARI_REQUEST_INTERCEPTED',
						payload: { ...details, requestId },
					},
					'*',
				);

				setTimeout(() => {
					if (pendingDecisions.has(requestId)) {
						console.warn(
							`[api-interceptor] decision timeout for ${requestId} — passing through`,
						);
						pendingDecisions.delete(requestId);
						resolve({ action: 'passthrough' });
					}
				}, DECISION_TIMEOUT_MS);
			});
		}

		function getUrl(input: RequestInfo | URL) {
			if (typeof input === 'string') {
				return input;
			}
			if (input instanceof URL) {
				return input.href;
			}
			return input.url;
		}

		function getMethod(
			input: RequestInfo | URL,
			init: RequestInit | undefined,
		) {
			if (init?.method) {
				return init.method;
			}
			if (input instanceof Request) {
				return input.method;
			}
			return 'GET';
		}

		function getHeaders(
			input: RequestInfo | URL,
			init: RequestInit | undefined,
		) {
			if (init?.headers) {
				return init.headers;
			}
			if (input instanceof Request) {
				return input.headers;
			}
			return {};
		}

		const _OriginalFetch = window.fetch.bind(window);

		window.fetch = async function patchedFetch(input, init) {
			const requestId = uid();
			const url = getUrl(input);
			const method = getMethod(input, init);
			const reqHeaders = headersToRecord(getHeaders(input, init));
			let requestBody = null;

			try {
				if (init?.body != null) {
					requestBody = String(init.body);
				} else if (input instanceof Request && input.body) {
					requestBody = await input.clone().text();
				}
			} catch {}

			// wait for panel response
			const decision: any = await awaitDecision(requestId, {
				url,
				method,
				requestHeaders: reqHeaders,
				requestBody: requestBody,
				source: 'safari-patch',
				timestamp: Date.now(),
				// unknown before request resolves
				responseHeaders: {},
				responseBody: null,
				statusCode: null,
			});

			switch (decision.action) {
				case 'block': {
					const headers = new Headers(
						decision.syntheticHeaders ?? {
							'content-type': 'application/json',
						},
					);
					return new Response(decision.syntheticBody ?? '', {
						status: decision.syntheticStatus ?? 200,
						statusText: 'OK',
						headers,
					});
					break;
				}
				case 'modify': {
					const modifiedInit = {
						...init,
						method: decision.modifiedMethod ?? method,
						headers: decision.modifiedHeaders ?? reqHeaders,
						body: decision.modifiedBody ?? init?.body,
					};
					const modifiedUrl = decision.modifiedUrl ?? url;
					return _OriginalFetch(modifiedUrl, modifiedInit);
					break;
				}
				case 'passthrough':
				default: {
					return _OriginalFetch(input, init);
					break;
				}
			}
		};

		// --- PATCH XHR ---
		// xhr doesn't support async pausing because it is callback-based.
		// instead consume the real send(), await hidden fetch, mock the XHR lifecycle events

		// const _OriginalXMLHttpRequest = window.XMLHttpRequest;
		window.XMLHttpRequest = class PatchedXHR extends XMLHttpRequest {
			requestId = uid();
			method = 'GET';
			url = '';
			reqHeaders: Record<string, string> = {};
			async = true;

			override open(
				method: string,
				url: string | URL,
				async: boolean = true,
				username?: string | null,
				password?: string | null,
			) {
				this.method = String(method).toUpperCase();
				this.url = url instanceof URL ? url.href : String(url);
				this.async = async;
				return super.open(method, url, async, username, password);
			}

			setRequestHeader(name: string, value: string) {
				this.reqHeaders[name.toLowerCase()] = value;
				return super.setRequestHeader(name, value);
			}

			send(body?: Document | XMLHttpRequestBodyInit | null) {
				const requestId = this.requestId;
				const method = this.method;
				const url = this.url;
				const headers = { ...this.reqHeaders };
				let reqBody = null;
				try {
					reqBody = body != null ? String(body) : null;
				} catch {}

				// replace the true send() with async fetch
				this._interceptAsync(
					requestId,
					method,
					url,
					headers,
					reqBody,
					body,
				);
			}

			async _interceptAsync(
				requestId: string,
				method: string,
				url: string,
				reqHeaders: Record<string, string>,
				reqBody: any,
				originalBody: any,
			) {
				console.error('todo: remove after typed', reqBody);
				console.error('todo: remove after typed', originalBody);
				const decision: any = await awaitDecision(requestId, {
					url,
					method,
					requestHeaders: reqHeaders,
					requestBody: reqBody,
					source: 'safari-patch',
					timestamp: Date.now(),
					responseHeaders: {},
					responseBody: null,
					statusCode: null,
				});

				let response;
				try {
					switch (decision.action) {
						case 'block': {
							// no network call, completely mocked
							response = new Response(decision.syntheticBody ?? '', {
								status: decision.syntheticStatus ?? 200,
								headers: decision.syntheticHeaders ?? {},
							});
							break;
						}
						case 'modify': {
							response = await _OriginalFetch(decision.modifiedUrl ?? url, {
								method: decision.modifiedMethod ?? method,
								headers: decision.modifiedHeaders ?? reqHeaders,
								body: decision.modifiedBody ?? originalBody,
							});
							break;
						}
						case 'passthrough':
						default: {
							// replay with fetch for readable response
							response = await _OriginalFetch(url, {
								method,
								headers: reqHeaders,
								body: originalBody,
							});
						}
					}
				} catch (err) {
					this.dispatchEvent(new ProgressEvent('error'));
					return;
				}

				const responseText = await response.text();
				const responseHeaders: any = {};
				response.headers.forEach((v: any, k: any) => {
					responseHeaders[k] = v;
				});

				// Mock XHR transitions expected by callbacks
				this._synthesiseXHRResponse(
					response.status,
					responseHeaders,
					responseText,
				);
			}

			_synthesiseXHRResponse(status: any, headers: any, body: any) {
				// Mock readonly XHR properties
				const define = (prop: any, value: any) =>
					Object.defineProperty(this, prop, {
						value,
						writable: true,
						configurable: true,
					});

				define('readyState', 2);
				this.dispatchEvent(new Event('readystatechange'));

				define('readyState', 3);
				this.dispatchEvent(new Event('readystatechange'));

				define('readyState', 4);
				define('status', status);
				define(
					'statusText',
					status >= 200 && status < 300 ? 'OK' : 'Error',
				);
				define('responseText', body);
				define('response', body);
				define('getAllResponseHeaders', () =>
					Object.entries(headers)
						.map(([k, v]) => `${k}: ${v}`)
						.join('\r\n'),
				);

				this.dispatchEvent(new Event('readystatechange'));
				this.dispatchEvent(new ProgressEvent('load'));
				this.dispatchEvent(new ProgressEvent('loadend'));
			}
		};

		console.debug('[ok-api: API Mocking] safari patch active (blocking mode)');
	})();
});