import { Injectable } from '@angular/core';
import { DEMO_ENVIRONMENT } from './demo.environment';

export interface AppEnvironment {
  apiBaseUrl: string;
  authEndpoint: string;
  production: boolean;
  appVersion: string;
  features: {
    darkMode: boolean;
    notifications: boolean;
    websockets: boolean;
  };
}

/**
 * Runtime environment. In a deployed product this would be loaded from a JSON file at
 * startup so the same build can target several environments; the demo ships a static
 * constant instead (no network round-trip before the first render).
 */
@Injectable({ providedIn: 'root' })
export class EnvironmentService {
  private readonly env: AppEnvironment = DEMO_ENVIRONMENT;

  get<K extends keyof AppEnvironment>(key: K): AppEnvironment[K] {
    return this.env[key];
  }

  get apiBaseUrl(): string {
    return this.env.apiBaseUrl;
  }

  get authEndpoint(): string {
    return this.env.authEndpoint;
  }

  get production(): boolean {
    return this.env.production;
  }

  get appVersion(): string {
    return this.env.appVersion;
  }

  hasFeature(feature: keyof AppEnvironment['features']): boolean {
    return this.env.features[feature];
  }
}
