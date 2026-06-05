import { Method } from '@/lib/interceptor/types';
import Dexie, { EntityTable, type Table } from 'dexie';

export enum IdbStatus {
    CONFLICT = 'deleted',
    ERROR = 'error',
    LOCKED = 'locked',
    PENDING_CREATE = 'pending_create',
    PENDING_DELETE = 'pending_delete',
    PENDING_UPDATE = 'pending_update',
    SYNCED = 'synced',
}
export type IDBStatus = IdbStatus;
export type ISODateString = string;
export type IDBBaseRecord = {
    createdAt: ISODateString;
    deletedAt?: string;
    errorMessage?: string;
    id: string;
    lockExpiresAt?: string;
    lockToken?: string;
    remoteId?: string;
    retryCount: number;
    status: IDBStatus;
    syncedAt?: string;
    updatedAt: ISODateString;
}
export type IDBMockRecord = IDBBaseRecord & {
    url: string;
    method: Method;
    requestHeaders: Record<string, string>;
    requestBody: string | null;
    responseHeaders: Record<string, string>;
    responseBody: string | null;
    statusCode: number | null;
    tags?: string[];
    alias?: string;
    description?: string;
    isActive: boolean;
    delayMs?: number;
}
export type IDBSynceMeta = {
    id?: number;
    tableName: string;
    lastSyncAt?: string;
    lastCursor?: string;
    totlaPending: number;
}
export type IDBBatchResult<T> = {
    succeeded: T[];
    failed: Array<{ item: unknown; error: unknown }>;
}
export type IDBNewRecord<T extends IDBBaseRecord> = Omit<Table, 'id' | 'status' | 'createdAt' | 'updatedAt' | 'retryCount'> & Partial<Pick<T, 'status'>>;
export type IDBUpdatePayload<T extends BaseRecord> = Partial<Omit<T, "id" | "createdAt">>;

export class AppDatabase extends Dexie {
    mocks!: Table<IDBMockRecord, number>;
    syncMeta!: Table<IDBSynceMeta, number>;

    constructor() {
        super('okapi-mock-store');
        this._defineSchema();
        this._applyHooks();
    }

    private _defineSchema() {
        this.version(1).stores({
            mocks: '++id, &remoteId, status, createdAt, updatedAt, syncedAt, deletedAt, endpointId, isActive, [status+updatedAt]',
            syncMeta: '++id, &tableName',
        })
    }

    private _applyHooks() {
        this.mocks.hook('creating', (_primaryKey, obj) => {
            const now = new Date().toISOString();
            obj.createdAt ??= now;
            obj.updatedAt = now;
            obj.retryCount ??= 0;
            obj.status ??= IdbStatus.PENDING_CREATE;
            obj.isActive ??= false;
        });

        this.mocks.hook('updating', (modifications: Partial<{ updatedAt: string }>) => {
            modifications.updatedAt = new Date().toISOString();
        });
    }
}

export const db = new AppDatabase();
export const { mocks, syncMeta } = db;



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