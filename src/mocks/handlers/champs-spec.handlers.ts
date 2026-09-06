import { http, HttpResponse } from 'msw';
import { db } from '../db';

import { API_BASE as BASE } from '../mock-origin';

// ── Seed data ─────────────────────────────────────────────────

const pages = db.collection('pagesSpec', [
  { id: 1, nom: 'courrier-entrant',      nomTable: 'ELEMENT', champCount: 4 },
  { id: 2, nom: 'FichierJoint',     nomTable: 'FICHIER_JOINT', champCount: 2 },
  { id: 3, nom: 'Classement',       nomTable: 'ELEMENT', champCount: 3 },
  { id: 4, nom: 'courrier-sortant',   nomTable: 'ELEMENT', champCount: 3 },
  { id: 5, nom: 'Numerisation',     nomTable: 'NUMERISATION', champCount: 2 },
] as any[]);

const champs = db.collection('champsSpec', [
  // ── courrier-entrant ──
  { id: 1,  pageNom: 'courrier-entrant', nom: 'ref',          libelle: 'Référence article', infobulle: 'Référence interne du produit reçu', visible: true,  obligatoire: false, majuscule: true,  type: 'chaine',     valeurDefaut: '',           ordre: 0 },
  { id: 2,  pageNom: 'courrier-entrant', nom: 'dateArticle',  libelle: 'Date article',      infobulle: '',                                  visible: true,  obligatoire: true,  majuscule: false, type: 'date',       valeurDefaut: '',           ordre: 1 },
  { id: 3,  pageNom: 'courrier-entrant', nom: 'typeProduit',  libelle: 'Type de produit',   infobulle: 'Catégorie du produit reçu',         visible: true,  obligatoire: true,  majuscule: false, type: 'liste',      valeurDefaut: '',           valeurs: 'Courrier,Colis,Document officiel,Facture', identifiants: 'C,CO,DO,FA', ordre: 2 },
  { id: 4,  pageNom: 'courrier-entrant', nom: 'commentaire',  libelle: 'Commentaire',       infobulle: '',                                  visible: true,  obligatoire: false, majuscule: false, type: 'multiligne', valeurDefaut: '',           ordre: 3 },
  // ── FichierJoint ──
  { id: 5,  pageNom: 'FichierJoint', nom: 'titre',       libelle: 'Titre du document', infobulle: '',                                  visible: true,  obligatoire: true,  majuscule: false, type: 'chaine',     valeurDefaut: '',           ordre: 0 },
  { id: 6,  pageNom: 'FichierJoint', nom: 'categorie',   libelle: 'Catégorie',         infobulle: 'Type de pièce jointe',              visible: true,  obligatoire: false, majuscule: false, type: 'liste',      valeurDefaut: 'Autre',      valeurs: 'Contrat,Rapport,Photo,Autre', identifiants: 'CTR,RPT,PHO,AUT', ordre: 1 },
  // ── Classement ──
  { id: 7,  pageNom: 'Classement',  nom: 'codeArchive',  libelle: 'Code d\'archive',   infobulle: 'Identifiant unique dans le système d\'archivage', visible: true,  obligatoire: true,  majuscule: true,  type: 'chaine',     valeurDefaut: '',           ordre: 0 },
  { id: 8,  pageNom: 'Classement',  nom: 'dateArchive',  libelle: 'Date d\'archivage', infobulle: '',                                  visible: true,  obligatoire: true,  majuscule: false, type: 'date',       valeurDefaut: '',           ordre: 1 },
  { id: 9,  pageNom: 'Classement',  nom: 'rayonBoite',   libelle: 'Rayon / Boîte',     infobulle: 'Localisation physique en rayonnage', visible: false, obligatoire: false, majuscule: false, type: 'chaine',     valeurDefaut: '',           ordre: 2 },
  // ── courrier-sortant ──
  { id: 10, pageNom: 'courrier-sortant', nom: 'codeGestion', libelle: 'Code gestion',    infobulle: '',                                  visible: true,  obligatoire: true,  majuscule: true,  type: 'chaine',     valeurDefaut: '',           ordre: 0 },
  { id: 11, pageNom: 'courrier-sortant', nom: 'quantite',    libelle: 'Quantité',        infobulle: '',                                  visible: true,  obligatoire: false, majuscule: false, type: 'numerique',  valeurDefaut: '1',          ordre: 1 },
  { id: 12, pageNom: 'courrier-sortant', nom: 'remarques',   libelle: 'Remarques',       infobulle: '',                                  visible: true,  obligatoire: false, majuscule: false, type: 'multiligne', valeurDefaut: '',           ordre: 2 },
  // ── Numerisation ──
  { id: 13, pageNom: 'Numerisation',  nom: 'scanner',     libelle: 'Scanner utilisé',  infobulle: '',                                  visible: true,  obligatoire: false, majuscule: false, type: 'liste',      valeurDefaut: '',           valeurs: 'Scanner A3,Scanner A4,Photocopieur', identifiants: 'SCA3,SCA4,PHO', ordre: 0 },
  { id: 14, pageNom: 'Numerisation',  nom: 'resolution',  libelle: 'Résolution (DPI)', infobulle: 'Résolution de numérisation',        visible: true,  obligatoire: false, majuscule: false, type: 'numerique',  valeurDefaut: '300',        ordre: 1 },
] as any[]);

let nextId = db.nextId([...pages, ...champs], 100);

// ── Recalculate champCount ────────────────────────────────────

function syncCounts(): void {
  for (const p of pages) p.champCount = champs.filter((c) => c.pageNom === p.nom).length;
}

// ── Handlers ──────────────────────────────────────────────────

export const champsSpecHandlers = [

  // GET all pages
  http.get(`${BASE}/pages-spec`, () => {
    syncCounts();
    return HttpResponse.json(pages);
  }),

  // POST create page
  http.post(`${BASE}/pages-spec`, async ({ request }) => {
    const body = await request.json() as Record<string, unknown>;
    const page = { id: nextId++, nom: body['nom'], nomTable: body['nomTable'] ?? null, champCount: 0 };
    pages.push(page);
    return HttpResponse.json(page, { status: 201 });
  }),

  // DELETE page
  http.delete(`${BASE}/pages-spec/:nom`, ({ params }) => {
    const nom = params['nom'] as string;
    db.replace(pages, pages.filter((p) => p.nom !== nom));
    db.replace(champs, champs.filter((c) => c.pageNom !== nom));
    return new HttpResponse(null, { status: 204 });
  }),

  // GET champs for a page
  http.get(`${BASE}/pages-spec/:nom/champs`, ({ params }) => {
    const nom = params['nom'] as string;
    const result = champs
      .filter((c) => c.pageNom === nom)
      .sort((a, b) => a.ordre - b.ordre);
    return HttpResponse.json(result);
  }),

  // POST create champ — must come BEFORE the reorder route
  http.post(`${BASE}/pages-spec/:nom/champs`, async ({ request, params }) => {
    const nom = params['nom'] as string;
    const body = await request.json() as Record<string, unknown>;
    const maxOrdre = champs
      .filter((c) => c.pageNom === nom)
      .reduce((max, c) => Math.max(max, c.ordre), -1);
    const champ = { ...body, id: nextId++, pageNom: nom, ordre: maxOrdre + 1 };
    champs.push(champ);
    syncCounts();
    return HttpResponse.json(champ, { status: 201 });
  }),

  // PUT reorder champs
  http.put(`${BASE}/pages-spec/:nom/champs/reorder`, async ({ request, params }) => {
    const nom = params['nom'] as string;
    const body = await request.json() as { orderedIds: number[] };
    body.orderedIds.forEach((id, index) => {
      const target = champs.find((c) => c.pageNom === nom && c.id === id);
      if (target) target.ordre = index;
    });
    return HttpResponse.json({ ok: true });
  }),

  // PUT update champ
  http.put(`${BASE}/pages-spec/:nom/champs/:id`, async ({ request, params }) => {
    const id = Number(params['id']);
    const body = await request.json() as Record<string, unknown>;
    db.replace(champs, champs.map((c) => (c.id === id ? { ...c, ...body, id } : c)));
    return HttpResponse.json(champs.find((c) => c.id === id));
  }),

  // DELETE champ
  http.delete(`${BASE}/pages-spec/:nom/champs/:id`, ({ params }) => {
    const id = Number(params['id']);
    db.replace(champs, champs.filter((c) => c.id !== id));
    syncCounts();
    return new HttpResponse(null, { status: 204 });
  }),
];
