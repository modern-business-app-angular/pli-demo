import { Routes } from '@angular/router';
import { CourriersHubComponent } from './pages/courriers-hub/courriers-hub.component';
import { CourrierEntrantListComponent } from './pages/courrier-entrant-list/courrier-entrant-list.component';
import { CourrierEntrantNewComponent } from './pages/courrier-entrant-new/courrier-entrant-new.component';
import { CourriersListComponent } from './pages/courriers-list/courriers-list.component';
import { CourrierNouveauComponent } from './pages/courrier-nouveau/courrier-nouveau.component';

export const COURRIERS_ROUTES: Routes = [
  {
    path: '',
    component: CourriersHubComponent,
    data: { breadcrumb: 'Courriers' },
    children: [
      // Default — redirect to incoming mail
      { path: '', redirectTo: 'entrant', pathMatch: 'full' },

      // Courriers entrants (keep existing list + wizard, add new unified form)
      {
        path: 'entrant',
        data: { breadcrumb: 'Entrants' },
        children: [
          { path: '', component: CourrierEntrantListComponent },
          { path: 'nouveau', component: CourrierNouveauComponent, data: { courrierType: 'entrant', breadcrumb: 'Nouveau' } },
          { path: ':id', component: CourrierEntrantNewComponent, data: { breadcrumb: 'Détail' } },
        ],
      },

      // Courriers sortants
      {
        path: 'sortant',
        data: { breadcrumb: 'Sortants' },
        children: [
          { path: '', component: CourriersListComponent, data: { courrierType: 'sortant' } },
          { path: 'nouveau', component: CourrierNouveauComponent, data: { courrierType: 'sortant', breadcrumb: 'Nouveau' } },
        ],
      },

      // Courriers internes
      {
        path: 'interne',
        data: { breadcrumb: 'Internes' },
        children: [
          { path: '', component: CourriersListComponent, data: { courrierType: 'interne' } },
          { path: 'nouveau', component: CourrierNouveauComponent, data: { courrierType: 'interne', breadcrumb: 'Nouveau' } },
        ],
      },

      // Advanced search
      {
        path: 'recherche',
        data: { breadcrumb: 'Recherche' },
        loadComponent: () =>
          import('./pages/courrier-search/courrier-search.component')
            .then(m => m.CourrierSearchComponent),
      },
    ],
  },
];
