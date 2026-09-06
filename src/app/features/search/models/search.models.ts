// ============================================================
// Pli — Search Models
// Modèles de recherche sauvegardés (filtres + colonnes)
// ============================================================

export type SearchModelType =
  | 'actions'
  | 'chronos'
  | 'civilites'
  | 'courriers'
  | 'demandes'
  | 'dossiers'
  | 'elements'
  | 'etats-classeur'
  | 'etats-elements'
  | 'fonctions'
  | 'jours-feries'
  | 'natures'
  | 'objets'
  | 'personnels'
  | 'protocoles'
  | 'services';

export type FilterOperator =
  | 'eq'
  | 'neq'
  | 'startsWith'
  | 'endsWith'
  | 'contains'
  | 'notContains'
  | 'gt'
  | 'gte'
  | 'lt'
  | 'lte'
  | 'in';

export interface SearchFilter {
  id: number;
  modelId: number;
  columnKey: string;      // column identifier
  columnLabel: string;    // human label
  operator: FilterOperator;
  value: string;
}

/** 11 UI capability flags (maps to 11 columns in USER_RECHERCHE) */
export interface SearchCapabilities {
  alerte: boolean;      // ALERTE — enable alerts on this view
  colonnes: boolean;    // COLONNES — column picker button
  grouper: boolean;     // GROUPER — row grouping
  tableur: boolean;     // TABLEUR — Excel export
  imprimer: boolean;    // IMPRIMER — print
  filtrer: boolean;     // FILTRER — filter panel
  sql: boolean;         // AFFICHER_SQL — show generated SQL
  mail: boolean;        // MAIL — email results
  selection: boolean;   // SELECTION — row checkboxes
  nbLignes: boolean;    // NBLIGNES — total row count
  favorite: boolean;    // FAVORITE — pin to favorites
}

export type SearchVisibility = 'private' | 'public' | 'service';

// ── Column catalog types (replaces legacy XML files) ────────────────────────

export type ColumnDataType = 'text' | 'number' | 'date' | 'boolean';
export type ColumnAlignment = 'left' | 'center' | 'right';

/** A column available for a given entity type — static catalog entry */
export interface SearchColumnDef {
  key: string;              // unique key / DB field alias
  label: string;            // French display label
  dataType: ColumnDataType;
  align: ColumnAlignment;
  defaultVisible: boolean;  // shown by default in new models
  sortable: boolean;
  defaultWidth?: number;    // px; undefined = auto
  // ── Join metadata (replaces legacy XML Chemin / CheminObligatoire) ────────
  group?: string;           // UI group name: 'Organisme', 'Nature', 'Personnel'…
                            // undefined = base table column (no join required)
  joinPath?: string;        // SQL join expression: 'CHR_ORG_CLE=ORGANISME.ORG_CLE'
  joinType?: 'inner' | 'left'; // inner = mandatory row, left = optional
}

/** Per-model column override stored alongside the model */
export interface SearchColumnConfig {
  key: string;     // references SearchColumnDef.key
  visible: boolean;
  order: number;   // 0-based position in visible list
  width?: number;  // px override; undefined = use catalog default
}

export interface SearchModel {
  id: number;
  nom: string;                   // NOM_LONG — full display name
  libelle: string;               // NOM_COURT — short label
  type: SearchModelType;         // NOM_RECHERCHE — XML base entity
  visibility: SearchVisibility;
  serviceId?: number;            // IDGROUPE — service restriction
  serviceNom?: string;           // joined display
  capabilities: SearchCapabilities;
  filters: SearchFilter[];
  columns: SearchColumnConfig[];  // custom column config ([] = use catalog defaults)
  isSystem: boolean;             // SYSTEME — built-in / non-deletable
  ownerId?: number;
  ownerNom?: string;
}

export const DEFAULT_CAPABILITIES: SearchCapabilities = {
  alerte: false,
  colonnes: true,
  grouper: false,
  tableur: true,
  imprimer: true,
  filtrer: true,
  sql: false,
  mail: false,
  selection: true,
  nbLignes: true,
  favorite: false,
};

export const MODEL_TYPE_LABELS: Record<SearchModelType, string> = {
  actions:       'Actions',
  chronos:       'Chronos',
  civilites:     'Civilités',
  courriers:     'Courriers',
  demandes:      'Demandes',
  dossiers:      'Dossiers',
  elements:      'Éléments',
  'etats-classeur': 'États classeurs',
  'etats-elements': 'États éléments',
  fonctions:     'Fonctions',
  'jours-feries': 'Jours fériés',
  natures:       'Natures',
  objets:        'Objets',
  personnels:    'Personnels',
  protocoles:    'Protocoles',
  services:      'Services',
};

// ── Column catalog — replaces legacy XML model files ────────────────────────
// Each entry defines the complete set of available columns for a given entity.
// `defaultVisible: true` → shown in new models unless the admin changes it.

const stub = (label: string): SearchColumnDef[] => [
  { key: 'cle',          label: 'Clé',           dataType: 'number', align: 'right',  defaultVisible: false, sortable: true,  defaultWidth: 60  },
  { key: 'libelle',      label: label,            dataType: 'text',   align: 'left',   defaultVisible: true,  sortable: true                     },
  { key: 'dateCreation', label: 'Date création',  dataType: 'date',   align: 'center', defaultVisible: true,  sortable: true,  defaultWidth: 110 },
];

export const COLUMN_CATALOG: Record<SearchModelType, SearchColumnDef[]> = {

  // ── Courriers ─────────────────────────────────────────────────────────────
  // Base: CHRONO table. Joins to NATURE, ETAT, SERVICE, PERSONNEL, ORGANISME/TRIPLET
  courriers: [
    // Base table columns
    { key: 'chrono',         label: 'Chrono',            dataType: 'text',    align: 'center', defaultVisible: true,  sortable: true,  defaultWidth: 100 },
    { key: 'objet',          label: 'Objet',             dataType: 'text',    align: 'left',   defaultVisible: true,  sortable: true                     },
    { key: 'dateArrivee',    label: 'Date arrivée',      dataType: 'date',    align: 'center', defaultVisible: true,  sortable: true,  defaultWidth: 110 },
    { key: 'dateExpedition', label: 'Date expéd.',       dataType: 'date',    align: 'center', defaultVisible: true,  sortable: true,  defaultWidth: 110 },
    { key: 'dateLimite',     label: 'Date limite',       dataType: 'date',    align: 'center', defaultVisible: true,  sortable: true,  defaultWidth: 110 },
    { key: 'dateReponse',    label: 'Date réponse',      dataType: 'date',    align: 'center', defaultVisible: false, sortable: true,  defaultWidth: 110 },
    { key: 'ref',            label: 'Référence',         dataType: 'text',    align: 'left',   defaultVisible: false, sortable: true,  defaultWidth: 100 },
    { key: 'nbPj',           label: 'Pièces jointes',    dataType: 'number',  align: 'center', defaultVisible: false, sortable: false, defaultWidth: 60  },
    // Nature (LEFT JOIN NATURE ON CHR_NAT_CLE=NATURE.NAT_CLE)
    { key: 'nature',         label: 'Nature',            dataType: 'text',    align: 'left',   defaultVisible: true,  sortable: true,  defaultWidth: 130, group: 'Nature',    joinPath: 'CHR_NAT_CLE=NATURE.NAT_CLE',          joinType: 'left'  },
    // État (INNER JOIN ETAT ON CHR_ETAT=ETAT.ETA_CLE)
    { key: 'etat',           label: 'État',              dataType: 'text',    align: 'left',   defaultVisible: true,  sortable: true,  defaultWidth: 120, group: 'État',      joinPath: 'CHR_ETAT=ETAT.ETA_CLE',               joinType: 'inner' },
    // Service (LEFT JOIN SERVICE ON CHR_SRV_CLE=SERVICE.SRV_CLE)
    { key: 'service',        label: 'Service',           dataType: 'text',    align: 'left',   defaultVisible: true,  sortable: true,                     group: 'Service',   joinPath: 'CHR_SRV_CLE=SERVICE.SRV_CLE',         joinType: 'left'  },
    { key: 'directionNom',   label: 'Direction',         dataType: 'text',    align: 'left',   defaultVisible: false, sortable: true,                     group: 'Service',   joinPath: 'CHR_SRV_CLE=SERVICE.SRV_CLE',         joinType: 'left'  },
    // Personnel (LEFT JOIN PERSONNEL ON CHR_PERSL_CLE=PERSONNEL.PERSL_CLE)
    { key: 'agent',          label: 'Agent traitant',    dataType: 'text',    align: 'left',   defaultVisible: true,  sortable: true,  defaultWidth: 150, group: 'Personnel', joinPath: 'CHR_PERSL_CLE=PERSONNEL.PERSL_CLE',   joinType: 'left'  },
    { key: 'agentEmail',     label: 'Email agent',       dataType: 'text',    align: 'left',   defaultVisible: false, sortable: false,                    group: 'Personnel', joinPath: 'CHR_PERSL_CLE=PERSONNEL.PERSL_CLE',   joinType: 'left'  },
    // Organisme (INNER JOIN TRIPLET + INNER JOIN ORGANISME)
    { key: 'orgNom',         label: 'Nom organisme',     dataType: 'text',    align: 'left',   defaultVisible: false, sortable: true,                     group: 'Organisme', joinPath: 'CHR_TRI_CLE=TRIPLET.TRI_CLE AND TRIPLET.TRI_ORG_CLE=ORGANISME.ORG_CLE', joinType: 'inner' },
    { key: 'orgAdresse',     label: 'Adresse',           dataType: 'text',    align: 'left',   defaultVisible: false, sortable: false,                    group: 'Organisme', joinPath: 'CHR_TRI_CLE=TRIPLET.TRI_CLE AND TRIPLET.TRI_ORG_CLE=ORGANISME.ORG_CLE', joinType: 'inner' },
    { key: 'orgCp',          label: 'Code postal',       dataType: 'text',    align: 'center', defaultVisible: false, sortable: true,  defaultWidth: 90,  group: 'Organisme', joinPath: 'CHR_TRI_CLE=TRIPLET.TRI_CLE AND TRIPLET.TRI_ORG_CLE=ORGANISME.ORG_CLE', joinType: 'inner' },
    { key: 'orgVille',       label: 'Ville',             dataType: 'text',    align: 'left',   defaultVisible: false, sortable: true,  defaultWidth: 130, group: 'Organisme', joinPath: 'CHR_TRI_CLE=TRIPLET.TRI_CLE AND TRIPLET.TRI_ORG_CLE=ORGANISME.ORG_CLE', joinType: 'inner' },
    // Personne (INNER JOIN TRIPLET + INNER JOIN PERSONNE)
    { key: 'perNom',         label: 'Nom interlocuteur', dataType: 'text',    align: 'left',   defaultVisible: false, sortable: true,  defaultWidth: 150, group: 'Personne',  joinPath: 'CHR_TRI_CLE=TRIPLET.TRI_CLE AND TRIPLET.TRI_PER_CLE=PERSONNE.PER_CLE',  joinType: 'inner' },
    { key: 'perPrenom',      label: 'Prénom interlocut.', dataType: 'text',   align: 'left',   defaultVisible: false, sortable: true,  defaultWidth: 130, group: 'Personne',  joinPath: 'CHR_TRI_CLE=TRIPLET.TRI_CLE AND TRIPLET.TRI_PER_CLE=PERSONNE.PER_CLE',  joinType: 'inner' },
  ],

  // ── Éléments ─────────────────────────────────────────────────────────────
  // Base: ELEMENT table. Joins to NATURE, ETAT, ORGANISME/TRIPLET, PERSONNEL, AFFECTGEO1-3, DOSSIER
  elements: [
    // Base
    { key: 'chrono',              label: 'Chrono élément',     dataType: 'text',   align: 'center', defaultVisible: true,  sortable: true,  defaultWidth: 100 },
    { key: 'objet',               label: 'Objet',              dataType: 'text',   align: 'left',   defaultVisible: true,  sortable: true                     },
    { key: 'dateEnregistrement',  label: 'Date enreg.',        dataType: 'date',   align: 'center', defaultVisible: true,  sortable: true,  defaultWidth: 110 },
    { key: 'dateArrivee',         label: 'Date arrivée',       dataType: 'date',   align: 'center', defaultVisible: true,  sortable: true,  defaultWidth: 110 },
    { key: 'dateLimite',          label: 'Date limite',        dataType: 'date',   align: 'center', defaultVisible: true,  sortable: true,  defaultWidth: 110 },
    { key: 'dateExpedition',      label: 'Date expéd.',        dataType: 'date',   align: 'center', defaultVisible: false, sortable: true,  defaultWidth: 110 },
    { key: 'dateReponse',         label: 'Date réponse',       dataType: 'date',   align: 'center', defaultVisible: false, sortable: true,  defaultWidth: 110 },
    { key: 'dateAr',              label: 'Date AR',            dataType: 'date',   align: 'center', defaultVisible: false, sortable: true,  defaultWidth: 110 },
    { key: 'ref',                 label: 'Référence',          dataType: 'text',   align: 'left',   defaultVisible: false, sortable: true,  defaultWidth: 100 },
    { key: 'adresseIntervention', label: 'Adresse interv.',    dataType: 'text',   align: 'left',   defaultVisible: false, sortable: false                    },
    // Nature (LEFT JOIN NATURE ON ELT_NAT_CLE=NATURE.NAT_CLE)
    { key: 'nature',      label: 'Nature',            dataType: 'text',   align: 'left',   defaultVisible: true,  sortable: true,  defaultWidth: 130, group: 'Nature',     joinPath: 'ELT_NAT_CLE=NATURE.NAT_CLE',          joinType: 'left'  },
    // État (INNER JOIN ETAT ON ELT_ETAT=ETAT.ETA_CLE)
    { key: 'etat',        label: 'État élément',      dataType: 'text',   align: 'left',   defaultVisible: true,  sortable: true,  defaultWidth: 120, group: 'État',       joinPath: 'ELT_ETAT=ETAT.ETA_CLE',               joinType: 'inner' },
    // Organisme (INNER JOIN TRIPLET + INNER JOIN ORGANISME)
    { key: 'orgNom',      label: 'Nom organisme',     dataType: 'text',   align: 'left',   defaultVisible: true,  sortable: true,                     group: 'Organisme',  joinPath: 'ELT_TRI_CLE=TRIPLET.TRI_CLE AND TRIPLET.TRI_ORG_CLE=ORGANISME.ORG_CLE', joinType: 'inner' },
    { key: 'orgAdresse',  label: 'Adresse organisme', dataType: 'text',   align: 'left',   defaultVisible: false, sortable: false,                    group: 'Organisme',  joinPath: 'ELT_TRI_CLE=TRIPLET.TRI_CLE AND TRIPLET.TRI_ORG_CLE=ORGANISME.ORG_CLE', joinType: 'inner' },
    { key: 'orgCp',       label: 'Code postal org.',  dataType: 'text',   align: 'center', defaultVisible: false, sortable: true,  defaultWidth: 90,  group: 'Organisme',  joinPath: 'ELT_TRI_CLE=TRIPLET.TRI_CLE AND TRIPLET.TRI_ORG_CLE=ORGANISME.ORG_CLE', joinType: 'inner' },
    { key: 'orgVille',    label: 'Ville organisme',   dataType: 'text',   align: 'left',   defaultVisible: false, sortable: true,  defaultWidth: 130, group: 'Organisme',  joinPath: 'ELT_TRI_CLE=TRIPLET.TRI_CLE AND TRIPLET.TRI_ORG_CLE=ORGANISME.ORG_CLE', joinType: 'inner' },
    // Personne (INNER JOIN TRIPLET + INNER JOIN PERSONNE)
    { key: 'perNom',      label: 'Nom personne',      dataType: 'text',   align: 'left',   defaultVisible: false, sortable: true,  defaultWidth: 150, group: 'Personne',   joinPath: 'ELT_TRI_CLE=TRIPLET.TRI_CLE AND TRIPLET.TRI_PER_CLE=PERSONNE.PER_CLE',  joinType: 'inner' },
    // Personnel (LEFT JOIN PERSONNEL ON ELT_PERSL_AFF=PERSONNEL.PERSL_CLE)
    { key: 'saisiPar',    label: 'Saisi par',         dataType: 'text',   align: 'left',   defaultVisible: true,  sortable: true,  defaultWidth: 150, group: 'Personnel',  joinPath: 'ELT_PERSL_AFF=PERSONNEL.PERSL_CLE',   joinType: 'left'  },
    { key: 'responsable', label: 'Responsable',       dataType: 'text',   align: 'left',   defaultVisible: false, sortable: true,  defaultWidth: 150, group: 'Personnel',  joinPath: 'ELT_PERSL_DEST=PERSONNEL.PERSL_CLE',  joinType: 'left'  },
    // Territoire géographique (LEFT JOIN AFFECTGEO1/2/3)
    { key: 'geo1',        label: 'Localisation',      dataType: 'text',   align: 'left',   defaultVisible: false, sortable: true,                     group: 'Territoire', joinPath: 'ELT_AFFECT1_CLE=AFFECTGEO1.AFCTG1_CLE', joinType: 'left'  },
    { key: 'geo2',        label: 'Quartier',          dataType: 'text',   align: 'left',   defaultVisible: false, sortable: true,                     group: 'Territoire', joinPath: 'ELT_AFFECT2_CLE=AFFECTGEO2.AFCTG2_CLE', joinType: 'left'  },
    { key: 'geo3',        label: 'Canton',            dataType: 'text',   align: 'left',   defaultVisible: false, sortable: true,                     group: 'Territoire', joinPath: 'ELT_AFFECT3_CLE=AFFECTGEO3.AFCTG3_CLE', joinType: 'left'  },
    // Dossier (INNER JOIN DOSSIER ON ELT_DOS_NUMDOSS=DOSSIER.DOS_NUMDOSS)
    { key: 'dossChrono',  label: 'N° chrono dossier', dataType: 'text',   align: 'center', defaultVisible: false, sortable: true,  defaultWidth: 120, group: 'Dossier',    joinPath: 'ELT_DOS_NUMDOSS=DOSSIER.DOS_NUMDOSS', joinType: 'inner' },
    { key: 'dossDateLim', label: 'Date limite dossier',dataType: 'date',  align: 'center', defaultVisible: false, sortable: true,  defaultWidth: 110, group: 'Dossier',    joinPath: 'ELT_DOS_NUMDOSS=DOSSIER.DOS_NUMDOSS', joinType: 'inner' },
    { key: 'dossEtat',    label: 'État dossier',      dataType: 'text',   align: 'left',   defaultVisible: false, sortable: true,  defaultWidth: 120, group: 'Dossier',    joinPath: 'ELT_DOS_NUMDOSS=DOSSIER.DOS_NUMDOSS AND DOSSIER.DOS_ETA=ETAT_CLASSEUR.ETA_CLE', joinType: 'inner' },
  ],

  // ── Personnels ────────────────────────────────────────────────────────────
  personnels: [
    // Base
    { key: 'matricule',   label: 'Matricule',         dataType: 'text',    align: 'center', defaultVisible: true,  sortable: true,  defaultWidth: 90  },
    { key: 'nom',         label: 'Nom',               dataType: 'text',    align: 'left',   defaultVisible: true,  sortable: true,  defaultWidth: 150 },
    { key: 'prenom',      label: 'Prénom',            dataType: 'text',    align: 'left',   defaultVisible: true,  sortable: true,  defaultWidth: 130 },
    { key: 'email',       label: 'Email',             dataType: 'text',    align: 'left',   defaultVisible: true,  sortable: true                     },
    { key: 'telephone',   label: 'Téléphone',         dataType: 'text',    align: 'left',   defaultVisible: false, sortable: false, defaultWidth: 120 },
    { key: 'dateEntree',  label: 'Date entrée',       dataType: 'date',    align: 'center', defaultVisible: false, sortable: true,  defaultWidth: 110 },
    { key: 'actif',       label: 'Actif',             dataType: 'boolean', align: 'center', defaultVisible: true,  sortable: true,  defaultWidth: 60  },
    // Service (LEFT JOIN SERVICE ON PERSL_SRV_CLE=SERVICE.SRV_CLE)
    { key: 'service',     label: 'Service',           dataType: 'text',    align: 'left',   defaultVisible: true,  sortable: true,                     group: 'Service',   joinPath: 'PERSL_SRV_CLE=SERVICE.SRV_CLE',       joinType: 'left'  },
    { key: 'direction',   label: 'Direction',         dataType: 'text',    align: 'left',   defaultVisible: false, sortable: true,                     group: 'Service',   joinPath: 'PERSL_SRV_CLE=SERVICE.SRV_CLE AND SERVICE.SERV_DIRECTION=DIRECTION.CLEDIR', joinType: 'left' },
    // Fonction (LEFT JOIN FONCTION ON PERSL_FON_CLE=FONCTION.FON_CLE)
    { key: 'fonction',    label: 'Fonction',          dataType: 'text',    align: 'left',   defaultVisible: true,  sortable: true,  defaultWidth: 150, group: 'Fonction',  joinPath: 'PERSL_FON_CLE=FONCTION.FON_CLE',      joinType: 'left'  },
    // Territoire (LEFT JOIN AFFECTGEO1)
    { key: 'territoire',  label: 'Territoire',        dataType: 'text',    align: 'left',   defaultVisible: false, sortable: true,                     group: 'Territoire',joinPath: 'PERSL_AFFECT1_CLE=AFFECTGEO1.AFCTG1_CLE', joinType: 'left' },
  ],

  // ── Demandes ──────────────────────────────────────────────────────────────
  demandes: [
    // Base
    { key: 'chrono',         label: 'Chrono',          dataType: 'text',   align: 'center', defaultVisible: true,  sortable: true,  defaultWidth: 100 },
    { key: 'objet',          label: 'Objet',           dataType: 'text',   align: 'left',   defaultVisible: true,  sortable: true                     },
    { key: 'dateDepot',      label: 'Date dépôt',      dataType: 'date',   align: 'center', defaultVisible: true,  sortable: true,  defaultWidth: 110 },
    { key: 'dateLimite',     label: 'Date limite',     dataType: 'date',   align: 'center', defaultVisible: true,  sortable: true,  defaultWidth: 110 },
    { key: 'priorite',       label: 'Priorité',        dataType: 'text',   align: 'center', defaultVisible: true,  sortable: true,  defaultWidth: 90  },
    { key: 'dateTraitement', label: 'Date traitement', dataType: 'date',   align: 'center', defaultVisible: false, sortable: true,  defaultWidth: 110 },
    // Nature (LEFT JOIN NATURE ON DEM_NAT_CLE=NATURE.NAT_CLE)
    { key: 'nature',     label: 'Nature',              dataType: 'text',   align: 'left',   defaultVisible: true,  sortable: true,  defaultWidth: 130, group: 'Nature',    joinPath: 'DEM_NAT_CLE=NATURE.NAT_CLE',          joinType: 'left'  },
    // État (INNER JOIN ETAT ON DEM_ETAT=ETAT.ETA_CLE)
    { key: 'etat',       label: 'État',                dataType: 'text',   align: 'left',   defaultVisible: true,  sortable: true,  defaultWidth: 120, group: 'État',      joinPath: 'DEM_ETAT=ETAT.ETA_CLE',               joinType: 'inner' },
    // Demandeur (INNER JOIN TRIPLET + INNER JOIN PERSONNE)
    { key: 'demandeur',  label: 'Demandeur',           dataType: 'text',   align: 'left',   defaultVisible: true,  sortable: true,                     group: 'Demandeur', joinPath: 'DEM_TRI_CLE=TRIPLET.TRI_CLE AND TRIPLET.TRI_PER_CLE=PERSONNE.PER_CLE',  joinType: 'inner' },
    { key: 'demOrgNom',  label: 'Organisme dem.',      dataType: 'text',   align: 'left',   defaultVisible: false, sortable: true,                     group: 'Demandeur', joinPath: 'DEM_TRI_CLE=TRIPLET.TRI_CLE AND TRIPLET.TRI_ORG_CLE=ORGANISME.ORG_CLE', joinType: 'inner' },
    { key: 'demOrgVille',label: 'Ville demandeur',     dataType: 'text',   align: 'left',   defaultVisible: false, sortable: true,  defaultWidth: 130, group: 'Demandeur', joinPath: 'DEM_TRI_CLE=TRIPLET.TRI_CLE AND TRIPLET.TRI_ORG_CLE=ORGANISME.ORG_CLE', joinType: 'inner' },
    // Agent (LEFT JOIN PERSONNEL ON DEM_PERSL_CLE=PERSONNEL.PERSL_CLE)
    { key: 'agent',      label: 'Agent traitant',      dataType: 'text',   align: 'left',   defaultVisible: false, sortable: true,  defaultWidth: 150, group: 'Personnel', joinPath: 'DEM_PERSL_CLE=PERSONNEL.PERSL_CLE',   joinType: 'left'  },
  ],

  actions:          stub('Libellé action'),
  chronos:          stub('Libellé chrono'),
  civilites:        stub('Civilité'),
  dossiers:         stub('Libellé dossier'),
  'etats-classeur': stub('État classeur'),
  'etats-elements': stub('État élément'),
  fonctions:        stub('Fonction'),
  'jours-feries':   stub('Jour férié'),
  natures:          stub('Nature'),
  objets:           stub('Objet'),
  protocoles:       stub('Protocole'),
  services:         stub('Service'),
};
