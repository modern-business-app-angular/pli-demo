import type { RequestHandler } from 'msw';
import { authHandlers } from './auth.handlers';
import { courriersHandlers } from './courriers.handlers';
import { codificationsHandlers } from './codifications.handlers';
import { administrationHandlers } from './administration.handlers';
import { searchHandlers } from './search.handlers';
import { demandesHandlers } from './demandes.handlers';
import { champsSpecHandlers } from './champs-spec.handlers';
import { maquetteTagsHandlers } from './maquette-tags.handlers';
import { courrierSearchHandlers } from './courrier-search.handlers';
import { courriersNouveauHandlers } from './courriers-nouveau.handlers';

/** All request handlers of the simulated API (order matters: specific routes first). */
export const handlers: RequestHandler[] = [
  ...authHandlers,
  ...courriersNouveauHandlers,
  ...courriersHandlers,
  ...courrierSearchHandlers,
  ...codificationsHandlers,
  ...administrationHandlers,
  ...searchHandlers,
  ...demandesHandlers,
  ...champsSpecHandlers,
  ...maquetteTagsHandlers,
];
