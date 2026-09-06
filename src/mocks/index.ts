/**
 * Lazy barrel for the in-browser API: MSW core + every request handler + seed data.
 * Loaded by MockHttpBackend on the first HTTP call so nothing of it lands in the
 * initial bundle.
 */
export { handlers } from './handlers';
export { getResponse } from 'msw';
import { db } from './db';

/** Called by the mock network layer after each successful mutating request. */
export function persist(): void {
  db.persist();
}
