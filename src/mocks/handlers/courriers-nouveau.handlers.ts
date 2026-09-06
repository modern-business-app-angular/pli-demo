import { http, HttpResponse } from 'msw';
import { db } from '../db';
import { MOCK_COURRIERS } from './courriers.handlers';

import { API_BASE as BASE } from '../mock-origin';

// Minimal valid DOCX (Open XML, ZIP-based) with merge fields {{Objet}}, {{NomComplet}}, etc.
// Generated programmatically — same structure for all types; backend would serve real BLOB.
const MOCK_DOCX_BASE64 =
  'UEsDBBQAAAAAAAAAAAB5bjPXrQEAAK0BAAATAAAAW0NvbnRlbnRfVHlwZXNdLnhtbDw/eG1sIHZlcn' +
  'Npb249IjEuMCIgZW5jb2Rpbmc9IlVURi04IiBzdGFuZGFsb25lPSJ5ZXMiPz48VHlwZXMgeG1sbnM9' +
  'Imh0dHA6Ly9zY2hlbWFzLm9wZW54bWxmb3JtYXRzLm9yZy9wYWNrYWdlLzIwMDYvY29udGVudC10' +
  'eXBlcyI+PERlZmF1bHQgRXh0ZW5zaW9uPSJyZWxzIiBDb250ZW50VHlwZT0iYXBwbGljYXRpb24v' +
  'dm5kLm9wZW54bWxmb3JtYXRzLXBhY2thZ2UucmVsYXRpb25zaGlwcyt4bWwiLz48RGVmYXVsdCBF' +
  'eHRlbnNpb249InhtbCIgQ29udGVudFR5cGU9ImFwcGxpY2F0aW9uL3htbCIvPjxPdmVycmlkZSBQ' +
  'YXJ0TmFtZT0iL3dvcmQvZG9jdW1lbnQueG1sIiBDb250ZW50VHlwZT0iYXBwbGljYXRpb24vdm5k' +
  'Lm9wZW54bWxmb3JtYXRzLW9mZmljZWRvY3VtZW50LndvcmRwcm9jZXNzaW5nbWwuZG9jdW1lbnQu' +
  'bWFpbit4bWwiLz48L1R5cGVzPlBLAwQUAAAAAAAAAAAAm/036ikBAAApAQAACwAAAF9yZWxzLy5yZWxz' +
  'PD94bWwgdmVyc2lvbj0iMS4wIiBlbmNvZGluZz0iVVRGLTgiIHN0YW5kYWxvbmU9InllcyI/PjxS' +
  'ZWxhdGlvbnNoaXBzIHhtbG5zPSJodHRwOi8vc2NoZW1hcy5vcGVueG1sZm9ybWF0cy5vcmcvcGFj' +
  'a2FnZS8yMDA2L3JlbGF0aW9uc2hpcHMiPjxSZWxhdGlvbnNoaXAgSWQ9InJJZDEiIFR5cGU9Imh0' +
  'dHA6Ly9zY2hlbWFzLm9wZW54bWxmb3JtYXRzLm9yZy9vZmZpY2VEb2N1bWVudC8yMDA2L3JlbGF0' +
  'aW9uc2hpcHMvb2ZmaWNlRG9jdW1lbnQiIFRhcmdldD0id29yZC9kb2N1bWVudC54bWwiLz48L1Jl' +
  'bGF0aW9uc2hpcHM+UEsDBBQAAAAAAAAAAADp+cGTmwAAAJsAAAAcAAAAd29yZC9fcmVscy9kb2N1' +
  'bWVudC54bWwucmVsczw/eG1sIHZlcnNpb249IjEuMCIgZW5jb2Rpbmc9IlVURi04IiBzdGFuZGFs' +
  'b25lPSJ5ZXMiPz48UmVsYXRpb25zaGlwcyB4bWxucz0iaHR0cDovL3NjaGVtYXMub3BlbnhtbGZv' +
  'cm1hdHMub3JnL3BhY2thZ2UvMjAwNi9yZWxhdGlvbnNoaXBzIj48L1JlbGF0aW9uc2hpcHM+UEsD' +
  'BBQAAAAAAAAAAAD1U3EjVQMAAFUDAAARAAAAd29yZC9kb2N1bWVudC54bWw8P3htbCB2ZXJzaW9uPSIx' +
  'LjAiIGVuY29kaW5nPSJVVEYtOCIgc3RhbmRhbG9uZT0ieWVzIj8+PHc6ZG9jdW1lbnQgeG1sbnM6' +
  'dz0iaHR0cDovL3NjaGVtYXMub3BlbnhtbGZvcm1hdHMub3JnL3dvcmRwcm9jZXNzaW5nbWwvMjAw' +
  'Ni9tYWluIj48dzpib2R5Pjx3OnA+PHc6cj48dzp0Pnt7VmlsbGV9fSwgbGUge3tEYXRlRHVKb3Vy' +
  'fX08L3c6dD48L3c6cj48L3c6cD48dzpwPjx3OnI+PHc6dCB4bWw6c3BhY2U9InByZXNlcnZlIj4g' +
  'PC93OnQ+PC93OnI+PC93OnA+PHc6cD48dzpyPjx3OnQ+TWFkYW1lLCBNb25zaWV1ciB7e05vbUNv' +
  'bXBsZXR9fSw8L3c6dD48L3c6cj48L3c6cD48dzpwPjx3OnI+PHc6dCB4bWw6c3BhY2U9InByZXNl' +
  'cnZlIj4gPC93OnQ+PC93OnI+PC93OnA+PHc6cD48dzpyPjx3OnJQcj48dzpiLz48L3c6clByPjx3' +
  'OnQ+T2JqZXQgOiB7e09iamV0fX08L3c6dD48L3c6cj48L3c6cD48dzpwPjx3OnI+PHc6dD5SZWYg' +
  'OiB7e051bWVyb0Nocm9ub319IGR1IHt7RGF0ZUVucmVnaXN0cmVtZW50fX08L3c6dD48L3c6cj48' +
  'L3c6cD48dzpwPjx3OnI+PHc6dCB4bWw6c3BhY2U9InByZXNlcnZlIj4gPC93OnQ+PC93OnI+PC93' +
  'OnA+PHc6cD48dzpyPjx3OnQ+W0NvcnBzIGR1IGRvY3VtZW50IGEgY29tcGxldGVyXTwvdzp0Pjwv' +
  'dzpyPjwvdzpwPjx3OnA+PHc6cj48dzp0IHhtbDpzcGFjZT0icHJlc2VydmUiPiA8L3c6dD48L3c6' +
  'cj48L3c6cD48dzpwPjx3OnI+PHc6dD5WZXVpbGxleiBhZ3JlZXIsIE1hZGFtZSwgTW9uc2lldXIs' +
  'IGwgZXhwcmVzc2lvbiBkZSBub3Mgc2FsdXRhdGlvbnMgZGlzdGluZ3VlZXMuPC93OnQ+PC93OnI+' +
  'PC93OnA+PHc6c2VjdFByLz48L3c6Ym9keT48L3c6ZG9jdW1lbnQ+UEsBAhQAFAAAAAAAAAAAAHluM9' +
  'etAQAArQEAABMAAAAAAAAAAAAAAAAAAAAAAFtDb250ZW50X1R5cGVzXS54bWxQSwECFAAUAAAAAAAA' +
  'AAAAm/036ikBAAApAQAACwAAAAAAAAAAAAAAAADeAQAAX3JlbHMvLnJlbHNQSwECFAAUAAAAAAAAAAAA' +
  '6fnBk5sAAACbAAAAHAAAAAAAAAAAAAAAAAAwAwAAd29yZC9fcmVscy9kb2N1bWVudC54bWwucmVscw' +
  'BQSwECFAAUAAAAAAAAAAAA9VNxI1UDAABVAwAAEQAAAAAAAAAAAAAAAAUEAAB3b3JkL2RvY3VtZW50' +
  'LnhtbFBLBQYAAAAABAAEAAsBAACJBwAAAAA=';

const MOCK_SORTANT = db.collection('courriers-sortant', [
  { ...MOCK_COURRIERS[0], id: 2001, numeroChrono: 'S-2026-001', objet: 'Réponse à la demande de subvention', dateArrivee: '2026-03-10' },
  { ...MOCK_COURRIERS[1], id: 2002, numeroChrono: 'S-2026-002', objet: 'Notification de traitement', dateArrivee: '2026-03-12' },
  { ...MOCK_COURRIERS[2], id: 2003, numeroChrono: 'S-2026-003', objet: 'Transmission de documents officiels', dateArrivee: '2026-03-14' },
  { ...MOCK_COURRIERS[3], id: 2004, numeroChrono: 'S-2026-004', objet: 'Accusé de réception — Dossier 2026-447', dateArrivee: '2026-03-15' },
  { ...MOCK_COURRIERS[4], id: 2005, numeroChrono: 'S-2026-005', objet: 'Bordereau de transmission', dateArrivee: '2026-03-17' },
]);

const MOCK_INTERNE = db.collection('courriers-interne', [
  { ...MOCK_COURRIERS[0], id: 3001, numeroChrono: 'I-2026-001', objet: 'Diffusion interne — Circulaire RH', dateArrivee: '2026-03-11' },
  { ...MOCK_COURRIERS[1], id: 3002, numeroChrono: 'I-2026-002', objet: 'Note de service — Fermeture exceptionnelle', dateArrivee: '2026-03-13' },
  { ...MOCK_COURRIERS[2], id: 3003, numeroChrono: 'I-2026-003', objet: 'Compte-rendu réunion de direction', dateArrivee: '2026-03-18' },
]);

const MOCK_PREVIEW_HTML: Record<string, string> = {
  AR: `<p>{{Ville}}, le {{DateDuJour}}</p>
<p>&nbsp;</p>
<p>Madame, Monsieur <strong>{{NomComplet}}</strong>,</p>
<p>&nbsp;</p>
<p>Nous accusons réception de votre courrier concernant :</p>
<p><strong>{{Objet}}</strong></p>
<p>&nbsp;</p>
<p>Enregistré le <strong>{{DateEnregistrement}}</strong> sous le numéro <strong>{{NumeroChrono}}</strong>.</p>
<p>&nbsp;</p>
<p>Votre demande est en cours de traitement. Nous vous contacterons dans les meilleurs délais.</p>
<p>&nbsp;</p>
<p>Veuillez agréer, Madame, Monsieur, l'expression de nos salutations distinguées.</p>`,

  REP: `<p>{{Ville}}, le {{DateDuJour}}</p>
<p>&nbsp;</p>
<p>À l'attention de <strong>{{NomComplet}}</strong></p>
<p>&nbsp;</p>
<p>Objet : <strong>{{Objet}}</strong></p>
<p>Réf : {{NumeroChrono}} — du {{DateEnregistrement}}</p>
<p>&nbsp;</p>
<p>Madame, Monsieur,</p>
<p>&nbsp;</p>
<p>En réponse à votre demande susmentionnée, nous avons l'honneur de vous informer que :</p>
<p>&nbsp;</p>
<p>[Contenu de la réponse à compléter]</p>
<p>&nbsp;</p>
<p>Veuillez agréer, Madame, Monsieur, l'expression de nos salutations distinguées.</p>`,

  BOR: `<p><strong>BORDEREAU DE TRANSMISSION</strong></p>
<p>N° : {{NumeroChrono}}</p>
<p>Date : {{DateDuJour}}</p>
<p>&nbsp;</p>
<p><strong>De :</strong> [Service émetteur]</p>
<p><strong>À :</strong> {{NomComplet}}</p>
<p>&nbsp;</p>
<p><strong>Objet :</strong> {{Objet}}</p>
<p>&nbsp;</p>
<table border="1" cellpadding="6" cellspacing="0" style="width:100%;border-collapse:collapse">
  <thead><tr style="background:#f0f0f0"><th>N°</th><th>Désignation</th><th>Nb d'exemplaires</th><th>Observations</th></tr></thead>
  <tbody>
    <tr><td>1</td><td>&nbsp;</td><td>&nbsp;</td><td>&nbsp;</td></tr>
    <tr><td>2</td><td>&nbsp;</td><td>&nbsp;</td><td>&nbsp;</td></tr>
  </tbody>
</table>
<p>&nbsp;</p>
<p>Pour information — Pour suite à donner — Pour avis — Pour signature</p>`,
};

export const courriersNouveauHandlers = [

  // Sortant list
  http.get(`${BASE}/courriers/sortant`, ({ request }) => {
    const url = new URL(request.url);
    const page = parseInt(url.searchParams.get('page') ?? '1');
    const pageSize = parseInt(url.searchParams.get('pageSize') ?? '20');
    const search = url.searchParams.get('search')?.toLowerCase() ?? '';
    let items = search
      ? MOCK_SORTANT.filter(c => c.objet.toLowerCase().includes(search))
      : MOCK_SORTANT;
    const total = items.length;
    items = items.slice((page - 1) * pageSize, page * pageSize);
    return HttpResponse.json({ items, total, page, pageSize });
  }),

  // Interne list
  http.get(`${BASE}/courriers/interne`, ({ request }) => {
    const url = new URL(request.url);
    const page = parseInt(url.searchParams.get('page') ?? '1');
    const pageSize = parseInt(url.searchParams.get('pageSize') ?? '20');
    const search = url.searchParams.get('search')?.toLowerCase() ?? '';
    let items = search
      ? MOCK_INTERNE.filter(c => c.objet.toLowerCase().includes(search))
      : MOCK_INTERNE;
    const total = items.length;
    items = items.slice((page - 1) * pageSize, page * pageSize);
    return HttpResponse.json({ items, total, page, pageSize });
  }),

  // Create sortant
  http.post(`${BASE}/courriers/sortant`, async ({ request }) => {
    const body = await request.json() as Record<string, unknown>;
    const created = { ...MOCK_SORTANT[0], id: Date.now(), objet: String(body['objet'] ?? 'Nouveau courrier sortant'), numeroChrono: `S-2026-${Date.now()}` };
    MOCK_SORTANT.unshift(created);
    return HttpResponse.json(created, { status: 201 });
  }),

  // Create interne
  http.post(`${BASE}/courriers/interne`, async ({ request }) => {
    const body = await request.json() as Record<string, unknown>;
    const created = { ...MOCK_INTERNE[0], id: Date.now(), objet: String(body['objet'] ?? 'Nouveau courrier interne'), numeroChrono: `I-2026-${Date.now()}` };
    MOCK_INTERNE.unshift(created);
    return HttpResponse.json(created, { status: 201 });
  }),

  // Maquette preview HTML (used by Quill editor for in-form preview)
  http.get(`${BASE}/maquettes/:id/preview-html`, ({ params }) => {
    const id = Number(params['id']);
    // Map mock maquette IDs to types: 1-3=AR, 4-6=REP, 9=BOR
    const type = id <= 3 ? 'AR' : id <= 6 ? 'REP' : 'BOR';
    const html = MOCK_PREVIEW_HTML[type] ?? MOCK_PREVIEW_HTML['AR'];
    const tags = ['NomComplet', 'Objet', 'DateDuJour', 'DateEnregistrement', 'NumeroChrono', 'Ville'];
    return HttpResponse.json({ html, tags });
  }),

  // Maquette DOCX download — returns the raw .docx binary
  // In production the backend serves the BLOB stored in DB; here we return a minimal valid DOCX
  http.get(`${BASE}/maquettes/:id/download`, ({ params }) => {
    const id = Number(params['id']);
    const typeLabel: Record<string, string> = { AR: 'Accuse-Reception', REP: 'Reponse', BOR: 'Bordereau' };
    const type = id <= 3 ? 'AR' : id <= 6 ? 'REP' : 'BOR';
    const filename = `PLI-Maquette-${typeLabel[type]}-${id}.docx`;
    const bytes = Uint8Array.from(atob(MOCK_DOCX_BASE64), c => c.charCodeAt(0));
    return new HttpResponse(bytes, {
      status: 200,
      headers: {
        'Content-Type': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        'Content-Disposition': `attachment; filename="${filename}"`,
      },
    });
  }),
];
