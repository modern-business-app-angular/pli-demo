import { http, HttpResponse } from 'msw';
import { db } from '../db';

import { API_BASE as BASE } from '../mock-origin';

// ── Seed data ─────────────────────────────────────────────────

const searchModels = db.collection('searchModels', [
  {
    id: 1,
    nom: 'Toutes les actions',
    libelle: 'Actions',
    type: 'actions',
    visibility: 'public',
    isSystem: true,
    capabilities: { alerte: false, colonnes: true, grouper: false, tableur: true, imprimer: true, filtrer: true, sql: false, mail: false, selection: true, nbLignes: true, favorite: false },
    filters: [], columns: [],
  },
  {
    id: 2,
    nom: 'Courriers en retard',
    libelle: 'En retard',
    type: 'courriers',
    visibility: 'public',
    isSystem: false,
    capabilities: { alerte: true, colonnes: true, grouper: true, tableur: true, imprimer: true, filtrer: true, sql: false, mail: true, selection: true, nbLignes: true, favorite: true },
    filters: [{ id: 1, modelId: 2, columnKey: 'statut', columnLabel: 'Statut', operator: 'eq', value: 'retard' }],
    columns: [],
  },
  {
    id: 3,
    nom: 'Personnels actifs',
    libelle: 'Personnels',
    type: 'personnels',
    visibility: 'service',
    serviceId: 1,
    serviceNom: 'Direction Générale',
    isSystem: false,
    capabilities: { alerte: false, colonnes: true, grouper: false, tableur: true, imprimer: true, filtrer: true, sql: false, mail: false, selection: false, nbLignes: true, favorite: false },
    filters: [{ id: 2, modelId: 3, columnKey: 'actif', columnLabel: 'Actif', operator: 'eq', value: 'true' }],
    columns: [],
  },
  {
    id: 4,
    nom: 'Services actifs',
    libelle: 'Services',
    type: 'services',
    visibility: 'public',
    isSystem: true,
    capabilities: { alerte: false, colonnes: true, grouper: false, tableur: false, imprimer: false, filtrer: true, sql: false, mail: false, selection: false, nbLignes: true, favorite: false },
    filters: [], columns: [],
  },
  {
    id: 5,
    nom: 'Éléments nature Réclamation',
    libelle: 'Réclamations',
    type: 'elements',
    visibility: 'private',
    isSystem: false,
    ownerId: 1,
    ownerNom: 'Admin',
    capabilities: { alerte: true, colonnes: true, grouper: true, tableur: true, imprimer: true, filtrer: true, sql: true, mail: true, selection: true, nbLignes: true, favorite: true },
    filters: [{ id: 3, modelId: 5, columnKey: 'nature', columnLabel: 'Nature', operator: 'eq', value: 'Réclamation' }],
    columns: [],
  },
  {
    id: 6,
    nom: 'Dossiers en cours',
    libelle: 'Dossiers',
    type: 'dossiers',
    visibility: 'public',
    isSystem: false,
    capabilities: { alerte: false, colonnes: true, grouper: true, tableur: true, imprimer: true, filtrer: true, sql: false, mail: false, selection: true, nbLignes: true, favorite: false },
    filters: [], columns: [],
  },
  {
    id: 7,
    nom: 'Toutes les natures',
    libelle: 'Natures',
    type: 'natures',
    visibility: 'public',
    isSystem: true,
    capabilities: { alerte: false, colonnes: true, grouper: false, tableur: true, imprimer: true, filtrer: false, sql: false, mail: false, selection: false, nbLignes: false, favorite: false },
    filters: [], columns: [],
  },
  {
    id: 8,
    nom: 'Demandes urgentes',
    libelle: 'Urgentes',
    type: 'demandes',
    visibility: 'service',
    serviceId: 2,
    serviceNom: 'Direction de la Demande',
    isSystem: false,
    capabilities: { alerte: true, colonnes: true, grouper: false, tableur: true, imprimer: true, filtrer: true, sql: false, mail: true, selection: true, nbLignes: true, favorite: true },
    filters: [{ id: 4, modelId: 8, columnKey: 'priorite', columnLabel: 'Priorité', operator: 'eq', value: 'urgent' }],
    columns: [],
  },
] as any[]);

let nextId = db.nextId(searchModels, 9);

// ── Handlers ──────────────────────────────────────────────────

export const searchHandlers = [
  http.get(`${BASE}/search-models`, () => HttpResponse.json(searchModels)),

  http.post(`${BASE}/search-models`, async ({ request }) => {
    const body = await request.json() as Record<string, unknown>;
    const created = { ...body, id: nextId++, filters: (body['filters'] as unknown[]) ?? [], isSystem: false };
    searchModels.push(created);
    return HttpResponse.json(created, { status: 201 });
  }),

  http.put(`${BASE}/search-models/:id`, async ({ request, params }) => {
    const body = await request.json() as Record<string, unknown>;
    const id = Number(params['id']);
    db.replace(searchModels, searchModels.map(m => m.id === id ? { ...m, ...body, id } : m));
    return HttpResponse.json(searchModels.find(m => m.id === id));
  }),

  http.delete(`${BASE}/search-models/:id`, ({ params }) => {
    const id = Number(params['id']);
    db.replace(searchModels, searchModels.filter(m => m.id !== id));
    return new HttpResponse(null, { status: 204 });
  }),
];
