import { http, HttpResponse } from 'msw';
import { db } from '../db';

import { API_BASE as BASE } from '../mock-origin';

// ── Seed data ──────────────────────────────────────────────────

const maquettes = db.collection('maquettes', [
  { id: 1, nom: 'ACCUSE RECEPTION',              type: 'AR',  extension: '.docx', acces: 'PUBLIC',  serviceNom: null, personnelNom: null, fileUrl: `${BASE}/maquettes/1/download` },
  { id: 2, nom: 'AR SMS',                         type: 'AR',  extension: '.docx', acces: 'PUBLIC',  serviceNom: null, personnelNom: null, fileUrl: `${BASE}/maquettes/2/download` },
  { id: 3, nom: 'AR — Réclamation',              type: 'AR',  extension: '.docx', acces: 'PUBLIC',  serviceNom: null, personnelNom: null, fileUrl: `${BASE}/maquettes/3/download` },
  { id: 4, nom: 'Mail — Création de compte',      type: 'REP', extension: '.docx', acces: 'SERVICE', serviceNom: 'Direction de la Demande', personnelNom: null, fileUrl: `${BASE}/maquettes/4/download` },
  { id: 5, nom: 'Mail — Échange avec l’usager',  type: 'REP', extension: '.docx', acces: 'SERVICE', serviceNom: 'Direction de la Demande', personnelNom: null, fileUrl: `${BASE}/maquettes/5/download` },
  { id: 6, nom: 'Réponse de clôture',            type: 'REP', extension: '.docx', acces: 'SERVICE', serviceNom: 'Direction de la Demande', personnelNom: null, fileUrl: `${BASE}/maquettes/6/download` },
  { id: 7, nom: 'Attestation de travail',          type: 'ML',  extension: '.docx', acces: 'PUBLIC',  serviceNom: null, personnelNom: null, fileUrl: `${BASE}/maquettes/7/download` },
  { id: 8, nom: 'Étiquettes de publipostage',      type: 'ML',  extension: '.docx', acces: 'PUBLIC',  serviceNom: null, personnelNom: null, fileUrl: `${BASE}/maquettes/8/download` },
  { id: 9, nom: 'Bordereau de transmission',       type: 'BOR', extension: '.docx', acces: 'PUBLIC',  serviceNom: null, personnelNom: null, fileUrl: `${BASE}/maquettes/9/download` },
]);

const maintenanceLogs = db.collection('maintenance-logs', [
  { id: 1, date: '2026-03-18T22:20:49', machine: '10.0.203.10', utilisateur: 'ADMIN', type: 'CON', objet: 'Logon.UserConnect', commentaire: 'Connexion réussie depuis 10.0.203.10' },
  { id: 2, date: '2026-03-18T21:16:56', machine: '10.0.203.10', utilisateur: 'ADMIN', type: 'CON', objet: 'Logon.UserConnect', commentaire: 'Connexion réussie depuis 10.0.203.10' },
  { id: 3, date: '2026-03-18T20:39:28', machine: '10.0.203.10', utilisateur: 'ADMIN', type: 'CON', objet: 'Logon.UserConnect', commentaire: null },
  { id: 4, date: '2026-03-18T16:07:30', machine: '10.0.203.10', utilisateur: 'ADMIN', type: 'FON', objet: 'ChampsSpecService.getChamps', commentaire: 'Erreur lors de la récupération des champs personnalisés.\nStack trace:\n  at ChampsSpecService.getChamps()\n  at Page_Load()' },
  { id: 5, date: '2026-03-18T15:50:57', machine: '10.0.203.10', utilisateur: 'ADMIN', type: 'CON', objet: 'Logon.UserConnect', commentaire: null },
  { id: 6, date: '2026-03-17T14:30:00', machine: '10.0.101.5',  utilisateur: 'DUPONT', type: 'ERR', objet: 'Courrier.Save', commentaire: 'Erreur de validation: champ obligatoire manquant (objet)' },
]);

const mailsArchives = [
  { id: 1, origine: 'Courrier', objet: 'Pour traitement // [Objet: Demande de rendez-vous — état civil, Priorité : -]', emetteur: 'Service courrier <sas.courrier@ville-exemple.fr>', destinataire: 'sas.courrier@ville-exemple.fr', date: '2023-09-18T17:44:09', dateSuppr: '2024-01-15', serviceHierarchie: 'Direction Générale > Service Informatique', demandeId: 12543 },
  { id: 2, origine: 'Courrier', objet: 'Nouvel élément reçu dans Pli (Objet : Inscription scolaire — dossier 56612, Priorité : -)', emetteur: 'Service courrier <sas.courrier@ville-exemple.fr>', destinataire: 'sas.courrier@ville-exemple.fr', date: '2023-09-18T17:43:01', dateSuppr: null, serviceHierarchie: 'Direction Générale', demandeId: 12542 },
  { id: 3, origine: 'Protocole', objet: 'Pour traitement // [Objet: Inscription scolaire — dossier 56612, Priorité : -]', emetteur: 'Service courrier <sas.courrier@ville-exemple.fr>', destinataire: 'sas.courrier@ville-exemple.fr', date: '2023-09-18T17:16:57', dateSuppr: '2024-02-01', serviceHierarchie: null, demandeId: null },
];

const journalMails = [
  { id: 1, objet: 'Pour traitement // [Objet: Demande de rendez-vous — état civil, Priorité : -]', date: '2023-09-18T17:44:09', emetteur: 'Service courrier <sas.courrier@ville-exemple.fr>', destinataire: 'sas.courrier@ville-exemple.fr', type: 'AR', machine: '203.0.113.24', contenu: '<p>Bonjour,</p><p>Un nouvel élément vous a été assigné...</p>' },
  { id: 2, objet: 'Nouvel élément reçu dans Pli (Objet : Inscription scolaire — dossier 56612, Priorité : -)', date: '2023-09-18T17:43:01', emetteur: 'Service courrier <sas.courrier@ville-exemple.fr>', destinataire: 'sas.courrier@ville-exemple.fr', type: 'AR', machine: '203.0.113.24', contenu: null },
  { id: 3, objet: 'Pour traitement // [Objet: test, Priorité : Très urgent, Nature : Question]', date: '2023-09-15T16:38:58', emetteur: 'Service courrier <sas.courrier@ville-exemple.fr>', destinataire: 'sas.courrier@ville-exemple.fr', type: 'AR', machine: '203.0.113.87', contenu: null },
  { id: 4, objet: 'Réponse automatique — Dossier clôturé', date: '2023-09-14T10:22:00', emetteur: 'noreply@mairie.fr', destinataire: 'citoyen@example.com', type: 'RP', machine: '10.0.1.5', contenu: '<p>Votre dossier a été clôturé.</p>' },
];

const systemConfigStore = db.collection('system-config', [{
  storage: {
    mode: 'interne',
    alfrescoUrl: '',
    alfrescoLogin: '',
    alfrescoPassword: '',
    alfrescoRoot: 'Courrier',
  },
  ldap: {
    enabled: false,
    serverUrl: '',
    domain: '',
    adminLogin: '',
    adminPassword: '',
  },
}]);

// ── Handlers ──────────────────────────────────────────────────

export const administrationHandlers = [

  // ── Maquettes ────────────────────────────────────────────────
  http.get(`${BASE}/maquettes`, ({ request }) => {
    const url = new URL(request.url);
    const type = url.searchParams.get('type');
    const filtered = type ? maquettes.filter(m => m.type === type) : maquettes;
    return HttpResponse.json(filtered);
  }),

  http.post(`${BASE}/maquettes`, async ({ request }) => {
    const ct = request.headers.get('content-type') ?? '';
    let fields: Record<string, unknown>;
    if (ct.includes('multipart/form-data')) {
      const fd = await request.formData();
      fields = {};
      fd.forEach((v, k) => { if (typeof v === 'string') fields[k] = v; });
      const file = fd.get('file') as File | null;
      if (file) fields['fileUrl'] = `mock://maquettes/${file.name}`;
    } else {
      fields = await request.json() as Record<string, unknown>;
    }
    const item = { serviceNom: null, personnelNom: null, ...fields, id: Date.now() };
    maquettes.push(item as typeof maquettes[0]);
    return HttpResponse.json(item, { status: 201 });
  }),

  http.put(`${BASE}/maquettes/:id`, async ({ request, params }) => {
    const ct = request.headers.get('content-type') ?? '';
    let fields: Record<string, unknown>;
    if (ct.includes('multipart/form-data')) {
      const fd = await request.formData();
      fields = {};
      fd.forEach((v, k) => { if (typeof v === 'string') fields[k] = v; });
      const file = fd.get('file') as File | null;
      if (file) fields['fileUrl'] = `mock://maquettes/${file.name}`;
    } else {
      fields = await request.json() as Record<string, unknown>;
    }
    const idx = maquettes.findIndex((m) => String(m.id) === String(params['id']));
    if (idx >= 0) maquettes[idx] = { ...maquettes[idx], ...fields } as typeof maquettes[0];
    return HttpResponse.json(maquettes[idx]);
  }),

  http.delete(`${BASE}/maquettes/:id`, ({ params }) => {
    const idx = maquettes.findIndex((m) => String(m.id) === String(params['id']));
    if (idx >= 0) maquettes.splice(idx, 1);
    return new HttpResponse(null, { status: 204 });
  }),

  http.post(`${BASE}/maquettes/:id/duplicate`, ({ params }) => {
    const src = maquettes.find((m) => String(m.id) === String(params['id']));
    if (!src) return new HttpResponse(null, { status: 404 });
    const copy = { ...src, id: Date.now(), nom: `Copie de ${src.nom}` };
    maquettes.push(copy);
    return HttpResponse.json(copy, { status: 201 });
  }),

  // ── Maintenance logs ─────────────────────────────────────────
  http.get(`${BASE}/maintenance-logs`, () => HttpResponse.json(maintenanceLogs)),

  http.delete(`${BASE}/maintenance-logs/:id`, ({ params }) => {
    const idx = maintenanceLogs.findIndex((l) => String(l.id) === String(params['id']));
    if (idx >= 0) maintenanceLogs.splice(idx, 1);
    return new HttpResponse(null, { status: 204 });
  }),

  // ── Mails archivés ───────────────────────────────────────────
  http.get(`${BASE}/mails-archives`, () => HttpResponse.json(mailsArchives)),

  // ── Journal des mails ────────────────────────────────────────
  http.get(`${BASE}/journal-mails`, () => HttpResponse.json(journalMails)),

  // ── System config ────────────────────────────────────────────
  http.get(`${BASE}/system-config`, () => HttpResponse.json(systemConfigStore[0])),

  http.put(`${BASE}/system-config`, async ({ request }) => {
    const body = await request.json() as (typeof systemConfigStore)[0];
    systemConfigStore[0] = body;
    return HttpResponse.json(systemConfigStore[0]);
  }),
];
