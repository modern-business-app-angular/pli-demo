import { beforeEach, describe, expect, it, vi } from 'vitest';
import { TestBed } from '@angular/core/testing';
import { UrlTree, provideRouter } from '@angular/router';
import { authGuard } from './auth.guard';
import { roleGuard } from './role.guard';
import { AuthService } from '../services/auth.service';

describe('authGuard / roleGuard', () => {
  const isAuthenticated = vi.fn<() => boolean>();
  const currentUser = vi.fn<() => { roles: string[] } | null>();

  beforeEach(() => {
    isAuthenticated.mockReturnValue(false);
    currentUser.mockReturnValue(null);
    TestBed.configureTestingModule({
      providers: [
        provideRouter([]),
        { provide: AuthService, useValue: { isAuthenticated, currentUser } },
      ],
    });
  });

  it('redirects to /auth when not authenticated', () => {
    const result = TestBed.runInInjectionContext(() => authGuard({} as never, {} as never));
    expect(result).toBeInstanceOf(UrlTree);
    expect((result as UrlTree).toString()).toBe('/auth');
  });

  it('allows navigation when authenticated', () => {
    isAuthenticated.mockReturnValue(true);
    const result = TestBed.runInInjectionContext(() => authGuard({} as never, {} as never));
    expect(result).toBe(true);
  });

  it('roleGuard redirects a USER away from ADMIN routes', () => {
    isAuthenticated.mockReturnValue(true);
    currentUser.mockReturnValue({ roles: ['USER'] });
    const route = { data: { roles: ['ADMIN'] } } as never;
    const result = TestBed.runInInjectionContext(() => roleGuard(route, {} as never));
    expect((result as UrlTree).toString()).toBe('/dashboard');
  });

  it('roleGuard lets an ADMIN through', () => {
    isAuthenticated.mockReturnValue(true);
    currentUser.mockReturnValue({ roles: ['ADMIN', 'USER'] });
    const route = { data: { roles: ['ADMIN'] } } as never;
    expect(TestBed.runInInjectionContext(() => roleGuard(route, {} as never))).toBe(true);
  });
});
