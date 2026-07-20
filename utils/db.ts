import Dexie, { EntityTable, liveQuery } from 'dexie';
import { generateKeyBetween } from 'fractional-indexing';

export type UrlMatchType = 'exact' | 'contains' | 'wildcard' | 'regex';
export type HttpMethod =
  | 'GET'
  | 'POST'
  | 'PUT'
  | 'PATCH'
  | 'DELETE'
  | 'OPTIONS'
  | 'HEAD';
export type HttpStatusCodes = 
    | 100 | 101 | 102 | 103
    | 200 | 201 | 202 | 203 | 204 | 205 | 206 | 207 | 208 | 226
    | 300 | 301 | 302 | 303 | 304 | 305 | 306 | 307 | 308
    | 400 | 401 | 402 | 403 | 404 | 405 | 406 | 407 | 408 | 409
    | 410 | 411 | 412 | 413 | 414 | 415 | 416 | 417 | 418 | 421
    | 422 | 423 | 424 | 425 | 426 | 428 | 429 | 431 | 451
    | 500 | 501 | 502 | 503 | 504 | 505 | 506 | 507 | 508 | 510 | 511;
type HttpStatusText =
  // 1xx Informational
  | "Continue"
  | "Switching Protocols"
  | "Processing"
  | "Early Hints"
  // 2xx Success
  | "OK"
  | "Created"
  | "Accepted"
  | "Non-Authoritative Information"
  | "No Content"
  | "Reset Content"
  | "Partial Content"
  | "Multi-Status"
  | "Already Reported"
  | "IM Used"
  // 3xx Redirection
  | "Multiple Choices"
  | "Moved Permanently"
  | "Found"
  | "See Other"
  | "Not Modified"
  | "Use Proxy"
  | "Temporary Redirect"
  | "Permanent Redirect"
  // 4xx Client Error
  | "Bad Request"
  | "Unauthorized"
  | "Payment Required"
  | "Forbidden"
  | "Not Found"
  | "Method Not Allowed"
  | "Not Acceptable"
  | "Proxy Authentication Required"
  | "Request Timeout"
  | "Conflict"
  | "Gone"
  | "Length Required"
  | "Precondition Failed"
  | "Payload Too Large"
  | "URI Too Long"
  | "Unsupported Media Type"
  | "Range Not Satisfiable"
  | "Expectation Failed"
  | "I'm a teapot"
  | "Misdirected Request"
  | "Unprocessable Entity"
  | "Locked"
  | "Failed Dependency"
  | "Too Early"
  | "Upgrade Required"
  | "Precondition Required"
  | "Too Many Requests"
  | "Request Header Fields Too Large"
  | "Unavailable For Legal Reasons"
  // 5xx Server Error
  | "Internal Server Error"
  | "Not Implemented"
  | "Bad Gateway"
  | "Service Unavailable"
  | "Gateway Timeout"
  | "HTTP Version Not Supported"
  | "Variant Also Negotiates"
  | "Insufficient Storage"
  | "Loop Detected"
  | "Not Extended"
  | "Network Authentication Required";

export type MockRequestSpec = {
  headers?: Record<string, string>;
  queryParams?: Record<string, string>;
  /** arbitrary json used to validate/inspect the incoming request body. */
  body?: unknown;
}
export type MockResponseSpec = {
  status: HttpStatusCodes;
  statusText?: HttpStatusText;
  headers?: Record<string, string>;
  /** arbitrary json returned as the mocked response body. */
  body: unknown;
}
export type MockEndpoint = {
  /** Optional artificial latency to simulate real network conditions. */
  delayMs: number;
  createdAt: number;
  enabled: boolean;
  id?: number;
  matchType: UrlMatchType;
  description?: string;
  method: HttpMethod;
  name: string;
  updatedAt: number;
  request?: MockRequestSpec;
  response: MockResponseSpec;
  tags?: string[];
  /** literal URL/path, or a pattern interpreted per `matchType`. */
  url: string;
  priorityOrder: number;
  listOrder: string;
}
export interface RequestLog {
  id?: number;
  /** FK to MockEndpoint.id when source === 'mock'. */
  mockId?: number;
  method: HttpMethod;
  url: string;
  requestHeaders?: Record<string, string>;
  requestBody?: unknown;
  responseStatus: number;
  responseHeaders?: Record<string, string>;
  responseBody?: unknown;
  durationMs?: number;
  timestamp: number;
}
type MockApiDexie = Dexie & {
  mocks: EntityTable<MockEndpoint, 'id'>;
  logs: EntityTable<RequestLog, 'id'>;
};

export const db = new Dexie('ok-apiMockApiDB') as MockApiDexie;
db.version(1).stores({
  // ++id -> auto-incrementing primary key
  // *tags -> multi-entry index (array of strings)
  // [method+url] -> compound index for fast exact lookups
  mocks: '++id,listOrder,method,url,[method+url],createdAt,updatedAt,*tags',
  logs: '++id,mockId,method,url,source,timestamp',
});

/**
 * Ask the browser to put this origin's storage into "persistent" mode.
 * Overides default "best-effort" behavior by disabling automatic 
 * storage-eviction-under-disk-pressure policy.
 * Safe to call multiple times.
 * 
 * @returns true iff storage is successfuly persisted.
 */
export async function persistStorage(): Promise<boolean> {
  try {
    if (!navigator.storage?.persist || !navigator.storage?.persisted) {
      return false;
    }
    const alreadyPersisted = await navigator.storage.persisted();
    const persisted = alreadyPersisted || (await navigator.storage.persist());
    return persisted;
  } catch {
    // Storage API not available
    // 'unlimitedStorage' as a fall back should cover most scenarios.
    return false;
  }
}

/**
 * current usage/quota for this origin's storage.
 * 
 * @returns {StorageEstimate|undefined}
 */
export async function getStorageEstimate(): Promise<StorageEstimate | undefined> {
  return navigator.storage?.estimate ? navigator.storage.estimate() : undefined;
}

// --- mock operations ---
/**
 * Adds new mock to the table.
 * The 'id' (primary key) is auto incremented by dexie.
 * 'createdAt' and 'updatedAt' are generated.
 * 'priorityOrder' is defaulted to 0.
 * The next fractional index is auto-generated for 'listOrder'.
 * 
 * @param mock - Mock data to add
 * @returns The created mocks id (primary key)
 */
export async function addMock(
  mock: Omit<MockEndpoint, 'id'|'createdAt'|'updatedAt'|'priorityOrder'|'listOrder'>,
): Promise<number|undefined> {
  const now = Date.now();

  const lastMock = await db.mocks.orderBy('listOrder').last();
  const prevKey = lastMock ? lastMock.listOrder : null;
  const newKey = generateKeyBetween(prevKey, null);

  return db.mocks.add({ 
    ...mock, 
    createdAt: now, 
    updatedAt: now,
    priorityOrder: 0,
    listOrder: newKey,
  } as MockEndpoint);
}

/**
 * Updates target mock with applied changes.
 * 
 * @param id - primary key of the mock.
 * @param changes - updates to the mock.
 * @returns 'id' (primary key) of the updated mock
 */
export async function updateMock(
  id: number,
  changes: Partial<Omit<MockEndpoint, 'id'|'createdAt'|'updatedAt'|'listOrder'>>,
): Promise<number> {
  return db.mocks.update(id, { ...changes, updatedAt: Date.now() });
}

/**
 * Update the listOrder of an item based on the items before and after it in the new position.
 * 
 * @param id - the 'id' (primary key) of the moved item.
 * @param idBefore - the 'id' (primary key) of the item preceding the moved item (after being moved).
 * @param idAfter - the 'id' (primary key) of the item after the moved item (after being moved).
 */
export async function moveMock(id: number, idBefore: number, idAfter: number) {
  const prevItem = idBefore ? await db.mocks.get(idBefore) : null;
  const nextItem = idAfter ? await db.mocks.get(idAfter) : null;

  const prevKey = prevItem ? prevItem.listOrder : null;
  const nextKey = nextItem ? nextItem.listOrder : null;

  const newOrderKey = generateKeyBetween(prevKey, nextKey);

  await db.mocks.update(id, { listOrder: newOrderKey });
}

export async function deleteMock(id: number): Promise<void> {
  await db.mocks.delete(id);
}

/**
 * Adds multiple mocks to the table. For each mock:
 * The 'id' (primary key) is auto incremented by dexie.
 * 'createdAt' and 'updatedAt' are generated.
 * 'priorityOrder' is defaulted to 0.
 * The next fractional index is auto-generated for 'listOrder'.
 * 
 * @param mocks - mocks to add.
 * @returns 'id's (primary keys) of the added mocks
 */
export async function bulkAddMocks(
  mocks: Array<Omit<MockEndpoint, 'id'|'createdAt'|'updatedAt'|'listOrder'>>,
): Promise<(number|undefined)[]> {
  const now = Date.now();

  const lastMock = await db.mocks.orderBy('listOrder').last();
  let currentKey = lastMock ? lastMock.listOrder : null;
  
  const prepared = mocks.map((m) => {
    currentKey = generateKeyBetween(currentKey, null);

    return { ...m, createdAt: now, updatedAt: now, listOrder: currentKey } as MockEndpoint;
  });
  return db.transaction('rw', db.mocks, () => db.mocks.bulkAdd(prepared, { allKeys: true }));
}

/**
 * Updates/insertes mocks. Mocks are inserted iff a matching id (primary key)
 * cannot be found - updated otherwise.
 * 
 * @param mocks - mocks to update
 * @returns 'id's (primary keys) of the updated mocks
 */
export async function bulkPutMocks(mocks: MockEndpoint[]): Promise<(number|undefined)[]> {
  const now = Date.now();
  const prepared = mocks.map((m) => ({ ...m, updatedAt: now }));
  return db.transaction('rw', db.mocks, () => db.mocks.bulkPut(prepared, { allKeys: true }));
}

export async function bulkDeleteMocks(ids: number[]): Promise<void> {
  await db.transaction('rw', db.mocks, () => db.mocks.bulkDelete(ids));
}

/**
 * Get all mocks in the table in listOrder.
 * 
 * @returns mocks
 */
export async function getOrderedMocks() {
  return await db.mocks
    .orderBy('listOrder')
    .toArray();
}


// find first enabled mock that matches
function wildcardToRegExp(pattern: string): RegExp {
  const escaped = pattern.replace(/[.+^${}()|[\]\\]/g, '\\$&').replace(/\*/g, '.*');
  return new RegExp(`^${escaped}$`);
}

export function urlMatches(mock: MockEndpoint, url: string): boolean {
  switch (mock.matchType) {
    case 'exact':
      return mock.url === url;
    case 'contains':
      return url.includes(mock.url);
    case 'wildcard':
      return wildcardToRegExp(mock.url).test(url);
    case 'regex':
      return new RegExp(mock.url).test(url);
    default:
      return false;
  }
}

export async function getMatchingMocks(url: string): Promise<Array<MockEndpoint>> {
  const mocks = await getEnabledMocks();
  const matches = mocks.filter(m => urlMatches(m, url));
  return matches.sort((a,b) => a.priorityOrder - b.priorityOrder);
}

export async function getEnabledMocks(): Promise<Array<MockEndpoint>> {
  return db.mocks.where('enabled').equals('true').toArray();
}

// --- logs operations ---
export async function addLog(log: Omit<RequestLog, 'id'>): Promise<(number|undefined)> {
  return db.logs.add(log as RequestLog);
}

export async function bulkAddLogs(logs: Array<Omit<RequestLog, 'id'>>): Promise<(number|undefined)[]> {
  return db.transaction('rw', db.logs, () =>
    db.logs.bulkAdd(logs as RequestLog[], { allKeys: true }),
  );
}

export async function deleteLog(id: number): Promise<void> {
  await db.logs.delete(id);
}

export async function bulkDeleteLogs(ids: number[]): Promise<void> {
  await db.transaction('rw', db.logs, () => db.logs.bulkDelete(ids));
}

/** Batch-deletes logs older than `maxAgeMs`. Returns number of rows removed. */
export async function pruneLogsOlderThan(maxAgeMs: number): Promise<number> {
  const cutoff = Date.now() - maxAgeMs;
  return db.transaction('rw', db.logs, async () => {
    const ids = await db.logs.where('timestamp').below(cutoff).primaryKeys();
    await db.logs.bulkDelete(ids);
    return ids.length;
  });
}

/** Batch-deletes oldest logs beyond `maxCount`, keeping the most recent ones. */
export async function pruneLogsKeepLatest(maxCount: number): Promise<number> {
  return db.transaction('rw', db.logs, async () => {
    const total = await db.logs.count();
    if (total <= maxCount) return 0;
    const ids = await db.logs.orderBy('timestamp').limit(total - maxCount).primaryKeys();
    await db.logs.bulkDelete(ids);
    return ids.length;
  });
}

// --- import/export ---
export interface ExportedData {
  mocks: MockEndpoint[];
  logs: RequestLog[];
  exportedAt: number;
}

export async function exportAllData(): Promise<ExportedData> {
  return db.transaction('r', db.mocks, db.logs, async () => {
    const [mocks, logs] = await Promise.all([
      db.mocks.toArray(),
      db.logs.toArray(),
    ]);
    return { mocks, logs, exportedAt: Date.now() };
  });
}

// batch-import mocks from a json file/object
export async function importMocks(
  mocks: Array<Omit<MockEndpoint, 'id' | 'createdAt' | 'updatedAt'>>,
): Promise<(number|undefined)[]> {
  return bulkAddMocks(mocks);
}

export async function clearAllData(): Promise<void> {
  await db.transaction('rw', db.mocks, db.logs, async () => {
    await Promise.all([db.mocks.clear(), db.logs.clear()]);
  });
}

// --- cross-tab syncing ---
export function watchAllMocks() {
  return liveQuery(() => db.mocks.orderBy('listOrder').toArray());
}

export function watchEnabledMocks() {
  return liveQuery(async () => (await db.mocks.toArray()).filter((m) => m.enabled));
}

export function watchMock(id: number) {
  return liveQuery(() => db.mocks.get(id));
}

export function watchRecentLogs(limit = 50) {
  return liveQuery(() => db.logs.orderBy('timestamp').reverse().limit(limit).toArray());
}

// initialization is idempotent
// can be called in all entrypoints
let initialized = false;
export async function initDb(): Promise<void> {
  if (initialized) return;
  initialized = true;
  await db.open();
  await persistStorage();
}

export default db;