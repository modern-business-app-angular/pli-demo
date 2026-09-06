import {
  Component, OnInit, inject, signal, DestroyRef,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, ActivatedRoute } from '@angular/router';
import { FormBuilder, ReactiveFormsModule } from '@angular/forms';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { debounceTime, distinctUntilChanged } from 'rxjs/operators';
import { NzTableModule } from 'ng-zorro-antd/table';
import { NzButtonModule } from 'ng-zorro-antd/button';
import { NzInputModule } from 'ng-zorro-antd/input';
import { NzIconModule } from 'ng-zorro-antd/icon';
import { NzTagModule } from 'ng-zorro-antd/tag';
import { NzEmptyModule } from 'ng-zorro-antd/empty';
import { NzTooltipModule } from 'ng-zorro-antd/tooltip';
import { CourriersStore } from '../../state/courriers.store';
import type { CourrierEntrant, CourrierListConfig, CourrierType } from '../../models/courrier.model';
import { COURRIER_LIST_CONFIG } from '../../models/courrier.model';

@Component({
  selector: 'pli-courriers-list',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    ReactiveFormsModule,
    NzTableModule,
    NzButtonModule,
    NzInputModule,
    NzIconModule,
    NzTagModule,
    NzEmptyModule,
    NzTooltipModule,
  ],
  templateUrl: './courriers-list.component.html',
  styleUrl: './courriers-list.component.scss',
})
export class CourriersListComponent implements OnInit {
  protected readonly store = inject(CourriersStore);
  private readonly route = inject(ActivatedRoute);
  private readonly destroyRef = inject(DestroyRef);
  private readonly fb = inject(FormBuilder);

  protected readonly config = signal<CourrierListConfig>(COURRIER_LIST_CONFIG['entrant']);
  protected readonly searchControl = this.fb.control('');

  ngOnInit(): void {
    const type = (this.route.snapshot.data['courrierType'] as CourrierType) ?? 'entrant';
    this.config.set(COURRIER_LIST_CONFIG[type]);
    this.store.setCourrierType(type);
    this.store.loadList();

    this.searchControl.valueChanges.pipe(
      debounceTime(350),
      distinctUntilChanged(),
      takeUntilDestroyed(this.destroyRef),
    ).subscribe(val => {
      this.store.setFilters({ ...this.store.filters(), search: val ?? undefined });
      this.store.loadList();
    });
  }

  protected onSortChange(sortBy: string, dir: string | null): void {
    if (!dir) return;
    this.store.setSort(sortBy, dir === 'ascend' ? 'asc' : 'desc');
    this.store.loadList();
  }

  protected onPageChange(page: number): void {
    this.store.setPage(page);
    this.store.loadList();
  }

  protected onPageSizeChange(size: number): void {
    this.store.setPageSize(size);
    this.store.loadList();
  }

  protected clearSearch(): void {
    this.searchControl.setValue('');
    this.store.clearFilters();
    this.store.loadList();
  }

  protected trackById(_i: number, item: CourrierEntrant): number { return item.id; }

  protected get statutColor(): Record<string, string> {
    return { E: 'processing', T: 'warning', F: 'success', C: 'default', S: 'error' };
  }

  protected get statutLabel(): Record<string, string> {
    return { E: 'En cours', T: 'Transmis', F: 'Fini', C: 'Clôturé', S: 'Suspendu' };
  }
}
