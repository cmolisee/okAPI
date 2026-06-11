export type BroadcastEventType =
  | 'rule:created'
  | 'rule:updated'
  | 'rule:deleted'
  | 'profile:created'
  | 'profile:updated'
  | 'profile:deleted'
  | 'sync:started'
  | 'sync:completed'
  | 'sync:error';
export type BroadcastEvent<T = unknown> = {
  type: BroadcastEventType;
  payload: T;
  sourceTabId?: number;
  timestamp: number;
}
type Handler<T = unknown> = (payload: T) => void;

const CHANNEL_NAME = "okapi:db";

class OkapiBus {
  private channel: BroadcastChannel;
  private listeners = new Map<string, Set<Handler>>();

  constructor() {
    this.channel = new BroadcastChannel(CHANNEL_NAME);
    this.channel.onmessage = (e: MessageEvent<BroadcastEvent>) => {
      this.dispatch(e.data);
    };
  }

  emit<T>(type: BroadcastEventType, payload: T): void {
    const event: BroadcastEvent<T> = { type, payload, timestamp: Date.now() };
    // Broadcast to other tabs
    this.channel.postMessage(event);
    // Also dispatch locally so the emitting tab reacts
    this.dispatch(event);
  }

  on<T = unknown>(type: BroadcastEventType, handler: Handler<T>): void {
    if (!this.listeners.has(type)) this.listeners.set(type, new Set());
    this.listeners.get(type)!.add(handler as Handler);
  }

  off<T = unknown>(type: BroadcastEventType, handler: Handler<T>): void {
    this.listeners.get(type)?.delete(handler as Handler);
  }

  once<T = unknown>(
    type: BroadcastEventType,
    handler: Handler<T>
  ): void {
    const wrapper: Handler<T> = (payload) => {
      handler(payload);
      this.off(type, wrapper);
    };
    this.on(type, wrapper);
  }

  destroy(): void {
    this.channel.close();
    this.listeners.clear();
  }

  private dispatch(event: BroadcastEvent): void {
    this.listeners.get(event.type)?.forEach((h) => h(event.payload));
    // Wildcard listeners
    this.listeners.get("*")?.forEach((h) => h(event));
  }
}

export const bus = new OkapiBus();