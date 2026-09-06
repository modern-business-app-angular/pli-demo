/**
 * Tiny in-browser "database" for the mock API.
 *
 * Every mutable seed collection is registered here. Collections are restored from a
 * localStorage snapshot on startup (so a visitor's changes survive a page refresh) and
 * re-saved after each successful mutating request by the mock network layer.
 *
 * Binary stores (DOCX bytes) are deliberately kept in memory only.
 */
const STORAGE_KEY = 'pli_demo_db';
/** Bump when seed shapes change so stale snapshots are discarded. */
const SCHEMA_VERSION = 2;
const PERSIST_DEBOUNCE_MS = 150;

interface Snapshot {
  v: number;
  savedAt: string;
  collections: Record<string, unknown[]>;
}

interface WithId { id?: number | string }

function readStorage(): Storage | null {
  try {
    return typeof localStorage === 'undefined' ? null : localStorage;
  } catch {
    return null;
  }
}

function loadSnapshot(): Snapshot | null {
  const storage = readStorage();
  if (!storage) return null;
  try {
    const raw = storage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as Snapshot;
    if (parsed?.v !== SCHEMA_VERSION || typeof parsed.collections !== 'object') {
      storage.removeItem(STORAGE_KEY);
      return null;
    }
    return parsed;
  } catch {
    return null;
  }
}

export class MockDb {
  private readonly collections = new Map<string, unknown[]>();
  private snapshot: Snapshot | null = loadSnapshot();
  private persistTimer: ReturnType<typeof setTimeout> | undefined;

  /** True when the current session was restored from a previous visit. */
  readonly restored = this.snapshot !== null;

  /**
   * Register a named collection. The returned array is the live store: mutate it in place
   * (push / splice / index assignment) — never reassign it — so persistence keeps working.
   */
  collection<T>(name: string, seed: T[]): T[] {
    const existing = this.collections.get(name);
    if (existing) return existing as T[];
    const stored = this.snapshot?.collections[name];
    const live = Array.isArray(stored) ? (stored as T[]) : seed;
    this.collections.set(name, live);
    return live;
  }

  /** Next numeric id for a collection (safe after a restore). */
  nextId(items: readonly WithId[], floor = 1): number {
    let max = floor - 1;
    for (const item of items) {
      const n = typeof item.id === 'number' ? item.id : Number(item.id);
      if (Number.isFinite(n) && n > max) max = n;
    }
    return max + 1;
  }

  /** Replace the contents of a live collection in place. */
  replace<T>(target: T[], next: readonly T[]): void {
    target.splice(0, target.length, ...next);
  }

  /** Debounced snapshot to localStorage. */
  persist(): void {
    if (this.persistTimer) clearTimeout(this.persistTimer);
    this.persistTimer = setTimeout(() => this.persistNow(), PERSIST_DEBOUNCE_MS);
  }

  persistNow(): void {
    const storage = readStorage();
    if (!storage) return;
    const collections: Record<string, unknown[]> = {};
    for (const [name, items] of this.collections) collections[name] = items;
    const snapshot: Snapshot = { v: SCHEMA_VERSION, savedAt: new Date().toISOString(), collections };
    try {
      storage.setItem(STORAGE_KEY, JSON.stringify(snapshot));
    } catch {
      // Quota exceeded or storage disabled — the demo keeps working in memory.
    }
  }

  /** Drop the snapshot; the caller decides whether to reload the page. */
  clear(): void {
    if (this.persistTimer) clearTimeout(this.persistTimer);
    this.persistTimer = undefined;
    this.snapshot = null;
    readStorage()?.removeItem(STORAGE_KEY);
  }

  /** Snapshot age, for the "À propos" panel. */
  get savedAt(): string | null {
    return this.snapshot?.savedAt ?? null;
  }

  static readonly storageKey = STORAGE_KEY;
}

export const db = new MockDb();
