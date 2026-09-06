import {
  Component,
  OnInit,
  inject,
  signal,
  DestroyRef,
} from '@angular/core';
import { CommonModule, DatePipe } from '@angular/common';
import { ActivatedRoute } from '@angular/router';
import {
  ReactiveFormsModule,
  FormsModule,
  FormBuilder,
  FormGroup,
  Validators,
} from '@angular/forms';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { Subject, debounceTime, distinctUntilChanged, switchMap, forkJoin } from 'rxjs';
import { HttpParams } from '@angular/common/http';
import { NzTableModule } from 'ng-zorro-antd/table';
import { NzButtonModule } from 'ng-zorro-antd/button';
import { NzInputModule } from 'ng-zorro-antd/input';
import { NzModalModule } from 'ng-zorro-antd/modal';
import { NzFormModule } from 'ng-zorro-antd/form';
import { NzSelectModule } from 'ng-zorro-antd/select';
import { NzDatePickerModule } from 'ng-zorro-antd/date-picker';
import { NzCheckboxModule } from 'ng-zorro-antd/checkbox';
import { NzSwitchModule } from 'ng-zorro-antd/switch';
import { NzPopconfirmModule } from 'ng-zorro-antd/popconfirm';
import { NzMessageService } from 'ng-zorro-antd/message';
import { NzTagModule } from 'ng-zorro-antd/tag';
import { CodificationsService } from '../../services/codifications.service';
import type { CodifPageConfig } from '../../configs/codif-page.configs';

@Component({
  selector: 'pli-codif-list-page',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    FormsModule,
    NzTableModule,
    NzButtonModule,
    NzInputModule,
    NzModalModule,
    NzFormModule,
    NzSelectModule,
    NzDatePickerModule,
    NzCheckboxModule,
    NzSwitchModule,
    NzPopconfirmModule,
    NzTagModule,
    DatePipe,
  ],
  templateUrl: './codif-list-page.component.html',
  styleUrl: './codif-list-page.component.scss',
})
export class CodifListPageComponent implements OnInit {
  private readonly route = inject(ActivatedRoute);
  private readonly service = inject(CodificationsService);
  private readonly fb = inject(FormBuilder);
  private readonly msg = inject(NzMessageService);
  private readonly destroyRef = inject(DestroyRef);

  protected config!: CodifPageConfig;

  protected readonly items = signal<unknown[]>([]);
  protected readonly isLoading = signal(false);
  protected readonly isSaving = signal(false);
  protected readonly modalVisible = signal(false);
  protected readonly editingItem = signal<Record<string, unknown> | null>(null);

  /** Populated for fields with asyncOptions: endpoint → option list */
  protected readonly asyncSelectOptions = signal<Record<string, { value: unknown; label: string }[]>>({});

  protected form!: FormGroup;

  // search
  protected searchModel = '';
  private readonly search$ = new Subject<string>();

  ngOnInit(): void {
    this.config = this.route.snapshot.data['config'] as CodifPageConfig;
    this.buildForm();
    this.loadAsyncOptions();
    this.loadData();

    this.search$
      .pipe(
        debounceTime(300),
        distinctUntilChanged(),
        switchMap((q) => {
          const params = q && this.config.searchField
            ? new HttpParams().set(this.config.searchField, q)
            : undefined;
          this.isLoading.set(true);
          return this.service.list<unknown>(this.config.apiEndpoint, params);
        }),
        takeUntilDestroyed(this.destroyRef)
      )
      .subscribe({
        next: (data) => { this.items.set(data); this.isLoading.set(false); },
        error: () => this.isLoading.set(false),
      });
  }

  private loadData(): void {
    this.isLoading.set(true);
    this.service.list<unknown>(this.config.apiEndpoint)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (data) => { this.items.set(data); this.isLoading.set(false); },
        error: () => { this.isLoading.set(false); this.msg.error('Erreur lors du chargement.'); },
      });
  }

  private loadAsyncOptions(): void {
    const asyncFields = this.config.formFields.filter((f) => f.asyncOptions);
    if (!asyncFields.length) return;

    // Deduplicate endpoints
    const endpoints = [...new Set(asyncFields.map((f) => f.asyncOptions!))];
    const requests = endpoints.map((ep) => this.service.list<Record<string, unknown>>(ep));

    forkJoin(requests)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (results) => {
          const map: Record<string, { value: unknown; label: string }[]> = {};
          endpoints.forEach((ep, i) => {
            const field = asyncFields.find((f) => f.asyncOptions === ep)!;
            const valKey = field.asyncOptionsValue ?? 'id';
            const lblKey = field.asyncOptionsLabel ?? 'libelle';
            map[ep] = (results[i] as Record<string, unknown>[]).map((item) => ({
              value: item[valKey],
              label: String(item[lblKey] ?? ''),
            }));
          });
          this.asyncSelectOptions.set(map);
        },
      });
  }

  private buildForm(): void {
    const controls: Record<string, unknown[]> = {};
    for (const f of this.config.formFields) {
      const validators = f.required ? [Validators.required] : [];
      if (f.maxLength) validators.push(Validators.maxLength(f.maxLength));
      controls[f.name] = [null, validators];
    }
    this.form = this.fb.group(controls);
  }

  protected onSearch(value: string): void {
    this.search$.next(value);
  }

  protected openAdd(): void {
    this.editingItem.set(null);
    this.form.reset();
    this.modalVisible.set(true);
  }

  protected openEdit(item: Record<string, unknown>): void {
    this.editingItem.set(item);
    // Patch form — convert ISO date strings to Date objects for date pickers
    const patch: Record<string, unknown> = {};
    for (const f of this.config.formFields) {
      const val = item[f.name];
      patch[f.name] = f.type === 'date' && typeof val === 'string' ? new Date(val) : val;
    }
    this.form.patchValue(patch);
    this.modalVisible.set(true);
  }

  protected saveModal(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }
    this.isSaving.set(true);
    const raw = this.form.value as Record<string, unknown>;
    // Convert Date objects back to ISO strings
    const body: Record<string, unknown> = {};
    for (const f of this.config.formFields) {
      const val = raw[f.name];
      body[f.name] = f.type === 'date' && val instanceof Date
        ? val.toISOString().split('T')[0]
        : val;
    }

    const editing = this.editingItem();
    const obs = editing
      ? this.service.update(this.config.apiEndpoint, editing[this.config.idField] as number | string, body)
      : this.service.create(this.config.apiEndpoint, body);

    obs.pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
      next: () => {
        this.isSaving.set(false);
        this.modalVisible.set(false);
        this.msg.success(editing ? 'Modification enregistrée.' : 'Élément ajouté.');
        this.loadData();
      },
      error: () => { this.isSaving.set(false); this.msg.error('Erreur lors de l\'enregistrement.'); },
    });
  }

  protected confirmDelete(id: number | string): void {
    this.service.delete(this.config.apiEndpoint, id)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: () => { this.msg.success('Élément supprimé.'); this.loadData(); },
        error: () => this.msg.error('Impossible de supprimer cet élément.'),
      });
  }

  protected getFieldOptions(field: { options?: { value: unknown; label: string }[]; asyncOptions?: string }): { value: unknown; label: string }[] {
    if (field.options) return field.options;
    if (field.asyncOptions) return this.asyncSelectOptions()[field.asyncOptions] ?? [];
    return [];
  }

  protected getCellValue(item: unknown, col: { field: string; type?: string }): string {
    const val = (item as Record<string, unknown>)[col.field];
    if (val == null) return '—';
    if (col.type === 'date' && typeof val === 'string') {
      const d = new Date(val);
      return isNaN(d.getTime()) ? val : d.toLocaleDateString('fr-FR');
    }
    if (col.type === 'boolean') return val ? 'Oui' : 'Non';
    return String(val);
  }

  protected get modalVisibleModel(): boolean { return this.modalVisible(); }
  protected set modalVisibleModel(v: boolean) { this.modalVisible.set(v); }

  protected getItemId(item: unknown): number | string {
    return ((item as Record<string, unknown>)[this.config.idField]) as number | string;
  }
}
