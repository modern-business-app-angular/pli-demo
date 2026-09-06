export interface Maquette {
  id: number;
  nom: string;
  type: 'AR' | 'REP' | 'ML' | 'BOR';
  extension: string;
  acces: 'PUBLIC' | 'SERVICE' | 'USER';
  serviceId?: number;
  serviceNom?: string;
  personnelId?: number;
  personnelNom?: string;
  filename?: string;
  fileUrl?: string;
}

export interface LogEntry {
  id: number;
  date: string;
  machine: string;
  utilisateur: string;
  type: 'CON' | 'FON' | 'ERR' | string;
  objet: string;
  commentaire?: string;
}

export interface MailLog {
  id: number;
  date: string;
  type: string;
  emetteur: string;
  destinataire: string;
  objet: string;
  machine?: string;
  contenu?: string;
}

export interface MailArchive extends MailLog {
  origine: string;
  dateSuppr?: string;
  serviceHierarchie?: string;
  demandeId?: number;
}

// ── Personnalisation des champs ───────────────────────────────────────────────

export type ChampType = 'chaine' | 'date' | 'numerique' | 'liste' | 'multiligne';

export interface PageSpec {
  id: number;
  nom: string;       // technical name — used by CHRONO.CHR_PAGESPECIFIQUE
  nomTable?: string; // linked DB table (informational)
  champCount: number;
}

export interface ChampSpec {
  id: number;
  pageNom: string;
  nom: string;
  libelle: string;
  infobulle?: string;
  visible: boolean;
  obligatoire: boolean;
  majuscule: boolean;
  type: ChampType;
  valeurDefaut?: string;
  valeurs?: string;      // Liste type: comma-separated static values
  identifiants?: string; // Liste type: matching IDs
  requeteListe?: string; // Liste type: SQL query (alternative to static values)
  ordre: number;
}

// ── Maquette tag configuration ────────────────────────────────────────────────

export type TagDataType = 'text' | 'date' | 'number';

export interface TagDefinition {
  name: string;          // raw field name, e.g. "Nom"
  mergeField: string;    // "«Nom»" — Word mail-merge display syntax
  mustache: string;      // "{{Nom}}" — simple text syntax
  label: string;         // French label: "Nom du correspondant"
  description: string;
  dataType: TagDataType;
  example: string;       // e.g. "DUPONT"
  source: 'system' | 'dynamic';
  pageNom?: string;      // set for dynamic (ChampSpec) tags
}

export interface TagCategory {
  id: string;
  label: string;
  icon: string;
  tags: TagDefinition[];
}

export interface TagCatalog {
  categories: TagCategory[];
}

export interface DocxParseResult {
  status: 'idle' | 'parsing' | 'done' | 'error';
  foundTags: string[];
  detectedMode: 'mergefield' | 'mustache' | 'mixed' | 'none';
  errorMessage?: string;
}

export interface MaquetteTagsConfig {
  maquetteId: number;
  lastFoundTags?: string[];
  lastParsedAt?: string;
}

// ─────────────────────────────────────────────────────────────────────────────

export interface SystemConfig {
  storage: {
    mode: 'interne' | 'alfresco';
    alfrescoUrl?: string;
    alfrescoLogin?: string;
    alfrescoPassword?: string;
    alfrescoRoot?: string;
  };
  ldap: {
    enabled: boolean;
    serverUrl?: string;
    domain?: string;
    adminLogin?: string;
    adminPassword?: string;
  };
}
