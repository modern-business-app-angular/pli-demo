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
import { DemandesService } from '../services/demandes.service';
import type {
  Demande,
  DemandeStatus,
  TraiterPayload,
  RepondrePayload,
  PullResult,
} from '../models/demande.model';

interface DemandesState {
  items: Demande[];
  isLoading: boolean;
  isPulling: boolean;
  isSaving: boolean;
  activeStatut: DemandeStatus | 'tous';
  search: string;
  selectedId: number | null;
  error: string | null;
  pullResult: PullResult | null;
}

export const DemandesStore = signalStore(
  { providedIn: 'root' },

  withState<DemandesState>({
    items: [],
    isLoading: false,
    isPulling: false,
    isSaving: false,
    activeStatut: 'tous',
    search: '',
    selectedId: null,
    error: null,
    pullResult: null,
  }),

  withComputed((store) => ({
    filteredItems: computed(() => {
      const items = store.items();
      const statut = store.activeStatut();
      const search = store.search().toLowerCase().trim();

      return items.filter((d) => {
        const matchStatut = statut === 'tous' || d.statut === statut;
        const matchSearch =
          !search ||
          d.emetteur.toLowerCase().includes(search) ||
          d.objet.toLowerCase().includes(search) ||
          (d.emetteurNom ?? '').toLowerCase().includes(search);
        return matchStatut && matchSearch;
      });
    }),

    selected: computed(() =>
      store.items().find((d) => d.id === store.selectedId()) ?? null
    ),

    isEmpty: computed(
      () => !store.isLoading() && store.items().length === 0
    ),

    tabCounts: computed(() => {
      const items = store.items();
      return {
        tous: items.length,
        nouveau: items.filter((d) => d.statut === 'nouveau').length,
        en_cours: items.filter((d) => d.statut === 'en_cours').length,
        traite: items.filter((d) => d.statut === 'traite').length,
      };
    }),
  })),

  withMethods((store, service = inject(DemandesService)) => ({

    loadList: rxMethod<void>(
      pipe(
        tap(() => patchState(store, { isLoading: true, error: null })),
        switchMap(() =>
          service.getList().pipe(
            tap((items: Demande[]) =>
              patchState(store, { items, isLoading: false })
            ),
            catchError((err: Error) => {
              patchState(store, { error: err.message, isLoading: false });
              return EMPTY;
            })
          )
        )
      )
    ),

    pullFromPop: rxMethod<void>(
      pipe(
        tap(() => patchState(store, { isPulling: true, pullResult: null, error: null })),
        switchMap(() =>
          service.pullFromPop().pipe(
            tap((result: PullResult) =>
              patchState(store, { isPulling: false, pullResult: result })
            ),
            switchMap((result: PullResult) => {
              if (result.count > 0) {
                return service.getList().pipe(
                  tap((items: Demande[]) => patchState(store, { items }))
                );
              }
              return EMPTY;
            }),
            catchError((err: Error) => {
              patchState(store, { error: err.message, isPulling: false });
              return EMPTY;
            })
          )
        )
      )
    ),

    traiter: rxMethod<TraiterPayload>(
      pipe(
        tap(() => patchState(store, { isSaving: true, error: null })),
        switchMap((payload) =>
          service.traiter(payload).pipe(
            tap((updated: Demande) =>
              patchState(store, {
                isSaving: false,
                items: store.items().map((d) => (d.id === updated.id ? updated : d)),
              })
            ),
            catchError((err: Error) => {
              patchState(store, { error: err.message, isSaving: false });
              return EMPTY;
            })
          )
        )
      )
    ),

    repondre: rxMethod<RepondrePayload>(
      pipe(
        tap(() => patchState(store, { isSaving: true, error: null })),
        switchMap((payload) =>
          service.repondre(payload).pipe(
            tap((updated: Demande) =>
              patchState(store, {
                isSaving: false,
                items: store.items().map((d) => (d.id === updated.id ? updated : d)),
              })
            ),
            catchError((err: Error) => {
              patchState(store, { error: err.message, isSaving: false });
              return EMPTY;
            })
          )
        )
      )
    ),

    select(id: number | null): void {
      patchState(store, { selectedId: id });
    },

    setStatut(statut: DemandeStatus | 'tous'): void {
      patchState(store, { activeStatut: statut });
    },

    setSearch(search: string): void {
      patchState(store, { search });
    },

    clearPullResult(): void {
      patchState(store, { pullResult: null });
    },
  }))
);
