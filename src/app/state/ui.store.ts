import {
  signalStore,
  withState,
  withComputed,
  withMethods,
  patchState,
} from '@ngrx/signals';
import { computed } from '@angular/core';

export type ActiveModule =
  | 'dashboard'
  | 'courriers'
  | 'search'
  | 'protocole'
  | 'administration'
  | null;

export interface Breadcrumb {
  label: string;
  route?: string;
}

interface UiState {
  sidebarCollapsed: boolean;
  activeModule: ActiveModule;
  pendingRequests: number;
  isDarkMode: boolean;
  breadcrumbs: Breadcrumb[];
}

/**
 * Global UI/layout state store.
 * Consumed by: layout shell, interceptors, breadcrumb component.
 */
export const UiStore = signalStore(
  { providedIn: 'root' },

  withState<UiState>({
    sidebarCollapsed: false,
    activeModule: null,
    pendingRequests: 0,
    isDarkMode: false,
    breadcrumbs: [],
  }),

  withComputed((store) => ({
    /** True while any HTTP request is in flight (set by loadingInterceptor) */
    isLoading: computed(() => store.pendingRequests() > 0),
  })),

  withMethods((store) => ({
    toggleSidebar(): void {
      patchState(store, { sidebarCollapsed: !store.sidebarCollapsed() });
    },

    setSidebarCollapsed(collapsed: boolean): void {
      patchState(store, { sidebarCollapsed: collapsed });
    },

    setActiveModule(module: ActiveModule): void {
      patchState(store, { activeModule: module });
    },

    setBreadcrumbs(breadcrumbs: Breadcrumb[]): void {
      patchState(store, { breadcrumbs });
    },

    toggleDarkMode(): void {
      patchState(store, { isDarkMode: !store.isDarkMode() });
    },

    /** Called by loadingInterceptor when a request starts */
    incrementPendingRequests(): void {
      patchState(store, { pendingRequests: store.pendingRequests() + 1 });
    },

    /** Called by loadingInterceptor when a request completes */
    decrementPendingRequests(): void {
      const current = store.pendingRequests();
      patchState(store, { pendingRequests: Math.max(0, current - 1) });
    },
  }))
);
