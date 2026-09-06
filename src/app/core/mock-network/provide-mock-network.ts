import { EnvironmentProviders, isDevMode, makeEnvironmentProviders } from '@angular/core';
import { HttpBackend } from '@angular/common/http';
import { MockHttpBackend } from './mock-http.backend';
import {
  MOCK_NETWORK_LOADER,
  MOCK_NETWORK_OPTIONS,
  MockNetworkLoader,
  MockNetworkOptions,
} from './mock-network.tokens';
import { MOCK_ORIGIN } from '../../../mocks/mock-origin';

const DEFAULT_LATENCY = { min: 60, max: 180 };

const defaultLoader: MockNetworkLoader = () => import('../../../mocks');

/** `?latency=<ms>` overrides the simulated latency (handy for screenshots and tests). */
function latencyFromQuery(): MockNetworkOptions['latency'] | undefined {
  try {
    const raw = new URLSearchParams(location.search).get('latency');
    if (raw === null) return undefined;
    const ms = Number(raw);
    return Number.isFinite(ms) && ms >= 0 ? { min: ms, max: ms } : undefined;
  } catch {
    return undefined;
  }
}

/**
 * Replaces Angular's `HttpBackend` with the in-browser mock.
 * Must be listed AFTER `provideHttpClient(...)` in the application providers.
 */
export function provideMockNetwork(
  overrides: Partial<MockNetworkOptions> = {},
  loader: MockNetworkLoader = defaultLoader
): EnvironmentProviders {
  const options: MockNetworkOptions = {
    origin: MOCK_ORIGIN,
    latency: latencyFromQuery() ?? DEFAULT_LATENCY,
    log: isDevMode(),
    ...overrides,
  };
  return makeEnvironmentProviders([
    { provide: MOCK_NETWORK_OPTIONS, useValue: options },
    { provide: MOCK_NETWORK_LOADER, useValue: loader },
    { provide: HttpBackend, useClass: MockHttpBackend },
  ]);
}
