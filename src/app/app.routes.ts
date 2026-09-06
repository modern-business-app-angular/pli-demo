import { Routes } from '@angular/router';
import { authGuard } from './core/guards/auth.guard';
import { roleGuard } from './core/guards/role.guard';

export const appRoutes: Routes = [
  // ── Public routes (no auth required) ──────────────────────────────────────
  {
    path: 'auth',
    title: 'Connexion',
    loadComponent: () =>
      import('./features/auth/pages/login/login.component').then((m) => m.LoginComponent),
  },

  // ── Protected routes (wrapped in layout shell) ────────────────────────────
  {
    path: '',
    loadComponent: () =>
      import('./layout/main-layout/main-layout.component').then((m) => m.MainLayoutComponent),
    canActivate: [authGuard],
    children: [
      { path: '', redirectTo: 'dashboard', pathMatch: 'full' },
      {
        path: 'dashboard',
        title: 'Tableau de bord',
        loadComponent: () =>
          import('./features/dashboard/dashboard.component').then((m) => m.DashboardComponent),
        data: { breadcrumb: 'Tableau de bord', module: 'dashboard' },
      },
      {
        path: 'courriers',
        loadChildren: () =>
          import('./features/courriers/courriers.routes').then((m) => m.COURRIERS_ROUTES),
        data: { breadcrumb: 'Courriers', module: 'courriers' },
      },
      {
        path: 'demandes',
        loadChildren: () =>
          import('./features/demandes/demandes.routes').then((m) => m.DEMANDES_ROUTES),
        data: { breadcrumb: 'Demandes', module: 'demandes' },
      },
      {
        path: 'protocole',
        loadChildren: () =>
          import('./features/protocole/protocole.routes').then((m) => m.PROTOCOLE_ROUTES),
        data: { breadcrumb: 'Protocole', module: 'protocole' },
      },
      // The global search lives with the courriers module.
      { path: 'recherche', redirectTo: 'courriers/recherche' },
      {
        path: 'parametres',
        loadChildren: () =>
          import('./features/administration/administration.routes').then(
            (m) => m.ADMINISTRATION_ROUTES
          ),
        canActivate: [roleGuard],
        data: {
          breadcrumb: 'Administration',
          module: 'administration',
          roles: ['ADMIN'],
        },
      },
      {
        path: '**',
        title: 'Page introuvable',
        loadComponent: () =>
          import('./shared/components/not-found/not-found.component').then(
            (m) => m.NotFoundComponent
          ),
      },
    ],
  },

  { path: '**', redirectTo: 'auth' },
];
