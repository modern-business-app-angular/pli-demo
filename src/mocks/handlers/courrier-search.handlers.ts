import { http, HttpResponse, delay } from 'msw';
import { MOCK_COURRIERS, MOCK_NATURES } from './courriers.handlers';
import type { CourrierEntrant } from '../../app/features/courriers/models/courrier.model';
import type { PagedResult } from '../../app/core/models/api-response.model';

import { MOCK_ORIGIN as BASE } from '../mock-origin';

export const courrierSearchHandlers = [

  // POST /api/courriers/search
  http.post(`${BASE}/api/courriers/search`, async ({ request }) => {
    await delay(350);

    const body = await request.json() as Record<string, unknown>;

    const page      = (body['page']      as number) ?? 1;
    const pageSize  = (body['pageSize']  as number) ?? 20;
    const sortBy    = (body['sortBy']    as string) ?? 'dateArrivee';
    const sortOrder = (body['sortOrder'] as string) ?? 'desc';

    const el = (body['elements']  as Record<string, unknown>) ?? {};
    const ct = (body['contact']   as Record<string, unknown>) ?? {};
    const wf = (body['workflow']  as Record<string, unknown>) ?? {};

    let items: CourrierEntrant[] = [...MOCK_COURRIERS];

    // ── Elements filters ────────────────────────────────────────────────────

    if (el['objet']) {
      const q = String(el['objet']).toLowerCase();
      items = items.filter(c => c.objet.toLowerCase().includes(q));
    }

    if (el['chrono']) {
      const q = String(el['chrono']).toLowerCase();
      items = items.filter(c => c.numeroChrono.toLowerCase().includes(q));
    }

    if (el['reference']) {
      const q = String(el['reference']).toLowerCase();
      items = items.filter(c => (c.reference ?? '').toLowerCase().includes(q));
    }

    if (Array.isArray(el['natureIds']) && el['natureIds'].length > 0) {
      const ids = el['natureIds'] as number[];
      const labels = ids.map(id => MOCK_NATURES.find(n => n.id === id)?.libelle ?? '');
      items = items.filter(c => labels.includes(c.natureLibelle ?? ''));
    }

    if (Array.isArray(el['chronoTypeIds']) && el['chronoTypeIds'].length > 0) {
      const ids = el['chronoTypeIds'] as number[];
      items = items.filter(c => ids.includes(c.chronoTypeId));
    }

    if (el['dateArriveeFrom']) {
      items = items.filter(c => c.dateArrivee >= String(el['dateArriveeFrom']));
    }
    if (el['dateArriveeTo']) {
      items = items.filter(c => c.dateArrivee <= String(el['dateArriveeTo']));
    }
    if (el['dateLimiteFrom']) {
      items = items.filter(c => c.dateLimite && c.dateLimite >= String(el['dateLimiteFrom']));
    }
    if (el['dateLimiteTo']) {
      items = items.filter(c => c.dateLimite && c.dateLimite <= String(el['dateLimiteTo']));
    }

    // ── Contact filters ─────────────────────────────────────────────────────

    if (ct['tripletNom']) {
      const q = String(ct['tripletNom']).toLowerCase();
      items = items.filter(c => {
        const exp = c.expediteur;
        if (!exp) return false;
        const fullName = `${exp.prenom ?? ''} ${exp.nom ?? ''}`.toLowerCase();
        return fullName.includes(q);
      });
    }

    if (ct['organisme']) {
      const q = String(ct['organisme']).toLowerCase();
      items = items.filter(c => (c.expediteur?.organisme ?? '').toLowerCase().includes(q));
    }

    if (ct['ville']) {
      const q = String(ct['ville']).toLowerCase();
      items = items.filter(c => (c.expediteur?.ville ?? '').toLowerCase().includes(q));
    }

    // ── Workflow filters ────────────────────────────────────────────────────

    if (Array.isArray(wf['etats']) && wf['etats'].length > 0) {
      const etats = wf['etats'] as string[];
      items = items.filter(c => etats.includes(c.statut));
    }

    if (wf['destinataireId']) {
      const id = wf['destinataireId'] as number;
      items = items.filter(c => c.ficheSuiveuse?.destinataireId === id);
    }

    if (wf['actionId']) {
      const id = wf['actionId'] as number;
      items = items.filter(c => c.ficheSuiveuse?.actionId === id);
    }

    if (wf['original']) {
      items = items.filter(c => c.ficheSuiveuse?.type === 'ORI');
    }

    // ── Sort ────────────────────────────────────────────────────────────────

    items.sort((a, b) => {
      let va: string | number = '';
      let vb: string | number = '';

      if (sortBy === 'dateArrivee')   { va = a.dateArrivee;    vb = b.dateArrivee; }
      else if (sortBy === 'numeroChrono') { va = a.numeroChrono; vb = b.numeroChrono; }
      else if (sortBy === 'objet')    { va = a.objet;          vb = b.objet; }

      if (va < vb) return sortOrder === 'asc' ? -1 : 1;
      if (va > vb) return sortOrder === 'asc' ?  1 : -1;
      return 0;
    });

    // ── Paginate ────────────────────────────────────────────────────────────

    const total = items.length;
    const paged = items.slice((page - 1) * pageSize, page * pageSize);

    const result: PagedResult<CourrierEntrant> = {
      items: paged,
      total,
      page,
      pageSize,
      totalPages: Math.ceil(total / pageSize),
    };

    return new HttpResponse(JSON.stringify(result), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  }),
];
