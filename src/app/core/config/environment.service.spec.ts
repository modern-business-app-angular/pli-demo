import { describe, expect, it } from 'vitest';
import { TestBed } from '@angular/core/testing';
import { EnvironmentService } from './environment.service';
import { API_BASE, AUTH_BASE, MOCK_ORIGIN } from '../../../mocks/mock-origin';

describe('EnvironmentService (static demo environment)', () => {
  it('points every API call at the reserved mock origin', () => {
    const env = TestBed.inject(EnvironmentService);
    expect(env.apiBaseUrl).toBe(API_BASE);
    expect(env.authEndpoint).toBe(AUTH_BASE);
    expect(new URL(env.apiBaseUrl).origin).toBe(MOCK_ORIGIN);
    expect(MOCK_ORIGIN.endsWith('.invalid')).toBe(true);
  });

  it('exposes feature flags synchronously', () => {
    const env = TestBed.inject(EnvironmentService);
    expect(env.hasFeature('notifications')).toBe(true);
    expect(env.hasFeature('websockets')).toBe(false);
    expect(env.production).toBe(true);
  });
});
