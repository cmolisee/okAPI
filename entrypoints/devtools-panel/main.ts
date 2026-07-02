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
import db, { addMock, HttpMethod, initDb, MockEndpoint, updateMock } from '@/utils/db';
import { BADGE_ACTIVE, BADGE_INACTIVE, BadgeManager, setExtensionIconStateActive, setExtensionIconStateDisabled } from '@/utils/shared';
import createTabToolbar from '@/components/tab-toolbar';
import createToolbarTab from '@/components/toolbar-tab';
import createToolsToolbar from '@/components/tool-toolbar';
import createSimpleLabel from '@/components/simple-label';
import createCheckbox from '@/components/checkbox';
import createAddMockRow from '@/components/add-mock-row';
import createReadOnlyForm from '@/components/read-only-form';
import createRequestRow from '@/components/request-row';
import createForm from '@/components/form';
import createMockRow from '@/components/mock-row';

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

  const tabToolbar = createTabToolbar();
  const optionToolbar = createToolsToolbar();
  const labelToolbar = createToolsToolbar();
  header?.append(tabToolbar, optionToolbar, labelToolbar);

  const networkViewTab = createToolbarTab({ id: 'network-view-toggle', title: 'Network Viewer', ariaSelected: 'true' });
  const mockViewTab = createToolbarTab({ id: 'mock-view-toggle', title: 'Mock Viewer', ariaSelected: 'false' });
  tabToolbar.append(networkViewTab, mockViewTab);
  
  const engineType = getEngine();
  TabStore.set(tabId, 'engineType', engineType);
  labelToolbar.append(createSimpleLabel({ textContent: `Engine: ${engineType ?? 'uknown'}`}));

  // --- notification toggle ---
  const enableNotificationsCheckbox = createCheckbox({ 
    htmlFor: 'enableNotifications',
    id: 'enableNotifications',
    textContent: 'Enable Notifications',
    checked: await TabStore.get(tabId, 'isNotificationsEnabled') ?? false
  });
  optionToolbar.append(enableNotificationsCheckbox);

  enableNotificationsCheckbox!.querySelector('input')!.addEventListener('change', (event: Event) => {
    const target = event.target as HTMLInputElement;
    TabStore.set(tabId, 'isNotificationsEnabled', target.checked);
  });

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

  const enableNetworkViewCheckbox = createCheckbox({ 
    htmlFor: 'enableNetworkViewer',
    id: 'enableNetworkViewer',
    textContent: 'Enable Network Viewer',
    checked: await TabStore.get(tabId, 'isNetworkViewerEnabled') ?? false
  });
  optionToolbar.append(enableNetworkViewCheckbox);

  enableNetworkViewCheckbox!.querySelector('input')!.addEventListener('change', (event: Event) => {
    const target = event.target as HTMLInputElement;
    TabStore.set(tabId, 'isNetworkViewerEnabled', target.checked);
  });

  cleanup.push(
    TabStore.watch(tabId, 'isNetworkViewerEnabled', async (nv: boolean|null) => {
      if (!port) return;
      enableNetworkViewCheckbox!.querySelector('input')!.checked = nv ?? false;

      if (nv) {
        networkViewerEnabled();
      } else {
        networkViewerDisabled()
      }
    })
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

  const enableMockingCheckbox = createCheckbox({ 
    htmlFor: 'enableMocking',
    id: 'enableMocking',
    textContent: 'Enable Mocking',
    checked: isMockingCheckboxChecked
  });
  optionToolbar.append(enableMockingCheckbox);

  enableMockingCheckbox!.querySelector('input')!.addEventListener('change',async (event: Event) => {
    const target = event.target as HTMLInputElement;
    TabStore.set(tabId, 'isMockingEnabled', target.checked);
  });

  cleanup.push(
    TabStore.watch(tabId, 'isMockingEnabled', async (nv: boolean|null) => {
      if (!port) return;
      enableMockingCheckbox!.querySelector('input')!.checked = nv ?? false;
      if (nv) {
        mockingEnabled();
      } else {
        mockingDisabled();
      }
    })
  );

  // --- panel tab buttons ---
  networkViewTab!.addEventListener('click', async (event: Event) => {
    mockViewTab!.setAttribute('aria-pressed', 'false');
    networkViewTab!.setAttribute('aria-pressed', 'true');
    document.querySelectorAll('.active').forEach(ele => ele.classList.replace('active', 'hidden'));
    document.querySelectorAll('.hidden').forEach(ele => ele.classList.replace('hidden', 'active'));
    await TabStore.set(tabId, 'panelUIState', {tab: 'networkView'});
  });

  mockViewTab!.addEventListener('click', async (event: Event) => {
    networkViewTab!.setAttribute('aria-pressed', 'false');
    mockViewTab!.setAttribute('aria-pressed', 'true');
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
  networkList!.append(networkListPlaceholder);

  const networkDetailsPlaceholder = document.createElement('p');
  networkDetailsPlaceholder.textContent = 'Select a request to inspect it.';
  networkDetails?.append(networkDetailsPlaceholder);

  // --- mocking ---
  const mockList = document.querySelector('.mock-list');
  const mockDetails = document.querySelector('.mock-details');

  // display list in reverse order so we can simply append children naturally
  const addMockRow = createAddMockRow();
  mockList?.append(enableMockingCheckbox);
  
  const addMockRowForm = addMockRow?.querySelector('form') as HTMLFormElement;
  addMockRowForm.onsubmit = addMockOnSubmit;

  const mockDetailsPlaceholder = document.createElement('p');
  mockDetailsPlaceholder.textContent = 'Select a mock.';
  mockDetails?.append(mockDetailsPlaceholder);
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
      status: Number(selectedRequest?.statusCode),
      statusText: undefined,
      headers: Object.fromEntries(
        (selectedRequest?.responseHeaders ?? []).map(item => [item.name, item.value])
      ),
      body: selectedRequest?.responseBody
    },
    url: selectedRequest.url ?? '',
  };

  networkDetails.replaceChildren(createReadOnlyForm({
    onclick: async () => await addMock(newMock),
    ...selectedRequest
  }));
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
    temp.append(createRequestRow({
      ...r,
      id: r.requestId.toString(),
      onclick: selectRequest
    }));
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

  originalMock!.url = formData.get('url')!.toString();
  // TODO: need to create custom field for headers
  originalMock!.request!.headers = JSON.parse(formData.get('request-headers')!.toString());
  originalMock!.request!.queryParams = JSON.parse(formData.get('request-params')!.toString());
  originalMock!.request!.body = JSON.parse(formData.get('request-body')!.toString());

  originalMock!.response!.status = Number(formData.get('response-status'));
  originalMock!.response!.headers = JSON.parse(formData.get('response-headers')!.toString());
  originalMock!.response!.body = JSON.parse(formData.get('response-body')!.toString());

  await updateMock(originalMock.id, originalMock);
}

async function selectMock(event: Event) {
  if (!event.currentTarget) return;
  const mockDetails = document.querySelector('.mock-details');
  if (!mockDetails) return;
  const id = (event.currentTarget as HTMLElement).id
  selectedMock = await db.mocks.get(Number(id));
  if (!selectedMock) return;

  mockDetails.innerHTML = '';
  
  mockDetails.replaceChildren(createForm({
    submit: submitSaveMock,
    ...selectedMock
  }));
}

async function renderMocks(mocks: Array<MockEndpoint>) {
  const mockList = document.querySelector('.mock-list');
  if (!mockList) return;
  // template in memory to build full update and render in a single paint
  const fragment: DocumentFragment = document.createDocumentFragment();
  // temporary element to collect the new children to render
  const temp = document.createElement('div');
  // rerender the add mock row
  const addMockRow = createAddMockRow();
  temp.append(addMockRow);

  const addMockRowForm = addMockRow?.querySelector('form') as HTMLFormElement;
  addMockRowForm.onsubmit = addMockOnSubmit;

  // render all mocks
  mocks.forEach(m => {
    temp.append(createMockRow({
      ...m,
      id: m.id!.toString(),
      onclick: selectMock,
    })); 
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