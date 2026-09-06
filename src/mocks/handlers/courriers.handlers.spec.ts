import { describe, expect, it } from 'vitest';
import { getResponse } from 'msw';
import { courriersHandlers, MOCK_COURRIERS } from './courriers.handlers';
import { API_BASE } from '../mock-origin';

describe('courriers handlers (workflow)', () => {
  it('lists incoming mail as a paged result', async () => {
    const res = await getResponse(
      courriersHandlers,
      new Request(`${API_BASE}/courriers/entrant?page=1&pageSize=5`)
    );
    const body = await res!.json();
    expect(res!.status).toBe(200);
    expect(body.items).toHaveLength(5);
    expect(body.total).toBe(MOCK_COURRIERS.length);
    expect(body.totalPages).toBe(Math.ceil(MOCK_COURRIERS.length / 5));
  });

  it('"faire suivre" transmits the courrier (statut E → T)', async () => {
    const target = MOCK_COURRIERS.find((c) => c.statut === 'E' && c.ficheSuiveuse)!;
    const res = await getResponse(
      courriersHandlers,
      new Request(`${API_BASE}/courriers/${target.id}/faire-suivre`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ actionId: 1, destinataireIds: [2] }),
      })
    );
    expect(res!.status).toBe(204);
    const updated = MOCK_COURRIERS.find((c) => c.id === target.id)!;
    expect(updated.statut).toBe('T');
    expect(updated.ficheSuiveuse?.etat).toBe('T');
  });

  it('returns 404 for an unknown courrier', async () => {
    const res = await getResponse(
      courriersHandlers,
      new Request(`${API_BASE}/courriers/entrant/999999`)
    );
    expect(res!.status).toBe(404);
  });
});
