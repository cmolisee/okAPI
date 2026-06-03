import { attach } from '@/lib/interceptor/chromium';
import type {
  Message,
  InterceptedRequest,
  ResponseOverride,
  Engine,
} from '../../lib/interceptor/types';
import { getMockingEnabledSetting, getNetworkViewerEnabledSetting, getNotificationsEnabledSetting, setMockingEnabledSetting, setNetworkViewerEnabledSetting, setNotificationsEnabledSetting } from '../../utils/storage';
import { tryPrettyPrint } from '@/utils/shared';

// --- MSG HELPERS ---

// function send(msg: Message): void {
//   port.postMessage(msg);
// }

// function attach(): void {
//   send(
// }

// function detach(): void {
//   send();
// }

// function override(o: ResponseOverride): void {
//   send({ type: 'RESPONSE_OVERRIDE', payload: { override: o } });
// }

// function passthrough(requestId: string): void {
//   send({ type: 'RESPONSE_PASSTHROUGH', payload: { requestId } });
// }
const tabId = browser.devtools.inspectedWindow.tabId;
const port = browser.runtime.connect({ name: `okapi-${tabId}` });
const requests = new Map<string, InterceptedRequest>();
let selected: InterceptedRequest | undefined = undefined;
let isAttached = false;
let engine: Engine | undefined = undefined;

// service worker -> panel
function statusListener(msg: Message): boolean {
  if (msg.type !== 'INTERCEPTOR_STATUS') return false;
  const { attached, strategy } = (msg as Message<'INTERCEPTOR_STATUS'>).data;
  isAttached = attached;
  engine = strategy;

  updateEngineLabel();
  return true;
}

// service worker -> panel
function requestListener(msg: Message): boolean {
  if (msg.type !== 'REQUEST_PAUSED') return false;
  const request = (msg as Message<'REQUEST_PAUSED'>).data;
  upsertRequestRow(request);

  // When running, pause all requests for a chance to replace it.
  // If no mock selected then auto pass it through to resume execution.
  if (request.source === 'chromium-cdp' && selected?.id !== request.id) {
    setTimeout(() => {
      if (requests.has(request.id)) port.postMessage({ type: 'RESPONSE_PASSTHROUGH', payload: { requestId: request.id } });
    }, 5_000);
  }
  return true;
}

// open message bus service worker -> panel
port.onMessage.addListener((msg: Message) => {
  // fire listeners
  const isMessageTypeUnkown = !statusListener(msg) && !requestListener(msg);
  if (isMessageTypeUnkown) logging('devtools', 'unknown message type', msg);
});

port.onDisconnect.addListener(() => {
  // setNotificationsEnabledSetting(false);
  // setMockingEnabledSetting(false);
  // setNetworkViewerEnabledSetting(false);
});

// --- toolbar ui ---
const enableNetworkViewerCheckbox = document.getElementById('enableNetworkViewer')! as HTMLInputElement;
const enableMockingCheckbox = document.getElementById('enableMocking')! as HTMLInputElement;
const enableNotificationsCheckbox = document.getElementById('enableNotifications')! as HTMLInputElement;
const networkViewTabButton = document.getElementById('network-view-btn')! as HTMLButtonElement;
const mockViewTabButton = document.getElementById('mock-view-btn')! as HTMLButtonElement;
const networkViewPane = document.getElementById('network-view-pane')! as HTMLDivElement;
const networkDetailPane = document.getElementById('network-detail-pane')! as HTMLDivElement;
const mockViewPane = document.getElementById('mock-view-pane')! as HTMLDivElement;
const mockDetailPane = document.getElementById('mock-detail-pane')! as HTMLDivElement;
const engineLabelElement = document.getElementById('engine-label')! as HTMLSpanElement;

async function updateScriptStatus(): Promise<void> {
  const isActive = await getNetworkViewerEnabledSetting() || await getMockingEnabledSetting();
  if (isActive === isAttached) return;
  const msgType = isActive ? 'INTERCEPTOR_ATTACH' : 'INTERCEPTOR_DETACH'
  port.postMessage({ type: msgType, payload: { tabId } });
}

function updateEngineLabel() { engineLabelElement.innerText = engine ? engine : isAttached ? 'unknown' : 'Enable Network View or Mocking'; }

const unwatchEnableNetworkViewerSetting = watch(
  'local:settings.networkViewerEnabled',
  (newValue, _) => {
    enableNetworkViewerCheckbox.checked = newValue as boolean;
    updateScriptStatus();
  }
);
const unwatchEnableMockingSetting = watch(
  'local:settings.mockingEnabled',
  (newValue, _) => {
    enableMockingCheckbox.checked = newValue as boolean;
    updateScriptStatus();
  }
);
const unwatchNotificationSetting = watch(
  'local:settings.notificationsEnabled',
  (newValue, _) => enableNotificationsCheckbox.checked = newValue as boolean
);

enableNetworkViewerCheckbox.addEventListener('change', (event: Event) => {
  setNetworkViewerEnabledSetting((event.target as HTMLInputElement).checked)
});
enableMockingCheckbox.addEventListener('change', (event: Event) => {
  setMockingEnabledSetting((event.target as HTMLInputElement).checked)
});
enableNotificationsCheckbox.addEventListener('change', (event: Event) => {
  setNotificationsEnabledSetting((event.target as HTMLInputElement).checked)
});

window.addEventListener('beforeunload', () => {
  unwatchEnableNetworkViewerSetting();
  unwatchEnableMockingSetting();
  unwatchNotificationSetting();
});

networkViewTabButton.addEventListener('click', () => {
  networkViewTabButton.classList.add('active');
  networkViewPane.classList.add('active');
  networkDetailPane.classList.add('active');

  networkViewPane.classList.remove('hidden');
  networkDetailPane.classList.remove('hidden');

  mockViewTabButton.classList.remove('active');
  mockViewPane.classList.remove('active');
  mockDetailPane.classList.remove('active');

  mockViewPane.classList.add('hidden');
  mockDetailPane.classList.add('hidden');
});
mockViewTabButton.addEventListener('click', () => {
  mockViewTabButton.classList.add('active');
  mockViewPane.classList.add('active');
  mockDetailPane.classList.add('active');

  mockViewPane.classList.remove('hidden');
  mockDetailPane.classList.remove('hidden');

  networkViewTabButton.classList.remove('active');
  networkViewPane.classList.remove('active');
  networkDetailPane.classList.remove('active');

  networkViewPane.classList.add('hidden');
  networkDetailPane.classList.add('hidden');
});

// --- network view ui ---
const networkViewHint = document.querySelector('#network-view-pane .empty-hint')! as HTMLElement;
const networkDetailPlaceholder = document.querySelector('#network-detail-pane .detail-placeholder')! as HTMLElement;
const networkDetailContent = document.querySelector('#network-detail-pane .detail-content')! as HTMLElement;
const networkDetailMeta = document.querySelector('#network-detail-pane .detail-meta')! as HTMLElement;
const networkDetailRequest = document.querySelector('#network-detail-pane #request-body')! as HTMLPreElement;
const networkDetailHeaders = document.querySelector('#network-detail-pane #headers')! as HTMLPreElement;
const networkDetailResponse = document.querySelector('#network-detail-pane #response-body')! as HTMLPreElement;
const createMockBtn = document.getElementById('create-mock')! as HTMLButtonElement;

/**
 * add/remove hidden on .empty-hint in network view pane
 * @param force true: add, false: remove
 */
function toggleHideHint(force: boolean) {
  networkViewHint.classList.toggle('hidden', force)
}

function updateRequestRow(id: string) {
  const requestToUpdate = networkViewPane.querySelector(`[data-id="${id}"]`);
  if (requestToUpdate) {
    requestToUpdate.classList.add('updated');
    return true;
  }

  return false;
}

function createRequestRow(id: string) {
  const div = window.document.createElement('div');
  div.className = 'request-row';
  div.dataset.id = id;
  return div;
}

function createRequestMethod(method: string) {
  const span = window.document.createElement('span');
  span.className = 'row-method';
  span.textContent = method;
  return span;
}

function createRequestStatus(status: number | null) {
  const span = window.document.createElement('span');
  span.className = `row-status ${status && status >= 400 ? 'status-error' : ''}`;
  span.textContent = String(status ?? '…');
  return span;
}

function createRequestUrl(url: string) {
  const span = window.document.createElement('span');
  span.className = 'row-url';
  span.textContent = url;
  return span;
}

function selectRequest(id: string): void {
  selected = requests.get(id) ?? undefined;
  if (!selected) return;

  networkViewPane.querySelectorAll('.request-row').forEach(r =>
    r.classList.toggle('active', r.getAttribute('data-id') === id),
  );

  networkDetailPlaceholder.classList.add('hidden');
  networkDetailContent.classList.remove('hidden');

  networkDetailMeta.innerHTML =
    `<strong>${selected.method}</strong> <span class="url">${selected.url}</span> ` +
    `<span class="status">${selected.statusCode ?? '…'}</span>`;

  networkDetailRequest.textContent = tryPrettyPrint(selected.requestBody ?? '');
  networkDetailHeaders.textContent = tryPrettyPrint(
    JSON.stringify({ request: selected.requestHeaders, response: selected.responseHeaders })
  );
  networkDetailResponse.textContent = tryPrettyPrint(JSON.stringify(selected.responseBody) ?? '');
}

async function upsertRequestRow(request: InterceptedRequest): Promise<void> {
  toggleHideHint(true);

  if (updateRequestRow(request.id)) return;

  const row = createRequestRow(request.id);
  const method = createRequestMethod(request.method);
  const status = createRequestStatus(request.statusCode);
  const url = createRequestUrl(request.url);
  // TODO: consider response headers

  row.append(method, status, url);
  row.addEventListener('click', () => selectRequest(request.id));

  networkViewPane.appendChild(row);
}

createMockBtn.addEventListener('click', (event: MouseEvent) => {
  // collect selected request details
  // create a new mock template with these details
  // send/open mock view with these details in panel
});

// upsertRequestRow({
//   id: '1',
//   url: 'test1',
//   method: 'get',
//   requestHeaders: {},
//   requestBody: null,
//   responseHeaders: {},
//   responseBody: null,
//   statusCode: 200,
//   timestamp: 0,
//   source: 'chromium-cdp'
// });
// upsertRequestRow({
//   id: '2',
//   url: 'test2',
//   method: 'get',
//   requestHeaders: {},
//   requestBody: null,
//   responseHeaders: {},
//   responseBody: null,
//   statusCode: 200,
//   timestamp: 0,
//   source: 'chromium-cdp'
// })
// upsertRequestRow({
//   id: '3',
//   url: 'test3',
//   method: 'get',
//   requestHeaders: {},
//   requestBody: null,
//   responseHeaders: {},
//   responseBody: null,
//   statusCode: 200,
//   timestamp: 0,
//   source: 'chromium-cdp'
// })

// --- mock view ui ---


// add create mock in the view
  // should be an input field that accepts a url and allows some regex 
  // should show errors if not formatted properly and disable add button
  // should enable add button if valid and not empty
  // on add, should create a new mock
    // all fields empty
    // saved in a json serializable object where each non-regex path part is a layer

// function to upsert mock row
  // similar to network upsert row
  // generate markup for each item based on the serialized mocks object from storage
  // populates view and the details
  // should have column for all rows with checkbox to enable
  // should have column for all rows with icon to delete

// update function to update the mock on field change
// select function to populate the detail based on selected mock





  




  // todo: consider adding clear button to network viewer

updateEngineLabel();
  // btnOverrideElement.addEventListener('click', () => {
  //   if (!selected) return;
  //   if (selected.source === 'safari-patch') {
  //     // Safari: send a decision before the real request is made
  //     send({
  //       type: 'REQUEST_DECISION',
  //       payload: {
  //         decision: {
  //           requestId:       selected.id,
  //           action:          'block',
  //           syntheticStatus: 200,
  //           syntheticBody:   editorBodyElement.value,
  //         },
  //       },
  //     });
  //   } else {
  //     // Chromium/Firefox: override the response after it was received
  //     send({
  //       type:    'RESPONSE_OVERRIDE',
  //       payload: {
  //         override: {
  //           requestId:  selected.id,
  //           body:       editorBodyElement.value,
  //           statusCode: selected.statusCode ?? 200,
  //         },
  //       },
  //     });
  //   }
  
  //   listElement.querySelector(`[data-id="${selected.id}"]`)?.classList.add('row--overridden');
  // });

  // btnPassthroughElement.addEventListener('click', () => {
  //   if (!selected) return;
  //   if (selected.source === 'safari-patch') {
  //     send({
  //       type: 'REQUEST_DECISION',
  //       payload: {
  //         decision: {
  //           requestId: selected.id,
  //           action:    'passthrough',
  //         },
  //       },
  //     });
  //   } else {
  //     send({ type: 'RESPONSE_PASSTHROUGH', payload: { requestId: selected.id } });
  //   }
  
  //   listElement.querySelector(`[data-id="${selected.id}"]`)?.classList.remove('row--updated');
  // });
