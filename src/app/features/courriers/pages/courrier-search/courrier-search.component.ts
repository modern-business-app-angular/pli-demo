import {
  Component, OnInit, inject, DestroyRef, signal,
} from '@angular/core';
import { CommonModule }           from '@angular/common';
import { FormBuilder, ReactiveFormsModule } from '@angular/forms';
import { RouterModule }           from '@angular/router';
import { takeUntilDestroyed }     from '@angular/core/rxjs-interop';
import { debounceTime, distinctUntilChanged } from 'rxjs/operators';
import { NzTableModule }          from 'ng-zorro-antd/table';
import { NzButtonModule }         from 'ng-zorro-antd/button';
import { NzInputModule }          from 'ng-zorro-antd/input';
import { NzIconModule }           from 'ng-zorro-antd/icon';
import { NzTagModule }            from 'ng-zorro-antd/tag';
import { NzEmptyModule }          from 'ng-zorro-antd/empty';
import { NzSpinModule }           from 'ng-zorro-antd/spin';
import { NzTooltipModule }        from 'ng-zorro-antd/tooltip';
import { NzBadgeModule }          from 'ng-zorro-antd/badge';
import { CourrierSearchStore }    from '../../state/courrier-search.store';
import { CourrierFilterPanelComponent }   from '../../components/courrier-filter-panel/courrier-filter-panel.component';
import { CourrierFilterChipComponent }    from '../../components/courrier-filter-chip/courrier-filter-chip.component';
import { CourrierSearchModelsDrawerComponent } from '../../components/courrier-search-models-drawer/courrier-search-models-drawer.component';
import type { ActiveFilterChip, CourrierEntrant } from '../../models/courrier.model';

@Component({
  selector: 'pli-courrier-search',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    RouterModule,
    NzTableModule,
    NzButtonModule,
    NzInputModule,
    NzIconModule,
    NzTagModule,
    NzEmptyModule,
    NzSpinModule,
    NzTooltipModule,
    NzBadgeModule,
    CourrierFilterPanelComponent,
    CourrierFilterChipComponent,
    CourrierSearchModelsDrawerComponent,
  ],
  templateUrl: './courrier-search.component.html',
  styleUrl:    './courrier-search.component.scss',
})
export class CourrierSearchComponent implements OnInit {
  protected readonly store      = inject(CourrierSearchStore);
  private   readonly destroyRef = inject(DestroyRef);
  private   readonly fb         = inject(FormBuilder);

  /** Two-step flow state */
  protected readonly searchMode = signal<'form' | 'results'>('form');

  protected readonly quickSearchControl = this.fb.control('');

  ngOnInit(): void {
    this.store.initRefData();
    this.store.loadSavedModels();

    this.quickSearchControl.valueChanges.pipe(
      debounceTime(350),
      distinctUntilChanged(),
      takeUntilDestroyed(this.destroyRef),
    ).subscribe(val => {
      this.store.patchElements({ objet: val ?? undefined });
      // In results mode, live-update; in form mode, just patch state for later
      if (this.searchMode() === 'results') {
        this.store.executeSearch();
      }
    });
  }

  /** Step 1 → Step 2: commit the search */
  protected launchSearch(): void {
    this.store.executeSearch();
    this.searchMode.set('results');
  }

  /** Step 2 → Step 1: go back and refine */
  protected backToForm(): void {
    this.searchMode.set('form');
  }

  protected onFilterApplied(): void {
    // In results mode, apply immediately (live filter); in form mode, just store the patch
    if (this.searchMode() === 'results') {
      this.store.executeSearch();
    }
  }

  protected removeChip(chip: ActiveFilterChip): void {
    this.store.removeFilter(chip);
    this.store.executeSearch();
  }

  protected clearAll(): void {
    this.quickSearchControl.setValue('', { emitEvent: false });
    this.store.clearAllFilters();
    if (this.searchMode() === 'results') {
      this.store.executeSearch();
    }
  }

  protected clearAllAndReset(): void {
    this.clearAll();
    this.searchMode.set('form');
  }

  protected onSortChange(sortBy: string, dir: string | null): void {
    if (!dir) return;
    this.store.setSort(sortBy, dir === 'ascend' ? 'asc' : 'desc');
    this.store.executeSearch();
  }

  protected onPageChange(page: number): void {
    this.store.setPage(page);
    this.store.executeSearch();
  }

  protected onPageSizeChange(size: number): void {
    this.store.setPageSize(size);
    this.store.executeSearch();
  }

  protected trackById(_i: number, item: CourrierEntrant): number { return item.id; }

  protected get statutColor(): Record<string, string> {
    return { E: 'processing', T: 'warning', F: 'success', C: 'default', S: 'error' };
  }

  protected get statutLabel(): Record<string, string> {
    return { E: 'En cours', T: 'Transmise', F: 'Fini', C: 'Clôturé', S: 'Suspendu' };
  }
}
