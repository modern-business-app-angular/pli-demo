import { computed, inject } from '@angular/core';
import {
  signalStore,
  withState,
  withComputed,
  withMethods,
  patchState,
} from '@ngrx/signals';
import { rxMethod } from '@ngrx/signals/rxjs-interop';
import { pipe, switchMap, tap, catchError, EMPTY } from 'rxjs';
import { NzMessageService } from 'ng-zorro-antd/message';
import {
  CourrierSearchService,
  type CourrierSearchRefData,
} from '../services/courrier-search.service';
import type {
  CourrierEntrant,
  CourrierSearchQuery,
  CourrierSearchEléments,
  CourrierSearchContact,
  CourrierSearchWorkflow,
  CourrierSearchSpecifiques,
  ActiveFilterChip,
  CourrierFilterGroup,
  CourrierStatut,
} from '../models/courrier.model';
import type { SearchModel } from '../../search/models/search.models';
import type { PagedResult } from '../../../core/models/api-response.model';

const STATUT_LABELS: Record<CourrierStatut, string> = {
  E: 'En cours', T: 'Transmise', F: 'Fini', C: 'Clôturé', S: 'Suspendu',
};

interface CourrierSearchState {
  query: CourrierSearchQuery;
  results: CourrierEntrant[];
  total: number;
  page: number;
  pageSize: number;
  sortBy: string;
  sortOrder: 'asc' | 'desc';
  refData: CourrierSearchRefData | null;
  savedModels: SearchModel[];
  activeModelId: number | null;
  isLoading: boolean;
  isRefDataLoading: boolean;
  isModelsPanelOpen: boolean;
  isFilterPanelOpen: boolean;
  error: string | null;
}

function hasValue(v: unknown): boolean {
  if (v === undefined || v === null || v === '') return false;
  if (Array.isArray(v)) return v.length > 0;
  return true;
}

export const CourrierSearchStore = signalStore(
  { providedIn: 'root' },

  withState<CourrierSearchState>({
    query:             { page: 1, pageSize: 20 },
    results:           [],
    total:             0,
    page:              1,
    pageSize:          20,
    sortBy:            'dateArrivee',
    sortOrder:         'desc',
    refData:           null,
    savedModels:       [],
    activeModelId:     null,
    isLoading:         false,
    isRefDataLoading:  false,
    isModelsPanelOpen: false,
    isFilterPanelOpen: true,
    error:             null,
  }),

  withComputed((store) => ({

    isEmpty: computed(() => !store.isLoading() && store.results().length === 0),
    totalPages: computed(() => Math.ceil(store.total() / store.pageSize())),

    activeFilterCount: computed(() => {
      const q = store.query();
      return [
        ...Object.values(q.elements  ?? {}),
        ...Object.values(q.contact   ?? {}),
        ...Object.values(q.workflow  ?? {}),
        ...Object.values(q.specifiques ?? {}),
      ].filter(hasValue).length;
    }),

    hasActiveFilters: computed(() => {
      const q = store.query();
      return [
        ...Object.values(q.elements  ?? {}),
        ...Object.values(q.contact   ?? {}),
        ...Object.values(q.workflow  ?? {}),
        ...Object.values(q.specifiques ?? {}),
      ].some(hasValue);
    }),

    activeFilterChips: computed((): ActiveFilterChip[] => {
      const q  = store.query();
      const rd = store.refData();
      const chips: ActiveFilterChip[] = [];

      function chip(key: string, group: CourrierFilterGroup, label: string, displayValue: string): void {
        chips.push({ key, group, label, displayValue, removable: true });
      }

      const el = q.elements ?? {};
      if (hasValue(el.objet))      chip('elements.objet',      'elements', 'Objet',          `"${el.objet}"`);
      if (hasValue(el.chrono))     chip('elements.chrono',     'elements', 'Chrono',         `"${el.chrono}"`);
      if (hasValue(el.reference))  chip('elements.reference',  'elements', 'Référence',      `"${el.reference}"`);
      if (hasValue(el.motsCles))   chip('elements.motsCles',   'elements', 'Mots-clés',      `"${el.motsCles}"`);
      if (hasValue(el.natureIds)) {
        const labels = (el.natureIds ?? []).map(id => rd?.natures.find(n => n.id === id)?.libelle ?? String(id)).join(', ');
        chip('elements.natureIds', 'elements', 'Nature', labels);
      }
      if (hasValue(el.chronoTypeIds)) {
        const labels = (el.chronoTypeIds ?? []).map(id => rd?.chronoTypes.find(c => c.id === id)?.libelle ?? String(id)).join(', ');
        chip('elements.chronoTypeIds', 'elements', 'Type chrono', labels);
      }
      if (hasValue(el.dateArriveeFrom) || hasValue(el.dateArriveeTo)) {
        chip('elements.dateArrivee', 'elements', 'Arrivée', `${el.dateArriveeFrom ?? '…'} → ${el.dateArriveeTo ?? '…'}`);
      }
      if (hasValue(el.dateLimiteFrom) || hasValue(el.dateLimiteTo)) {
        chip('elements.dateLimite', 'elements', 'Limite', `${el.dateLimiteFrom ?? '…'} → ${el.dateLimiteTo ?? '…'}`);
      }

      const ct = q.contact ?? {};
      if (hasValue(ct.tripletNom))  chip('contact.tripletNom',  'contact', 'Exp./Dest.',   `"${ct.tripletNom}"`);
      if (hasValue(ct.organisme))   chip('contact.organisme',   'contact', 'Organisme',    `"${ct.organisme}"`);
      if (hasValue(ct.fonction))    chip('contact.fonction',    'contact', 'Fonction',     `"${ct.fonction}"`);
      if (hasValue(ct.ville))       chip('contact.ville',       'contact', 'Ville',        `"${ct.ville}"`);
      if (hasValue(ct.cp))          chip('contact.cp',          'contact', 'Code postal',  ct.cp!);

      const wf = q.workflow ?? {};
      if (hasValue(wf.etats)) {
        chip('workflow.etats', 'workflow', 'État FS', (wf.etats ?? []).map(e => STATUT_LABELS[e]).join(', '));
      }
      if (hasValue(wf.emetteurId)) {
        const p = rd?.personnel.find(p => p.id === wf.emetteurId);
        chip('workflow.emetteurId', 'workflow', 'Émetteur', p?.displayName ?? String(wf.emetteurId));
      }
      if (hasValue(wf.destinataireId)) {
        const p = rd?.personnel.find(p => p.id === wf.destinataireId);
        chip('workflow.destinataireId', 'workflow', 'Destinataire', p?.displayName ?? String(wf.destinataireId));
      }
      if (hasValue(wf.actionId)) {
        const a = rd?.actions.find(a => a.id === wf.actionId);
        chip('workflow.actionId', 'workflow', 'Action', a?.libelle ?? String(wf.actionId));
      }
      if (wf.original) chip('workflow.original', 'workflow', 'Original', 'Oui');

      const sp = q.specifiques ?? {};
      for (const [k, v] of Object.entries(sp)) {
        if (hasValue(v)) chip(`specifiques.${k}`, 'specifiques', k, Array.isArray(v) ? v.join(', ') : String(v));
      }

      return chips;
    }),
  })),

  withMethods((store, svc = inject(CourrierSearchService), msg = inject(NzMessageService)) => ({

    // ── Ref data ──────────────────────────────────────────────────────────

    initRefData: rxMethod<void>(
      pipe(
        tap(() => patchState(store, { isRefDataLoading: true })),
        switchMap(() =>
          svc.loadRefData().pipe(
            tap(refData => patchState(store, { refData, isRefDataLoading: false })),
            catchError(() => {
              patchState(store, { isRefDataLoading: false });
              return EMPTY;
            })
          )
        )
      )
    ),

    // ── Search ────────────────────────────────────────────────────────────

    executeSearch: rxMethod<void>(
      pipe(
        tap(() => patchState(store, { isLoading: true, error: null })),
        switchMap(() =>
          svc.executeSearch({
            ...store.query(),
            page: store.page(),
            pageSize: store.pageSize(),
            sortBy: store.sortBy(),
            sortOrder: store.sortOrder(),
          }).pipe(
            tap((result: PagedResult<CourrierEntrant>) =>
              patchState(store, {
                results: result.items,
                total: result.total,
                isLoading: false,
              })
            ),
            catchError((err: Error) => {
              patchState(store, { error: err.message, isLoading: false });
              return EMPTY;
            })
          )
        )
      )
    ),

    // ── Filter patches ────────────────────────────────────────────────────

    patchElements(partial: Partial<CourrierSearchEléments>): void {
      patchState(store, {
        query: { ...store.query(), elements: { ...store.query().elements, ...partial } },
        page: 1,
      });
    },

    patchContact(partial: Partial<CourrierSearchContact>): void {
      patchState(store, {
        query: { ...store.query(), contact: { ...store.query().contact, ...partial } },
        page: 1,
      });
    },

    patchWorkflow(partial: Partial<CourrierSearchWorkflow>): void {
      patchState(store, {
        query: { ...store.query(), workflow: { ...store.query().workflow, ...partial } },
        page: 1,
      });
    },

    patchSpecifiques(sp: CourrierSearchSpecifiques): void {
      patchState(store, {
        query: { ...store.query(), specifiques: { ...store.query().specifiques, ...sp } },
        page: 1,
      });
    },

    removeFilter(chip: ActiveFilterChip): void {
      const [group, fieldPath] = chip.key.split('.') as [CourrierFilterGroup, string];
      const q = { ...store.query() };
      if (group === 'elements') {
        const el = { ...q.elements } as Record<string, unknown>;
        // Handle compound date range chips
        if (fieldPath === 'dateArrivee') { delete el['dateArriveeFrom']; delete el['dateArriveeTo']; }
        else if (fieldPath === 'dateLimite') { delete el['dateLimiteFrom']; delete el['dateLimiteTo']; }
        else delete el[fieldPath];
        q.elements = el as CourrierSearchEléments;
      } else if (group === 'contact') {
        const ct = { ...q.contact } as Record<string, unknown>;
        delete ct[fieldPath];
        q.contact = ct as CourrierSearchContact;
      } else if (group === 'workflow') {
        const wf = { ...q.workflow } as Record<string, unknown>;
        delete wf[fieldPath];
        q.workflow = wf as CourrierSearchWorkflow;
      } else if (group === 'specifiques') {
        const sp = { ...q.specifiques };
        delete sp[fieldPath];
        q.specifiques = sp;
      }
      patchState(store, { query: q, page: 1 });
    },

    clearAllFilters(): void {
      patchState(store, { query: { page: 1, pageSize: store.pageSize() }, page: 1, activeModelId: null });
    },

    // ── Saved models ──────────────────────────────────────────────────────

    loadSavedModels: rxMethod<void>(
      pipe(
        switchMap(() =>
          svc.getModels().pipe(
            tap(savedModels => patchState(store, { savedModels })),
            catchError(() => EMPTY)
          )
        )
      )
    ),

    applySavedModel(model: SearchModel): void {
      // For now, load the model's filters as display (serialization TBD)
      patchState(store, { activeModelId: model.id, page: 1 });
    },

    deleteModel: rxMethod<number>(
      pipe(
        switchMap(id =>
          svc.deleteModel(id).pipe(
            tap(() => {
              patchState(store, {
                savedModels: store.savedModels().filter(m => m.id !== id),
              });
              msg.success('Modèle supprimé');
            }),
            catchError(() => { msg.error('Suppression impossible'); return EMPTY; })
          )
        )
      )
    ),

    // ── Pagination & sort ─────────────────────────────────────────────────

    setPage(page: number): void {
      patchState(store, { page });
    },

    setPageSize(pageSize: number): void {
      patchState(store, { pageSize, page: 1 });
    },

    setSort(sortBy: string, sortOrder: 'asc' | 'desc'): void {
      patchState(store, { sortBy, sortOrder, page: 1 });
    },

    // ── UI toggles ────────────────────────────────────────────────────────

    toggleModelsPanel(): void {
      patchState(store, { isModelsPanelOpen: !store.isModelsPanelOpen() });
    },

    toggleFilterPanel(): void {
      patchState(store, { isFilterPanelOpen: !store.isFilterPanelOpen() });
    },
  }))
);
