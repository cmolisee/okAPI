import type {
  Message,
  InterceptedRequest,
  StatusPayload,
  PausedPayload,
  ResponseOverride,
} from '../../lib/interceptor/types';

/**
 * runs inside the devtools.
 * links to the background worker and drives the UI.
 */

// --- STATE ---

const tabId = browser.devtools.inspectedWindow.tabId;
const requests = new Map<string, InterceptedRequest>();
let selected: InterceptedRequest | null = null;
let attached = false;

// --- CONNECT TO BACKGROUND WORKER ---

const port = browser.runtime.connect({ name: `okapi-${tabId}` });
// listen for messages from background worker
port.onMessage.addListener((msg: Message) => {
  switch (msg.type) {
    case 'INTERCEPTOR_STATUS': {
      const { attached: a, strategy } = msg.payload as StatusPayload;
      attached = a;
      setEngineLabel(strategy);
      setToggleButton(a);
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
  setToggleButton(false);
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

// --- UI HELPERS ---

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

function setToggleButton(on: boolean): void {
  btnToggleElement.textContent = on ? '⏹ Stop' : '▶ Start';
  badgeElement.textContent = on ? 'On' : 'Off';
  badgeElement.className = `badge ${on ? 'badge--on' : 'badge--off'}`;
}

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

btnToggleElement.addEventListener('click', () => {
  attached ? detach() : attach();
});

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