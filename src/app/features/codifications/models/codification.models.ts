// ============================================================
// Pli — Codification Reference Data Models
// Modèles de données du domaine courrier
// ============================================================

export interface Civilite {
  id: number;       // CIV_CLE
  libelle: string;  // CIV_LIB (max 250)
}

export interface Criticite {
  id: number;       // CRITICITE_ID
  libelle: string;  // CRITICITE_LIB (max 250)
}

export interface Priorite {
  id: number;          // PR_CLE
  libelle: string;     // PR_LIBELLE (max 50)
  isDefault: boolean;  // PR_DEFAULT ≠ 0
}

export interface Nature {
  id: number;          // NAT_CLE
  libelle: string;     // NAT_LIB (max 50)
  hierar?: string;     // NAT_HIERAR (parent-child path, max 10)
  nbjDtLim?: number;   // NAT_NBJDTLIM — default deadline days
}

export interface Fonction {
  id: string;        // FON_CLE (VARCHAR2 250 — used as code)
  libelle: string;   // FON_LIB (max 250)
  module?: string;   // FON_MODULE (max 50)
}

/** Jour = ISO date string (YYYY-MM-DD) — serves as PK */
export interface JourFerie {
  jour: string;      // JOUR (DATE, PK)
  libelle: string;   // LIBELLE (max 50)
}

export interface EtatClasseur {
  id: number;        // ETA_CLE
  libelle: string;   // ETA_LIB (max 50)
  type: string;      // ETA_TYP (VARCHAR2 3)
  valeur: number;    // ETA_VAL
}

export interface EtatElement {
  id: number;        // ETA_CLE
  libelle: string;   // ETA_LIB (max 50)
  type: string;      // ETA_TYP (VARCHAR2 3)
  valeur: number;    // ETA_VAL
}

export interface Objet {
  id: number;           // OBJ_CLE
  libelleC: string;     // OBJ_LIBC (max 20) — short label
  libelleL: string;     // OBJ_LIBL (max 250) — long label
  type: 'TOU' | 'REC' | 'PRO';  // OBJ_TYP — Tous/Réception/Production
}

export interface Ville {
  id: number;          // CODEVILLE
  codePostal: string;  // CODE_POSTAL
  ville: string;       // VILLE (max 50)
  insee?: number;      // INSEE (French statistical code)
}

export interface Rue {
  id: number;          // CLERUE
  nomRue: string;      // NOM_RUE (max 100)
  identif?: string;    // IDENTIF (max 15) — street code
  motDirec?: string;   // MOTDIREC (max 50) — prefix word (Rue, Avenue…)
  villeId: number;     // CODEVILLE (FK)
  villeNom?: string;   // VILLES.VILLE (joined for display)
}

export interface Delegation {
  id: number;              // synthetic PK for API
  delegateurId: number;    // DELEGPERS → PERSONNEL.PERSL_CLE
  delegateurNom: string;   // LIB_DELEGPERS (denormalized)
  delegueId: number;       // PERS_DELEG → PERSONNEL.PERSL_CLE
  delegueNom: string;      // LIB_PERS_DELEG (denormalized)
  debut: string;           // DELEG_DEBUT (ISO)
  fin: string;             // DELEG_FIN (ISO)
}

export interface Dossier {
  id: number;             // DOS_NUMDOSS
  mot: string;            // DOS_MOT (max 250) — keyword/description
  datLim?: string;        // DOS_DATLIM (ISO)
  typ?: number;           // DOS_TYP
  serviceId?: number;     // DOS_SERVID → SERVICE.SRV_CLE
  serviceNom?: string;    // SERVICE.SRV_NOM (joined)
  personnelId?: number;   // DOS_PERSLID → PERSONNEL.PERSL_CLE
  personnelNom?: string;  // joined display name
}

// ── Phase 2 stubs (full models in Phase 2) ─────────────────────────────────

/** Partial model — full implementation in Phase 2 */
export interface ActionCodif {
  id: number;           // ACTION_CLE
  libelle: string;      // ACTION_LIB (max 100)
  etat: string;         // ACTION_ETAT
  nbjDtLim?: number;    // ACTION_NBJDTLIM
}

/** Full Chrono model — automatic sequential numbering configuration */
export interface Chrono {
  id: number;                           // CHR_CLE
  nom: string;                          // CHR_LIB (max 50)
  type: string;                         // CHR_TYP
  prefixe: string;                      // CHR_PRE
  suffixe: string;                      // CHR_SUF
  separateur: string;                   // CHR_SEP
  sigleService: boolean;                // use service abbreviation instead of prefix
  nbChiffresAnnee: 2 | 4;              // digits for year part
  nbChiffresNumero: 3 | 4 | 5 | 6;     // digits for sequential number

  // Libellés et automatismes
  resumeLabel: string;
  tripletLabel: string;
  objetLabel: string;
  reference: string;
  dateArriveeLabel: string;
  showDateArrivee: boolean;
  dateExpeditionLabel: string;
  showDateExpedition: boolean;
  dateLimiteLabel: string;
  showDateLimite: boolean;
  premiereAffectation: string;
  deuxiemeAffectation: string;
  nbJoursDateLimite: number;
  criticiteLabel: string;
  showCriticite: boolean;
  sansJoursFeries: boolean;
  enJoursOuvres: boolean;
  clotureCopies: boolean;

  // Visibilité
  isPublic: boolean;
  tri: number;
  acces: 'SERVICE' | 'UTILISATEUR';
  hierarchie: string;

  // Descriptif
  descriptif: string;

  // Priorité et Nature
  hasPriorite: boolean;
  hasNature: boolean;

  // Autres propriétés
  hasDoleances: boolean;
  specifique: string;
  coEmetteur: string;
  showCoEmetteur: boolean;

  // Triplet associé
  tripletNom: string;
  tripletPrenom: string;
  tripletFonction: string;
  tripletOrganisme: string;

  // Courrier
  affichageTickets: boolean;
}

// ── Personnel (full model — Phase 2 implemented) ────────────────────────────

export interface Personnel {
  id: number;                        // PERSL_CLE
  nom: string;                       // PERSL_NOM
  prenom: string;                    // PERSL_PRE
  login: string;                     // PERSL_NAM
  motDePasse?: string;               // PERSL_PSW (write-only)
  serviceId?: number;                // PERSL_SRVCLE
  serviceNom?: string;               // SERVICE.SRV_NOM (joined)
  servicePrecedentId?: number;       // PERSL_SRVCLE_PRE
  servicePrecedentNom?: string;      // joined
  email?: string;                    // PERSL_BAL
  // ── Type flags ──────────────────────────────────────────────
  estBalService: boolean;            // PERSL_BALSRV
  estListe: boolean;                 // list mailbox type
  estResponsable: boolean;           // PERSL_REP
  estBal: boolean;                   // user IS a mailbox
  estAgent: boolean;                 // PERSL_TYP_AGENT
  // ── Autorisations ───────────────────────────────────────────
  actif: boolean;                    // PERSL_ACTIF
  connecte: boolean;                 // PERSL_CONNECT
  admin: boolean;                    // PERSL_ADMIN
  lectureSeule: boolean;
  parDefaut: boolean;                // PERSL_SRVDEF
  fonctionsAvancees: boolean;        // PERSL_FA
  adminMaqPubliques: boolean;        // PERSL_ADMINMAQ
  adminMaqServices: boolean;
  creationClasseur: boolean;         // PERSL_CREATIONCLASSEUR
  creationPersonne: boolean;         // PERSL_CREATIONPERSONNE
  creationOrganisme: boolean;        // PERSL_CREATIONORGANISME
  droitSuppression: boolean;
  modifHierarchie: boolean;
  voitBalService: boolean;           // PERSL_VISUBALSRV
  droitSuppressionSas: boolean;
  nonEnvoiCourrielSuiveuse: boolean; // PERSL_NONENVOI_MAIL
  droitProtocole: boolean;
  modifInfosSpecifiques: boolean;
  // ── POP incoming mail ────────────────────────────────────────
  popActif: boolean;
  popCompte?: string;                // PERSL_EMAILENTREEUSER
  popServeur?: string;               // PERSL_EMAILENTREEPOPSRV
  popMotDePasse?: string;            // PERSL_EMAILENTREEPWD
  voirSas: boolean;
  // ── SMTP outgoing mail ───────────────────────────────────────
  smtpCompte?: string;               // PERSL_EMAILSORTIEUSER
  smtpMotDePasse?: string;           // PERSL_EMAILSORTIEPWD
  // ── Triplet associé ──────────────────────────────────────────
  tripletNom?: string;
  tripletPrenom?: string;
  tripletFonction?: string;
  tripletOrganisme?: string;
}

/** Full Service model — organisational unit */
export interface Service {
  id: number;               // SRV_CLE
  nom: string;              // SRV_NOM (required)
  sigle: string;            // SRV_SIG (abbreviation, max 20)
  bal: string;              // SRV_BAL (email/mailbox, max 250)
  hierarchie: string;       // SRV_HIERAR (code path, required)
  parentId: number | null;  // SRV_PERECLE (FK to parent service)
  parentNom: string | null; // joined display
  actif: boolean;           // SRV_ACTIF
  // SAS courrier — POP access
  popCompte: string;        // SAS_COMPTE
  popMotDePasse: string;    // SAS_PSW
  popServeur: string;       // SAS_SERVEUR (IP or hostname)
  // Editions
  imprimante: string;       // printer name/path
  etiquettes: boolean;      // label printing
  logoPdf: string;          // PDF logo path
}

/** Backwards-compat alias — used by personnel form dropdown */
export type ServiceCodif = Service;

// ── Territoire (Geographic segmentation) ───────────────────────────────────

/** One of the 9 territory classification levels (maps to AFFECTGEO1-9 tables) */
export interface TerritoireNiveau {
  niveau: number;  // 1–9
  nom: string;     // user-defined name (e.g. "Quartier", "Secteur")
}

/** An element within one territory level (one row in AFFECTGEO[N]) */
export interface TerritoireElement {
  id: number;
  niveau: number;       // 1–9 — which level this belongs to
  cle: string;          // AFCTG[N]_CLE — short code (max 6 chars)
  labelCourt: string;   // AFCTG[N]_LBLC — short label (max 250)
  labelLong: string;    // AFCTG[N]_LBL — long label (max 250)
  rang: number;         // AFCTG[N]_NIVO — sort order
  adresseCount: number; // joined count from ADR_AFFECTGEO
}

// ── Sectorisation (street section / address range) ──────────────────────────

/** A tronçon de rue — one row in ADR_AFFECTGEO */
export interface Sectorisation {
  id: number;               // ADRAFCTG_CLE
  rueId?: number;           // RUE (FK to RUES.CLERUE)
  nomRue: string;           // ADRAFCTG_VOIE (max 100)
  codePostal: string;       // ADRAFCTG_CP (max 45)
  ville: string;            // ADRAFCTG_VIL (max 60)
  codeVoie?: string;        // ADRAFCTG_CDVOIE — Code Rivoli (max 15)
  motVoie?: string;         // ADRAFCTG_MOTVOIE — Mot directeur (max 50)
  parite: 'I' | 'P' | 'T'; // ADRAFCTG_PARITE — Impair / Pair / Tous
  numDebut: number;         // ADRAFCTG_DEB
  typeDebut: '' | 'B' | 'T' | 'Q'; // ADRAFCTG_TYPD — Bis / Ter / Quater
  numFin: number;           // ADRAFCTG_FIN
  typeFin: '' | 'B' | 'T' | 'Q';   // ADRAFCTG_TYPF
  // Territory assignments (FK to AFFECTGEO[N].AFCTG[N]_CLE)
  geo1?: string; geo2?: string; geo3?: string;
  geo4?: string; geo5?: string; geo6?: string;
  geo7?: string; geo8?: string; geo9?: string;
}
