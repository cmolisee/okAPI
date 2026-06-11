import Dexie, { EntityTable, type Table } from 'dexie';

export type HttpMethod =
  | 'GET'
  | 'POST'
  | 'PUT'
  | 'PATCH'
  | 'DELETE'
  | 'OPTIONS'
  | 'HEAD'
  | '*';
export type Status =
  | 'synced'
  | 'pending_create'
  | 'pending_update'
  | 'pending_delete'
  | 'error'
  | 'conflict';
export type DateString = string;
export type MockRecord = {
    createdAt: ISODateString;
    updatedAt: ISODateString;
    id?: string;
    uuid: string;
    method: HttpMethod;
    urlPattern: string;
    statusCode: number;
    responseHeaders: Record<string, string>;
    responseBody: string | null;
    contentType: string;
    delayMs?: number;
    enabled: boolean;
    syncedAt?: number;
    status: Status;
    error?: string;
    remoteId?: string;
    desription?: string;
    title?: string;
}
export type SyncMeta = {
    id?: number;
    key: string;
    lastSyncAt: number;
    lastSyncCursor?: string;
    pendingCount: number;
}
export type NewMockRecord = Omit<MockRecord,'id' | 'uuid' | 'status' | 'createdAt' | 'updatedAt'>;
export type UpdateMockRecord = Partial<Omit<MockRecord, 'id' | 'uuid' | 'createdAt'>>;
export type BatchOperationType = 'create' | 'update' | 'delete';
export type BatchOperation<T> = {
  op: BatchOperationType;
  data: T;
}
export type BatchResult = {
  succeeded: number;
  failed: number;
  errors: Array<{ index: number; error: string }>;
}

export class OkapiDB extends Dexie {
  mocks!: Table<MockRecord, number>;
  syncMeta!: Table<SyncMeta, number>;
 
  constructor() {
    super('okapi');
 
    this.version(1).stores({
      rules: [
        '++id',
        'uuid',
        'profileId',
        'method',
        'urlPattern',
        'status',
        'enabled',
        'priority',
        '*tags',
        'updatedAt',
        '[status+updateAt'
      ].join(', '),
 
      syncMeta: ['++id', '&key'].join(', '),
    });
  }
}
 
export const db = new OkapiDB();

const now = () => Date.now();
const uuid = () => crypto.randomUUID();
 
function makePending<T extends { status: Status; updatedAt: number }>(
  patch: Partial<T>,
  pendingStatus: Status
): Partial<T> {
  return { ...patch, status: pendingStatus, updatedAt: now() };
}

export const mockRepository = {
  async getAll(profileId?: string): Promise<MockRecord[]> {
    const query = profileId
      ? db.mocks.where('profileId').equals(profileId)
      : db.mocks.toCollection();
    return query.sortBy('urlPattern');
  },
 
  async getByStatus(status: Status): Promise<MockRecord[]> {
    return db.mocks.where('status').equals(status).toArray();
  },
 
  async create(input: NewMockRecord): Promise<MockRecord> {
    const record: MockRecord = {
      ...input,
      uuid: uuid(),
      status: 'pending_create',
      createdAt: now(),
      updatedAt: now(),
    };
    const id = (await db.mocks.add(record)).toString();
    return { ...record, id };
  },
 
  async update(uuid: string, patch: UpdateMockRecord): Promise<void> {
    const rule = await db.mocks.where('uuid').equals(uuid).first();
    if (!rule?.id) throw new Error(`Rule not found: ${uuid}`);
 
    // Don't downgrade a pending_create to pending_update
    const nextStatus: Status = rule.status === 'pending_create' ? 'pending_create' : 'pending_update';
 
    await db.mocks.update(
      Number(rule.id),
      makePending({ ...patch }, nextStatus) as Partial<MockRecord>
    );
  },
 
  async delete(uuid: string): Promise<void> {
    const rule = await db.mocks.where('uuid').equals(uuid).first();
    if (!rule?.id) throw new Error(`Rule not found: ${uuid}`);
 
    // Never-synced records can be hard-deleted immediately
    if (rule.status === 'pending_create') {
      await db.mocks.delete(Number(rule.id));
      return;
    }
 
    await db.mocks.update(Number(rule.id), {
      status: 'pending_delete',
      updatedAt: now(),
    });
  },
 
  async hardDelete(uuid: string): Promise<void> {
    await db.mocks.where('uuid').equals(uuid).delete();
  },
 
  async markSynced(uuid: string, remoteId?: string): Promise<void> {
    const rule = await db.mocks.where('uuid').equals(uuid).first();
    if (!rule?.id) return;
    await db.mocks.update(Number(rule.id), {
      status: 'synced',
      syncedAt: now(),
      error: undefined,
      ...(remoteId ? { remoteId } : {}),
    });
  },
 
  async markError(uuid: string, message: string): Promise<void> {
    const rule = await db.mocks.where('uuid').equals(uuid).first();
    if (!rule?.id) return;
    await db.mocks.update(Number(rule.id), { status: 'error', error: message });
  },
};

// ─── Batch Operations ────────────────────────────────────────────────────────
 
/**
 * Execute a batch of rule operations in a single Dexie transaction.
 * All-or-nothing: if any op throws, the entire batch rolls back.
 */
export async function batchRules(
  ops: BatchOperation<MockRecord | NewMockRecord | { uuid: string }>[]
): Promise<BatchResult> {
  const result: BatchResult = { succeeded: 0, failed: 0, errors: [] };
 
  await db.transaction("rw", db.mocks, async () => {
    for (let i = 0; i < ops.length; i++) {
      const { op, data } = ops[i];
      try {
        if (op === "create") {
          const input = data as NewMockRecord;
          await db.mocks.add({
            ...input,
            uuid: uuid(),
            status: "pending_create",
            createdAt: now(),
            updatedAt: now(),
          });
        } else if (op === "update") {
          const { uuid: u, ...patch } = data as MockRecord;
          await mockRepository.update(u, patch);
        } else if (op === "delete") {
          await mockRepository.delete((data as { uuid: string }).uuid);
        }
        result.succeeded++;
      } catch (err) {
        result.failed++;
        result.errors.push({
          index: i,
          error: err instanceof Error ? err.message : String(err),
        });
        // Re-throw to trigger Dexie transaction rollback
        throw err;
      }
    }
  }).catch(() => {
    // Transaction rolled back; errors already recorded above
  });
 
  return result;
}
 
/**
 * Collect all pending records and push them to the remote API.
 * Returns counts of what was processed.
 */
export async function flushPendingToRemote(
  syncFn: (rules: MockRecord[],) => Promise<{rules: Array<{ uuid: string; remoteId?: string; error?: string }>;}>
): Promise<{ rules: BatchResult }> {
  const pendingStatuses: Status[] = [
    "pending_create",
    "pending_update",
    "pending_delete",
    "error",
  ];
 
  const [pendingMocks] = await Promise.all([
    db.mocks.where("status").anyOf(pendingStatuses).toArray()
  ]);
 
  if (!pendingMocks.length) {
    return { rules: { succeeded: 0, failed: 0, errors: [] }, };
  }
 
  const remoteResults = await syncFn(pendingMocks);
 
  const rulesResult: BatchResult = { succeeded: 0, failed: 0, errors: [] };
  const profilesResult: BatchResult = { succeeded: 0, failed: 0, errors: [] };
 
  await db.transaction("rw", db.mocks, async () => {
    for (const r of remoteResults.rules) {
      if (r.error) {
        await mockRepository.markError(r.uuid, r.error);
        rulesResult.failed++;
        rulesResult.errors.push({ index: rulesResult.failed, error: r.error });
      } else {
        const rule = pendingMocks.find((x) => x.uuid === r.uuid);
        if (rule?.status === "pending_delete") {
          await mockRepository.hardDelete(r.uuid);
        } else {
          await mockRepository.markSynced(r.uuid, r.remoteId);
        }
        rulesResult.succeeded++;
      }
    }
  });
 
  // Update syncMeta timestamp
  await db.syncMeta.put({
    key: "last_flush",
    lastSyncAt: now(),
    pendingCount: profilesResult.failed + rulesResult.failed,
  });
 
  return { rules: rulesResult };
}

// export type IDBMessageType =
//     | 'DB_UPSERT'
//     | 'DB_BULK_UPSERT'
//     | 'DB_SOFT_DELETE'
//     | 'DB_BULK_SOFT_DELETE'
//     | 'DB_QUERY_BY_STATUS'
//     | 'DB_UPDATE_STATUS'
//     | 'DB_BULK_UPDATE_STATUS'
//     | 'DB_PURGE_DELETED';
// export type IDBMessage<P = unknown> = {
//     type: IDBMessageType;
//     table: string;
//     payload: P;
// }
// export type IDBResponse<R = unknown> = {
//     ok: boolean;
//     data?: R;
//     error?: string;
// }

// const ENTITY_META = Symbol('dexie:entity');
// const INDEXED_FIELDS = Symbol('dexie:indexed');

// export type EntityOptions = {
//     storeName?: string;
// }
// export type IndexedFieldMeta = {
//     propertyKey: string;
//     unique: boolean;
//     multiEntry: boolean;
// }

// export function Entity(options: EntityOptions = {}) {
//     return function <T extends { new (...args: unknown[]): object }>(ctor: T) {
//         Reflect.defineMetadata(ENTITY_META, options, ctor);
//         return ctor;
//     }
// }

// export function Indexed(options: { unique?: boolean; multiEntry?: boolean } = {}) {
//     return function (target: object, propertyKey: string) {
//         const existing: IndexedFieldMeta[] = Reflect.getMetadata(INDEXED_FIELDS, target.constructor) ?? [];
//         existing.push ({
//             propertyKey,
//             unique: options.unique ?? false,
//             multiEntry: options.multiEntry ?? false,
//         });
//         Reflect.defineMetadata(INDEXED_FIELDS, existing, target.constructor);
//     };
// }

// function buildStoredString(ctor: Function): string {
//     const fields: IndexedFieldMeta[] = Reflect.getMetadata(INDEXED_FIELDS, ctor) ?? [];
//     const BASE_INDEXES = ['status', '[status+updatedAt]', 'remodeId', 'retryCount'];
//     const extra = fields.map(f => {
//         const prefix = f.unique ? '&' : f.multiEntry ? '*' : '';
//         return `${prefix}${f.propertyKey}`;
//     });
//     const all = Array.from(new Set([...BASE_INDEXES, ...extra]));
//     return `++id, ${all.join(', ')}`;
// }

// export type PageVisit = IDBBaseRecord & {
//     id?: number;
//     url: string;
//     title: string;
//     visitedAt: ISODateString;
//     durationMs: number;
//     tags: string[];
// };
// export type Annotation = IDBBaseRecord & {
//     id?: number;
//     pageVisitedId: number;
//     selectedtext: string;
//     note: string;
//     color: string;
//     anchorSelector: string;
// }
// export type SyncLog = IDBBaseRecord & {
//     id?: number;
//     targetTable: string;
//     targetId: number;
//     operation: 'create' | 'update' | 'delete';
//     httpStatus: number | null;
//     syncedAt: ISODateString;
// }

// @Entity({ storeName: 'pageVisits' })
// class PageVisitEntity {
//     @Indexed({ unique: false }) url!: string;
//     @Indexed() visitedAt!: string;
//     @Indexed({ multiEntry: true }) tags!: string[];
// }

// @Entity({ storeName: 'annotations' })
// class AnnotationEntity {
//     @Indexed() pageVisitId!: number;
//     @Indexed() color!: string;
// }

// @Entity({ storeName: 'syncLogs' })
// class SyncLogEntity {
//     @Indexed() targetTable!: string;
//     @Indexed() targetId!: number;
//     @Indexed() operation!: string;
//     @Indexed() syncedAt!: string;
// }

// export const STORE_SCHEMAS = {
//     pageVisits: buildStoredString(PageVisitEntity),
//     annotations: buildStoredString(AnnotationEntity),
//     syncLogs: buildStoredString(SyncLogEntity)
// } as const;

// export class AppDatabase extends Dexie {
//     pageVisits!: EntityTable<PageVisit, 'id'>;
//     annotations!: EntityTable<Annotation, 'id'>;
//     syncLogs!: EntityTable<SyncLog, 'id'>;

//     constructor() {
//         super('OkapiDB');

//         this.version(1).stores(STORE_SCHEMAS);

//         this.pageVisits.hook('creating', (_pk, obj) => stampNew(obj));
//         this.annotations.hook('creating', (_pk, obj) => stampNew(obj));
//         this.syncLogs.hook('creating', (_pk, obj) => stampNew(obj));

//         this.pageVisits.hook('updating', (mods) => stampUpdate(mods));
//         this.annotations.hook('updating', (mods) => stampUpdate(mods));
//         this.syncLogs.hook('updating', (mods) => stampUpdate(mods));
//     }
// }

// function stampNew(obj: Partial<IDBBaseRecord>): void {
//     const now = new Date().toISOString();
//     obj._idb_status ??= IdbStatus.PENDING_CREATE;
//     obj._idb_createdAt ??= now;
//     obj._idb_updatedAt ??= now;
//     obj.remoteId ??= null;
//     obj.retryCount ??= 0;
//     obj.lastError ??=null;
// }

// function stampUpdate(mods: Partial<IDBBaseRecord>): void {
//     mods._idb_updatedAt = new Date().toISOString();
// }

// let _db: AppDatabase | undefined;
// export function getDb(): AppDatabase {
//     if (!_db) _db = new AppDatabase();
//     return _db;
// }