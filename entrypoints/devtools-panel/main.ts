import type {
  Message,
  InterceptedRequest,
  StatusPayload,
  PausedPayload,
  ResponseOverride,
} from '../../lib/interceptor/types';
import { getMockingEnabledSetting, getNetworkViewerEnabledSetting, getNotificationsEnabledSetting, setMockingEnabledSetting, setMockingEnabledSettingSetting, setNetworkViewerEnabledSetting, setNotificationsEnabledSetting } from '../../utils/storage';

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
  setMockingEnabledSettingSetting(false);
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
const enableNetworkViewerButton = document.getElementById('toggle-network-viewer-enabled') as HTMLButtonElement | null;
const enableMockingButton = document.getElementById('toggle-mocking-enabled') as HTMLButtonElement | null;
const enableNotificationsButton = document.getElementById('toggle-notifications-enabled') as HTMLButtonElement | null;
const networkViewerTabButton = document.getElementById('tab-network-viewer') as HTMLButtonElement | null;
const mockViewerTabButton = document.getElementById('tab-mock-viewer') as HTMLButtonElement | null;

const engineLabelElement = document.getElementById('engine-label') as HTMLSpanElement | null;
const viewPanel = document.getElementById('viewer-panel') as HTMLElement | null;
const detailPanel = document.getElementById('detail-panel') as HTMLElement | null;

const networkViewPanel = document.getElementById('network-viewer') as HTMLElement | null;
const networkDetailPanel = document.getElementById('network-details') as HTMLElement | null;
const mockViewPanel = document.getElementById('mock-viewer') as HTMLElement | null;
const mockDetailPanel = document.getElementById('mock-details') as HTMLElement | null;

const detailContentPlaceholderSelector = '[data-active] .detail-placeholder';
const detailContentSelector = '[data-active] .detail-content';
const detailContentMetaSelector = '[data-active] .detail-meta';
const detailContentResponseTabSelector = '[data-active] [data-tab="response"]';
const detailContentRequestTabSelector = '[data-active] [data-tab="request"]';
const detailContentHeadersTabSelector = '[data-active] [data-tab="headers"]';
const detailContentResponeEditorSelector = '[data-active] textarea';
const detailContentRequestBodySelector = '[data-active] #view-request-body';
const detailContentHeadersSelector = '[data-active] #view-headers';
const detailContentOverrideButtonSelector = '[data-active] #btn-override';
const detailContentpassthroughButtonSelector = '[data-active] #btn-passthrough';

function updatePanelUI(attached: boolean, strategy: string): void {
  if (engineLabelElement) engineLabelElement.innerText = strategy;
  const method = attached ? 'removeAttribute' : 'setAttribute';
  if (enableNetworkViewerButton) enableNetworkViewerButton.disabled = !attached
  if (enableMockingButton) enableMockingButton.disabled = !attached
  if (enableNotificationsButton) enableNotificationsButton.disabled = !attached
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

async function toggleEnableNetworkViewer(event: Event): Promise<void> {
  if (!enableNetworkViewerButton) return;
  if (enableNetworkViewerButton?.disabled) return;
  const isActive = await getNetworkViewerEnabledSetting();
  enableNetworkViewerButton.textContent = isActive ? '⏹ Stop' : '▶ Start';
  setNetworkViewerEnabledSetting(!isActive);
  updateScriptStatus();
}

async function toggleEnableMocking(event: Event): Promise<void> {
  if (!enableMockingButton) return;
  if (enableMockingButton?.disabled) return;
  const isActive = await getMockingEnabledSetting();
  enableMockingButton.textContent = isActive ? '⏹ Stop' : '▶ Start';
  setMockingEnabledSetting(!isActive);
  updateScriptStatus();
}

async function toggleEnableNotifications(event: Event): Promise<void> {
  if (!enableNotificationsButton) return;
  if (enableNotificationsButton?.disabled) return;
  const isActive = await getNotificationsEnabledSetting();
  enableNotificationsButton.textContent = isActive ? '⏹ Stop' : '▶ Start';
  setNotificationsEnabledSetting(!isActive);
}

async function toggleActiveClickEvent(event: Event): Promise<void> {
  if (!toggleActiveButton) return;
  const isActive = await getMockingEnabledSettingSetting();

  isActive ? detach() : attach();
  toggleActiveButton.textContent = isActive ? '⏹ Stop' : '▶ Start';
  setMockingEnabledSettingSetting(!isActive);
}

if (toggleActiveButton) {
  const isActive = await getMockingEnabledSettingSetting();

  toggleActiveButton.textContent = isActive ? '⏹ Stop' : '▶ Start';
  isActive ? attach() : detach();

  toggleActiveButton.removeEventListener('click', toggleActiveClickEvent)
  toggleActiveButton.addEventListener('click', toggleActiveClickEvent);
}

// --- engine lable ---
if (engingLabel) {
  engineElement.textContent = strategy !== 'none' ? `[${strategy}]` : '';
}




const listElement = document.getElementById('request-list')!;
const detailElement = document.getElementById('detail-panel')!;
const detailMetaElement = document.getElementById('detail-meta')!;
const editorBodyElement = document.getElementById('editor-body') as HTMLTextAreaElement;
const reqBodyElement = document.getElementById('view-request-body')!;
const headersElement = document.getElementById('view-headers')!;
const btnToggleElement = document.getElementById('btn-toggle')!;
const btnClearElement = document.getElementById('btn-clear')!;
const btnOverrideElement = document.getElementById('btn-override')!;
const btnPassthroughElement = document.getElementById('btn-passthrough')!;
const badgeElement = document.getElementById('status-badge')!;
const engineElement = document.getElementById('engine-label')!;



function setEngineLabel(strategy: string): void {
  engineElement.textContent = strategy !== 'none' ? `[${strategy}]` : '';
}

function renderRequestRow(req: InterceptedRequest): void {
  // Remove empty-hint on first item
  listElement.querySelector('.empty-hint')?.remove();

  const existing = listElement.querySelector(`[data-id="${req.id}"]`);
  if (existing) {
    existing.classList.add('row--updated');
    return;
  }

  const row = document.createElement('div');
  row.className   = 'request-row';
  row.dataset.id  = req.id;

  const method = document.createElement('span');
  method.className = 'row-method';
  method.textContent = req.method;

  const url = document.createElement('span');
  url.className = 'row-url';
  url.textContent = req.url;

  const status = document.createElement('span');
  status.className = `row-status ${req.statusCode && req.statusCode >= 400 ? 'status--error' : ''}`;
  status.textContent = String(req.statusCode ?? '…');

  row.append(method, url, status);
  row.addEventListener('click', () => selectRequest(req.id));
  listElement.appendChild(row);
}

function selectRequest(id: string): void {
  selected = requests.get(id) ?? null;
  if (!selected) return;

  listElement.querySelectorAll('.request-row').forEach(r =>
    r.classList.toggle('active', r.getAttribute('data-id') === id),
  );

  detailElement.querySelector('.detail-placeholder')?.classList.add('hidden');
  detailElement.querySelector('.detail-content')?.classList.remove('hidden');

  detailMetaElement.innerHTML =
    `<strong>${selected.method}</strong> <span class="url">${selected.url}</span> ` +
    `<span class="status">${selected.statusCode ?? '…'}</span>`;

  editorBodyElement.value    = tryPrettyPrint(selected.responseBody ?? '');
  reqBodyElement.textContent = tryPrettyPrint(selected.requestBody ?? '(none)');
  headersElement.textContent = JSON.stringify(
    { request: selected.requestHeaders, response: selected.responseHeaders },
    null,
    2,
  );
}

function tryPrettyPrint(text: string): string {
  try { return JSON.stringify(JSON.parse(text), null, 2); } catch { return text; }
}

// ─── Tab switching ────────────────────────────────────────────────────────────

document.querySelectorAll('.tab').forEach((tab) => {
  tab.addEventListener('click', () => {
    document.querySelectorAll('.tab').forEach(t => t.classList.remove('active'));
    tab.classList.add('active');
    const target = (tab as HTMLElement).dataset.tab!;
    document.querySelectorAll('.tab-body').forEach(b => {
      b.classList.toggle('hidden', b.id !== `tab-${target}`);
    });
  });
});

// ─── Toolbar actions ─────────────────────────────────────────────────────────

btnClearElement.addEventListener('click', () => {
  requests.clear();
  selected = null;
  listElement.innerHTML = '<p class="empty-hint">No requests captured yet.</p>';
  detailElement.querySelector('.detail-content')?.classList.add('hidden');
  detailElement.querySelector('.detail-placeholder')?.classList.remove('hidden');
});

btnOverrideElement.addEventListener('click', () => {
  if (!selected) return;
  if (selected.source === 'safari-patch') {
    // Safari: send a decision before the real request is made
    send({
      type: 'REQUEST_DECISION',
      payload: {
        decision: {
          requestId:       selected.id,
          action:          'block',
          syntheticStatus: 200,
          syntheticBody:   editorBodyElement.value,
        },
      },
    });
  } else {
    // Chromium/Firefox: override the response after it was received
    send({
      type:    'RESPONSE_OVERRIDE',
      payload: {
        override: {
          requestId:  selected.id,
          body:       editorBodyElement.value,
          statusCode: selected.statusCode ?? 200,
        },
      },
    });
  }
 
  listElement.querySelector(`[data-id="${selected.id}"]`)?.classList.add('row--overridden');
});

btnPassthroughElement.addEventListener('click', () => {
  if (!selected) return;
  if (selected.source === 'safari-patch') {
    send({
      type: 'REQUEST_DECISION',
      payload: {
        decision: {
          requestId: selected.id,
          action:    'passthrough',
        },
      },
    });
  } else {
    send({ type: 'RESPONSE_PASSTHROUGH', payload: { requestId: selected.id } });
  }
 
  listElement.querySelector(`[data-id="${selected.id}"]`)?.classList.remove('row--updated');
});