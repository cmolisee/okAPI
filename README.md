# ok-API

API Interception strategy by browser:

|BROWSER|STRATEGY|NOTES|
|---|---|---|
|Chrome/Edge|browser.debugger CDP|pause and modify|
|Firefox|filterResponseData|set rules before request and modify|
|Safari|fetch/XHR monkey-patch|Can only observe for XHR and modify fetch|

## Environment

Browser extension is sandboxed into different JS environments.

None of the following contexts share memory or variables. All communication must happen through the messaging ports.

### Background (Service Worker)

`background.ts`

- Always-on worker
- owns browser.debugger
- owns webRequest
- message router
- no DOM access

### DevTools Window

_devtools_ - registers the devtools panel
_devtools-panel_ - top-level tab (Elements, Console, Network, etc...)
_devtools-pane_ - secondary view or sidebar pane with the bulk of the UI

The service worker (via `background.ts`) communicates to the devtools entrypoints via the messaging port.

- brower.runtime.connect for long-lived connection/communication
- browser.runtime.sendMessage() for one-time requests

### Webpage or Tab

`injected.ts` gets injected directly on to the page DOM. It has access to the DOM and can communicate with other sandbox environments that are otherwise isolated.

`content.ts` runs in an isolated environment but only for the specific tab/page.

### Popup

- opens on toolbar click
- has DOM, runtime API
- short-lived (only while open)

## Execution context lifecycle

Background service worker

```text
Extension installed/updated
    ↓
service worker registered -> background.ts runs top-level code
    ↓
service worker idles -> may be killed by browser
    ↓
Event fires (message, debugger event, etc...)
    ↓
service worker wakes up and handles event
    ↓
service worker idles again -> may be killed by browser
```

__Cannot rely on in-memmory state to persist in the background across events. See storage for ephemeral state options/implementation.__

Content script

```text
navigation starts for a matching url
    ↓
content.ts injected into the page's isolated environment
    ↓
script runs, sets up listeners, optionally injects page level scripts
    ↓
lives as long as the page lives
    ↓
page navigates or closes -> content script torn down
```

Devtools + Devtools-panel + Devtools-pane

```text
user opens devtools for a tab
    ↓
devtools loads -> devtools.ts runs
    ↓
broser.devtools.panels.create() registers the panel tab
    ↓
user clicks the panel tab
    ↓
devtools-panel/pane load -> devtools-panel/pane main.ts run
    ↓
lives as long as devtools is open for that tab
    ↓
devtools closed -> port disconnects -> background cleans up
```

Popup

```text
user clikcs the extension icon in the toolbar
    ↓
popup loades -> popup.ts runs
    ↓
user interacts
    ↓
user clicks away -> popup destroyed, all state lost
```

## libs/interceptor/chromium.ts

## Inputs

```html
<div class="input-container">
    <input 
        type="text" 
        id="txt" 
        name="txt" 
        placeholder=" " 
        required
        aria-describedby="txt-hint"
    />
    <label for="txt">text input</label>
    <span id="txt-hint" class="input-hint">Enter some text.</span>
</div>
```

```html
<div class="checkbox-item">
    <input type="checkbox" id="notify-sms" name="notifications" value="sms">
    <label for="notify-sms">SMS text messages</label>
</div>
```

```html
<div class="select-container">
    <label for="country-select" id="country-label" class="select-label">
        Choose a country
    </label>
    <div class="select-wrapper">
        <select 
            id="country-select" 
            name="country" 
            aria-labelledby="country-label"
            required
        >
        <button value="" disabled selected hidden>Select an option...</button>
        <option value="us">United States</option>
        <option value="ca">Canada</option>
        <option value="uk">United Kingdom</option>
        <option value="au">Australia</option>
        </select>
        <!-- Custom accessible chevron indicator -->
        <span class="select-arrow" aria-hidden="true"></span>
    </div>
</div>
```

## Schema Versioning
 
Dexie migrations run via `.version(N).stores(...)`. When adding/removing indexes:
 
```ts
// db.ts
this.version(1).stores({ rules: "++id, uuid, ..." });
 
// Adding a new index in v2:
this.version(2).stores({ rules: "++id, uuid, ..., newField" });
// Dexie handles the IDBVersionChange transaction automatically.
```
 
Never rename or delete the DB — bump the version instead.

---

## Status Flow
 
```
[offline create]  → pending_create → synced
                                   → error (retry → synced)
 
[offline update]  → pending_update → synced
                                   → error
 
[offline delete]  → pending_delete → hard-deleted from IDB
                  (if never synced) → immediate hard-delete
 
[sync conflict]   → conflict       → manual resolution required
```
 
`pending_create` is sticky — an update to an unsynced record stays `pending_create`
so the remote sees a single CREATE rather than CREATE + UPDATE.

---
 
## Cross-Tab Sync
 
`BroadcastChannel` works across popup, options page, and devtools panel.
It does **not** reach content scripts (different origin). Use `chrome.runtime.sendMessage`
for content script → background communication, then re-emit on the bus in the background.
 
```ts
// background.ts (WXT entrypoint)
chrome.runtime.onMessage.addListener((msg) => {
  if (msg.type === "db:event") bus.emit(msg.event.type, msg.event.payload);
});
```
 
---
 
## Batch Operations
 
`batchRules()` wraps ops in a single Dexie transaction — all-or-nothing.
For partial success (each op independent), run them outside a transaction:
 
```ts
const results = await Promise.allSettled(
  ops.map(({ op, data }) => /* individual calls */)
);
```
 
---

## WXT Integration Tips
 
- **Background service worker**: Instantiate `SyncManager` here. SW can be
  terminated; re-instantiate on `chrome.runtime.onInstalled` and `onStartup`.
- **Popup / Options**: Import repos directly — Dexie opens the same IDB.
- **Content scripts**: Avoid direct Dexie imports (bundle size). Use
  `chrome.runtime.sendMessage` to the background instead.
---
 
## Offline Detection
 
`navigator.onLine` is unreliable (returns `true` on captive portals).
Consider wrapping `syncFn` to catch network errors and set status `error`,
then retry on the next flush cycle rather than trusting `onLine` alone.
 
---
 
## Conflict Strategy (not implemented — choose one)
 
| Strategy | When to use |
|---|---|
| **Last-write-wins** (default) | Simple; `updatedAt` timestamp decides |
| **Server wins** | Server is source of truth; overwrite local |
| **Client wins** | Local edits always override remote |
| **Manual** | Set `status: "conflict"`, surface to user |
 
Mark conflicts using `status: "conflict"` + store `remoteSnapshot` field for diffing.
 
---
 
## Indexes to Add If Needed
 
- `rules: "remoteId"` — if you query by server-assigned ID post-sync
- `logs: "[tabId+timestamp]"` — compound index for per-tab log filtering
- `rules: "[profileId+enabled]"` — if you filter by both frequently
 