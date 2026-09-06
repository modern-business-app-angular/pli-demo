import { InjectionToken } from '@angular/core';
import type { RequestHandler, getResponse } from 'msw';

export interface MockLatency {
  min: number;
  max: number;
}

export interface MockNetworkOptions {
  /** Origin answered by the mock layer; any other origin goes to the real XHR backend. */
  origin: string;
  /** Extra latency added to every mocked request (on top of handler-level `delay()`). */
  latency: MockLatency | null;
  /** Log unhandled routes and handler crashes to the console. */
  log: boolean;
}

/** Lazily loaded module holding the handlers and the MSW resolver. */
export interface MockNetworkModule {
  handlers: RequestHandler[];
  getResponse: typeof getResponse;
  /** Optional hook run after each successful mutating request. */
  persist?: () => void;
}

export type MockNetworkLoader = () => Promise<MockNetworkModule>;

export const MOCK_NETWORK_OPTIONS = new InjectionToken<MockNetworkOptions>('MOCK_NETWORK_OPTIONS');
export const MOCK_NETWORK_LOADER = new InjectionToken<MockNetworkLoader>('MOCK_NETWORK_LOADER');
