import { Routes } from '@angular/router';
import { OutOfScopeComponent } from '../../shared/components/out-of-scope/out-of-scope.component';
import { CodificationsHubComponent } from './pages/codifications-hub/codifications-hub.component';
import { CodifListPageComponent } from './components/codif-list-page/codif-list-page.component';
import { PersonnelsComponent } from './pages/personnels/personnels.component';
import { ChronosComponent } from './pages/chronos/chronos.component';
import { ServicesComponent } from './pages/services/services.component';
import { TerritoiresComponent } from './pages/territoires/territoires.component';
import { SectorisationComponent } from './pages/sectorisation/sectorisation.component';
import {
  civiliteConfig,
  criticiteConfig,
  prioriteConfig,
  natureConfig,
  fonctionConfig,
  jourFerieConfig,
  etatClasseurConfig,
  etatElementConfig,
  objetConfig,
  villeConfig,
  rueConfig,
  delegationConfig,
  dossierConfig,
} from './configs/codif-page.configs';

export const CODIFICATIONS_ROUTES: Routes = [
  {
    path: '',
    component: CodificationsHubComponent,
    children: [
      // Default redirect
      { path: '', redirectTo: 'civilites', pathMatch: 'full' },

      // ── Config-driven (generic CodifListPageComponent) ──────────────────
      {
        path: 'civilites',
        component: CodifListPageComponent,
        data: { config: civiliteConfig, breadcrumb: 'Civilités' },
      },
      {
        path: 'criticites',
        component: CodifListPageComponent,
        data: { config: criticiteConfig, breadcrumb: 'Criticités' },
      },
      {
        path: 'priorites',
        component: CodifListPageComponent,
        data: { config: prioriteConfig, breadcrumb: 'Priorités' },
      },
      {
        path: 'natures',
        component: CodifListPageComponent,
        data: { config: natureConfig, breadcrumb: 'Natures' },
      },
      {
        path: 'fonctions',
        component: CodifListPageComponent,
        data: { config: fonctionConfig, breadcrumb: 'Fonctions' },
      },
      {
        path: 'jours-feries',
        component: CodifListPageComponent,
        data: { config: jourFerieConfig, breadcrumb: 'Jours fériés' },
      },
      {
        path: 'etats-classeur',
        component: CodifListPageComponent,
        data: { config: etatClasseurConfig, breadcrumb: 'États Classeurs' },
      },
      {
        path: 'etats-elements',
        component: CodifListPageComponent,
        data: { config: etatElementConfig, breadcrumb: 'États Éléments' },
      },
      {
        path: 'objets',
        component: CodifListPageComponent,
        data: { config: objetConfig, breadcrumb: 'Objets' },
      },
      {
        path: 'villes',
        component: CodifListPageComponent,
        data: { config: villeConfig, breadcrumb: 'Villes' },
      },
      {
        path: 'rues',
        component: CodifListPageComponent,
        data: { config: rueConfig, breadcrumb: 'Rues' },
      },
      {
        path: 'delegations',
        component: CodifListPageComponent,
        data: { config: delegationConfig, breadcrumb: 'Délégations' },
      },
      {
        path: 'dossiers',
        component: CodifListPageComponent,
        data: { config: dossierConfig, breadcrumb: 'Dossiers' },
      },

      // ── Phase 2 — dedicated pages (WIP stubs) ───────────────────────────
      { path: 'actions',        component: OutOfScopeComponent, data: { breadcrumb: 'Actions' } },
      { path: 'chronos',        component: ChronosComponent,  data: { breadcrumb: 'Chronos' } },
      { path: 'personnels',     component: PersonnelsComponent, data: { breadcrumb: 'Personnels' } },
      { path: 'services',       component: ServicesComponent,  data: { breadcrumb: 'Services' } },
      { path: 'sectorisation',  component: SectorisationComponent, data: { breadcrumb: 'Sectorisation' } },
      { path: 'territoires',    component: TerritoiresComponent, data: { breadcrumb: 'Territoires' } },
    ],
  },
];
