import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { NzDrawerModule } from 'ng-zorro-antd/drawer';
import { NzButtonModule } from 'ng-zorro-antd/button';
import { NzTagModule } from 'ng-zorro-antd/tag';
import { NzPopconfirmModule } from 'ng-zorro-antd/popconfirm';
import { DemoUiService } from '../demo-ui.service';
import { DemoTourService } from '../demo-tour.service';

const STACK = [
  'Angular 21 · standalone · zoneless',
  'Signals & NgRx Signals',
  'NG-ZORRO (Ant Design)',
  'Tailwind CSS · tokens DSFR',
  'Less theme',
  'TypeScript strict',
  'MSW (handlers HTTP)',
  'Vitest',
  'Cloudflare Pages',
];

const FLOW = [
  { step: 'Composant', text: 'Un écran appelle un service métier, comme dans le produit final.' },
  { step: 'HttpClient', text: 'Le service émet une requête HTTP typée (GET, POST, PUT, DELETE, multipart).' },
  { step: 'Intercepteurs', text: 'Jeton d’authentification, gestion des erreurs et indicateur de chargement.' },
  { step: 'MockHttpBackend', text: 'Remplace le backend réseau d’Angular : la requête est résolue dans le navigateur.' },
  { step: 'Handlers MSW', text: '~75 routes, données de démo en français, latence simulée, persistance locale.' },
];

const SHOWCASE = [
  'Courriers entrants, sortants et internes avec numérotation chrono',
  'Fiche suiveuse et action « Faire suivre » (workflow)',
  'Recherche avancée multi-critères et modèles de recherche sauvegardés',
  'Boîte de réception des demandes (mail, SMS, formulaire, guichet)',
  'Administration : codifications, personnels, services, territoires',
  'Maquettes Word : analyse des champs de fusion directement dans le navigateur',
  'Personnalisation des champs par page, configuration système',
];

const LIMITS = [
  'Les modules Protocole et Profils & droits sont hors périmètre de la démo.',
  'Ouverture dans Word (WebDAV) désactivée ; le téléchargement des maquettes fonctionne.',
  'Vos modifications sont conservées dans ce navigateur uniquement (localStorage).',
];

@Component({
  selector: 'pli-demo-about-drawer',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [NzDrawerModule, NzButtonModule, NzTagModule, NzPopconfirmModule],
  templateUrl: './demo-about-drawer.component.html',
  styleUrl: './demo-about-drawer.component.scss',
})
export class DemoAboutDrawerComponent {
  protected readonly demo = inject(DemoUiService);
  private readonly tour = inject(DemoTourService);

  protected readonly config = this.demo.config;
  protected readonly stack = STACK;
  protected readonly flow = FLOW;
  protected readonly showcase = SHOWCASE;
  protected readonly limits = LIMITS;

  protected replayTour(): void {
    this.demo.closeAbout();
    // Let the drawer close before highlighting shell elements.
    setTimeout(() => void this.tour.start(true), 350);
  }

  protected reset(): void {
    this.demo.resetDemo();
  }
}
