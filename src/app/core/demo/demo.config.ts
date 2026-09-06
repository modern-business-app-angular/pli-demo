/**
 * Everything that is specific to the portfolio demo (and not to the product itself)
 * is configured here: public links, one-click personas and storage keys.
 */
export interface DemoPersona {
  key: 'admin' | 'agent';
  title: string;
  name: string;
  service: string;
  username: string;
  password: string;
  hint: string;
}

export const DEMO_CONFIG = {
  appName: 'Pli',
  tagline: 'Gestion du courrier et des demandes pour les collectivités',
  version: '1.0.0-demo',
  links: {
    github: 'https://github.com/modern-business-app-angular/pli-demo',
    live: 'https://pli-demo.pages.dev',
    /** À compléter avec l'URL du profil Malt. */
    malt: 'https://www.malt.com/profile/faroukbouterfass',
  },
  personas: [
    {
      key: 'admin',
      title: 'Administrateur',
      name: 'Jean Dupont',
      service: 'Direction Générale',
      username: 'admin',
      password: 'admin',
      hint: 'Accès complet : administration, codifications, maquettes',
    },
    {
      key: 'agent',
      title: 'Agent',
      name: 'Marie Leblanc',
      service: 'Relations Extérieures',
      username: 'mleblanc',
      password: 'password',
      hint: 'Droits restreints : courriers entrants et sortants, contacts',
    },
  ] as readonly DemoPersona[],
  storage: {
    tourDone: 'pli_demo_tour_done',
  },
} as const;
