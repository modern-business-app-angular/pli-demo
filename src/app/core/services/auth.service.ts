import { Injectable, computed, inject, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';
import { tap } from 'rxjs';
import type { Observable } from 'rxjs';
import {
  AuthUser,
  LoginRequest,
  LoginResponse,
  RefreshTokenResponse,
} from '../models/auth.model';
import { StorageService } from './storage.service';
import { EnvironmentService } from '../config/environment.service';
import { AuthStore } from '../../state/auth.store';

const KEYS = {
  ACCESS_TOKEN:  'pli_access_token',
  REFRESH_TOKEN: 'pli_refresh_token',
  USER:          'pli_user',
} as const;

@Injectable({ providedIn: 'root' })
export class AuthService {
  private _accessToken = signal<string | null>(null);
  private _user = signal<AuthUser | null>(null);

  /** Read-only signal — used by authInterceptor to attach Bearer token */
  readonly accessToken = this._accessToken.asReadonly();

  /** Read-only signal — current authenticated user */
  readonly currentUser = this._user.asReadonly();

  /** Derived signal — true when a valid access token is present */
  readonly isAuthenticated = computed(() => !!this._accessToken());

  /** Check if the current user has a specific role */
  readonly hasRole = (role: string) =>
    computed(() => this._user()?.roles.includes(role) ?? false);

  /** Check if the current user has a specific permission key */
  readonly hasPermission = (permission: string) =>
    computed(() => this._user()?.permissions.includes(permission) ?? false);

  private readonly authStore = inject(AuthStore);

  private readonly http = inject(HttpClient);
  private readonly router = inject(Router);
  private readonly storage = inject(StorageService);
  private readonly env = inject(EnvironmentService);

  constructor() {
    // Rehydrate from localStorage on startup
    const token = this.storage.getItem(KEYS.ACCESS_TOKEN);
    const user = this.storage.getJsonItem<AuthUser>(KEYS.USER);
    this._accessToken.set(token);
    this._user.set(user);
    // Sync AuthStore so permission-dependent UI is reactive from the start
    if (user) {
      this.authStore.setUser(user);
    }
  }

  login(request: LoginRequest): Observable<LoginResponse> {
    return this.http
      .post<LoginResponse>(`${this.env.authEndpoint}/login`, request)
      .pipe(
        tap((response) => this.persistSession(response))
      );
  }

  logout(): void {
    this.clearSession();
    this.router.navigate(['/auth']);
  }

  refreshToken(): Observable<RefreshTokenResponse> {
    const refreshToken = this.storage.getItem(KEYS.REFRESH_TOKEN);
    return this.http
      .post<RefreshTokenResponse>(`${this.env.authEndpoint}/refresh`, {
        refreshToken,
      })
      .pipe(
        tap(({ accessToken }) => {
          this.storage.setItem(KEYS.ACCESS_TOKEN, accessToken);
          this._accessToken.set(accessToken);
        })
      );
  }

  clearSession(): void {
    this.storage.removeItem(KEYS.ACCESS_TOKEN);
    this.storage.removeItem(KEYS.REFRESH_TOKEN);
    this.storage.removeItem(KEYS.USER);
    this._accessToken.set(null);
    this._user.set(null);
    this.authStore.clearUser();
  }

  private persistSession(response: LoginResponse): void {
    this.storage.setItem(KEYS.ACCESS_TOKEN, response.accessToken);
    this.storage.setItem(KEYS.REFRESH_TOKEN, response.refreshToken);
    this.storage.setJsonItem(KEYS.USER, response.user);
    this._accessToken.set(response.accessToken);
    this._user.set(response.user);
    this.authStore.setUser(response.user);
  }
}
