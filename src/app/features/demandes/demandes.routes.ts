import { Routes } from '@angular/router';

export const DEMANDES_ROUTES: Routes = [
  {
    path: '',
    loadComponent: () =>
      import('./pages/demandes-inbox/demandes-inbox.component').then(
        (m) => m.DemandesInboxComponent
      ),
  },
  {
    path: ':id',
    loadComponent: () =>
      import('./pages/demande-detail/demande-detail.component').then(
        (m) => m.DemandeDetailComponent
      ),
  },
];
