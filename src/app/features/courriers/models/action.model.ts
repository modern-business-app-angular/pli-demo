// ============================================================
// Pli — Action, Personnel, ChronoType, Référentiel Models
// Modèles de données du domaine courrier
// ============================================================

/**
 * Workflow action.
 * Maps to ACTION table.
 */
export interface Action {
  id: number;            // ACTION_CLE
  libelle: string;       // ACTION_LIB
  /** Resulting FS_ETAT after this action */
  etatResultant: 'E' | 'T' | 'F' | 'C';  // ACTION_ETAT
  /** Recipient selection mode — determines who appears in the recipient list */
  destMode: 'Tous' | 'SERVICES' | 'PERSONNES' | 'MEME' | 'BALPers' | 'BALServ' | 'LISTEPOS';
  /** Days to add to today to compute default deadline (ACTION_NBJDTLIM) */
  nbjDtLim?: number;
}

/**
 * Internal personnel/agent.
 * Maps to PERSONNEL table joined with SERVICE.
 */
export interface Personnel {
  id: number;                // PERSL_CLE
  nom: string;               // PERSL_NOM
  prenom: string;            // PERSL_PRE
  displayName: string;       // PERSL_NOM + ' ' + PERSL_PRE
  serviceId: number;         // PERSL_SRVCLE → SERVICE.SRV_CLE
  serviceNom: string;        // SERVICE.SRV_NOM (joined)
  /** True when PERSL_BALSRV = 1 (service mailbox account) */
  isServiceMailbox: boolean;
  email?: string;            // PERSL_EMAIL
}

/**
 * Chronological numbering type.
 * Maps to CHRONO table.
 * Per-chrono flags control which fields are shown in the form.
 */
export interface ChronoType {
  id: number;            // CHR_CLE
  libelle: string;       // CHR_LIB
  type: 'REC' | 'PRO' | 'INT'; // CHR_TYP
  prefixe?: string;      // CHR_PRE
  separateur?: string;   // CHR_SEP
  lgAnnee: number;       // CHR_LGANNEE (2 or 4)
  lgNum: number;         // CHR_LGNUM (3–6)
  /** Show Nature field — CHRCHKNATURE = 1 */
  showNature: boolean;
  /** Show Priorité field — CHRCHKPRIORITE = 1 */
  showPriorite: boolean;
  /** Show Criticité field — CHRVISIBCRITICITE ≠ 0 (default -1 = visible) */
  showCriticite: boolean;
  /** Default deadline days — CHR_NBJDTLIM */
  nbjDtLim?: number;
}

/**
 * Nature codification.
 * Maps to NATURE table (NAT_CLE, NAT_LIB).
 */
export interface Nature {
  id: number;       // NAT_CLE
  libelle: string;  // NAT_LIB
}

/**
 * Priority codification.
 * Maps to PRIORITES table (not PRIORITE).
 * Columns: PR_CLE, PR_LIBELLE, PR_DEFAULT.
 */
export interface Priorite {
  id: number;          // PR_CLE
  libelle: string;     // PR_LIBELLE
  isDefault: boolean;  // PR_DEFAULT ≠ 0
}

/**
 * Criticality level.
 * Maps to CRITICITE table (CRITICITE_CLE, CRITICITE_LIB).
 */
export interface Criticite {
  id: number;       // CRITICITE_CLE
  libelle: string;  // CRITICITE_LIB
}

/** POST /api/courriers/:id/faire-suivre */
export interface FaireSuivreRequest {
  actionId: number;       // → FS_ACTION_CLE
  destinataireId: number; // → FS_PERSL_CLE (new tracking step recipient)
  dateLimite?: string;    // → FS_DTLIM (ISO)
  commentaire?: string;   // → FS_COM (max 3500 chars)
}
