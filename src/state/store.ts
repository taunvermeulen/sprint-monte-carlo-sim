/** Who made a change, so the originating view can skip re-rendering itself. */
export interface ChangeMeta {
  source?: string;
  /** Rows added/removed/replaced — every view should refresh. */
  structural?: boolean;
}

export type Listener<T> = (state: T, meta: ChangeMeta) => void;

export interface Store<T> {
  get(): T;
  set(next: T, meta?: ChangeMeta): void;
  update(change: (current: T) => T, meta?: ChangeMeta): void;
  subscribe(listener: Listener<T>): () => void;
}

/** Minimal observable value. State is treated as immutable: always `set` a new object. */
export function createStore<T>(initial: T): Store<T> {
  let state = initial;
  const listeners = new Set<Listener<T>>();
  const store: Store<T> = {
    get: () => state,
    set(next, meta = {}) {
      state = next;
      listeners.forEach((listener) => listener(state, meta));
    },
    update(change, meta) {
      store.set(change(state), meta);
    },
    subscribe(listener) {
      listeners.add(listener);
      return () => listeners.delete(listener);
    },
  };
  return store;
}
