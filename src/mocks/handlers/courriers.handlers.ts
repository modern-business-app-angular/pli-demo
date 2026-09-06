import { http, HttpResponse, delay } from 'msw';
import { db } from '../db';
import { MOCK_ORIGIN } from '../mock-origin';
import type {
  CourrierEntrant,
  CourrierStatut,
} from '../../app/features/courriers/models/courrier.model';
import type {
  Action,
  Personnel,
  ChronoType,
  Nature,
  Priorite,
} from '../../app/features/courriers/models/action.model';
import type { PagedResult } from '../../app/core/models/api-response.model';

// ─── Mock Reference Data ──────────────────────────────────────────────────────

export const MOCK_CHRONO_TYPES: ChronoType[] = [
  { id: 1, libelle: 'Courriers entrants généraux', type: 'REC', prefixe: 'REC', separateur: '-', lgAnnee: 4, lgNum: 4, showNature: true, showPriorite: true, showCriticite: false, nbjDtLim: 15 },
  { id: 2, libelle: 'Courriers Direction Générale', type: 'REC', prefixe: 'DG', separateur: '-', lgAnnee: 4, lgNum: 4, showNature: false, showPriorite: true, showCriticite: false, nbjDtLim: 7 },
  { id: 3, libelle: 'Courriers urgents', type: 'REC', prefixe: 'URG', separateur: '-', lgAnnee: 4, lgNum: 4, showNature: true, showPriorite: false, showCriticite: true },
  { id: 4, libelle: 'Courriers élus', type: 'REC', prefixe: 'ELU', separateur: '-', lgAnnee: 4, lgNum: 4, showNature: true, showPriorite: true, showCriticite: false, nbjDtLim: 5 },
];

export const MOCK_NATURES: Nature[] = [
  { id: 1, libelle: 'Lettre' },
  { id: 2, libelle: 'Note de service' },
  { id: 3, libelle: 'Rapport' },
  { id: 4, libelle: 'Décision' },
  { id: 5, libelle: 'Arrêté' },
  { id: 6, libelle: 'Convention' },
  { id: 7, libelle: 'Autre' },
];

export const MOCK_PRIORITES: Priorite[] = [
  { id: 1, libelle: 'Normal', isDefault: true },
  { id: 2, libelle: 'Urgent', isDefault: false },
  { id: 3, libelle: 'Très urgent', isDefault: false },
];

export const MOCK_ACTIONS: Action[] = [
  { id: 1, libelle: 'Pour traitement', etatResultant: 'T', destMode: 'Tous', nbjDtLim: 15 },
  { id: 2, libelle: 'Pour information', etatResultant: 'T', destMode: 'Tous' },
  { id: 3, libelle: 'Pour signature', etatResultant: 'T', destMode: 'SERVICES', nbjDtLim: 3 },
  { id: 4, libelle: 'Pour avis', etatResultant: 'T', destMode: 'PERSONNES', nbjDtLim: 10 },
  { id: 5, libelle: 'Clôturer', etatResultant: 'C', destMode: 'MEME' },
];

export const MOCK_PERSONNEL: Personnel[] = [
  { id: 1, nom: 'Dumont', prenom: 'Marie', displayName: 'Marie Dumont', serviceId: 1, serviceNom: 'Direction Générale', isServiceMailbox: false, email: 'marie.dumont@collectivite.fr' },
  { id: 2, nom: 'Petit', prenom: 'Thomas', displayName: 'Thomas Petit', serviceId: 2, serviceNom: 'Service Technique', isServiceMailbox: false, email: 'thomas.petit@collectivite.fr' },
  { id: 3, nom: 'Fontaine', prenom: 'Lucie', displayName: 'Lucie Fontaine', serviceId: 3, serviceNom: 'Service des Relations Ext.', isServiceMailbox: false, email: 'lucie.fontaine@collectivite.fr' },
  { id: 4, nom: 'Girard', prenom: 'Antoine', displayName: 'Antoine Girard', serviceId: 4, serviceNom: 'Direction Financière', isServiceMailbox: false, email: 'antoine.girard@collectivite.fr' },
  { id: 5, nom: 'Rousseau', prenom: 'Claire', displayName: 'Claire Rousseau', serviceId: 5, serviceNom: 'Ressources Humaines', isServiceMailbox: false, email: 'claire.rousseau@collectivite.fr' },
  { id: 10, nom: 'BAL Direction Générale', prenom: '', displayName: 'BAL Direction Générale', serviceId: 1, serviceNom: 'Direction Générale', isServiceMailbox: true },
  { id: 11, nom: 'BAL Service Technique', prenom: '', displayName: 'BAL Service Technique', serviceId: 2, serviceNom: 'Service Technique', isServiceMailbox: true },
];

// ─── Mock Courriers ───────────────────────────────────────────────────────────

export const MOCK_COURRIERS: CourrierEntrant[] = db.collection<CourrierEntrant>('courriers', [
  {
    id: 1,
    numeroChrono: 'REC-2026-0001',
    chronoTypeId: 1,
    chronoTypeLabel: 'Courriers entrants généraux',
    dateArrivee: '2026-03-18',
    dateExpedition: '2026-03-15',
    objet: 'DEMANDE DE SUBVENTION POUR RÉNOVATION BÂTIMENT',
    reference: 'REF-2026-001',
    statut: 'E',
    natureLibelle: 'Lettre',
    prioriteLibelle: 'Normal',
    nbPiecesJointes: 2,
    expediteur: { id: 1, nom: 'Dupont', prenom: 'Jean', libelleFunction: 'Directeur Général', organisme: 'Mairie de Lyon', ville: 'Lyon', email: 'jean.dupont@mairie-lyon.fr', telephone: '04 72 10 30 00', type: 'personne' },
    ficheSuiveuse: { id: 1, etape: '1', etat: 'E', type: 'ORI', actionId: 1, actionLibelle: 'Pour traitement', destinataireId: 1, destinataireNom: 'Marie Dumont', serviceDestinataire: 'Direction Générale', dateCreation: '2026-03-18', isCurrentUserRecipient: true },
  },
  {
    id: 2,
    numeroChrono: 'REC-2026-0002',
    chronoTypeId: 1,
    chronoTypeLabel: 'Courriers entrants généraux',
    dateArrivee: '2026-03-17',
    objet: 'RÉCLAMATION CONCERNANT LES NUISANCES SONORES RUE DE LA PAIX',
    statut: 'T',
    prioriteLibelle: 'Urgent',
    nbPiecesJointes: 0,
    expediteur: { id: 2, nom: 'Leblanc', prenom: 'Marie', libelleFunction: 'Habitante', organisme: undefined, ville: 'Lyon', email: 'm.leblanc@gmail.com', type: 'personne' },
    ficheSuiveuse: { id: 2, etape: '2', etat: 'T', type: 'ORI', actionId: 1, actionLibelle: 'Pour traitement', destinataireId: 2, destinataireNom: 'Thomas Petit', serviceDestinataire: 'Service Technique', dateCreation: '2026-03-17', dateLimite: '2026-04-01', isCurrentUserRecipient: false },
  },
  {
    id: 3,
    numeroChrono: 'DG-2026-0001',
    chronoTypeId: 2,
    chronoTypeLabel: 'Courriers Direction Générale',
    dateArrivee: '2026-03-16',
    dateExpedition: '2026-03-14',
    objet: 'INVITATION COLLOQUE NATIONAL DES DIRECTEURS GÉNÉRAUX',
    reference: 'ADGCF-2026-COL',
    statut: 'T',
    natureLibelle: 'Lettre',
    nbPiecesJointes: 1,
    expediteur: { id: 3, nom: 'ADGCF', libelleFunction: 'Association', organisme: 'Association des DGS', ville: 'Paris', email: 'contact@adgcf.fr', type: 'organisme' },
    ficheSuiveuse: { id: 3, etape: '1', etat: 'T', type: 'ORI', actionId: 2, actionLibelle: 'Pour information', destinataireId: 1, destinataireNom: 'Marie Dumont', serviceDestinataire: 'Direction Générale', dateCreation: '2026-03-16', isCurrentUserRecipient: true },
  },
  {
    id: 4,
    numeroChrono: 'REC-2026-0003',
    chronoTypeId: 1,
    chronoTypeLabel: 'Courriers entrants généraux',
    dateArrivee: '2026-03-15',
    objet: 'DEMANDE PERMIS DE CONSTRUIRE — LOT 12 ZAC DES GRANGES',
    statut: 'F',
    natureLibelle: 'Rapport',
    prioriteLibelle: 'Normal',
    nbPiecesJointes: 5,
    expediteur: { id: 4, nom: 'Martin', prenom: 'Pierre', libelleFunction: 'Architecte', organisme: 'Cabinet Martin & Associés', ville: 'Bourg-en-Bresse', type: 'personne' },
    ficheSuiveuse: { id: 4, etape: '3', etat: 'F', type: 'ORI', actionId: 4, actionLibelle: 'Pour avis', destinataireId: 3, destinataireNom: 'Lucie Fontaine', serviceDestinataire: 'Service des Relations Ext.', dateCreation: '2026-03-15', isCurrentUserRecipient: false },
  },
  {
    id: 5,
    numeroChrono: 'URG-2026-0001',
    chronoTypeId: 3,
    chronoTypeLabel: 'Courriers urgents',
    dateArrivee: '2026-03-18',
    dateLimite: '2026-03-20',
    objet: 'MISE EN DEMEURE — CONTRÔLE SANITAIRE RESTAURANT SCOLAIRE',
    statut: 'E',
    nbPiecesJointes: 3,
    expediteur: { id: 5, nom: 'ARS Auvergne-Rhône-Alpes', libelleFunction: 'Agence régionale de santé', organisme: 'ARS AURA', ville: 'Lyon', email: 'ars-aura@ars.sante.fr', type: 'organisme' },
    ficheSuiveuse: { id: 5, etape: '1', etat: 'E', type: 'ORI', actionId: 3, actionLibelle: 'Pour signature', destinataireId: 1, destinataireNom: 'Marie Dumont', serviceDestinataire: 'Direction Générale', dateCreation: '2026-03-18', dateLimite: '2026-03-20', isCurrentUserRecipient: true },
  },
  {
    id: 6,
    numeroChrono: 'REC-2026-0004',
    chronoTypeId: 1,
    chronoTypeLabel: 'Courriers entrants généraux',
    dateArrivee: '2026-03-14',
    objet: 'CONVENTION DE PARTENARIAT CULTUREL 2026-2028',
    statut: 'T',
    natureLibelle: 'Convention',
    prioriteLibelle: 'Normal',
    nbPiecesJointes: 2,
    expediteur: { id: 6, nom: 'Grand Lyon Métropole', libelleFunction: 'Collectivité', organisme: 'Grand Lyon Métropole', ville: 'Lyon', email: 'partenariats@grandlyon.com', type: 'organisme' },
    ficheSuiveuse: { id: 6, etape: '2', etat: 'T', type: 'ORI', actionId: 4, actionLibelle: 'Pour avis', destinataireId: 5, destinataireNom: 'Claire Rousseau', serviceDestinataire: 'Ressources Humaines', dateCreation: '2026-03-14', isCurrentUserRecipient: false },
  },
  {
    id: 7,
    numeroChrono: 'ELU-2026-0001',
    chronoTypeId: 4,
    chronoTypeLabel: 'Courriers élus',
    dateArrivee: '2026-03-13',
    dateExpedition: '2026-03-11',
    objet: 'INTERPELLATION SUR LA POLITIQUE DE STATIONNEMENT EN CENTRE-VILLE',
    statut: 'C',
    natureLibelle: 'Lettre',
    prioriteLibelle: 'Urgent',
    nbPiecesJointes: 0,
    expediteur: { id: 7, nom: 'Morel', prenom: 'Jean-Pierre', libelleFunction: 'Élu, Adjoint au Maire', organisme: 'Mairie de Caluire', ville: 'Caluire', type: 'personne' },
    ficheSuiveuse: { id: 7, etape: '2', etat: 'C', type: 'ORI', actionId: 5, actionLibelle: 'Clôturer', destinataireId: 1, destinataireNom: 'Marie Dumont', serviceDestinataire: 'Direction Générale', dateCreation: '2026-03-13', isCurrentUserRecipient: false },
  },
  {
    id: 8,
    numeroChrono: 'REC-2026-0005',
    chronoTypeId: 1,
    chronoTypeLabel: 'Courriers entrants généraux',
    dateArrivee: '2026-03-12',
    objet: 'RAPPORT ANNUEL DÉLÉGATAIRE EAU POTABLE 2025',
    statut: 'E',
    natureLibelle: 'Rapport',
    prioriteLibelle: 'Normal',
    nbPiecesJointes: 8,
    expediteur: { id: 8, nom: 'Veolia Eau', libelleFunction: 'Prestataire', organisme: 'Veolia Eau France', ville: 'Paris', email: 'exploitation@veolia.com', type: 'organisme' },
    ficheSuiveuse: { id: 8, etape: '1', etat: 'E', type: 'ORI', actionId: 1, actionLibelle: 'Pour traitement', destinataireId: 4, destinataireNom: 'Antoine Girard', serviceDestinataire: 'Direction Financière', dateCreation: '2026-03-12', dateLimite: '2026-03-27', isCurrentUserRecipient: false },
  },
  {
    id: 9,
    numeroChrono: 'REC-2026-0006',
    chronoTypeId: 1,
    chronoTypeLabel: 'Courriers entrants généraux',
    dateArrivee: '2026-03-11',
    objet: 'DEMANDE DE RENSEIGNEMENTS — DROIT D\'ACCÈS AUX DOCUMENTS ADMINISTRATIFS',
    statut: 'T',
    prioriteLibelle: 'Normal',
    nbPiecesJointes: 1,
    expediteur: { id: 9, nom: 'Bernard', prenom: 'Sophie', libelleFunction: 'Juriste', organisme: 'Cabinet juridique Bernard', ville: 'Grenoble', email: 's.bernard@cabinet-bernard.fr', type: 'personne' },
    ficheSuiveuse: { id: 9, etape: '2', etat: 'T', type: 'ORI', actionId: 1, actionLibelle: 'Pour traitement', destinataireId: 3, destinataireNom: 'Lucie Fontaine', serviceDestinataire: 'Service des Relations Ext.', dateCreation: '2026-03-11', isCurrentUserRecipient: false },
  },
  {
    id: 10,
    numeroChrono: 'DG-2026-0002',
    chronoTypeId: 2,
    chronoTypeLabel: 'Courriers Direction Générale',
    dateArrivee: '2026-03-10',
    objet: 'NOTIFICATION RÉSULTAT APPEL D\'OFFRES — TRAVAUX VOIRIE 2026',
    reference: 'PREFET-2026-0112',
    statut: 'E',
    natureLibelle: 'Décision',
    nbPiecesJointes: 4,
    expediteur: { id: 10, nom: 'Préfecture du Rhône', libelleFunction: 'Administration centrale', organisme: 'État', ville: 'Lyon', email: 'pref@rhone.gouv.fr', type: 'organisme' },
    ficheSuiveuse: { id: 10, etape: '1', etat: 'E', type: 'ORI', actionId: 1, actionLibelle: 'Pour traitement', destinataireId: 1, destinataireNom: 'Marie Dumont', serviceDestinataire: 'Direction Générale', dateCreation: '2026-03-10', dateLimite: '2026-03-25', isCurrentUserRecipient: true },
  },
]);

// ─── Handlers ────────────────────────────────────────────────────────────────

const BASE = MOCK_ORIGIN;

export const courriersHandlers = [

  // GET /api/courriers/entrant — paginated list with optional filters
  http.get(`${BASE}/api/courriers/entrant`, async ({ request }) => {
    await delay(300);
    const url = new URL(request.url);
    const page     = parseInt(url.searchParams.get('page')     || '1');
    const pageSize = parseInt(url.searchParams.get('pageSize') || '10');
    const search   = url.searchParams.get('search')?.toLowerCase();
    const statut   = url.searchParams.get('statut') as CourrierStatut | null;
    const chrono   = url.searchParams.get('chronoTypeId');

    let items = [...MOCK_COURRIERS];
    if (search)  items = items.filter(c => c.objet.toLowerCase().includes(search) || c.numeroChrono.toLowerCase().includes(search));
    if (statut)  items = items.filter(c => c.statut === statut);
    if (chrono)  items = items.filter(c => c.chronoTypeId === parseInt(chrono));

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

  // GET /api/courriers/entrant/:id
  http.get(`${BASE}/api/courriers/entrant/:id`, async ({ params }) => {
    await delay(150);
    const found = MOCK_COURRIERS.find(c => c.id === parseInt(params['id'] as string));
    if (!found) {
      return new HttpResponse(JSON.stringify({ message: 'Courrier introuvable' }), {
        status: 404, headers: { 'Content-Type': 'application/json' },
      });
    }
    return new HttpResponse(JSON.stringify(found), {
      status: 200, headers: { 'Content-Type': 'application/json' },
    });
  }),

  // POST /api/courriers/entrant — create new courrier
  http.post(`${BASE}/api/courriers/entrant`, async ({ request }) => {
    await delay(500);
    const body = await request.json() as Record<string, unknown>;
    const chrType = MOCK_CHRONO_TYPES.find(c => c.id === (body['chronoTypeId'] as number));
    const seq = String(Math.floor(Math.random() * 50) + 11).padStart(chrType?.lgNum ?? 4, '0');
    const year = new Date().getFullYear();
    const sep  = chrType?.separateur ?? '-';
    const num  = `${chrType?.prefixe ?? 'REC'}${sep}${year}${sep}${seq}`;

    const created: CourrierEntrant = {
      id: Math.floor(Math.random() * 10000) + 100,
      numeroChrono: num,
      chronoTypeId: chrType?.id ?? 1,
      chronoTypeLabel: chrType?.libelle ?? 'Courrier entrant',
      dateArrivee: (body['dateArrivee'] as string) ?? new Date().toISOString().split('T')[0],
      objet: (body['objet'] as string) ?? '',
      statut: 'E',
      nbPiecesJointes: ((body['piecesJointes'] as unknown[]) ?? []).length,
      ficheSuiveuse: {
        id: Math.floor(Math.random() * 9000) + 1000,
        etape: '1',
        etat: 'E',
        type: 'ORI',
        dateCreation: new Date().toISOString().split('T')[0],
        isCurrentUserRecipient: true,
      },
    };
    MOCK_COURRIERS.unshift(created);
    return new HttpResponse(JSON.stringify(created), {
      status: 201, headers: { 'Content-Type': 'application/json' },
    });
  }),

  // POST /api/courriers/:id/faire-suivre
  http.post(`${BASE}/api/courriers/:id/faire-suivre`, async ({ params }) => {
    await delay(400);
    const id = parseInt(params['id'] as string);
    const idx = MOCK_COURRIERS.findIndex(c => c.id === id);
    if (idx !== -1 && MOCK_COURRIERS[idx].ficheSuiveuse) {
      // Simulate: update status to T (Transmise)
      MOCK_COURRIERS[idx] = {
        ...MOCK_COURRIERS[idx],
        statut: 'T',
        ficheSuiveuse: {
          ...MOCK_COURRIERS[idx].ficheSuiveuse!,
          etat: 'T',
          isCurrentUserRecipient: false,
        },
      };
    }
    return new HttpResponse(null, { status: 204 });
  }),

  // GET /api/actions
  http.get(`${BASE}/api/actions`, async () => {
    await delay(100);
    return new HttpResponse(JSON.stringify(MOCK_ACTIONS), {
      status: 200, headers: { 'Content-Type': 'application/json' },
    });
  }),

  // GET /api/personnel?q=&mode=
  http.get(`${BASE}/api/personnel`, async ({ request }) => {
    await delay(200);
    const url  = new URL(request.url);
    const q    = url.searchParams.get('q')?.toLowerCase() ?? '';
    const mode = url.searchParams.get('mode') ?? 'Tous';

    let results = MOCK_PERSONNEL.filter(p => {
      if (mode === 'SERVICES' || mode === 'BALServ') return p.isServiceMailbox;
      if (mode === 'PERSONNES' || mode === 'BALPers') return !p.isServiceMailbox;
      return true; // Tous, MEME, LISTEPOS → return all for mock
    });

    if (q) results = results.filter(p =>
      p.displayName.toLowerCase().includes(q) ||
      p.serviceNom.toLowerCase().includes(q)
    );

    return new HttpResponse(JSON.stringify(results), {
      status: 200, headers: { 'Content-Type': 'application/json' },
    });
  }),

  // GET /api/chrono-types
  http.get(`${BASE}/api/chrono-types`, async () => {
    await delay(100);
    return new HttpResponse(JSON.stringify(MOCK_CHRONO_TYPES), {
      status: 200, headers: { 'Content-Type': 'application/json' },
    });
  }),

  // GET /api/natures
  http.get(`${BASE}/api/natures`, async () => {
    await delay(100);
    return new HttpResponse(JSON.stringify(MOCK_NATURES), {
      status: 200, headers: { 'Content-Type': 'application/json' },
    });
  }),

  // GET /api/priorites
  http.get(`${BASE}/api/priorites`, async () => {
    await delay(100);
    return new HttpResponse(JSON.stringify(MOCK_PRIORITES), {
      status: 200, headers: { 'Content-Type': 'application/json' },
    });
  }),

  // GET /api/triplets/search?q=
  http.get(`${BASE}/api/triplets/search`, async ({ request }) => {
    await delay(250);
    const q = new URL(request.url).searchParams.get('q')?.toLowerCase() ?? '';
    const triplets = [
      { id: 1, nom: 'Dupont', prenom: 'Jean', libelleFunction: 'Directeur Général', organisme: 'Mairie de Lyon', ville: 'Lyon', email: 'jean.dupont@mairie-lyon.fr', telephone: '04 72 10 30 00', type: 'personne' },
      { id: 2, nom: 'Leblanc', prenom: 'Marie', libelleFunction: 'DRH', organisme: 'Préfecture du Rhône', ville: 'Lyon', email: 'm.leblanc@prefecture69.fr', telephone: '04 72 61 60 60', type: 'personne' },
      { id: 3, nom: 'Cabinet Dubois', libelleFunction: 'Avocats associés', organisme: 'Cabinet d\'avocats', ville: 'Lyon', email: 'contact@cabinet-dubois.fr', telephone: '04 78 33 44 55', type: 'organisme' },
      { id: 4, nom: 'Préfecture du Rhône', libelleFunction: 'Administration centrale', organisme: 'État', ville: 'Lyon', email: 'pref@rhone.gouv.fr', type: 'organisme' },
      { id: 5, nom: 'Bernard', prenom: 'Sophie', libelleFunction: 'Cheffe de projet', organisme: 'Grand Lyon Métropole', ville: 'Lyon', email: 's.bernard@grandlyon.com', type: 'personne' },
    ];
    const filtered = q ? triplets.filter(t =>
      t.nom.toLowerCase().includes(q) ||
      (t.organisme ?? '').toLowerCase().includes(q) ||
      (t.email ?? '').toLowerCase().includes(q)
    ) : triplets.slice(0, 4);
    return new HttpResponse(JSON.stringify(filtered), {
      status: 200, headers: { 'Content-Type': 'application/json' },
    });
  }),
];
