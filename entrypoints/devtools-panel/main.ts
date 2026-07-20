import { browser } from 'wxt/browser';
import { TabStore } from '@/utils/storage';
import type {
  InterceptedRequest,
  Engine,
  EnableMocking,
  EnableNetworkView,
  DisableNetworkView,
  DisableMocking,
  ServiceWorkerToPanel,
} from '../../lib/interceptor/types';
import { Unwatch } from 'wxt/utils/storage';
import db, { addMock, HttpMethod, HttpStatusCodes, initDb, MockEndpoint, updateMock } from '@/utils/db';
import { BADGE_ACTIVE, BADGE_INACTIVE, BadgeManager, HTTP_STATUS_CODES, HTTP_STATUS_TEXT, setExtensionIconStateActive, setExtensionIconStateDisabled } from '@/utils/shared';
import '@/components';

// --- control data ---
initDb();
const tabId = browser.devtools.inspectedWindow.tabId;
const cleanup: Array<Unwatch|null> = [];
let port: Browser.runtime.Port | null = null;
let isPanelVisible = true; 
let reconnectAttempts = 0;
const MAX_RECONNECT_ATTEMPTS = 5;
let selectedRequest: InterceptedRequest | undefined = undefined;
let selectedMock: MockEndpoint | undefined = undefined;

function reconnect() {
  if (reconnectAttempts >= MAX_RECONNECT_ATTEMPTS) return;
  const delay = Math.min(1000 * reconnectAttempts++, 5000);

  setTimeout(() => {
    if (isPanelVisible && navigator.onLine) {
      connectToBackground();
    }
  }, delay);
}

async function initializeTabStore() {
  if (await TabStore.has(tabId)) return;
  Promise.all([
    TabStore.set(tabId, 'isNotificationsEnabled', false),
    TabStore.set(tabId, 'isNetworkViewerEnabled', false),
    TabStore.set(tabId, 'isMockingEnabled', false),
    TabStore.set(tabId, 'engineType', undefined),
    TabStore.set(tabId, 'isAttached', false),
    // todo: i need to be able to show which of the captured requests was mocked
    //  in the network view.
    TabStore.set(tabId, 'capturedRequests', []),
    TabStore.set(tabId, 'mockedRequests', []),
    TabStore.set(tabId, 'panelUIState', { tab: 'networkView' }),
  ])
}

async function connectToBackground() {
  port = browser.runtime.connect({ name: `ok-api:${tabId}` });
  await initializeTabStore();

  port?.onMessage.addListener(async (msg: ServiceWorkerToPanel, port: Browser.runtime.Port) => {
    // service worker ID should match the extension runtime ID
    if (!port.sender?.id || port.sender.id !== browser.runtime.id) return;

    const panelTab = (await TabStore.get(tabId, 'panelUIState'))?.tab;
    switch (msg.type) {
      case 'PANEL_CONTENT': {
        const {requests, mocks} = msg.payload;
        if (requests && document.getElementById('network-view-toggle')?.ariaPressed === 'true') {
          renderRequests(requests);
        }
        if (mocks && document.getElementById('mock-view-toggle')?.ariaPressed === 'true') {
          renderMocks(mocks);
        }
        break;
      }
      case 'FAILED_ENABLE_NETWORK_VIEW': { break;}
      case 'FAILED_ENABLE_MOCKING': { break;}
      case 'FAILED_UPDATE_MOCK_PATTERN': { break;}
      case 'UPDATE_INTERCEPTED_REQUESTS': {
        // TODO: make sure we verify sender id 
        if (panelTab !== 'networkView') return;
        renderRequests(msg.payload?.requests);
        break;
      }
      case 'UPDATE_MOCKS': {
        // TODO: make sure we verify sender id 
        if (panelTab !== 'mockView') return;
        renderMocks(msg.payload.mocks);
        break;
      }
      default: logging('devtools-panel', 'Unknown message type', msg); break;
    }
  });

  port?.onDisconnect.addListener((p) => {
    port = null;
    if (isPanelVisible && navigator.onLine) {
      reconnect();
    }
  });
}

function getEngine(): Engine {
  const browser = import.meta.env.BROWSER;
  if (['firefox', 'safari'].includes(browser)) return browser as Engine;
  return 'chrome';
}

function addMockOnSubmit(event: Event) {
  event.preventDefault();
  const form = event.currentTarget as HTMLFormElement;
  const formData = new FormData(form);
  const pattern = formData.get('pattern') as string;

  const newMock: Omit<MockEndpoint, 'id'|'createdAt'|'updatedAt'|'listOrder'> = {
    delayMs: 0,
    enabled: false,
    matchType: 'regex',
    method: 'GET',
    name: '',
    response: {
      status: 200,
      statusText: undefined,
      headers: undefined,
      body: undefined
    },
    url: pattern,
    priorityOrder: 0,
  }

  addMock(newMock);
}

async function render() {
  const header = document.querySelector('header');

  const tabToolbar = document.createElement('ok-toolbar');
  const optionToolbar = document.createElement('ok-toolbar');
  const labelToolbar = document.createElement('ok-toolbar');
  header?.append(tabToolbar, optionToolbar, labelToolbar);

    const networkViewTab = document.createElement('ok-tab-button');
    networkViewTab.textContent = 'Network View';
    networkViewTab.setAttribute('id', 'network-view-toggle');
    networkViewTab.setAttribute('toggled', '');

    const mockViewTab = document.createElement('ok-tab-button');
    mockViewTab.textContent = 'Mock View';
    mockViewTab.setAttribute('id', 'network-view-toggle');
    
    tabToolbar.append(networkViewTab, mockViewTab);
  
    const engineType = getEngine();
    TabStore.set(tabId, 'engineType', engineType);

    const engineLabel = document.createElement('span');
    engineLabel.textContent = `Engine: ${engineType ?? 'uknown'}`;
    labelToolbar.append(engineLabel);

    // --- notification toggle ---
    const enableNotificationsCheckbox = document.createElement('ok-checkbox');
    enableNotificationsCheckbox.textContent = 'Enable Notifications';
    enableNotificationsCheckbox.setAttribute('id', 'enableNotifications');
    enableNotificationsCheckbox.setAttribute('name', 'enableNotifications');
    enableNotificationsCheckbox.addEventListener('change', (event: Event) => {
        const target = event.target as HTMLInputElement;
        TabStore.set(tabId, 'isNotificationsEnabled', target.checked);
    });

    if (await TabStore.get(tabId, 'isNotificationsEnabled') ?? false) {
        enableNotificationsCheckbox.setAttribute('checked', '');
    }

  cleanup.push(
    TabStore.watch(tabId, 'isNotificationsEnabled', (nv: boolean|null) => {
      enableNotificationsCheckbox!.querySelector('input')!.checked = nv ?? false
    }),
  );

  // --- network toggle ---
  const isNetworkViewCheckboxChecked = await TabStore.get(tabId, 'isNetworkViewerEnabled') ?? false;
  async function networkViewerEnabled() {
    if (!port) return;
    port.postMessage({type: 'ENABLE_NETWORK_VIEW', payload: {engineType: engineType}} as EnableNetworkView);
    setExtensionIconStateActive(tabId);
  }
  async function networkViewerDisabled() {
    if (!port) return;
    port.postMessage({type: 'DISABLE_NETWORK_VIEW', payload: {engineType: engineType}} as DisableNetworkView);
    if (!await TabStore.get(tabId, 'isMockingEnabled')) setExtensionIconStateDisabled(tabId);
  }
  
  if (isNetworkViewCheckboxChecked) {
    networkViewerEnabled();
  } else {
    networkViewerDisabled();
  }

    const enableNetworkViewCheckbox = document.createElement('ok-checkbox');
    enableNetworkViewCheckbox.textContent = 'Enable Network View';
    enableNetworkViewCheckbox.setAttribute('id', 'enableNetworkViewer');
    enableNetworkViewCheckbox.setAttribute('name', 'enableNetworkViewer');
    enableNetworkViewCheckbox.addEventListener('change', (event: Event) => {
        const target = event.target as HTMLInputElement;
        TabStore.set(tabId, 'isNetworkViewerEnabled', target.checked);
    });

    if (await TabStore.get(tabId, 'isNetworkViewerEnabled') ?? false) {
        enableNotificationsCheckbox.setAttribute('checked', '');
    }
    
    optionToolbar.append(enableNetworkViewCheckbox);

    cleanup.push(
        TabStore.watch(tabId, 'isNetworkViewerEnabled', async (nv: boolean|null) => {
            if (!port) return;

            if (nv) {
                enableNotificationsCheckbox.setAttribute('checked', '');
                networkViewerEnabled();
            } else {
                enableNotificationsCheckbox.removeAttribute('checked');
                networkViewerDisabled();
            }
        }),
    );

  // --- mocking toggle ---
  const isMockingCheckboxChecked = await TabStore.get(tabId, 'isMockingEnabled') ?? false;
  async function mockingEnabled() {
    if (!port) return;
    port.postMessage({type: 'ENABLE_MOCKING', payload: {engineType: engineType}} as EnableMocking);
    setExtensionIconStateActive(tabId);
    await BadgeManager.background(tabId, BADGE_ACTIVE.background);
    await BadgeManager.color(tabId, BADGE_ACTIVE.text);
    if (!(await BadgeManager.get(tabId))) {
      await BadgeManager.set(tabId, '0');
    }
  }
  async function mockingDisabled() {
    if (!port) return;
    port.postMessage({type: 'DISABLE_MOCKING', payload: {engineType: engineType}} as DisableMocking);
    if (!await TabStore.get(tabId, 'isNetworkViewerEnabled')) setExtensionIconStateDisabled(tabId);
    await BadgeManager.background(tabId, BADGE_INACTIVE.background);
    await BadgeManager.color(tabId, BADGE_INACTIVE.text);
  }

  if (isMockingCheckboxChecked) {
    mockingEnabled();
  } else {
    mockingDisabled();
  }

    const enableMockingCheckbox = document.createElement('ok-checkbox');
    enableMockingCheckbox.textContent = 'Enable Mocking';
    enableMockingCheckbox.setAttribute('id', 'enableMocking');
    enableMockingCheckbox.setAttribute('name', 'enableMocking');
    enableMockingCheckbox.addEventListener('change', (event: Event) => {
        const target = event.target as HTMLInputElement;
        TabStore.set(tabId, 'isMockingEnabled', target.checked);
    });

    if (await TabStore.get(tabId, 'isMockingEnabled') ?? false) {
        enableNotificationsCheckbox.setAttribute('checked', '');
    }
  optionToolbar.append(enableMockingCheckbox);

  cleanup.push(
        TabStore.watch(tabId, 'isMockingEnabled', async (nv: boolean|null) => {
            if (!port) return;
            
            if (nv) {
                enableNotificationsCheckbox.setAttribute('checked', '');
                mockingEnabled();
            } else {
                enableNotificationsCheckbox.removeAttribute('checked');
                mockingDisabled();
            }
        })
  );

  // --- panel tab buttons ---
  networkViewTab.addEventListener('click', async (event: Event) => {
    mockViewTab.removeAttribute('toggled');
    networkViewTab.setAttribute('toggled', '');
    document.querySelectorAll('.active').forEach(ele => ele.classList.replace('active', 'hidden'));
    document.querySelectorAll('.hidden').forEach(ele => ele.classList.replace('hidden', 'active'));
    await TabStore.set(tabId, 'panelUIState', {tab: 'networkView'});
  });

  mockViewTab.addEventListener('click', async (event: Event) => {
    networkViewTab.removeAttribute('toggled');
    mockViewTab.setAttribute('toggled', '');
    document.querySelectorAll('.active').forEach(ele => ele.classList.replace('active', 'hidden'));
    document.querySelectorAll('.hidden').forEach(ele => ele.classList.replace('hidden', 'active'));
    await TabStore.set(tabId, 'panelUIState', {tab: 'mockView'});
  });

  // --- network ---
  const networkList = document.querySelector('.network-list');
  const networkDetails = document.querySelector('.network-details');

  let networkListPlaceholder: HTMLElement = document.createElement('p');
  networkListPlaceholder.textContent = 'No Requests.';
  if (await TabStore.get(tabId, 'isNetworkViewerEnabled')) {
    networkListPlaceholder.textContent += ' Enable Network Viewer to capture requests.'
  }

    networkList?.append(networkListPlaceholder);

  const networkDetailsPlaceholder = document.createElement('p');
  networkDetailsPlaceholder.textContent = 'Select a request to inspect it.';
  networkDetails?.append(networkDetailsPlaceholder);

  // --- mocking ---
  const mockList = document.querySelector('.mock-list');
  const mockDetails = document.querySelector('.mock-details');

  // display list in reverse order so we can simply append children naturally
  const addMockRow = document.createElement('ok-row');

  const addMockRowSubmit = document.createElement('ok-button');
  addMockRowSubmit.setAttribute('type', 'submit');
  addMockRowSubmit.slot = 'actions';

  const addMockRowInput = document.createElement('ok-text-input');
  addMockRowInput.setAttribute('placeholder', 'URL or Pattern');
  addMockRowInput.setAttribute('name', 'pattern');
  addMockRowInput.setAttribute('required', '');
  
  const addMockRowForm = document.createElement('ok-form');
  addMockRowForm.append(addMockRowSubmit, addMockRowInput);
  addMockRowForm.addEventListener('submit', addMockOnSubmit);

  mockList?.append(addMockRow);

  const mockDetailsPlaceholder = document.createElement('p');
  mockDetailsPlaceholder.textContent = 'Select a mock.';
  mockDetails?.append(mockDetailsPlaceholder);
}

function renderNetworkDetails(mock: Omit<MockEndpoint, 'id'|'createdAt'|'updatedAt'|'priorityOrder'|'listOrder'>) {
    const readOnlyForm = document.createElement('ok-readonly-form');

    // url, method, request, response
    const urlLabel = document.createElement('label');
    urlLabel.innerText = 'URL';

    const urlPre = document.createElement('ok-pre');
    urlPre.value = mock.url;

    const methodLabel = document.createElement('label');
    methodLabel.innerText = 'Method';

    const methodPre = document.createElement('ok-pre');
    methodPre.value = mock.method;

    const requestHeadersLabel = document.createElement('label');
    requestHeadersLabel.innerText = 'Request Headers';

    const requestHeadersPre = document.createElement('ok-pre');
    requestHeadersPre.value = JSON.stringify(mock.request?.headers ?? []);

    const requestBodyLabel = document.createElement('label');
    requestBodyLabel.innerText = 'Request Body';

    const requestBodyPre = document.createElement('ok-pre');
    requestBodyPre.value = JSON.stringify(mock.request?.body ?? {});

    const responseStatusLabel = document.createElement('label');
    responseStatusLabel.innerText = 'Status';

    const responseStatusPre = document.createElement('ok-pre');
    responseStatusPre.value = mock.response.status.toString();

    const responseHeadersLabel = document.createElement('label');
    responseHeadersLabel.innerText = 'Response Headers';

    const responseHeadersPre = document.createElement('ok-pre');
    responseHeadersPre.value = JSON.stringify(mock.response.headers);

    const responseBodyLabel = document.createElement('label');
    responseBodyLabel.innerText = 'Response Body';

    const responseBodyPre = document.createElement('ok-pre');
    responseBodyPre.value = JSON.stringify(mock.response.body);

    readOnlyForm.append(
        urlLabel,
        urlPre,
        methodLabel,
        methodPre,
        requestHeadersLabel,
        requestHeadersPre,
        requestBodyLabel,
        requestBodyPre,
        responseStatusLabel,
        responseStatusPre,
        responseHeadersLabel,
        responseHeadersPre,
        responseBodyLabel,
        responseBodyPre,
    );

    readOnlyForm.addEventListener('submit', async () => await addMock(mock));
    return readOnlyForm;
}

async function selectRequest(event: Event) {
  if (!event.currentTarget) return;
  const networkDetails = document.querySelector('.network-details');
  if (!networkDetails) return;
  const requestId = (event.currentTarget as HTMLElement).id
  selectedRequest = (await TabStore.get(tabId, 'capturedRequests'))?.find(r => r.requestId === requestId);
  if (!selectedRequest) return;

  networkDetails.innerHTML = '';

  selectedRequest.requestHeaders;
  const newMock: Omit<MockEndpoint, 'id'|'createdAt'|'updatedAt'|'priorityOrder'|'listOrder'> = {
    delayMs: 0,
    enabled: false,
    matchType: 'regex',
    description: '',
    method: selectedRequest?.method as HttpMethod,
    name: selectedRequest?.url ?? '',
    request: {
      headers: selectedRequest.requestHeaders,
      queryParams: Object.fromEntries(new URL(selectedRequest.url).searchParams),
      body: selectedRequest.requestBody,
    },
    response: {
      status: (selectedRequest?.statusCode ?? 200) as HttpStatusCodes,
      statusText: undefined,
      headers: Object.fromEntries(
        (selectedRequest?.responseHeaders ?? []).map(item => [item.name, item.value])
      ),
      body: selectedRequest?.responseBody
    },
    url: selectedRequest.url ?? '',
  };

  networkDetails.replaceChildren(renderNetworkDetails(newMock));
}

function renderRequestRow(request: InterceptedRequest) {
    const requestRow = document.createElement('ok-row');
    requestRow.setAttribute('id', request.requestId.toString());
    requestRow.addEventListener('click', selectRequest);

    const method = document.createElement('span');
    method.innerText = request.method;

    const status = document.createElement('span');
    status.innerText = request.statusCode.toString();

    const url = document.createElement('span');
    url.innerText = request.url;

    requestRow.append(method, status, url);
    return requestRow;
}

async function renderRequests(requests: Array<InterceptedRequest>) {
  const networkList = document.querySelector('.network-list');
  if (!networkList) return;
  // template in memory to build full update and render in a single paint
  const fragment: DocumentFragment = document.createDocumentFragment();
  // temporary element to collect the new children to render
  const temp = document.createElement('div');
  // render all mocks
  requests.forEach(r => {
    temp.append(renderRequestRow(r));
  });

  fragment.append(...temp.children);
  networkList.replaceChildren(fragment);
}

async function submitSaveMock(event: SubmitEvent) {
  event.preventDefault();
  const formElement = event.currentTarget as HTMLFormElement;
  if (!formElement) return;
  const formData = new FormData(formElement);
  const mockId = formElement.dataset.id;
  const originalMock = JSON.parse(JSON.stringify(await db.mocks.get(Number(mockId))));
  if (!originalMock) return;

  originalMock.url = formData.get('url')!.toString();
  // TODO: need to create custom field for headers
  originalMock.request.headers = JSON.parse(formData.get('request-headers')!.toString());
  originalMock.request.queryParams = JSON.parse(formData.get('request-params')!.toString());
  originalMock.request.body = JSON.parse(formData.get('request-body')!.toString());

  originalMock.response.status = Number(formData.get('response-status'));
  originalMock.response.headers = JSON.parse(formData.get('response-headers')!.toString());
  originalMock.response.body = JSON.parse(formData.get('response-body')!.toString());

  await updateMock(originalMock.id, originalMock);
}

function renderMockForm(mock: MockEndpoint) {
    const mockForm = document.createElement('ok-form');

    const pattern = document.createElement('ok-text-input');
    pattern.setAttribute('placeholder', 'pattern');
    pattern.setAttribute('name', 'pattern');
    pattern.setAttribute('required', '');

    const matchType = document.createElement('ok-select');
    matchType.setAttribute('required', '');
    matchType.setAttribute('name', 'matchType');
    for (const t of ['exact', 'contains', 'wildcard', 'regex']) {
        const opt = document.createElement('option');
        if (t === 'contains') opt.setAttribute('selected', '');
        opt.setAttribute('value', t);
        matchType.appendChild(opt);
    }

    const description = document.createElement('ok-textarea');
    description.setAttribute('name', 'description');

    const method = document.createElement('ok-select');
    method.setAttribute('required', '');
    method.setAttribute('name', 'method');
    for (const t of ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS', 'HEAD']) {
        const opt = document.createElement('option');
        if (t === 'GET') opt.setAttribute('selected', '');
        opt.setAttribute('value', t);
        method.appendChild(opt);
    }

    const name = document.createElement('ok-text-input');
    name.setAttribute('placeholder', 'my mock name');
    name.setAttribute('name', 'name');

    const delayMs = document.createElement('ok-text-input');
    delayMs.setAttribute('placeholder', '2000');
    delayMs.setAttribute('name', 'delay');

    const tags = document.createElement('ok-array-input');
    tags.setAttribute('field', 'ok-text-input');
    tags.setAttribute('name', 'tags');

    const reqHeaders = document.createElement('ok-array-input');
    reqHeaders.setAttribute('field', 'ok-key-value');
    reqHeaders.setAttribute('name', 'request-headers');

    const requestParams = document.createElement('ok-array-input');
    requestParams.setAttribute('field', 'ok-key-value');
    requestParams.setAttribute('name', 'request-headers');

    const requestBody = document.createElement('ok-textarea');
    requestBody.setAttribute('placeholder', '{}');
    requestBody.setAttribute('name', 'request-body');

    const responseStatus = document.createElement('ok-select');
    responseStatus.setAttribute('required', '');
    responseStatus.setAttribute('name', 'responseStatus');
    for (const t of HTTP_STATUS_CODES) {
        const opt = document.createElement('option');
        if (t === 200) opt.setAttribute('selected', '');
        opt.setAttribute('value', t.toString());
        responseStatus.appendChild(opt);
    }

    const responseStatusText = document.createElement('ok-select');
    responseStatusText.setAttribute('name', 'responseStatusText');
    for (const t of ['', ...HTTP_STATUS_TEXT]) {
        const opt = document.createElement('option');
        if (t === '') opt.setAttribute('selected', '');
        opt.setAttribute('value', t);
        responseStatus.appendChild(opt);
    }

    const responseHeaders = document.createElement('ok-array-input');
    responseHeaders.setAttribute('field', 'ok-key-value');
    responseHeaders.setAttribute('name', 'request-headers');

    const responseBody = document.createElement('ok-textarea');
    responseBody.setAttribute('placeholder', '{}');
    responseBody.setAttribute('name', 'request-body');

    mockForm.append(
        pattern,
        matchType,
        description,
        method,
        name,
        delayMs,
        tags,
        reqHeaders,
        requestParams,
        requestBody,
        responseStatus,
        responseStatusText,
        responseHeaders,
        responseBody,
    );

    return mockForm;
}

async function selectMock(event: Event) {
  if (!event.currentTarget) return;
  const mockDetails = document.querySelector('.mock-details');
  if (!mockDetails) return;
  const id = (event.currentTarget as HTMLElement).id
  selectedMock = await db.mocks.get(Number(id));
  if (!selectedMock) return;

  mockDetails.innerHTML = '';
  
  mockDetails.replaceChildren(renderMockForm(selectedMock));
}

function renderMockRow(mock: MockEndpoint) {
    const row = document.createElement('ok-row');
    row.setAttribute('id', mock.id?.toString()!);
    row.addEventListener('click', selectMock);

    const method = document.createElement('span');
    method.innerText = mock.method;

    const status = document.createElement('span');
    status.innerText = mock.response.status.toString();

    const url = document.createElement('span');
    url.innerText = mock.url;

    row.append(method, status, url);
    return row;
}

function renderAddMockRow() {
    const row = document.createElement('ok-row');
    row.setAttribute('id', 'add-mock-row');

    const submit = document.createElement('ok-button');
    submit.setAttribute('type', 'submit');
    submit.slot = 'actions';

    const input = document.createElement('ok-text-input');
    input.setAttribute('placeholder', 'URL or Pattern');
    input.setAttribute('name', 'pattern');
    input.setAttribute('required', '');
    
    const form = document.createElement('ok-form');
    form.append(submit, input);
    form.addEventListener('submit', addMockOnSubmit);

    row.append(form);
    return row;
}

async function renderMocks(mocks: Array<MockEndpoint>) {
  const mockList = document.querySelector('.mock-list');
  if (!mockList) return;
  // template in memory to build full update and render in a single paint
  const fragment: DocumentFragment = document.createDocumentFragment();
  // temporary element to collect the new children to render
  const temp = document.createElement('div');
  // rerender the add mock row
  const addMockRow = renderAddMockRow();
  temp.append(addMockRow);

  // render all mocks
  mocks.forEach(m => {
    temp.append(renderMockRow(m)); 
  });

  fragment.append(...temp.children);
  mockList.replaceChildren(fragment);
}

// --- setup ---
window.addEventListener('DOMContentLoaded', async () => {
  await connectToBackground();
  await render();
  // populate or repopulate requests
  // populate or repopulate mocks
});

// todo: return to modify for offline behavior
// browser suspended or offline, cleanup port for reconnect later
window.addEventListener('offline', () => {
  if (port) port.disconnect();
});

// reconnect to port when browser is unsuspended or goes online again
window.addEventListener('online', () => {
  if (!port && isPanelVisible) connectToBackground();
});

// cleanup
window.addEventListener('beforeunload', async () => {
  port = null;
  cleanup.forEach(fn => fn && fn());
});