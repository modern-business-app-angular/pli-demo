// ============================================================
// Pli — Courrier Entrant Models
// Modèles de données du domaine courrier
// ============================================================

/** Maps to FICHE_SUIVEUSE.FS_ETAT */
export type CourrierStatut = 'E' | 'T' | 'F' | 'C' | 'S';
// E = En cours, T = Transmise, F = Fini, C = Clôturé, S = Suspendu

/**
 * Triplet contact: junction of PERSONNE + ORGANISME + FONCTION.
 * Maps to TRIPLET table (TRI_CLE, TRI_PER_CLE, TRI_ORG_CLE, TRI_FON_CLE).
 */
export interface Triplet {
  id: number;                  // TRI_CLE
  nom: string;                 // PERSONNE.PER_NOM or ORGANISME.ORG_NOM
  prenom?: string;             // PERSONNE.PER_PRE
  libelleFunction?: string;    // TRIPLET.TRI_LIBFONC (denormalized)
  organisme?: string;          // ORGANISME.ORG_NOM (joined)
  ville?: string;              // ORGANISME.ORG_VIL (joined)
  email?: string;              // TRIPLET.TRI_EMAIL
  telephone?: string;          // TRIPLET.TRI_TEL
  type: 'personne' | 'organisme';
}

/**
 * Active tracking step for a courrier.
 * Maps to FICHE_SUIVEUSE table.
 */
export interface FicheSuiveuse {
  id: number;                     // FS_CLE
  etape: string;                  // FS_ETAPE
  etat: CourrierStatut;           // FS_ETAT
  type: 'ORI' | 'COP';           // FS_TYP
  actionId?: number;              // FS_ACTION_CLE
  actionLibelle?: string;
  destinataireId?: number;        // FS_PERSL_CLE
  destinataireNom?: string;
  serviceDestinataire?: string;   // FS_SRVPERSL_CLE → SERVICE.SRV_NOM
  emetteurNom?: string;           // FS_EMET_CLE → PERSONNEL
  dateCreation: string;           // FS_DTCREAT (ISO)
  dateLimite?: string;            // FS_DTLIM (ISO)
  commentaire?: string;           // FS_COM (max 3500 chars)
  /** True when FS_PERSL_CLE matches the currently authenticated user */
  isCurrentUserRecipient: boolean;
}

/** Intervention address — stored directly on ELEMENT (ELT_ADR, ELT_CP, ELT_VIL, ELT_PAYS) */
export interface AdresseIntervention {
  adresse?: string;    // ELT_ADR
  adresse2?: string;   // ELT_ADR2
  cp?: string;         // ELT_CP
  ville?: string;      // ELT_VIL
  pays?: string;       // ELT_PAYS
}

/**
 * Incoming mail record.
 * Maps to ELEMENT table with joined CHRONO, TRIPLET, FICHE_SUIVEUSE.
 */
export interface CourrierEntrant {
  id: number;                   // ELT_CLE
  numeroChrono: string;         // ELT_NUMCHRONO
  chronoTypeId: number;         // ELT_CHR_CLE
  chronoTypeLabel: string;      // CHRONO.CHR_LIB (joined)
  dateArrivee: string;          // ELT_DATARR (ISO)
  dateExpedition?: string;      // ELT_DATEXP (ISO)
  dateLimite?: string;          // ELT_DATLIM (ISO)
  objet: string;                // ELT_MOT (display version)
  reference?: string;           // ELT_REF
  tags?: string;                // ELT_TAGS (comma-separated, VARCHAR2 250)
  commentaire?: string;         // ELT_COMMENT (max 3500 chars)
  statut: CourrierStatut;       // derived from active FicheSuiveuse.FS_ETAT
  natureId?: number;            // ELT_NAT_CLE → NATURE.NAT_CLE
  natureLibelle?: string;
  prioriteId?: number;          // ELT_PRIORITE → PRIORITES.PR_CLE
  prioriteLibelle?: string;
  nbPiecesJointes: number;      // ELT_FICATT
  expediteur?: Triplet;         // ELT_TRI_CLE → TRIPLET (joined)
  adresseIntervention?: AdresseIntervention;
  /** Active tracking step (FS_ETAT IN ('E','T')) */
  ficheSuiveuse?: FicheSuiveuse;
}

/** Query params for the list endpoint */
export interface CourrierEntrantFilters {
  search?: string;              // full-text on ELT_MOTMAJ
  statut?: CourrierStatut;
  dateArriveeFrom?: string;
  dateArriveeTo?: string;
  chronoTypeId?: number;
}

// ── Advanced Search Types ──────────────────────────────────────────────────

export type CourrierFilterGroup = 'elements' | 'contact' | 'workflow' | 'specifiques';

export const COURRIER_FILTER_GROUP_META: Record<CourrierFilterGroup, { label: string; icon: string; color: string }> = {
  elements:    { label: 'Éléments courrier',  icon: 'mail',      color: '#4f46e5' },
  contact:     { label: 'Contacts',           icon: 'user',      color: '#7c3aed' },
  workflow:    { label: 'Workflow (FS)',       icon: 'apartment', color: '#b45309' },
  specifiques: { label: 'Champs spécifiques', icon: 'setting',   color: '#0f766e' },
};

export interface CourrierSearchEléments {
  chrono?: string;
  chronoTypeIds?: number[];
  objet?: string;
  reference?: string;
  motsCles?: string;
  natureIds?: number[];
  dateArriveeFrom?: string;  dateArriveeTo?: string;
  dateExpeditionFrom?: string; dateExpeditionTo?: string;
  dateLimiteFrom?: string;   dateLimiteTo?: string;
}

export interface CourrierSearchContact {
  tripletNom?: string;
  organisme?: string;
  fonction?: string;
  ville?: string;
  cp?: string;
}

export interface CourrierSearchWorkflow {
  etats?: CourrierStatut[];
  emetteurId?: number;
  destinataireId?: number;
  serviceEmetteurId?: number;
  serviceDestinataireId?: number;
  actionId?: number;
  dateCreationFrom?: string;  dateCreationTo?: string;
  original?: boolean;
}

export type CourrierSearchSpecifiques = Record<string, string | string[] | null>;

export interface CourrierSearchQuery {
  elements?: CourrierSearchEléments;
  contact?: CourrierSearchContact;
  workflow?: CourrierSearchWorkflow;
  specifiques?: CourrierSearchSpecifiques;
  page: number;
  pageSize: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

export interface ActiveFilterChip {
  key: string;
  group: CourrierFilterGroup;
  label: string;
  displayValue: string;
  removable: boolean;
}

// ─────────────────────────────────────────────────────────────────────────────

/** POST /api/courriers/entrant */
export interface CreateCourrierRequest {
  chronoTypeId: number;         // ELT_CHR_CLE
  dateArrivee: string;          // ELT_DATARR
  dateExpedition?: string;      // ELT_DATEXP
  dateLimite?: string;          // ELT_DATLIM
  objet: string;                // ELT_MOT (API normalizes → ELT_MOTMAJ)
  reference?: string;           // ELT_REF
  tags?: string;                // ELT_TAGS
  commentaire?: string;         // ELT_COMMENT (max 4000 chars)
  favori?: boolean;             // CHK1
  criticiteId?: number;         // ELT_CRITICITE (conditional on ChronoType.showCriticite)
  natureId?: number;            // ELT_NAT_CLE
  prioriteId?: number;          // ELT_PRIORITE
  adresseIntervention?: AdresseIntervention;
  /** Use an existing triplet */
  tripletId?: number;
  /** Or create a new one inline */
  expediteurManuel?: {
    nom: string;
    prenom?: string;
    libelleFunction?: string;
    organisme?: string;
    email?: string;
    telephone?: string;
    ville?: string;
    pays?: string;
  };
  traitement: {
    actionId: number;           // → FS_ACTION_CLE
    serviceId?: number;         // → ELT_SRV_DEST
    personnelId?: number;       // → ELT_PERSL_DEST + FS_PERSL_CLE
    dateLimite?: string;        // → FS_DTLIM
    commentaire?: string;       // → FS_COM
  };
  piecesJointes?: {
    nom: string;
    libelle: string;
    type: 'PJ' | 'AR' | 'REP' | 'BOR';
  }[];
  specifiques?: Record<string, unknown>;
  documentsLies?: DocumentLie[];
}

// ── Document types ────────────────────────────────────────────────────────────

/** Document generated from a maquette template, stored as HTML */
export interface DocumentLie {
  maquetteId: number;
  maquetteNom: string;
  type: 'AR' | 'REP' | 'BOR';
  titre: string;
  htmlContent: string;   // Quill HTML output
}

// ── Unified courrier type system ──────────────────────────────────────────────

export type CourrierType = 'entrant' | 'sortant' | 'interne';

export interface CourrierListConfig {
  type: CourrierType;
  dateLabel: string;
  partieLabel: string;
  apiEndpoint: string;
  pageSpecNom: string;
  nouveauRoute: string;
}

export const COURRIER_LIST_CONFIG: Record<CourrierType, CourrierListConfig> = {
  entrant: {
    type: 'entrant',
    dateLabel: 'Date arrivée',
    partieLabel: 'Expéditeur',
    apiEndpoint: '/api/courriers/entrant',
    pageSpecNom: 'courrier-entrant',
    nouveauRoute: 'entrant/nouveau',
  },
  sortant: {
    type: 'sortant',
    dateLabel: 'Date envoi',
    partieLabel: 'Destinataire',
    apiEndpoint: '/api/courriers/sortant',
    pageSpecNom: 'courrier-sortant',
    nouveauRoute: 'sortant/nouveau',
  },
  interne: {
    type: 'interne',
    dateLabel: 'Date',
    partieLabel: 'Émetteur → Destinataire',
    apiEndpoint: '/api/courriers/interne',
    pageSpecNom: 'courrier-entrant',
    nouveauRoute: 'interne/nouveau',
  },
};
