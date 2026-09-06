import { Injectable } from '@angular/core';
import type { Driver } from 'driver.js';
import { DEMO_CONFIG } from './demo.config';

interface TourStep {
  selector: string;
  title: string;
  description: string;
}

/** Shell-level steps only, so the tour works whatever lazy page is displayed. */
const STEPS: TourStep[] = [
  {
    selector: '[data-tour="palette"]',
    title: 'Palette de commandes',
    description:
      'Naviguez ou créez un courrier au clavier : <kbd>Ctrl</kbd> + <kbd>K</kbd> ouvre la palette depuis n’importe quelle page.',
  },
  {
    selector: '[data-tour="service"]',
    title: 'Mon service',
    description:
      'Les compteurs de la boîte aux lettres du service et des courriers en retard sont accessibles en un clic.',
  },
  {
    selector: '[data-tour="courriers"]',
    title: 'Courriers',
    description:
      'Entrants, sortants, internes et recherche avancée. Ouvrez un courrier puis « Faire suivre » pour alimenter la fiche suiveuse.',
  },
  {
    selector: '[data-tour="about"]',
    title: 'À propos de cette démo',
    description:
      'Le contexte du projet, la pile technique et l’architecture réseau simulée dans le navigateur.',
  },
  {
    selector: '[data-tour="user"]',
    title: 'Changer de profil',
    description:
      'Déconnectez-vous pour tester le profil « Agent » : le menu Administration disparaît et les pages protégées redirigent.',
  },
];

@Injectable({ providedIn: 'root' })
export class DemoTourService {
  private driverInstance: Driver | null = null;

  /** True when the visitor has already completed or dismissed the tour. */
  get done(): boolean {
    try {
      return localStorage.getItem(DEMO_CONFIG.storage.tourDone) === '1';
    } catch {
      return true;
    }
  }

  /** Start the tour (driver.js is loaded lazily on first use). */
  async start(force = false): Promise<void> {
    if (!force && this.done) return;
    if (this.driverInstance?.isActive()) return;

    const steps = STEPS.filter((s) => document.querySelector(s.selector));
    if (steps.length === 0) return;

    const { driver } = await import('driver.js');
    this.driverInstance = driver({
      showProgress: true,
      allowClose: true,
      overlayOpacity: 0.55,
      stagePadding: 6,
      stageRadius: 8,
      popoverClass: 'pli-tour',
      nextBtnText: 'Suivant',
      prevBtnText: 'Précédent',
      doneBtnText: 'Terminer',
      progressText: '{{current}} / {{total}}',
      steps: steps.map((s) => ({
        element: s.selector,
        popover: { title: s.title, description: s.description },
      })),
      onDestroyed: () => this.markDone(),
    });
    this.driverInstance.drive();
  }

  private markDone(): void {
    try {
      localStorage.setItem(DEMO_CONFIG.storage.tourDone, '1');
    } catch {
      // Storage disabled: the tour will simply show again next time.
    }
  }
}
