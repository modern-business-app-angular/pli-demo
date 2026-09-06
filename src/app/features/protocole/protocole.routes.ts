import { Routes } from '@angular/router';
import { OutOfScopeComponent } from '../../shared/components/out-of-scope/out-of-scope.component';

/** Contacts, organismes and mailing lists exist in the product but are outside the demo scope. */
export const PROTOCOLE_ROUTES: Routes = [
  { path: '', component: OutOfScopeComponent, data: { breadcrumb: 'Protocole' } },
  { path: 'contacts', component: OutOfScopeComponent, data: { breadcrumb: 'Contacts' } },
  { path: 'organismes', component: OutOfScopeComponent, data: { breadcrumb: 'Organismes' } },
  { path: 'diffusion', component: OutOfScopeComponent, data: { breadcrumb: 'Listes de diffusion' } },
];
