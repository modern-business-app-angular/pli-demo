import {
  Component,
  OnInit,
  inject,
  signal,
  computed,
  DestroyRef,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { ReactiveFormsModule, FormBuilder } from '@angular/forms';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { debounceTime, distinctUntilChanged } from 'rxjs';
import { NzTableModule } from 'ng-zorro-antd/table';
import { NzButtonModule } from 'ng-zorro-antd/button';
import { NzInputModule } from 'ng-zorro-antd/input';
import { NzSelectModule } from 'ng-zorro-antd/select';
import { NzDatePickerModule } from 'ng-zorro-antd/date-picker';
import { NzIconModule } from 'ng-zorro-antd/icon';
import { NzBadgeModule } from 'ng-zorro-antd/badge';
import { NzTooltipModule } from 'ng-zorro-antd/tooltip';
import { NzEmptyModule } from 'ng-zorro-antd/empty';
import { NzModalService } from 'ng-zorro-antd/modal';
import { CourriersStore } from '../../state/courriers.store';
import { CourriersService } from '../../services/courriers.service';
import { CourrierStatusBadgeComponent } from '../../components/courrier-status-badge/courrier-status-badge.component';
import { FaireSuivreModalComponent } from '../../components/faire-suivre-modal/faire-suivre-modal.component';
import type { CourrierEntrant, CourrierStatut } from '../../models/courrier.model';
import type { ChronoType } from '../../models/action.model';

@Component({
  selector: 'pli-courrier-entrant-list',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    ReactiveFormsModule,
    NzTableModule,
    NzButtonModule,
    NzInputModule,
    NzSelectModule,
    NzDatePickerModule,
    NzIconModule,
    NzBadgeModule,
    NzTooltipModule,
    NzEmptyModule,
    CourrierStatusBadgeComponent,
  ],
  templateUrl: './courrier-entrant-list.component.html',
  styleUrl: './courrier-entrant-list.component.scss',
})
export class CourrierEntrantListComponent implements OnInit {
  // ── Injections ────────────────────────────────────────────────────────────
  protected readonly store = inject(CourriersStore);
  private readonly service = inject(CourriersService);
  private readonly modal = inject(NzModalService);
  private readonly fb = inject(FormBuilder);
  private readonly destroyRef = inject(DestroyRef);

  // ── Reference data ────────────────────────────────────────────────────────
  protected readonly chronoTypes = signal<ChronoType[]>([]);

  // ── UI state ──────────────────────────────────────────────────────────────

  protected readonly statutOptions: { label: string; value: CourrierStatut }[] = [
    { label: 'En cours',  value: 'E' },
    { label: 'Transmis',  value: 'T' },
    { label: 'Terminé',   value: 'F' },
    { label: 'Clôturé',   value: 'C' },
    { label: 'Suspendu',  value: 'S' },
  ];

  // ── Filter form ───────────────────────────────────────────────────────────
  protected readonly filterForm = this.fb.group({
    search: [''],
    statut: [null as CourrierStatut | null],
    dateRange: [null as [Date, Date] | null],
    chronoTypeId: [null as number | null],
  });

  // ── Computed ──────────────────────────────────────────────────────────────
  protected readonly activeFilterCount = computed(() => {
    const f = this.store.filters();
    return [f.search, f.statut, f.dateArriveeFrom, f.chronoTypeId].filter(Boolean).length;
  });

  // ── Lifecycle ─────────────────────────────────────────────────────────────
  ngOnInit(): void {
    this.store.loadList();
    this.loadChronoTypes();
    this.watchSearchField();
  }

  private loadChronoTypes(): void {
    this.service
      .getChronoTypes()
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({ next: (types) => this.chronoTypes.set(types) });
  }

  private watchSearchField(): void {
    this.filterForm.get('search')!.valueChanges
      .pipe(debounceTime(400), distinctUntilChanged(), takeUntilDestroyed(this.destroyRef))
      .subscribe(() => this.applyFilters());
  }

  // ── Actions ───────────────────────────────────────────────────────────────
  protected applyFilters(): void {
    const { search, statut, dateRange, chronoTypeId } = this.filterForm.value;
    this.store.setFilters({
      search: search ?? undefined,
      statut: statut ?? undefined,
      dateArriveeFrom: dateRange?.[0]?.toISOString().split('T')[0],
      dateArriveeTo: dateRange?.[1]?.toISOString().split('T')[0],
      chronoTypeId: chronoTypeId ?? undefined,
    });
    this.store.loadList();
  }

  protected clearFilters(): void {
    this.filterForm.reset();
    this.store.clearFilters();
    this.store.loadList();
  }

  protected onPageChange(page: number): void {
    this.store.setPage(page);
    this.store.loadList();
  }

  protected onPageSizeChange(pageSize: number): void {
    this.store.setPageSize(pageSize);
    this.store.loadList();
  }

  protected onSortChange(sortBy: string, order: string | null): void {
    if (!order) return;
    this.store.setSort(sortBy, order === 'ascend' ? 'asc' : 'desc');
    this.store.loadList();
  }

  // ── Faire suivre ──────────────────────────────────────────────────────────
  protected canFaireSuivre(courrier: CourrierEntrant): boolean {
    return (
      !!courrier.ficheSuiveuse?.isCurrentUserRecipient &&
      (courrier.statut === 'E' || courrier.statut === 'T')
    );
  }

  protected openFaireSuivreModal(courrier: CourrierEntrant): void {
    this.modal.create({
      nzTitle: 'Faire suivre',
      nzContent: FaireSuivreModalComponent,
      nzData: courrier,
      nzFooter: null,
      nzWidth: 560,
      nzCentered: true,
    });
  }

  // ── Helpers ───────────────────────────────────────────────────────────────
  protected expediteurDisplay(courrier: CourrierEntrant): string {
    if (!courrier.expediteur) return '—';
    return courrier.expediteur.nom;
  }

  protected getInitials(name: string): string {
    return name
      .split(' ')
      .slice(0, 2)
      .map((n) => n[0]?.toUpperCase() ?? '')
      .join('');
  }

  protected trackById(_index: number, item: CourrierEntrant): number {
    return item.id;
  }
}
