// ============================================================
// Pli — Codification Page Configs
// One CodifPageConfig per simple/medium codification.
// Used by CodifListPageComponent to render table + modal form.
// ============================================================

// ── Config types ─────────────────────────────────────────────────────────

export interface CodifColumnDef {
  field: string;
  header: string;
  sortable?: boolean;
  width?: string;
  type?: 'text' | 'date' | 'boolean';
}

export interface CodifFormFieldDef {
  name: string;
  label: string;
  type: 'text' | 'number' | 'date' | 'select' | 'checkbox' | 'switch' | 'textarea';
  required?: boolean;
  maxLength?: number;
  /** Static options for select fields */
  options?: { value: unknown; label: string }[];
  /** API endpoint whose result array populates a select (e.g. '/villes') */
  asyncOptions?: string;
  /** Field to use as option label when asyncOptions is set */
  asyncOptionsLabel?: string;
  /** Field to use as option value when asyncOptions is set */
  asyncOptionsValue?: string;
}

export interface CodifPageConfig {
  /** Page title and modal heading prefix */
  title: string;
  /** API endpoint relative path, e.g. '/civilites' */
  apiEndpoint: string;
  /** Name of the primary key field on the DTO */
  idField: string;
  /** Table column definitions */
  columns: CodifColumnDef[];
  /** Modal form field definitions */
  formFields: CodifFormFieldDef[];
  canAdd?: boolean;
  canEdit?: boolean;
  canDelete?: boolean;
  /** Field used for the search input filter (GET ?q=…) */
  searchField?: string;
}

// ── Configs ──────────────────────────────────────────────────────────────

export const civiliteConfig: CodifPageConfig = {
  title: 'Civilités',
  apiEndpoint: '/civilites',
  idField: 'id',
  columns: [
    { field: 'id',      header: 'ID',      width: '80px', sortable: true },
    { field: 'libelle', header: 'Libellé',               sortable: true },
  ],
  formFields: [
    { name: 'libelle', label: 'Libellé', type: 'text', required: true, maxLength: 250 },
  ],
  searchField: 'libelle',
  canAdd: true, canEdit: true, canDelete: true,
};

export const criticiteConfig: CodifPageConfig = {
  title: 'Criticités',
  apiEndpoint: '/criticites',
  idField: 'id',
  columns: [
    { field: 'id',      header: 'ID',      width: '80px', sortable: true },
    { field: 'libelle', header: 'Libellé',               sortable: true },
  ],
  formFields: [
    { name: 'libelle', label: 'Libellé', type: 'text', required: true, maxLength: 250 },
  ],
  searchField: 'libelle',
  canAdd: true, canEdit: true, canDelete: true,
};

export const prioriteConfig: CodifPageConfig = {
  title: 'Priorités',
  apiEndpoint: '/priorites',
  idField: 'id',
  columns: [
    { field: 'id',        header: 'ID',        width: '80px',  sortable: true },
    { field: 'libelle',   header: 'Libellé',                   sortable: true },
    { field: 'isDefault', header: 'Défaut',    width: '100px', type: 'boolean' },
  ],
  formFields: [
    { name: 'libelle',   label: 'Libellé', type: 'text',     required: true, maxLength: 50 },
    { name: 'isDefault', label: 'Défaut',  type: 'checkbox' },
  ],
  searchField: 'libelle',
  canAdd: true, canEdit: true, canDelete: true,
};

export const natureConfig: CodifPageConfig = {
  title: 'Natures',
  apiEndpoint: '/natures',
  idField: 'id',
  columns: [
    { field: 'id',       header: 'ID',       width: '80px',  sortable: true },
    { field: 'libelle',  header: 'Libellé',                  sortable: true },
    { field: 'nbjDtLim', header: 'Délai (j)', width: '110px', sortable: true },
  ],
  formFields: [
    { name: 'libelle',  label: 'Libellé',      type: 'text',   required: true, maxLength: 50 },
    { name: 'nbjDtLim', label: 'Délai par défaut (jours)', type: 'number' },
  ],
  searchField: 'libelle',
  canAdd: true, canEdit: true, canDelete: true,
};

export const fonctionConfig: CodifPageConfig = {
  title: 'Fonctions',
  apiEndpoint: '/fonctions',
  idField: 'id',
  columns: [
    { field: 'id',      header: 'Code',    width: '180px', sortable: true },
    { field: 'libelle', header: 'Libellé',                 sortable: true },
    { field: 'module',  header: 'Module',  width: '160px', sortable: true },
  ],
  formFields: [
    { name: 'id',      label: 'Code',    type: 'text', required: true, maxLength: 250 },
    { name: 'libelle', label: 'Libellé', type: 'text', required: true, maxLength: 250 },
    { name: 'module',  label: 'Module',  type: 'text',               maxLength: 50  },
  ],
  searchField: 'libelle',
  canAdd: true, canEdit: true, canDelete: true,
};

export const jourFerieConfig: CodifPageConfig = {
  title: 'Jours fériés',
  apiEndpoint: '/jours-feries',
  idField: 'jour',
  columns: [
    { field: 'jour',    header: 'Date',    width: '140px', sortable: true, type: 'date' },
    { field: 'libelle', header: 'Libellé',                 sortable: true },
  ],
  formFields: [
    { name: 'jour',    label: 'Date',    type: 'date', required: true },
    { name: 'libelle', label: 'Libellé', type: 'text', required: true, maxLength: 50 },
  ],
  canAdd: true, canEdit: true, canDelete: true,
};

export const etatClasseurConfig: CodifPageConfig = {
  title: 'États Classeurs',
  apiEndpoint: '/etats-classeur',
  idField: 'id',
  columns: [
    { field: 'id',      header: 'ID',     width: '80px',  sortable: true },
    { field: 'libelle', header: 'Libellé',                sortable: true },
    { field: 'type',    header: 'Type',   width: '80px',  sortable: true },
    { field: 'valeur',  header: 'Valeur', width: '90px',  sortable: true },
  ],
  formFields: [
    { name: 'libelle', label: 'Libellé', type: 'text',   required: true, maxLength: 50 },
    { name: 'type',    label: 'Type',    type: 'text',   required: true, maxLength: 3  },
    { name: 'valeur',  label: 'Valeur',  type: 'number', required: true },
  ],
  searchField: 'libelle',
  canAdd: true, canEdit: true, canDelete: true,
};

export const etatElementConfig: CodifPageConfig = {
  title: 'États Éléments',
  apiEndpoint: '/etats-elements',
  idField: 'id',
  columns: [
    { field: 'id',      header: 'ID',     width: '80px',  sortable: true },
    { field: 'libelle', header: 'Libellé',                sortable: true },
    { field: 'type',    header: 'Type',   width: '80px',  sortable: true },
    { field: 'valeur',  header: 'Valeur', width: '90px',  sortable: true },
  ],
  formFields: [
    { name: 'libelle', label: 'Libellé', type: 'text',   required: true, maxLength: 50 },
    { name: 'type',    label: 'Type',    type: 'text',   required: true, maxLength: 3  },
    { name: 'valeur',  label: 'Valeur',  type: 'number', required: true },
  ],
  searchField: 'libelle',
  canAdd: true, canEdit: true, canDelete: true,
};

export const objetConfig: CodifPageConfig = {
  title: 'Objets',
  apiEndpoint: '/objets',
  idField: 'id',
  columns: [
    { field: 'id',       header: 'ID',          width: '80px',  sortable: true },
    { field: 'libelleC', header: 'Code',         width: '130px', sortable: true },
    { field: 'libelleL', header: 'Libellé long',                sortable: true },
    { field: 'type',     header: 'Usage',        width: '110px', sortable: true },
  ],
  formFields: [
    { name: 'libelleC', label: 'Code (court)',  type: 'text', required: true, maxLength: 20 },
    { name: 'libelleL', label: 'Libellé long',  type: 'text', required: true, maxLength: 250 },
    {
      name: 'type', label: 'Usage', type: 'select', required: true,
      options: [
        { value: 'TOU', label: 'Tous courriers' },
        { value: 'REC', label: 'Entrants seulement' },
        { value: 'PRO', label: 'Sortants seulement' },
      ],
    },
  ],
  searchField: 'libelleL',
  canAdd: true, canEdit: true, canDelete: true,
};

export const villeConfig: CodifPageConfig = {
  title: 'Villes',
  apiEndpoint: '/villes',
  idField: 'id',
  columns: [
    { field: 'id',         header: 'ID',          width: '80px',  sortable: true },
    { field: 'codePostal', header: 'Code postal',  width: '130px', sortable: true },
    { field: 'ville',      header: 'Ville',                        sortable: true },
    { field: 'insee',      header: 'INSEE',         width: '100px', sortable: true },
  ],
  formFields: [
    { name: 'codePostal', label: 'Code postal', type: 'text',   required: true, maxLength: 10 },
    { name: 'ville',      label: 'Ville',       type: 'text',   required: true, maxLength: 50 },
    { name: 'insee',      label: 'Code INSEE',  type: 'number' },
  ],
  searchField: 'ville',
  canAdd: true, canEdit: true, canDelete: true,
};

export const rueConfig: CodifPageConfig = {
  title: 'Rues',
  apiEndpoint: '/rues',
  idField: 'id',
  columns: [
    { field: 'id',       header: 'ID',        width: '80px',  sortable: true },
    { field: 'motDirec', header: 'Type',       width: '100px', sortable: true },
    { field: 'nomRue',   header: 'Nom de rue',                sortable: true },
    { field: 'villeNom', header: 'Ville',      width: '160px', sortable: true },
  ],
  formFields: [
    { name: 'motDirec', label: 'Type (Rue, Avenue…)', type: 'text',   maxLength: 50  },
    { name: 'nomRue',   label: 'Nom de rue',           type: 'text',   required: true, maxLength: 100 },
    { name: 'identif',  label: 'Code voie',            type: 'text',   maxLength: 15  },
    {
      name: 'villeId', label: 'Ville', type: 'select', required: true,
      asyncOptions: '/villes',
      asyncOptionsValue: 'id',
      asyncOptionsLabel: 'ville',
    },
  ],
  searchField: 'nomRue',
  canAdd: true, canEdit: true, canDelete: true,
};

export const delegationConfig: CodifPageConfig = {
  title: 'Délégations',
  apiEndpoint: '/delegations',
  idField: 'id',
  columns: [
    { field: 'delegateurNom', header: 'Délégant',    sortable: true },
    { field: 'delegueNom',    header: 'Délégué',     sortable: true },
    { field: 'debut',         header: 'Début',        width: '120px', sortable: true, type: 'date' },
    { field: 'fin',           header: 'Fin',          width: '120px', sortable: true, type: 'date' },
  ],
  formFields: [
    {
      name: 'delegateurId', label: 'Délégant', type: 'select', required: true,
      asyncOptions: '/personnel',
      asyncOptionsValue: 'id',
      asyncOptionsLabel: 'displayName',
    },
    {
      name: 'delegueId', label: 'Délégué', type: 'select', required: true,
      asyncOptions: '/personnel',
      asyncOptionsValue: 'id',
      asyncOptionsLabel: 'displayName',
    },
    { name: 'debut', label: 'Date de début', type: 'date', required: true },
    { name: 'fin',   label: 'Date de fin',   type: 'date', required: true },
  ],
  canAdd: true, canEdit: true, canDelete: true,
};

export const dossierConfig: CodifPageConfig = {
  title: 'Dossiers',
  apiEndpoint: '/dossiers',
  idField: 'id',
  columns: [
    { field: 'id',          header: 'N°',         width: '80px',  sortable: true },
    { field: 'mot',         header: 'Intitulé',                    sortable: true },
    { field: 'serviceNom',  header: 'Service',    width: '160px', sortable: true },
    { field: 'datLim',      header: 'Date limite', width: '120px', sortable: true, type: 'date' },
  ],
  formFields: [
    { name: 'mot',    label: 'Intitulé',    type: 'text', required: true, maxLength: 250 },
    { name: 'datLim', label: 'Date limite', type: 'date' },
    {
      name: 'serviceId', label: 'Service', type: 'select',
      asyncOptions: '/services',
      asyncOptionsValue: 'id',
      asyncOptionsLabel: 'nom',
    },
  ],
  searchField: 'mot',
  canAdd: true, canEdit: true, canDelete: true,
};
