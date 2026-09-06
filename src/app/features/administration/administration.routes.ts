import { Routes } from '@angular/router';
import { OutOfScopeComponent } from '../../shared/components/out-of-scope/out-of-scope.component';

export const ADMINISTRATION_ROUTES: Routes = [
  { path: '', component: OutOfScopeComponent, data: { breadcrumb: 'Administration' } },
  { path: 'droits', component: OutOfScopeComponent, data: { breadcrumb: 'Profils & droits' } },
  {
    path: 'recherches',
    loadComponent: () =>
      import('../search/pages/search-models/search-models.component').then(m => m.SearchModelsComponent),
    data: { breadcrumb: 'Modèles de recherche' },
  },
  {
    path: 'codifications',
    loadChildren: () =>
      import('../codifications/codifications.routes').then((m) => m.CODIFICATIONS_ROUTES),
    data: { breadcrumb: 'Codifications' },
  },
  {
    path: 'maquettes',
    loadComponent: () =>
      import('./pages/maquettes/maquettes.component').then((m) => m.MaquettesComponent),
    data: { breadcrumb: 'Maquettes' },
  },
  {
    path: 'maintenance',
    loadComponent: () =>
      import('./pages/maintenance/maintenance.component').then((m) => m.MaintenanceComponent),
    data: { breadcrumb: 'Maintenance' },
  },
  {
    path: 'mails-archives',
    loadComponent: () =>
      import('./pages/mails-archives/mails-archives.component').then((m) => m.MailsArchivesComponent),
    data: { breadcrumb: 'Mails archivés' },
  },
  {
    path: 'journal-mails',
    loadComponent: () =>
      import('./pages/journal-mails/journal-mails.component').then((m) => m.JournalMailsComponent),
    data: { breadcrumb: 'Journal des mails' },
  },
  {
    path: 'configuration',
    loadComponent: () =>
      import('./pages/system-config/system-config.component').then((m) => m.SystemConfigComponent),
    data: { breadcrumb: 'Configuration système' },
  },
  {
    path: 'champs',
    loadComponent: () =>
      import('./pages/champs-spec/champs-spec.component').then((m) => m.ChampsSpecComponent),
    data: { breadcrumb: 'Personnalisation des champs' },
  },
];
