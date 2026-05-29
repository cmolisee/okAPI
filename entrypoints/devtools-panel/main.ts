import type {
  Message,
  InterceptedRequest,
  StatusPayload,
  PausedPayload,
  ResponseOverride,
} from '../../lib/interceptor/types';
import { getMockingEnabledSetting, getNetworkViewerEnabledSetting, getNotificationsEnabledSetting, setMockingEnabledSetting, setNetworkViewerEnabledSetting, setNotificationsEnabledSetting } from '../../utils/storage';

const tabId = browser.devtools.inspectedWindow.tabId;
const port = browser.runtime.connect({ name: `okapi-${tabId}` });
const requests = new Map<string, InterceptedRequest>();
let selected: InterceptedRequest | null = null;

// --- message bus to background service worker ---
port.onMessage.addListener((msg: Message) => {
  switch (msg.type) {
    case 'INTERCEPTOR_STATUS': {
      const { attached, strategy } = msg.payload as StatusPayload;
      updatePanelUI(attached, strategy);
      break;
    }
    case 'REQUEST_PAUSED': {
      const { request } = msg.payload as PausedPayload;
      requests.set(request.id, request);
      renderRequestRow(request);

      // When running, pause all requests for a chance to replace it.
      // If no mock selected then auto pass it through to avoid stuck page.
      if (request.source === 'chromium-cdp' && selected?.id !== request.id) {
        setTimeout(() => {
          if (requests.has(request.id)) passthrough(request.id);
        }, 5_000);
      }
      break;
    }
    default: {
        console.debug('[devtools-panel] unknown message type', msg);
        break;
    }
  }
});

port.onDisconnect.addListener(() => {
  setNotificationsEnabledSetting(false);
  setMockingEnabledSetting(false);
  setNetworkViewerEnabledSetting(false);
});

// --- MSG HELPERS ---

function send(msg: Message): void {
  port.postMessage(msg);
}

function attach(): void {
  send({ type: 'INTERCEPTOR_ATTACH', payload: { tabId } });
}

function detach(): void {
  send({ type: 'INTERCEPTOR_DETACH', payload: { tabId } });
}

function override(o: ResponseOverride): void {
  send({ type: 'RESPONSE_OVERRIDE', payload: { override: o } });
}

function passthrough(requestId: string): void {
  send({ type: 'RESPONSE_PASSTHROUGH', payload: { requestId } });
}

// --- panel ui ---
const enableNetworkViewerButton = document.getElementById('toggle-network-viewer-enabled')! as HTMLButtonElement;
const enableMockingButton = document.getElementById('toggle-mocking-enabled')! as HTMLButtonElement;
const enableNotificationsButton = document.getElementById('toggle-notifications-enabled')! as HTMLButtonElement;
const networkViewerTabButton = document.getElementById('tab-network-viewer')! as HTMLButtonElement;
const mockViewerTabButton = document.getElementById('tab-mock-viewer')! as HTMLButtonElement;

const engineLabelElement = document.getElementById('engine-label')! as HTMLSpanElement;
const viewPain = document.getElementById('view-pane')! as HTMLElement;
const detailPain = document.getElementById('detail-pane')! as HTMLElement;

const networkViewPane = document.getElementById('network-view-pane')! as HTMLElement;
const networkViewPaneHint = networkViewPane.querySelector('.empty-hint')! as HTMLElement;
const networkDetailPane = document.getElementById('network-detail-pane')! as HTMLElement;
const networkDetailPlaceholder = networkDetailPane.querySelector('.detail-placeholder')! as HTMLElement;
const networkDetailContent = networkDetailPane.querySelector('.detail-content')! as HTMLElement;
const networkDetailMeta = networkDetailPane.querySelector('.detail-meta')! as HTMLElement;
const networkDetailTabs = networkDetailPane.querySelectorAll('.tabs')! as NodeListOf<HTMLButtonElement>;
const networkDetailRequest = networkDetailPane.querySelector('#request-body')! as HTMLPreElement;
const networkDetailHeaders = networkDetailPane.querySelector('#headers')! as HTMLPreElement;
const networkDetailResponse = networkDetailPane.querySelector('#response-body')! as HTMLPreElement;
const networkDetailCreateMock = networkDetailPane.querySelector('#create-mock')! as HTMLButtonElement;

const mockViewPane = document.getElementById('mock-view-pane')! as HTMLElement;
const mockViewPaneHint = mockViewPane.querySelector('empty-hint')! as HTMLElement;
const mockDetailPane = document.getElementById('mock-detail-pane')! as HTMLElement;
const mockDetailPlaceholder = mockDetailPane.querySelector('.detail-placeholder')! as HTMLElement;
const mockDetailContent = mockDetailPane.querySelector('.detail-content')! as HTMLElement;
const mockDetailMeta = mockDetailPane.querySelector('.detail-meta')! as HTMLElement;
const mockDetailTabs = mockDetailPane.querySelectorAll('.tabs')! as NodeListOf<HTMLButtonElement>;
const mockDetailRequestEditor = mockDetailPane.querySelector('#request-editor')! as HTMLTextAreaElement;
const mockDetailHeadersEditor = mockDetailPane.querySelector('#headers-editor')! as HTMLTextAreaElement;
const mockDetailResponseEditor = mockDetailPane.querySelector('#response-editor')! as HTMLTextAreaElement;
const mockDetailEnableMock = mockDetailPane.querySelector('#enable-mock')! as HTMLButtonElement;


function updatePanelUI(attached: boolean, strategy: string): void {
  if (engineLabelElement) engineLabelElement.innerText = strategy;
  if (enableNetworkViewerButton) enableNetworkViewerButton.disabled = !attached
  if (enableMockingButton) enableMockingButton.disabled = !attached
  if (enableNotificationsButton) enableNotificationsButton.disabled = !attached
  toggleEnableNetworkViewer();
  toggleEnableMocking();
  toggleEnableNotifications();
}

async function updateScriptStatus(): Promise<void> {
  if (
    !(await getNetworkViewerEnabledSetting()) ||
    !(await getMockingEnabledSetting())
  ) {
    detach();
  } else {
    attach();
  }
}

async function toggleEnableNetworkViewer(): Promise<void> {
  if (!enableNetworkViewerButton) return;
  if (enableNetworkViewerButton?.disabled) return;
  const isActive = await getNetworkViewerEnabledSetting();
  enableNetworkViewerButton.textContent = isActive ? '⏹ Stop' : '▶ Start';
  setNetworkViewerEnabledSetting(!isActive);
  updateScriptStatus();
}

async function toggleEnableMocking(): Promise<void> {
  if (!enableMockingButton) return;
  if (enableMockingButton?.disabled) return;
  const isActive = await getMockingEnabledSetting();
  enableMockingButton.textContent = isActive ? '⏹ Stop' : '▶ Start';
  setMockingEnabledSetting(!isActive);
  updateScriptStatus();
}

async function toggleEnableNotifications(): Promise<void> {
  if (!enableNotificationsButton) return;
  if (enableNotificationsButton?.disabled) return;
  const isActive = await getNotificationsEnabledSetting();
  enableNotificationsButton.textContent = isActive ? '⏹ Stop' : '▶ Start';
  setNotificationsEnabledSetting(!isActive);
}


async function renderRequestRow(request: InterceptedRequest): Promise<void> {
  // note: should only ever be called iff network viewer is enabled
  if (!networkViewPane) return;

  networkViewPaneHint.classList.toggle('hidden');

  const requestToUpdate = networkViewPane.querySelector(`[data-id="${request.id}"]`);
  if (requestToUpdate) {
    requestToUpdate.classList.add('updated');
    return;
  }

  const row = document.createElement('div');
  row.className = 'request-row';
  row.dataset.id = request.id;

  const method = document.createElement('span');
  method.className = 'row-method';
  method.textContent = request.method;

  const url = document.createElement('span');
  url.className = 'row-url';
  url.textContent = request.url;

  const status = document.createElement('span');
  status.className = `row-status ${request.statusCode && request.statusCode >= 400 ? 'status-error' : ''}`;
  status.textContent = String(request.statusCode ?? '…');

  row.append(method, url, status);
  row.addEventListener('click', () => selectRequest(request.id));

  networkViewPane.appendChild(row);
}

function selectRequest(id: string): void {
  // note: should only ever be called iff network viewer is enabled
  if (!networkViewPane) return;

  selected = requests.get(id) ?? null;
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
  networkDetailHeaders!.textContent = tryPrettyPrint(
    JSON.stringify({ request: selected.requestHeaders, response: selected.responseHeaders })
  );
  networkDetailResponse.textContent = tryPrettyPrint(JSON.stringify(selected.responseBody) ?? '');
}

// TODO: add status, response headers

function tryPrettyPrint(text: string): string {
  try { return JSON.stringify(JSON.parse(text), null, 2); } catch { return text; }
}

function panelTabClickEvent(event: Event) {
  const target = event.currentTarget as HTMLButtonElement;
  if (!target) return;
  if (target.classList.contains('active')) return;

  // toggle off active elements
  document.querySelector('.pane-tabs button.active')?.classList.toggle('active', false);
  viewPain.querySelector(':scope > .active')?.classList.toggle('active', false);
  detailPain.querySelector(':scope > .active')?.classList.toggle('active', false);

  target.classList.toggle('active', true);

  if (target.id === 'tab-network-viewer') {
    networkViewPane.classList.toggle('active', true);
    networkDetailPane.classList.toggle('active', true);
  } else if (target.id === 'tab-mock-viewer') {
    mockViewPane.classList.toggle('active', true);
    mockDetailPane.classList.toggle('active', true);
  }
}

// todo: consider adding clear button to network viewer


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