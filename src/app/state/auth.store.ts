import {
  signalStore,
  withState,
  withComputed,
  withMethods,
  patchState,
} from '@ngrx/signals';
import { computed } from '@angular/core';
import { AuthUser } from '../core/models/auth.model';

interface AuthState {
  user: AuthUser | null;
  isLoading: boolean;
  error: string | null;
}

/**
 * Auth state store.
 * Source of truth for the authenticated user and their permissions.
 * Updated by AuthService after login/logout.
 */
export const AuthStore = signalStore(
  { providedIn: 'root' },

  withState<AuthState>({
    user: null,
    isLoading: false,
    error: null,
  }),

  withComputed((store) => ({
    isAuthenticated: computed(() => !!store.user()),
    userName:        computed(() => store.user()?.displayName ?? ''),
    userInitials:    computed(() => {
      const name = store.user()?.displayName ?? '';
      return name
        .split(' ')
        .slice(0, 2)
        .map((n) => n[0]?.toUpperCase() ?? '')
        .join('');
    }),
    isAdmin:         computed(() => store.user()?.roles.includes('ADMIN') ?? false),
    serviceId:       computed(() => store.user()?.serviceId ?? null),
    serviceName:     computed(() => store.user()?.serviceName ?? ''),
    database:        computed(() => store.user()?.database ?? ''),
    userRoles:       computed(() => store.user()?.roles ?? []),
    userPermissions: computed(() => store.user()?.permissions ?? []),
  })),

  withMethods((store) => ({
    setUser(user: AuthUser): void {
      patchState(store, { user, error: null });
    },

    clearUser(): void {
      patchState(store, { user: null, error: null });
    },

    setLoading(isLoading: boolean): void {
      patchState(store, { isLoading });
    },

    setError(error: string): void {
      patchState(store, { error, isLoading: false });
    },

    /**
     * Check if the current user has a specific permission key.
     * Permission keys are flat strings granted at login.
     */
    canAccess(permission: string): boolean {
      return store.userPermissions().includes(permission);
    },
  }))
);
