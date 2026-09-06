import { Injectable } from '@angular/core';

/**
 * Type-safe localStorage wrapper.
 * Centralizes all storage access to simplify future migration to
 * sessionStorage or an encrypted store.
 */
@Injectable({ providedIn: 'root' })
export class StorageService {
  getItem(key: string): string | null {
    try {
      return localStorage.getItem(key);
    } catch {
      return null;
    }
  }

  setItem(key: string, value: string): void {
    try {
      localStorage.setItem(key, value);
    } catch {
      // Storage quota exceeded or private mode — fail silently
    }
  }

  removeItem(key: string): void {
    try {
      localStorage.removeItem(key);
    } catch {
      // Ignore
    }
  }

  getJsonItem<T>(key: string): T | null {
    const raw = this.getItem(key);
    if (!raw) return null;
    try {
      return JSON.parse(raw) as T;
    } catch {
      return null;
    }
  }

  setJsonItem<T>(key: string, value: T): void {
    this.setItem(key, JSON.stringify(value));
  }

  clear(): void {
    try {
      localStorage.clear();
    } catch {
      // Ignore
    }
  }
}
