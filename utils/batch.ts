// import Dexie, { Table } from "dexie";
// import { Annotation, getDb, IDBBaseRecord, IDBBatchResult, IDBBulkStatusUpdate, IdbStatus, PageVisit, SyncLog } from "./db";

// export function upsertOne<T extends IDBBaseRecord>(
//     table: Table<T, number>,
//     item: Omit<T, 'id' |'_idb_createdAt' | '_idb_updatedAt'> & Partial<Pick<T, 'id'>>
// ): Promise<number> {
//     const now = new Date().toISOString();
//     const isNew = item.id == null;

//     const record = {
//         ...item,
//         _idb_status: item._idb_status ?? (isNew ? IdbStatus.PENDING_CREATE : IdbStatus.PENDING_UPDATE),
//         _idb_createdAt: isNew ? now : (item as T)._idb_createdAt ?? now,
//         _idb_updatedAt: now,
//         remoteId: item.remoteId ?? null,
//         retryCount: item.retryCount ?? 0,
//         lastError: item.lastError ?? null,
//     } as T;

//     return table.put(record);
// }

// export async function bulkUpsert<T extends IDBBaseRecord>(
//     table: Table<T, number>,
//     items: Array<Omit<T, '_idb_createdAt' | '_idb_updatedAt'> & Partial<Pick<T, 'id'>>>
// ): Promise<IDBBatchResult<T>> {
//     const succeeded: T[] = [];
//     const failed: {item: T, error: unknown}[] = [];
//     const now = new Date().toISOString();

//     const prepared = items.map(item => {
//         const isNew = item.id == null;
//         return {
//             ...item,
//             _idb_status: item._idb_status ?? (isNew ? IdbStatus.PENDING_CREATE : IdbStatus.PENDING_UPDATE),
//             _idb_createdAt: isNew ? now : (item as T)._idb_createdAt ?? now,
//             _idb_updatedAt: now,
//             remoteId: item.remoteId ?? null,
//             retryCount: item.retryCount ?? 0,
//             lastError: item.lastError ?? null,
//         } as T;
//     });

//     try {
//         await table.bulkPut(prepared);
//         succeeded.push(...prepared);
//     } catch (error: unknown) {
//         if (error instanceof Dexie.BulkError) {
//             prepared.forEach((item, idx) => {
//                 if (error.failures[idx]) {
//                     failed.push({ item, error: error.failures[idx] });
//                 } else {
//                     succeeded.push(item);
//                 }
//             });
//         } else {
//             prepared.forEach(item => failed.push({ item, error: error }));
//         }
//     }

//     return { succeeded, failed };
// }

// export async function softDelete<T extends IDBBaseRecord>(
//     table: Table<T, number>,
//     id: number,
// ): Promise<void> {
//     // @ts-ignore
//     await table.update(id, {
//         _idb_status: IdbStatus.PENDING_DELETE,
//         _idb_updatedAt: new Date().toISOString()
//     } as Partial<T>);
// }

// export async function bulkSoftDelete<T extends IDBBaseRecord>(
//     table: Table<T, number>,
//     ids: number[],
// ): Promise<IDBBatchResult<number>> {
//     const succeeded: number[] = [];
//     const failed: {item: number, error: unknown}[] = [];
//     const now = new Date().toISOString();

//     await getDb().transaction('rw', table, async () => {
//         await Promise.all(
//             ids.map(async (id) => {
//                 try {
//                     // @ts-ignore
//                     await table.update(id, {
//                         _idb_status: IdbStatus.PENDING_DELETE,
//                         _idb_updatedAt: now,
//                     } as Partial<T>);
//                     succeeded.push(id);
//                 } catch (error: unknown) {
//                     failed.push({ item: id, error: error });
//                 }
//             })
//         );
//     });
//     return { succeeded, failed };
// }

// export async function queryByStatus<T extends IDBBaseRecord>(
//     table: Table<T, number>,
//     status: IdbStatus,
//     limit = 100
// ): Promise<T[]> {
//     return table.where('status').equals(status).limit(limit).toArray();
// }

// export async function bulkUpdateStatus<T extends IDBBaseRecord>(
//     table: Table<T, number>,
//     update: IDBBulkStatusUpdate
// ): Promise<IDBBatchResult<number>> {
//     const succeeded: number[] = [];
//     const failed: { item: number; error: unknown }[] = [];
//     const now = new Date().toISOString();

//     const patch: Partial<IDBBaseRecord> = {
//         _idb_status: update.status,
//         _idb_updatedAt: now,
//         ...(update.patch ?? {}),
//     };
    
//     await getDb().transaction('rw', table, async () => {
//         await Promise.all(
//             update.ids.map(async (id) => {
//                 try {
//                     // @ts-ignore
//                     await table.update(id, patch as Partial<T>);
//                     succeeded.push(id);
//                 } catch (error: unknown) {
//                     failed.push({ item: id, error: error });
//                 }
//             })
//         );
//     });
//     return { succeeded, failed };
// }

// export async function purgeSoftDeleted<T extends IDBBaseRecord>(
//     table: Table<T, number>
// ): Promise<number> {
//     return table.where('status').equals(IdbStatus.PENDING_DELETE).delete();
// }

// export async function requeueErrors<T extends IDBBaseRecord>(
//     table: Table<T, number>,
//     maxRetries: 5,
// ): Promise<number> {
//     let count = 0;
//     await table
//         .where('status')
//         .equals(IdbStatus.ERROR)
//         .modify((record) => {
//             if ((record.retryCount ?? 0) < maxRetries) {
//                 record._idb_status = IdbStatus.PENDING_UPDATE;
//                 record._idb_updatedAt = new Date().toISOString();
//                 count++;
//             }
//         });

//     return count;
// }

// export async function releaseStuckLocks<T extends IDBBaseRecord>(
//     table: Table<T, number>,
//     olderThanMs = 300_000
// ): Promise<number> {
//     const cutoff = new Date(Date.now() - olderThanMs).toISOString();
//     let count = 0;

//     await table
//         .where('status')
//         .equals(IdbStatus.LOCKED)
//         .and((record) => record._idb_updatedAt < cutoff)
//         .modify((record) => {
//             record._idb_status = IdbStatus.PENDING_UPDATE;
//             record._idb_updatedAt = new Date().toISOString();
//             count++;
//         })

//     return count;
// }

// export const pagevisitBatch = {
//     upsert: (item: Omit<PageVisit, 'id' | '_idb_createdAt' | '_idb_updatedAt'> & Partial<Pick<PageVisit, 'id'>>) => upsertOne(getDb().pageVisits, item),
//     bulkUpsert: (items: Parameters<typeof bulkUpsert<PageVisit>>[1]) => bulkUpsert(getDb().pageVisits, items),
//     softDelete: (id: number) => softDelete(getDb().pageVisits, id),
//     bulkSoftDelete: (ids: number[]) => bulkSoftDelete(getDb().pageVisits, ids),
//     queryByStatus: (status: IdbStatus, limit?: number) => queryByStatus(getDb().pageVisits, status, limit),
//     bulkUpdateStatus: (update: IDBBulkStatusUpdate) => bulkUpdateStatus(getDb().pageVisits, update),
//     purgeSoftDeleted: () => purgeSoftDeleted(getDb().pageVisits),
//     requeueErrors: (maxRetries?: number) => requeueErrors(getDb().pageVisits, maxRetries),
//     releaseStuckLocks: (olderThanMs?: number) => releaseStuckLocks(getDb().pageVisits, olderThanMs),
//     getByUrl: (url: string) => getDb().pageVisits.where('url').equals(url).sortBy('visitedAt'),
// }

// export const annotationBatch = {
//     upsert: (item: Omit<Annotation, 'id' | '_idb_createdAt' | '_idb_updatedAt'> & Partial<Pick<Annotation, 'id'>>) => upsertOne(getDb().annotations, item),
//     bulkUpsert: (items: Parameters<typeof bulkUpsert<Annotation>>[1]) => bulkUpsert(getDb().annotations, items),
//     softDelete: (id: number) => softDelete(getDb().annotations, id),
//     bulkSoftDelete: (ids: number[]) => bulkSoftDelete(getDb().annotations, ids),
//     queryByStatus: (status: IdbStatus, limit?: number) => queryByStatus(getDb().annotations, status, limit),
//     bulkUpdateStatus: (update: IDBBulkStatusUpdate) => bulkUpdateStatus(getDb().annotations, update),
//     purgeSoftDeleted: () => purgeSoftDeleted(getDb().annotations),
//     requeueErrors: (maxRetries?: number) => requeueErrors(getDb().annotations, maxRetries),
//     releaseStuckLocks: (olderThanMs?: number) => releaseStuckLocks(getDb().annotations, olderThanMs),
//     getByUrl: (url: string) => getDb().annotations.where('url').equals(url).sortBy('visitedAt'),
// }

// export const syncLogBatch = {
//     upsert: (item: Omit<SyncLog, 'id' | '_idb_createdAt' | '_idb_updatedAt'> & Partial<Pick<SyncLog, 'id'>>) => upsertOne(getDb().syncLogs, item),
//     bulkUpsert: (items: Parameters<typeof bulkUpsert<SyncLog>>[1]) => bulkUpsert(getDb().syncLogs, items),
//     queryByStatus: (status: IdbStatus, limit?: number) => queryByStatus(getDb().syncLogs, status, limit),
//     getForRecord: (targetTable: string, targetId: number) => getDb().syncLogs.where('[targetTable+targetId]').equals([targetTable, targetId]).sortBy('syncedAt')
// }