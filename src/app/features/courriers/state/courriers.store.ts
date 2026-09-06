import {
  signalStore,
  withState,
  withComputed,
  withMethods,
  patchState,
} from '@ngrx/signals';
import { computed, inject } from '@angular/core';
import { rxMethod } from '@ngrx/signals/rxjs-interop';
import { pipe, switchMap, tap, catchError, EMPTY } from 'rxjs';
import { CourriersService } from '../services/courriers.service';
import type { CourrierEntrant, CourrierEntrantFilters, CourrierType } from '../models/courrier.model';
import type { PagedResult } from '../../../core/models/api-response.model';

interface CourriersState {
  courrierType: CourrierType;
  items: CourrierEntrant[];
  total: number;
  page: number;
  pageSize: number;
  filters: CourrierEntrantFilters;
  sortBy: string;
  sortOrder: 'asc' | 'desc';
  isLoading: boolean;
  error: string | null;
  selectedId: number | null;
}

export const CourriersStore = signalStore(
  { providedIn: 'root' },

  withState<CourriersState>({
    courrierType: 'entrant',
    items: [],
    total: 0,
    page: 1,
    pageSize: 20,
    filters: {},
    sortBy: 'dateArrivee',
    sortOrder: 'desc',
    isLoading: false,
    error: null,
    selectedId: null,
  }),

  withComputed((store) => ({
    isEmpty: computed(() => !store.isLoading() && store.items().length === 0),
    totalPages: computed(() => Math.ceil(store.total() / store.pageSize())),
    hasActiveFilters: computed(() => {
      const f = store.filters();
      return !!(f.search || f.statut || f.dateArriveeFrom || f.dateArriveeTo || f.chronoTypeId);
    }),
    selected: computed(() =>
      store.items().find((c) => c.id === store.selectedId()) ?? null
    ),
  })),

  withMethods((store, service = inject(CourriersService)) => ({

    loadList: rxMethod<void>(
      pipe(
        tap(() => patchState(store, { isLoading: true, error: null })),
        switchMap(() => {
          const params = {
            page: store.page(),
            pageSize: store.pageSize(),
            sortBy: store.sortBy(),
            sortOrder: store.sortOrder(),
            ...store.filters(),
          };
          const type = store.courrierType();
          const call =
            type === 'sortant' ? service.getCourrierSortantList(params) :
            type === 'interne' ? service.getCourrierInterneList(params) :
            service.getCourrierEntrantList(params);

          return call.pipe(
            tap((result: PagedResult<CourrierEntrant>) =>
              patchState(store, {
                items: result.items,
                total: result.total,
                isLoading: false,
              })
            ),
            catchError((err: Error) => {
              patchState(store, { error: err.message, isLoading: false });
              return EMPTY;
            })
          );
        })
      )
    ),

    setCourrierType(type: CourrierType): void {
      patchState(store, { courrierType: type, items: [], total: 0, page: 1 });
    },

    setFilters(filters: CourrierEntrantFilters): void {
      patchState(store, { filters, page: 1 });
    },

    clearFilters(): void {
      patchState(store, { filters: {}, page: 1 });
    },

    setPage(page: number): void {
      patchState(store, { page });
    },

    setPageSize(pageSize: number): void {
      patchState(store, { pageSize, page: 1 });
    },

    setSort(sortBy: string, sortOrder: 'asc' | 'desc'): void {
      patchState(store, { sortBy, sortOrder, page: 1 });
    },

    selectCourrier(id: number | null): void {
      patchState(store, { selectedId: id });
    },

    updateItem(updated: CourrierEntrant): void {
      patchState(store, {
        items: store.items().map((c) => (c.id === updated.id ? updated : c)),
      });
    },

    markAsTransmis(id: number): void {
      patchState(store, {
        items: store.items().map((c) =>
          c.id === id
            ? { ...c, statut: 'T' as const, ficheSuiveuse: c.ficheSuiveuse ? { ...c.ficheSuiveuse, etat: 'T' as const, isCurrentUserRecipient: false } : undefined }
            : c
        ),
      });
    },
  }))
);
