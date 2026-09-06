import { http, HttpResponse } from 'msw';
import { db } from '../db';

import { API_BASE as BASE } from '../mock-origin';

// ── Seed data ─────────────────────────────────────────────────

const demandes = db.collection('demandes', [
  {
    id: 1,
    emetteur: 'jean.dupont@gmail.com',
    emetteurNom: 'Jean Dupont',
    destinataire: 'accueil@mairie.fr',
    objet: 'Demande de renseignement sur les horaires',
    corps: '<p>Bonjour,</p><p>Pourriez-vous m\'indiquer les horaires d\'ouverture du service état civil ?</p><p>Cordialement,<br>Jean Dupont</p>',
    type: 'mail',
    statut: 'nouveau',
    dateReception: '2026-03-19T08:12:00Z',
  },
  {
    id: 2,
    emetteur: 'marie.martin@outlook.fr',
    emetteurNom: 'Marie Martin',
    destinataire: 'accueil@mairie.fr',
    objet: 'Réclamation - Travaux bruyants rue de la Paix',
    corps: '<p>Madame, Monsieur,</p><p>Je me permets de vous contacter au sujet des travaux qui se déroulent rue de la Paix depuis plusieurs semaines. Le bruit est incessant et dépasse largement les horaires autorisés.</p><p>Je souhaite déposer une réclamation formelle.</p>',
    type: 'mail',
    statut: 'nouveau',
    dateReception: '2026-03-19T09:34:00Z',
  },
  {
    id: 3,
    emetteur: 'contact@association-sportive.org',
    emetteurNom: 'Association Sportive Municipale',
    destinataire: 'sport@mairie.fr',
    objet: 'Demande de subvention 2026',
    corps: '<p>Bonjour,</p><p>Dans le cadre de notre activité sportive, nous sollicitons une subvention municipale pour l\'année 2026. Veuillez trouver ci-joint notre dossier de demande.</p>',
    type: 'mail',
    statut: 'en_cours',
    dateReception: '2026-03-18T14:22:00Z',
    elementId: 1042,
    elementRef: '2026-1042',
  },
  {
    id: 4,
    emetteur: '0612345678',
    emetteurNom: 'Inconnu',
    destinataire: 'sms-accueil',
    objet: 'SMS entrant',
    corps: 'Bonjour, je voudrais un RDV pour renouveler ma carte d\'identité svp',
    type: 'sms',
    statut: 'nouveau',
    dateReception: '2026-03-19T10:05:00Z',
  },
  {
    id: 5,
    emetteur: 'formulaire-web',
    emetteurNom: 'Paul Bernard',
    destinataire: 'urbanisme@mairie.fr',
    objet: 'Demande de permis de construire - 12 rue des Fleurs',
    corps: '<p><strong>Nom :</strong> Paul Bernard</p><p><strong>Adresse du projet :</strong> 12 rue des Fleurs, 75001 Paris</p><p><strong>Nature des travaux :</strong> Extension de maison (30 m²)</p><p><strong>Message :</strong> Je souhaite déposer une demande de permis de construire pour agrandir ma maison.</p>',
    type: 'formulaire',
    statut: 'en_cours',
    dateReception: '2026-03-17T11:00:00Z',
    elementId: 1038,
    elementRef: '2026-1038',
  },
  {
    id: 6,
    emetteur: 'sophie.leclerc@yahoo.fr',
    emetteurNom: 'Sophie Leclerc',
    destinataire: 'accueil@mairie.fr',
    objet: 'Problème de collecte des ordures ménagères',
    corps: '<p>Bonjour,</p><p>Depuis deux semaines, la collecte des ordures ménagères n\'est plus effectuée dans mon quartier (rue Victor Hugo). Pourriez-vous résoudre ce problème au plus vite ?</p>',
    type: 'mail',
    statut: 'traite',
    dateReception: '2026-03-15T08:44:00Z',
    elementId: 1031,
    elementRef: '2026-1031',
    reponse: {
      corps: 'Madame Leclerc,\n\nNous avons bien pris note de votre signalement et transmis l\'information au service de collecte. Le problème sera résolu sous 48h.\n\nCordialement,\nLe service accueil',
      date: '2026-03-15T14:30:00Z',
      par: 'Agent Accueil',
    },
  },
  {
    id: 7,
    emetteur: 'thomas.roux@gmail.com',
    emetteurNom: 'Thomas Roux',
    destinataire: 'accueil@mairie.fr',
    objet: 'Signalement dégradation voie publique',
    corps: '<p>Bonjour,</p><p>Je souhaitais signaler un trou important dans la chaussée au croisement de la rue Gambetta et de l\'avenue de la République, qui pourrait causer des accidents.</p>',
    type: 'mail',
    statut: 'nouveau',
    dateReception: '2026-03-19T11:20:00Z',
  },
  {
    id: 8,
    emetteur: 'guichet-physique',
    emetteurNom: 'Mme Élisabeth Fontaine',
    destinataire: 'accueil@mairie.fr',
    objet: 'Demande de logement social (guichet)',
    corps: '<p><strong>Prise en charge au guichet</strong></p><p>Mme Fontaine souhaite déposer une demande de logement social. Elle est venue en personne avec ses justificatifs.</p>',
    type: 'guichet',
    statut: 'en_cours',
    dateReception: '2026-03-18T09:00:00Z',
    elementId: 1040,
    elementRef: '2026-1040',
  },
  {
    id: 9,
    emetteur: 'nathalie.girard@hotmail.com',
    emetteurNom: 'Nathalie Girard',
    destinataire: 'culture@mairie.fr',
    objet: 'Inscription médiathèque - renseignements',
    corps: '<p>Bonjour,</p><p>Je souhaiterais savoir quels documents sont nécessaires pour m\'inscrire à la médiathèque municipale. Mes enfants (8 et 11 ans) souhaiteraient également s\'inscrire.</p>',
    type: 'mail',
    statut: 'traite',
    dateReception: '2026-03-14T16:05:00Z',
    reponse: {
      corps: 'Madame Girard,\n\nPour une inscription à la médiathèque, il vous faut : une pièce d\'identité, un justificatif de domicile et une photo.\nPour les enfants, le carnet de famille suffit.\n\nCordialement,\nLe service culturel',
      date: '2026-03-14T17:00:00Z',
      par: 'Agent Culture',
    },
  },
  {
    id: 10,
    emetteur: 'pierre.morel@entreprise.com',
    emetteurNom: 'Pierre Morel',
    destinataire: 'urbanisme@mairie.fr',
    objet: 'Demande de certificat d\'urbanisme',
    corps: '<p>Madame, Monsieur,</p><p>Dans le cadre d\'un projet d\'acquisition immobilière, je souhaite obtenir un certificat d\'urbanisme pour la parcelle A0042, cadastrée au 15 rue du Commerce.</p>',
    type: 'mail',
    statut: 'nouveau',
    dateReception: '2026-03-19T07:55:00Z',
  },
] as any[]);

let nextId = db.nextId(demandes, 11);
let nextElementId = Math.max(1050, ...demandes.map((d) => (d.elementId ?? 1049) + 1));

// ── Handlers ──────────────────────────────────────────────────

export const demandesHandlers = [
  // GET list
  http.get(`${BASE}/demandes`, ({ request }) => {
    const url = new URL(request.url);
    const statut = url.searchParams.get('statut');
    const search = url.searchParams.get('search')?.toLowerCase();

    let result = [...demandes];
    if (statut) result = result.filter((d) => d.statut === statut);
    if (search) {
      result = result.filter(
        (d) =>
          d.emetteur.toLowerCase().includes(search) ||
          d.objet.toLowerCase().includes(search) ||
          (d.emetteurNom ?? '').toLowerCase().includes(search)
      );
    }
    return HttpResponse.json(result);
  }),

  // GET single
  http.get(`${BASE}/demandes/:id`, ({ params }) => {
    const id = Number(params['id']);
    const demande = demandes.find((d) => d.id === id);
    if (!demande) return new HttpResponse(null, { status: 404 });
    return HttpResponse.json(demande);
  }),

  // POST pull from POP
  http.post(`${BASE}/demandes/pull-pop`, () => {
    const newItems = [
      {
        id: nextId++,
        emetteur: `citoyen${nextId}@example.com`,
        emetteurNom: `Citoyen ${nextId}`,
        destinataire: 'accueil@mairie.fr',
        objet: `Nouvelle demande reçue du serveur POP #${nextId}`,
        corps: '<p>Bonjour, ceci est une nouvelle demande récupérée depuis le serveur POP.</p>',
        type: 'mail',
        statut: 'nouveau',
        dateReception: new Date().toISOString(),
      },
      {
        id: nextId++,
        emetteur: `usager${nextId}@example.com`,
        emetteurNom: `Usager ${nextId}`,
        destinataire: 'accueil@mairie.fr',
        objet: `Demande urgente POP #${nextId}`,
        corps: '<p>Madame, Monsieur, j\'ai besoin d\'une réponse urgente concernant mon dossier.</p>',
        type: 'mail',
        statut: 'nouveau',
        dateReception: new Date().toISOString(),
      },
    ];
    demandes.push(...newItems);
    return HttpResponse.json({ count: newItems.length });
  }),

  // PUT traiter
  http.put(`${BASE}/demandes/:id/traiter`, async ({ request, params }) => {
    const id = Number(params['id']);
    const body = await request.json() as Record<string, unknown>;
    const elementId = nextElementId++;
    const elementRef = `2026-${elementId}`;
    db.replace(demandes, demandes.map((d) =>
      d.id === id
        ? { ...d, statut: 'en_cours', elementId, elementRef, traiterMeta: body }
        : d
    ));
    return HttpResponse.json(demandes.find((d) => d.id === id));
  }),

  // PUT repondre
  http.put(`${BASE}/demandes/:id/repondre`, async ({ request, params }) => {
    const id = Number(params['id']);
    const body = await request.json() as Record<string, unknown>;
    const reponse = {
      corps: body['corps'] as string,
      date: new Date().toISOString(),
      par: 'Agent connecté',
    };
    db.replace(demandes, demandes.map((d) =>
      d.id === id ? { ...d, statut: 'traite', reponse } : d
    ));
    return HttpResponse.json(demandes.find((d) => d.id === id));
  }),
];
