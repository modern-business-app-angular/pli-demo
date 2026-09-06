import { http, HttpResponse } from 'msw';
import { db } from '../db';

import { API_BASE as BASE } from '../mock-origin';

// ── Seed data ─────────────────────────────────────────────────

const civilites = db.collection('civilites', [
  { id: 1, libelle: 'Monsieur' },
  { id: 2, libelle: 'Madame' },
  { id: 3, libelle: 'Docteur' },
  { id: 4, libelle: 'Professeur' },
]);

const criticites = db.collection('criticites', [
  { id: 1, libelle: 'Normal' },
  { id: 2, libelle: 'Urgent' },
  { id: 3, libelle: 'Très urgent' },
]);

const priorites = db.collection('priorites', [
  { id: 1, libelle: 'Basse',   isDefault: false },
  { id: 2, libelle: 'Normale', isDefault: true  },
  { id: 3, libelle: 'Haute',   isDefault: false },
  { id: 4, libelle: 'Critique',isDefault: false },
]);

const natures = db.collection('natures', [
  { id: 1, libelle: 'Courrier administratif', nbjDtLim: 15 },
  { id: 2, libelle: 'Réclamation',            nbjDtLim: 30 },
  { id: 3, libelle: 'Demande de renseignement', nbjDtLim: 10 },
  { id: 4, libelle: 'Signalement',            nbjDtLim: 7  },
]);

const fonctions = db.collection('fonctions', [
  { id: 'DGA',      libelle: 'Directeur Général Adjoint', module: 'Administration' },
  { id: 'CHEF_SRV', libelle: 'Chef de service',           module: 'Courriers' },
  { id: 'AGENT',    libelle: 'Agent',                     module: 'Courriers' },
]);

const joursFeries = db.collection('joursFeries', [
  { jour: '2026-01-01', libelle: 'Jour de l\'An' },
  { jour: '2026-04-06', libelle: 'Lundi de Pâques' },
  { jour: '2026-05-01', libelle: 'Fête du Travail' },
  { jour: '2026-05-08', libelle: 'Victoire 1945' },
  { jour: '2026-05-14', libelle: 'Ascension' },
  { jour: '2026-05-25', libelle: 'Lundi de Pentecôte' },
  { jour: '2026-07-14', libelle: 'Fête Nationale' },
  { jour: '2026-08-15', libelle: 'Assomption' },
  { jour: '2026-11-01', libelle: 'Toussaint' },
  { jour: '2026-11-11', libelle: 'Armistice' },
  { jour: '2026-12-25', libelle: 'Noël' },
]);

const etatsClasseur = db.collection('etatsClasseur', [
  { id: 1, libelle: 'Ouvert',   type: 'CLS', valeur: 1 },
  { id: 2, libelle: 'Fermé',    type: 'CLS', valeur: 2 },
  { id: 3, libelle: 'Archivé',  type: 'CLS', valeur: 3 },
]);

const etatsElements = db.collection('etatsElements', [
  { id: 1, libelle: 'En cours',  type: 'ELT', valeur: 1 },
  { id: 2, libelle: 'Transmis',  type: 'ELT', valeur: 2 },
  { id: 3, libelle: 'Terminé',   type: 'ELT', valeur: 3 },
  { id: 4, libelle: 'Clôturé',   type: 'ELT', valeur: 4 },
]);

const objets = db.collection('objets', [
  { id: 1, libelleC: 'RECL',  libelleL: 'Réclamation',              type: 'TOU' },
  { id: 2, libelleC: 'INFO',  libelleL: 'Demande d\'information',   type: 'TOU' },
  { id: 3, libelleC: 'SIGN',  libelleL: 'Signalement',              type: 'REC' },
  { id: 4, libelleC: 'REPONSE', libelleL: 'Réponse',               type: 'PRO' },
]);

const villes = db.collection('villes', [
  { id: 1, codePostal: '75001', ville: 'Paris 1er',  insee: 75101 },
  { id: 2, codePostal: '69001', ville: 'Lyon 1er',   insee: 69381 },
  { id: 3, codePostal: '13001', ville: 'Marseille 1er', insee: 13055 },
  { id: 4, codePostal: '31000', ville: 'Toulouse',   insee: 31555 },
]);

const rues = db.collection('rues', [
  { id: 1, motDirec: 'Rue',     nomRue: 'de Rivoli',    identif: '0001', villeId: 1, villeNom: 'Paris 1er' },
  { id: 2, motDirec: 'Avenue',  nomRue: 'des Champs-Élysées', identif: '0002', villeId: 1, villeNom: 'Paris 1er' },
  { id: 3, motDirec: 'Cours',   nomRue: 'Mirabeau',     identif: '0003', villeId: 3, villeNom: 'Marseille 1er' },
]);

const delegations = db.collection('delegations', [
  { id: 1, delegateurId: 1, delegateurNom: 'Martin Jean', delegueId: 2, delegueNom: 'Dupont Marie', debut: '2026-01-01', fin: '2026-03-31' },
]);

const dossiers = db.collection('dossiers', [
  { id: 1, mot: 'Travaux rue de la Paix',    datLim: '2026-06-30', serviceId: 1, serviceNom: 'Direction Générale' },
  { id: 2, mot: 'Budget 2026',               datLim: '2026-12-31', serviceId: 2, serviceNom: 'Service Finances' },
  { id: 3, mot: 'Plan local d\'urbanisme',   datLim: null,         serviceId: 1, serviceNom: 'Direction Générale' },
]);

// ── Helper: simple CRUD factory ───────────────────────────────

function crudHandlers<T extends { id?: number | string }>(
  path: string,
  store: T[],
  idKey = 'id' as keyof T
) {
  return [
    http.get(`${BASE}${path}`, () => HttpResponse.json(store)),
    http.post(`${BASE}${path}`, async ({ request }) => {
      const body = await request.json() as T;
      const newItem = { ...body, [idKey]: Date.now() } as T;
      store.push(newItem);
      return HttpResponse.json(newItem, { status: 201 });
    }),
    http.put(`${BASE}${path}/:id`, async ({ request, params }) => {
      const body = await request.json() as Partial<T>;
      const idx = store.findIndex((x) => String(x[idKey]) === String(params['id']));
      if (idx >= 0) store[idx] = { ...store[idx], ...body };
      return HttpResponse.json(store[idx]);
    }),
    http.delete(`${BASE}${path}/:id`, ({ params }) => {
      const idx = store.findIndex((x) => String(x[idKey]) === String(params['id']));
      if (idx >= 0) store.splice(idx, 1);
      return new HttpResponse(null, { status: 204 });
    }),
  ];
}

// ── Chronos seed ──────────────────────────────────────────────
const chronos = db.collection('chronos', [
  {
    id: 1, nom: 'Arrivée', type: 'RECU', prefixe: 'A', suffixe: '', separateur: '-',
    sigleService: false, nbChiffresAnnee: 4, nbChiffresNumero: 5,
    resumeLabel: 'Commentaires', tripletLabel: 'Client', objetLabel: 'Objet',
    reference: '', dateArriveeLabel: "Date d'arrivée", showDateArrivee: true,
    dateExpeditionLabel: "Date d'expédition", showDateExpedition: false,
    dateLimiteLabel: 'Date limite', showDateLimite: true,
    premiereAffectation: 'CONNECTE', deuxiemeAffectation: 'SUIVEUSE',
    nbJoursDateLimite: 0, criticiteLabel: 'Client du Distrib', showCriticite: true,
    sansJoursFeries: true, enJoursOuvres: true, clotureCopies: true,
    isPublic: true, tri: 1, acces: 'SERVICE', hierarchie: '',
    descriptif: 'Courrier entrant', hasPriorite: true, hasNature: false,
    hasDoleances: true, specifique: '', coEmetteur: '', showCoEmetteur: true,
    tripletNom: '', tripletPrenom: '', tripletFonction: '', tripletOrganisme: '',
    affichageTickets: false,
  },
  {
    id: 2, nom: 'Départ', type: 'SORTANT', prefixe: 'D', suffixe: '', separateur: '-',
    sigleService: false, nbChiffresAnnee: 4, nbChiffresNumero: 5,
    resumeLabel: 'Objet', tripletLabel: 'Destinataire', objetLabel: 'Objet',
    reference: '', dateArriveeLabel: "Date d'arrivée", showDateArrivee: false,
    dateExpeditionLabel: "Date d'expédition", showDateExpedition: true,
    dateLimiteLabel: 'Date limite', showDateLimite: false,
    premiereAffectation: 'CONNECTE', deuxiemeAffectation: 'AUCUN',
    nbJoursDateLimite: 0, criticiteLabel: '', showCriticite: false,
    sansJoursFeries: false, enJoursOuvres: false, clotureCopies: false,
    isPublic: true, tri: 2, acces: 'SERVICE', hierarchie: '',
    descriptif: 'Courrier sortant', hasPriorite: true, hasNature: true,
    hasDoleances: false, specifique: '', coEmetteur: '', showCoEmetteur: false,
    tripletNom: '', tripletPrenom: '', tripletFonction: '', tripletOrganisme: '',
    affichageTickets: false,
  },
  {
    id: 3, nom: 'Interne', type: 'INTERNE', prefixe: 'I', suffixe: '', separateur: '/',
    sigleService: true, nbChiffresAnnee: 2, nbChiffresNumero: 4,
    resumeLabel: 'Note', tripletLabel: 'Émetteur', objetLabel: 'Objet',
    reference: '', dateArriveeLabel: 'Date', showDateArrivee: true,
    dateExpeditionLabel: "Date d'expédition", showDateExpedition: false,
    dateLimiteLabel: 'Échéance', showDateLimite: true,
    premiereAffectation: 'CONNECTE', deuxiemeAffectation: 'AUCUN',
    nbJoursDateLimite: 5, criticiteLabel: '', showCriticite: false,
    sansJoursFeries: true, enJoursOuvres: true, clotureCopies: false,
    isPublic: false, tri: 3, acces: 'UTILISATEUR', hierarchie: '',
    descriptif: 'Courrier interne', hasPriorite: false, hasNature: false,
    hasDoleances: false, specifique: '', coEmetteur: '', showCoEmetteur: false,
    tripletNom: '', tripletPrenom: '', tripletFonction: '', tripletOrganisme: '',
    affichageTickets: false,
  },
]);

// ── Territoire seed ───────────────────────────────────────────
const territoireNiveaux = db.collection('territoireNiveaux', [
  { niveau: 1, nom: 'Quartier' },
  { niveau: 2, nom: 'Secteur' },
  { niveau: 3, nom: 'Zone' },
  { niveau: 4, nom: 'Territoire 4' },
  { niveau: 5, nom: 'Territoire 5' },
  { niveau: 6, nom: 'Territoire 6' },
  { niveau: 7, nom: 'Territoire 7' },
  { niveau: 8, nom: 'Territoire 8' },
  { niveau: 9, nom: 'Territoire 9' },
]);

const territoireElements = db.collection('territoireElements', [
  { id:  1, niveau: 1, cle: 'Q01',  labelCourt: 'Nord',    labelLong: 'Quartier Nord',            rang: 1, adresseCount: 42 },
  { id:  2, niveau: 1, cle: 'Q02',  labelCourt: 'Sud',     labelLong: 'Quartier Sud',             rang: 2, adresseCount: 38 },
  { id:  3, niveau: 1, cle: 'Q03',  labelCourt: 'Est',     labelLong: 'Quartier Est',             rang: 3, adresseCount: 25 },
  { id:  4, niveau: 1, cle: 'Q04',  labelCourt: 'Ouest',   labelLong: 'Quartier Ouest',           rang: 4, adresseCount: 19 },
  { id:  5, niveau: 2, cle: 'S01',  labelCourt: 'Centre',  labelLong: 'Secteur Centre-Ville',     rang: 1, adresseCount: 67 },
  { id:  6, niveau: 2, cle: 'S02',  labelCourt: 'Périph',  labelLong: 'Secteur Périphérique',     rang: 2, adresseCount: 31 },
  { id:  7, niveau: 2, cle: 'S03',  labelCourt: 'Indus',   labelLong: 'Zone Industrielle',        rang: 3, adresseCount: 12 },
  { id:  8, niveau: 3, cle: 'Z001', labelCourt: 'ZA',      labelLong: 'Zone A',                   rang: 1, adresseCount:  0 },
  { id:  9, niveau: 3, cle: 'Z002', labelCourt: 'ZB',      labelLong: 'Zone B',                   rang: 2, adresseCount:  0 },
]);

// ── Sectorisation seed ────────────────────────────────────────
const sectorisations = db.collection('sectorisations', [
  { id: 1, nomRue: 'Rue de la Paix',      codePostal: '75001', ville: 'Paris',   codeVoie: 'B041', motVoie: 'Rue',        parite: 'P', numDebut: 1,  typeDebut: '',  numFin: 99,   typeFin: '',  geo1: 'Q01', geo2: 'S01' },
  { id: 2, nomRue: 'Rue de la Paix',      codePostal: '75001', ville: 'Paris',   codeVoie: 'B041', motVoie: 'Rue',        parite: 'I', numDebut: 2,  typeDebut: '',  numFin: 98,   typeFin: '',  geo1: 'Q01', geo2: 'S01' },
  { id: 3, nomRue: 'Avenue des Fleurs',   codePostal: '75008', ville: 'Paris',   codeVoie: 'F012', motVoie: 'Avenue',     parite: 'T', numDebut: 0,  typeDebut: '',  numFin: 9999, typeFin: '',  geo1: 'Q02', geo2: 'S02', geo3: 'Z001' },
  { id: 4, nomRue: 'Boulevard du Marché', codePostal: '75003', ville: 'Paris',   codeVoie: 'M087', motVoie: 'Boulevard',  parite: 'I', numDebut: 1,  typeDebut: '',  numFin: 49,   typeFin: 'B', geo1: 'Q03' },
  { id: 5, nomRue: 'Boulevard du Marché', codePostal: '75003', ville: 'Paris',   codeVoie: 'M087', motVoie: 'Boulevard',  parite: 'P', numDebut: 2,  typeDebut: '',  numFin: 50,   typeFin: '',  geo1: 'Q04', geo2: 'S03' },
  { id: 6, nomRue: 'Impasse Lefèvre',     codePostal: '75011', ville: 'Paris',   codeVoie: 'L023', motVoie: 'Impasse',    parite: 'T', numDebut: 0,  typeDebut: '',  numFin: 9999, typeFin: '',  geo1: 'Q01' },
] as any[]);

// ── Services seed ─────────────────────────────────────────────
const services = db.collection('services', [
  { id: 1, nom: 'Direction Générale',         sigle: 'DG',  actif: true, parentId: null, parentNom: null,                   bal: 'dg@mairie.fr',          hierarchie: 'DG', popCompte: '',     popMotDePasse: '', popServeur: '', imprimante: 'PRINT-DG',   etiquettes: false, logoPdf: '' },
  { id: 2, nom: 'Direction de la Demande',    sigle: 'DD',  actif: true, parentId: 1,    parentNom: 'Direction Générale',   bal: 'demande@mairie.fr',     hierarchie: 'DD', popCompte: '',     popMotDePasse: '', popServeur: '', imprimante: '',            etiquettes: false, logoPdf: '' },
  { id: 3, nom: 'Service Courrier',           sigle: 'SC',  actif: true, parentId: 1,    parentNom: 'Direction Générale',   bal: 'courrier@mairie.fr',    hierarchie: 'SC', popCompte: 'pop_courrier@mairie.fr', popMotDePasse: null, popServeur: 'mail.mairie.fr', imprimante: 'PRINT-SC', etiquettes: true, logoPdf: '/logos/sc.pdf' },
  { id: 4, nom: 'Service Informatique',       sigle: 'SI',  actif: true, parentId: 1,    parentNom: 'Direction Générale',   bal: 'info@mairie.fr',        hierarchie: 'SI', popCompte: '',     popMotDePasse: '', popServeur: '', imprimante: '',            etiquettes: false, logoPdf: '' },
  { id: 5, nom: 'Cabinet du Maire',           sigle: 'CAB', actif: true, parentId: null, parentNom: null,                   bal: 'cabinet@mairie.fr',     hierarchie: 'CAB', popCompte: '',    popMotDePasse: '', popServeur: '', imprimante: 'PRINT-CAB',  etiquettes: false, logoPdf: '' },
  { id: 6, nom: 'Département Urbanisme',      sigle: 'URB', actif: true, parentId: 1,    parentNom: 'Direction Générale',   bal: 'urbanisme@mairie.fr',   hierarchie: 'URB', popCompte: '',    popMotDePasse: '', popServeur: '', imprimante: '',            etiquettes: false, logoPdf: '' },
]);

// ── Personnels seed ────────────────────────────────────────────
const personnels = db.collection('personnels', [
  {
    id: 1, nom: 'ADMIN', prenom: '-', login: 'ADMIN', serviceId: 5, serviceNom: 'Cabinet du Maire',
    email: 'courrier.entrant@ville-exemple.fr', estBalService: false, estListe: false, estResponsable: false, estBal: true, estAgent: false,
    actif: true, connecte: true, admin: true, lectureSeule: false, parDefaut: false, fonctionsAvancees: true,
    adminMaqPubliques: true, adminMaqServices: true, creationClasseur: true, creationPersonne: true,
    creationOrganisme: true, droitSuppression: true, modifHierarchie: true, voitBalService: true,
    droitSuppressionSas: true, nonEnvoiCourrielSuiveuse: false, droitProtocole: true, modifInfosSpecifiques: true,
    popActif: true, popCompte: 'courrier.entrant@ville-exemple.fr', popServeur: 'mail.ville-exemple.fr', popMotDePasse: null, voirSas: true,
    smtpCompte: 'courrier.entrant@ville-exemple.fr', smtpMotDePasse: null,
    tripletNom: null, tripletPrenom: null, tripletFonction: null, tripletOrganisme: null,
  },
  {
    id: 2, nom: 'DUPONT', prenom: 'Marie', login: 'mdupont', serviceId: 2, serviceNom: 'Direction de la Demande',
    email: 'marie.dupont@mairie.fr', estBalService: false, estListe: false, estResponsable: true, estBal: false, estAgent: true,
    actif: true, connecte: true, admin: false, lectureSeule: false, parDefaut: true, fonctionsAvancees: false,
    adminMaqPubliques: false, adminMaqServices: true, creationClasseur: true, creationPersonne: true,
    creationOrganisme: false, droitSuppression: false, modifHierarchie: true, voitBalService: true,
    droitSuppressionSas: false, nonEnvoiCourrielSuiveuse: false, droitProtocole: false, modifInfosSpecifiques: false,
    popActif: false, popCompte: null, popServeur: null, popMotDePasse: null, voirSas: false,
    smtpCompte: null, smtpMotDePasse: null,
    tripletNom: 'DUPONT', tripletPrenom: 'Marie', tripletFonction: 'Chargée de mission', tripletOrganisme: 'Mairie',
  },
  {
    id: 3, nom: 'MARTIN', prenom: 'Jean-Pierre', login: 'jpmartin', serviceId: 3, serviceNom: 'Service Courrier',
    email: 'jp.martin@mairie.fr', estBalService: true, estListe: false, estResponsable: false, estBal: false, estAgent: true,
    actif: true, connecte: false, admin: false, lectureSeule: false, parDefaut: false, fonctionsAvancees: false,
    adminMaqPubliques: false, adminMaqServices: false, creationClasseur: false, creationPersonne: false,
    creationOrganisme: false, droitSuppression: false, modifHierarchie: false, voitBalService: true,
    droitSuppressionSas: false, nonEnvoiCourrielSuiveuse: false, droitProtocole: false, modifInfosSpecifiques: false,
    popActif: false, popCompte: null, popServeur: null, popMotDePasse: null, voirSas: false,
    smtpCompte: null, smtpMotDePasse: null,
    tripletNom: null, tripletPrenom: null, tripletFonction: null, tripletOrganisme: null,
  },
  {
    id: 4, nom: 'BERNARD', prenom: 'Sophie', login: 'sbernard', serviceId: 4, serviceNom: 'Service Informatique',
    email: 'sophie.bernard@mairie.fr', estBalService: false, estListe: false, estResponsable: false, estBal: false, estAgent: true,
    actif: true, connecte: true, admin: false, lectureSeule: false, parDefaut: false, fonctionsAvancees: true,
    adminMaqPubliques: true, adminMaqServices: true, creationClasseur: true, creationPersonne: true,
    creationOrganisme: true, droitSuppression: false, modifHierarchie: false, voitBalService: false,
    droitSuppressionSas: false, nonEnvoiCourrielSuiveuse: false, droitProtocole: false, modifInfosSpecifiques: false,
    popActif: false, popCompte: null, popServeur: null, popMotDePasse: null, voirSas: false,
    smtpCompte: null, smtpMotDePasse: null,
    tripletNom: null, tripletPrenom: null, tripletFonction: null, tripletOrganisme: null,
  },
  {
    id: 5, nom: 'SAS COURRIER', prenom: '-', login: 'sas-courrier', serviceId: 3, serviceNom: 'Service Courrier',
    email: 'sas.courrier@ville-exemple.fr', estBalService: true, estListe: true, estResponsable: false, estBal: true, estAgent: false,
    actif: true, connecte: false, admin: false, lectureSeule: false, parDefaut: false, fonctionsAvancees: false,
    adminMaqPubliques: false, adminMaqServices: false, creationClasseur: false, creationPersonne: false,
    creationOrganisme: false, droitSuppression: false, modifHierarchie: false, voitBalService: true,
    droitSuppressionSas: false, nonEnvoiCourrielSuiveuse: false, droitProtocole: false, modifInfosSpecifiques: false,
    popActif: true, popCompte: 'sas.courrier@ville-exemple.fr', popServeur: 'mail.ville-exemple.fr', popMotDePasse: null, voirSas: true,
    smtpCompte: 'sas.courrier@ville-exemple.fr', smtpMotDePasse: null,
    tripletNom: null, tripletPrenom: null, tripletFonction: null, tripletOrganisme: null,
  },
  {
    id: 6, nom: 'LECLERC', prenom: 'Paul', login: 'pleclerc', serviceId: 6, serviceNom: 'Département Urbanisme',
    email: null, estBalService: false, estListe: false, estResponsable: false, estBal: false, estAgent: true,
    actif: false, connecte: false, admin: false, lectureSeule: true, parDefaut: false, fonctionsAvancees: false,
    adminMaqPubliques: false, adminMaqServices: false, creationClasseur: false, creationPersonne: false,
    creationOrganisme: false, droitSuppression: false, modifHierarchie: false, voitBalService: false,
    droitSuppressionSas: false, nonEnvoiCourrielSuiveuse: false, droitProtocole: false, modifInfosSpecifiques: false,
    popActif: false, popCompte: null, popServeur: null, popMotDePasse: null, voirSas: false,
    smtpCompte: null, smtpMotDePasse: null,
    tripletNom: null, tripletPrenom: null, tripletFonction: null, tripletOrganisme: null,
  },
]);

// ── Export handlers ───────────────────────────────────────────

export const codificationsHandlers = [
  // Stats (must be before individual CRUD routes)
  http.get(`${BASE}/codifications/stats`, () => HttpResponse.json({
    civilites:        civilites.length,
    criticites:       criticites.length,
    priorites:        priorites.length,
    natures:          natures.length,
    fonctions:        fonctions.length,
    'jours-feries':   joursFeries.length,
    'etats-classeur': etatsClasseur.length,
    'etats-elements': etatsElements.length,
    objets:           objets.length,
    villes:           villes.length,
    rues:             rues.length,
    delegations:      delegations.length,
    dossiers:         dossiers.length,
    chronos:          chronos.length,
    services:         services.length,
    personnels:       personnels.length,
    territoires:      territoireElements.length,
    sectorisation:    sectorisations.length,
  })),

  // Sectorisations CRUD
  http.get(`${BASE}/sectorisations`, () => HttpResponse.json(sectorisations)),

  http.post(`${BASE}/sectorisations`, async ({ request }) => {
    const body = await request.json() as Record<string, unknown>;
    const created = { ...body, id: db.nextId(sectorisations) };
    sectorisations.push(created);
    return HttpResponse.json(created, { status: 201 });
  }),

  http.put(`${BASE}/sectorisations/:id`, async ({ request, params }) => {
    const body = await request.json() as Record<string, unknown>;
    const id = Number(params['id']);
    db.replace(sectorisations, sectorisations.map(s => s.id === id ? { ...s, ...body, id } : s));
    return HttpResponse.json(sectorisations.find(s => s.id === id));
  }),

  http.delete(`${BASE}/sectorisations/:id`, ({ params }) => {
    const id = Number(params['id']);
    db.replace(sectorisations, sectorisations.filter(s => s.id !== id));
    return new HttpResponse(null, { status: 204 });
  }),

  // Territoire — Affectation des adresses
  http.post(`${BASE}/territoire-niveaux/:niveau/affecter-adresses`, async ({ request, params }) => {
    const body = await request.json() as { updateAll: boolean };
    const niveau = Number(params['niveau']);
    const count = territoireElements.filter(e => e.niveau === niveau).length;
    const updated = count * (body.updateAll
      ? Math.floor(Math.random() * 30 + 10)
      : Math.floor(Math.random() * 15 + 3));
    return HttpResponse.json({ updated });
  }),

  // Territoire niveaux
  http.get(`${BASE}/territoire-niveaux`, () => HttpResponse.json(territoireNiveaux)),
  http.patch(`${BASE}/territoire-niveaux/:niveau`, async ({ request, params }) => {
    const body = await request.json() as { nom: string };
    const idx = territoireNiveaux.findIndex(n => n.niveau === Number(params['niveau']));
    if (idx >= 0) territoireNiveaux[idx] = { ...territoireNiveaux[idx], ...body };
    return HttpResponse.json(territoireNiveaux[idx]);
  }),

  // Territoire elements (filterable by ?niveau=N)
  http.get(`${BASE}/territoire-elements`, ({ request }) => {
    const niveau = new URL(request.url).searchParams.get('niveau');
    const result = niveau
      ? territoireElements.filter(e => e.niveau === Number(niveau))
      : territoireElements;
    return HttpResponse.json(result);
  }),
  http.post(`${BASE}/territoire-elements`, async ({ request }) => {
    const body = await request.json() as Record<string, unknown>;
    const el = { ...body, id: Date.now(), adresseCount: 0 };
    territoireElements.push(el as typeof territoireElements[0]);
    return HttpResponse.json(el, { status: 201 });
  }),
  http.put(`${BASE}/territoire-elements/:id`, async ({ request, params }) => {
    const body = await request.json() as Partial<typeof territoireElements[0]>;
    const idx = territoireElements.findIndex(e => e.id === Number(params['id']));
    if (idx >= 0) territoireElements[idx] = { ...territoireElements[idx], ...body };
    return HttpResponse.json(territoireElements[idx]);
  }),
  http.delete(`${BASE}/territoire-elements/:id`, ({ params }) => {
    const idx = territoireElements.findIndex(e => e.id === Number(params['id']));
    if (idx >= 0) territoireElements.splice(idx, 1);
    return new HttpResponse(null, { status: 204 });
  }),

  ...crudHandlers('/civilites',      civilites),
  ...crudHandlers('/criticites',     criticites),
  ...crudHandlers('/priorites',      priorites),
  ...crudHandlers('/natures',        natures),
  ...crudHandlers('/fonctions',      fonctions, 'id'),
  ...crudHandlers('/etats-classeur', etatsClasseur),
  ...crudHandlers('/etats-elements', etatsElements),
  ...crudHandlers('/objets',         objets),
  ...crudHandlers('/villes',         villes),
  ...crudHandlers('/rues',           rues),
  ...crudHandlers('/delegations',    delegations),
  ...crudHandlers('/dossiers',       dossiers),
  ...crudHandlers('/chronos',       chronos),
  ...crudHandlers('/services',      services),

  // Test mail connection (must be before crudHandlers to avoid 404 match)
  http.post(`${BASE}/personnels/test-mail`, async ({ request }) => {
    const body = await request.json() as Record<string, string>;
    const hasCompte = (body['compte'] ?? '').length > 0;
    if (!hasCompte) {
      return HttpResponse.json({ message: 'Compte utilisateur requis' }, { status: 400 });
    }
    // Simulate a short network delay
    await new Promise(r => setTimeout(r, 800));
    return HttpResponse.json({ message: 'Connexion réussie' });
  }),

  ...crudHandlers('/personnels',    personnels),
  // JourFerie uses date string as PK
  http.get(`${BASE}/jours-feries`, () => HttpResponse.json(joursFeries)),
  http.post(`${BASE}/jours-feries`, async ({ request }) => {
    const body = await request.json() as (typeof joursFeries)[0];
    joursFeries.push(body);
    return HttpResponse.json(body, { status: 201 });
  }),
  http.put(`${BASE}/jours-feries/:jour`, async ({ request, params }) => {
    const body = await request.json() as Partial<(typeof joursFeries)[0]>;
    const idx = joursFeries.findIndex((x) => x.jour === params['jour']);
    if (idx >= 0) joursFeries[idx] = { ...joursFeries[idx], ...body };
    return HttpResponse.json(joursFeries[idx]);
  }),
  http.delete(`${BASE}/jours-feries/:jour`, ({ params }) => {
    const idx = joursFeries.findIndex((x) => x.jour === params['jour']);
    if (idx >= 0) joursFeries.splice(idx, 1);
    return new HttpResponse(null, { status: 204 });
  }),
];
