import { beforeEach, describe, expect, it } from 'vitest';
import { MockDb } from './db';

interface Item {
  id: number;
  label: string;
}

describe('MockDb (browser persistence of the mock API)', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it('returns the seed when nothing is stored', () => {
    const db = new MockDb();
    const items = db.collection<Item>('items', [{ id: 1, label: 'a' }]);
    expect(items).toEqual([{ id: 1, label: 'a' }]);
    expect(db.restored).toBe(false);
  });

  it('returns the same live array for repeated registrations', () => {
    const db = new MockDb();
    const first = db.collection<Item>('items', [{ id: 1, label: 'a' }]);
    const second = db.collection<Item>('items', []);
    expect(second).toBe(first);
  });

  it('persists mutations and restores them in a new session', () => {
    const db = new MockDb();
    const items = db.collection<Item>('items', [{ id: 1, label: 'a' }]);
    items.push({ id: 2, label: 'b' });
    db.persistNow();

    const next = new MockDb();
    expect(next.restored).toBe(true);
    expect(next.collection<Item>('items', [])).toEqual([
      { id: 1, label: 'a' },
      { id: 2, label: 'b' },
    ]);
    expect(next.savedAt).toBeTruthy();
  });

  it('discards snapshots written with another schema version', () => {
    localStorage.setItem(
      MockDb.storageKey,
      JSON.stringify({ v: -1, savedAt: '2026-01-01', collections: { items: [{ id: 9 }] } })
    );
    const db = new MockDb();
    expect(db.restored).toBe(false);
    expect(db.collection<Item>('items', [{ id: 1, label: 'seed' }])).toEqual([
      { id: 1, label: 'seed' },
    ]);
    expect(localStorage.getItem(MockDb.storageKey)).toBeNull();
  });

  it('computes the next id from the current items', () => {
    const db = new MockDb();
    expect(db.nextId([{ id: 3 }, { id: 10 }, { id: '7' }])).toBe(11);
    expect(db.nextId([], 100)).toBe(100);
  });

  it('replaces a collection in place', () => {
    const db = new MockDb();
    const items = db.collection<Item>('items', [{ id: 1, label: 'a' }, { id: 2, label: 'b' }]);
    db.replace(items, items.filter((i) => i.id !== 1));
    expect(items).toEqual([{ id: 2, label: 'b' }]);
  });

  it('clear() removes the snapshot', () => {
    const db = new MockDb();
    db.collection<Item>('items', [{ id: 1, label: 'a' }]);
    db.persistNow();
    expect(localStorage.getItem(MockDb.storageKey)).not.toBeNull();
    db.clear();
    expect(localStorage.getItem(MockDb.storageKey)).toBeNull();
  });
});
