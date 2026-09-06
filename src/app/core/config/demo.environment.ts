import type { AppEnvironment } from './environment.service';
import { API_BASE, AUTH_BASE } from '../../../mocks/mock-origin';

/**
 * Static runtime configuration of the demo.
 * The API origin is a reserved `.invalid` host: every request is answered inside the
 * browser by the mock network layer (see `core/mock-network`).
 */
export const DEMO_ENVIRONMENT: AppEnvironment = {
  apiBaseUrl: API_BASE,
  authEndpoint: AUTH_BASE,
  production: true,
  appVersion: '1.0.0-demo',
  features: {
    darkMode: false,
    notifications: true,
    websockets: false,
  },
};
