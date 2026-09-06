import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { NzDrawerModule }     from 'ng-zorro-antd/drawer';
import { NzButtonModule }     from 'ng-zorro-antd/button';
import { NzInputModule }      from 'ng-zorro-antd/input';
import { NzSelectModule }     from 'ng-zorro-antd/select';
import { NzTagModule }        from 'ng-zorro-antd/tag';
import { NzIconModule }       from 'ng-zorro-antd/icon';
import { NzPopconfirmModule } from 'ng-zorro-antd/popconfirm';
import { NzEmptyModule }      from 'ng-zorro-antd/empty';
import { NzMessageService }   from 'ng-zorro-antd/message';
import { CourrierSearchStore } from '../../state/courrier-search.store';
import { CourrierSearchService } from '../../services/courrier-search.service';
import type { SearchModel, SearchVisibility } from '../../../search/models/search.models';
import { DEFAULT_CAPABILITIES } from '../../../search/models/search.models';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { DestroyRef } from '@angular/core';

@Component({
  selector: 'pli-courrier-search-models-drawer',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    NzDrawerModule,
    NzButtonModule,
    NzInputModule,
    NzSelectModule,
    NzTagModule,
    NzIconModule,
    NzPopconfirmModule,
    NzEmptyModule,
  ],
  templateUrl: './courrier-search-models-drawer.component.html',
  styles: [`
    .drawer-section { padding: 16px; border-bottom: 1px solid #f0f0f0; }
    .drawer-title   { font-size: 11px; font-weight: 700; letter-spacing: .08em; text-transform: uppercase; color: #888; margin-bottom: 12px; }
    .model-card     { border: 1px solid #f0f0f0; border-radius: 8px; padding: 12px 14px; margin-bottom: 8px; transition: box-shadow .15s; }
    .model-card:hover { box-shadow: 0 2px 8px rgba(0,0,0,.08); }
    .model-card__name  { font-size: 13px; font-weight: 600; color: #1a1a2e; margin-bottom: 4px; }
    .model-card__meta  { display: flex; gap: 8px; align-items: center; font-size: 11px; color: #888; margin-bottom: 10px; }
    .model-card__actions { display: flex; gap: 6px; }
    .save-form { display: flex; flex-direction: column; gap: 8px; }
  `],
})
export class CourrierSearchModelsDrawerComponent {
  protected readonly store      = inject(CourrierSearchStore);
  private   readonly svc        = inject(CourrierSearchService);
  private   readonly msg        = inject(NzMessageService);
  private   readonly fb         = inject(FormBuilder);
  private   readonly destroyRef = inject(DestroyRef);

  protected isSaving = false;

  protected readonly saveForm = this.fb.group({
    nom:        ['', [Validators.required, Validators.minLength(2)]],
    visibility: ['private' as SearchVisibility],
  });

  protected readonly visibilityOptions = [
    { label: 'Privé (moi uniquement)',  value: 'private'  as SearchVisibility },
    { label: 'Public (tous)',           value: 'public'   as SearchVisibility },
    { label: 'Service',                 value: 'service'  as SearchVisibility },
  ];

  protected applyModel(model: SearchModel): void {
    this.store.applySavedModel(model);
    this.store.executeSearch();
    this.store.toggleModelsPanel();
  }

  protected deleteModel(model: SearchModel): void {
    this.store.deleteModel(model.id);
  }

  protected saveCurrentSearch(): void {
    if (this.saveForm.invalid) { this.saveForm.markAllAsTouched(); return; }
    this.isSaving = true;
    const { nom, visibility } = this.saveForm.value;

    this.svc.saveModel({
      nom:          nom!,
      libelle:      nom!,
      type:         'courriers',
      visibility:   visibility as SearchVisibility,
      capabilities: DEFAULT_CAPABILITIES,
      filters:      [],
      columns:      [],
      isSystem:     false,
    })
    .pipe(takeUntilDestroyed(this.destroyRef))
    .subscribe({
      next: (saved) => {
        this.isSaving = false;
        this.saveForm.reset({ nom: '', visibility: 'private' });
        this.store.loadSavedModels();
        this.msg.success(`Modèle "${saved.nom}" enregistré`);
      },
      error: () => {
        this.isSaving = false;
        this.msg.error('Enregistrement impossible');
      },
    });
  }

  protected visibilityLabel(v: SearchVisibility): string {
    return { private: 'Privé', public: 'Public', service: 'Service' }[v] ?? v;
  }

  protected visibilityColor(v: SearchVisibility): string {
    return { private: 'default', public: 'blue', service: 'orange' }[v] ?? 'default';
  }
}
