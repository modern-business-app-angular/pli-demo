import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { EnvironmentService } from '../../../core/config/environment.service';
import { Observable, forkJoin, map, catchError, of } from 'rxjs';
import type { TagCatalog, TagCategory, TagDefinition, ChampSpec } from '../models/administration.models';

// ── Static system catalog ─────────────────────────────────────────────────────

function tag(
  name: string,
  label: string,
  description: string,
  dataType: 'text' | 'date' | 'number',
  example: string
): TagDefinition {
  return { name, mergeField: `«${name}»`, mustache: `{{${name}}}`, label, description, dataType, example, source: 'system' };
}

const SYSTEM_CATEGORIES: TagCategory[] = [
  {
    id: 'correspondant',
    label: 'Correspondant',
    icon: 'user',
    tags: [
      tag('Civilite',      'Civilité',              'Civilité du correspondant (M., Mme, ...)',              'text',   'M.'),
      tag('Nom',           'Nom',                   'Nom de famille du correspondant',                      'text',   'DUPONT'),
      tag('Prenom',        'Prénom',                'Prénom du correspondant',                              'text',   'Jean'),
      tag('NomComplet',    'Nom complet',           'Civilité + Prénom + Nom',                              'text',   'M. Jean DUPONT'),
      tag('Email',         'E-mail',                'Adresse e-mail du correspondant',                      'text',   'jean.dupont@example.fr'),
      tag('Tel',           'Téléphone',             'Numéro de téléphone',                                  'text',   '01 23 45 67 89'),
      tag('AdresseLigne1', 'Adresse (ligne 1)',      'Numéro et nom de rue',                                 'text',   '12 rue de la Paix'),
      tag('AdresseLigne2', 'Adresse (ligne 2)',      'Complément d\'adresse',                               'text',   'Bâtiment B'),
      tag('CodePostal',    'Code postal',           'Code postal',                                          'text',   '75001'),
      tag('Ville',         'Ville',                 'Commune du correspondant',                              'text',   'PARIS'),
      tag('Pays',          'Pays',                  'Pays (si hors France)',                                'text',   'France'),
    ],
  },
  {
    id: 'courrier',
    label: 'Courrier',
    icon: 'mail',
    tags: [
      tag('Chrono',              'Numéro de chrono',        'Identifiant chronologique du courrier',      'text',   '2026-003421'),
      tag('Objet',               'Objet',                   'Objet du courrier',                          'text',   'Demande de renseignements'),
      tag('DateEnregistrement',  'Date d\'enregistrement',  'Date d\'entrée dans le système',             'date',   '19/03/2026'),
      tag('DateLimite',          'Date limite',             'Date limite de traitement',                  'date',   '02/04/2026'),
      tag('DateEnvoi',           'Date d\'envoi',           'Date d\'envoi au correspondant',             'date',   '20/03/2026'),
      tag('Nature',              'Nature',                  'Nature du courrier (libellé)',                'text',   'Plainte'),
      tag('NatureCode',          'Code nature',             'Code interne de la nature',                  'text',   'PLT'),
      tag('Priorite',            'Priorité',                'Priorité du courrier',                       'text',   'Urgente'),
      tag('RefExterne',          'Référence externe',       'Référence fournie par le correspondant',     'text',   'REF-2026-0099'),
    ],
  },
  {
    id: 'service',
    label: 'Service traitant',
    icon: 'apartment',
    tags: [
      tag('ServiceNom',  'Nom du service',    'Service responsable du dossier',   'text', 'Direction des affaires générales'),
      tag('ServiceCode', 'Code service',      'Code interne du service',          'text', 'DAG'),
      tag('DossierNom',  'Nom du dossier',    'Intitulé du dossier',              'text', 'Dossier urbanisme 2026'),
      tag('DossierRef',  'Référence dossier', 'Référence interne du dossier',     'text', 'DOS-2026-0042'),
    ],
  },
  {
    id: 'signataire',
    label: 'Signataire',
    icon: 'edit',
    tags: [
      tag('CiviliteSig', 'Civilité signataire', 'Civilité de l\'agent signataire', 'text', 'M.'),
      tag('NomSig',      'Nom signataire',      'Nom de l\'agent signataire',      'text', 'MARTIN'),
      tag('PrenomSig',   'Prénom signataire',   'Prénom de l\'agent signataire',   'text', 'Pierre'),
      tag('FonctionSig', 'Fonction signataire', 'Titre ou fonction du signataire', 'text', 'Directeur général des services'),
    ],
  },
  {
    id: 'organisation',
    label: 'Organisation',
    icon: 'bank',
    tags: [
      tag('OrganisationNom',     'Nom organisation',     'Nom de la collectivité',           'text', 'Mairie de Paris'),
      tag('OrganisationAdresse', 'Adresse organisation', 'Adresse du siège',                 'text', 'Hôtel de Ville'),
      tag('OrganisationCP',      'CP organisation',      'Code postal du siège',             'text', '75004'),
      tag('OrganisationVille',   'Ville organisation',   'Commune du siège',                 'text', 'PARIS'),
      tag('OrganisationTel',     'Tél. organisation',    'Téléphone du siège',               'text', '01 42 76 40 40'),
      tag('OrganisationEmail',   'E-mail organisation',  'E-mail de contact général',        'text', 'contact@paris.fr'),
      tag('LogoUrl',             'URL du logo',          'Lien vers le logo de l\'organisme','text', 'https://...'),
    ],
  },
  {
    id: 'dates',
    label: 'Dates système',
    icon: 'calendar',
    tags: [
      tag('DateDuJour',     'Date du jour',         'Date de génération du document (courte)', 'date',   '19/03/2026'),
      tag('DateDuJourLong', 'Date du jour (longue)', 'Date de génération (littérale)',          'date',   'jeudi 19 mars 2026'),
      tag('AnneeEnCours',   'Année en cours',        'Année de génération',                    'number', '2026'),
      tag('HeureGeneration','Heure de génération',   'Heure à la seconde de génération',       'text',   '14:32:07'),
    ],
  },
];

// ─────────────────────────────────────────────────────────────────────────────

@Injectable({ providedIn: 'root' })
export class TagCatalogService {
  private readonly http = inject(HttpClient);
  private readonly base = inject(EnvironmentService).apiBaseUrl;

  /** Returns the static system catalog (no HTTP). */
  getSystemCatalog(): TagCatalog {
    return { categories: structuredClone(SYSTEM_CATEGORIES) };
  }

  /**
   * Returns the full catalog = system tags + dynamic ChampSpec tags.
   * One HTTP request per distinct pageNom found across all pages-spec.
   */
  buildCatalog(): Observable<TagCatalog> {
    return this.http.get<{ nom: string }[]>(`${this.base}/pages-spec`).pipe(
      map((pages) => pages.map((p) => p.nom)),
      // Fetch all pages in parallel, gracefully ignore failures
      map((noms) =>
        noms.map((nom) =>
          this.http.get<ChampSpec[]>(`${this.base}/pages-spec/${nom}/champs`).pipe(
            catchError(() => of([] as ChampSpec[]))
          )
        )
      ),
      // forkJoin can't handle empty arrays — guard it
      (source$) =>
        new Observable<TagCatalog>((observer) => {
          source$.subscribe({
            next: (requests) => {
              if (requests.length === 0) {
                observer.next(this.getSystemCatalog());
                observer.complete();
                return;
              }
              forkJoin(requests).subscribe({
                next: (results) => {
                  const dynamicCategories = this._buildDynamicCategories(results.flat());
                  observer.next({
                    categories: [...structuredClone(SYSTEM_CATEGORIES), ...dynamicCategories],
                  });
                  observer.complete();
                },
                error: (err) => observer.error(err),
              });
            },
            error: (err) => observer.error(err),
          });
        }),
    );
  }

  private _buildDynamicCategories(champs: ChampSpec[]): TagCategory[] {
    // Group by pageNom
    const map = new Map<string, ChampSpec[]>();
    for (const c of champs) {
      if (!map.has(c.pageNom)) map.set(c.pageNom, []);
      map.get(c.pageNom)!.push(c);
    }
    const categories: TagCategory[] = [];
    for (const [pageNom, pageChamps] of map) {
      categories.push({
        id: `dynamic-${pageNom}`,
        label: `Champs spécifiques — ${pageNom}`,
        icon: 'setting',
        tags: pageChamps.map((c) => ({
          name:        c.nom,
          mergeField:  `«${c.nom}»`,
          mustache:    `{{${c.nom}}}`,
          label:       c.libelle,
          description: c.infobulle ?? c.libelle,
          dataType:    c.type === 'numerique' ? 'number' : c.type === 'date' ? 'date' : 'text',
          example:     c.valeurDefaut ?? '',
          source:      'dynamic' as const,
          pageNom,
        })),
      });
    }
    return categories;
  }

  /**
   * Generates a CSV string where the first row = field names (headers)
   * and the second row = example values.
   * This is served to Word so it populates the "Insérer un champ de fusion" dropdown.
   */
  generateCsvDataSource(catalog: TagCatalog): string {
    const allTags = catalog.categories.flatMap((c) => c.tags);
    const headers = allTags.map((t) => t.name).join(',');
    const examples = allTags.map((t) => `"${(t.example ?? '').replace(/"/g, '""')}"`).join(',');
    return `${headers}\r\n${examples}\r\n`;
  }
}
