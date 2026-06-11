import { db, flushPendingToRemote, MockRecord } from "./db";
import { bus } from "./bus";

export type RemoteSyncFn = (record: MockRecord[],) => Promise<{rules: Array<{ uuid: string; remoteId?: string; error?: string }>;}>;
type SyncManagerOptions {
  /** Called when online and pending records exist */
  syncFn: RemoteSyncFn;
  /** Auto-flush interval when online (ms). Default: 30_000 */
  intervalMs?: number;
}

/**
 * SyncManager handles online/offline transitions and periodic flushing.
 * Instantiate once in the background service worker.
 *
 * const manager = new SyncManager({ syncFn: myApiSync });
 * manager.start();
 */
export class SyncManager {
  private syncFn: RemoteSyncFn;
  private intervalMs: number;
  private timer: ReturnType<typeof setInterval> | null = null;
  private flushing = false;

  constructor({ syncFn, intervalMs = 30_000 }: SyncManagerOptions) {
    this.syncFn = syncFn;
    this.intervalMs = intervalMs;
  }

  start(): void {
    self.addEventListener("online", this.onOnline);
    self.addEventListener("offline", this.onOffline);

    if (navigator.onLine) this.scheduleFlush();
  }

  stop(): void {
    self.removeEventListener("online", this.onOnline);
    self.removeEventListener("offline", this.onOffline);
    this.clearTimer();
  }

  async flush(): Promise<void> {
    if (this.flushing || !navigator.onLine) return;
    this.flushing = true;
    bus.emit("sync:started", {});

    try {
      const result = await flushPendingToRemote(this.syncFn);
      bus.emit("sync:completed", result);
    } catch (err) {
      bus.emit("sync:error", {
        error: err instanceof Error ? err.message : String(err),
      });
    } finally {
      this.flushing = false;
    }
  }

  private onOnline = (): void => {
    this.scheduleFlush();
    this.flush();
  };

  private onOffline = (): void => {
    this.clearTimer();
  };

  private scheduleFlush(): void {
    this.clearTimer();
    this.timer = setInterval(() => this.flush(), this.intervalMs);
  }

  private clearTimer(): void {
    if (this.timer !== null) {
      clearInterval(this.timer);
      this.timer = null;
    }
  }
}

// ─── Pending count observable ─────────────────────────────────────────────────

/** Subscribe to live pending count (useful for badge updates) */
export function observePendingCount(onChange: (count: number) => void): () => void {
  let active = true;

  async function check() {
    if (!active) return;
    const count = await db.mocks
      .where("status")
      .anyOf(["pending_create", "pending_update", "pending_delete", "error"])
      .count();
    if (active) onChange(count);
  }

  // Check on relevant bus events
  const events = [
    "rule:created",
    "rule:updated",
    "rule:deleted",
    "sync:completed",
  ] as const;

  events.forEach((e) => bus.on(e, check));
  check(); // initial

  return () => {
    active = false;
    events.forEach((e) => bus.off(e, check));
  };
}