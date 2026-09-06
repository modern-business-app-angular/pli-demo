import {
  Component,
  OnInit,
  inject,
  signal,
  DestroyRef,
} from '@angular/core';
import { ReactiveFormsModule, FormsModule, FormBuilder, Validators } from '@angular/forms';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { Subject, debounceTime, distinctUntilChanged } from 'rxjs';
import { NzTableModule } from 'ng-zorro-antd/table';
import { NzButtonModule } from 'ng-zorro-antd/button';
import { NzInputModule } from 'ng-zorro-antd/input';
import { NzDrawerModule } from 'ng-zorro-antd/drawer';
import { NzFormModule } from 'ng-zorro-antd/form';
import { NzSelectModule } from 'ng-zorro-antd/select';
import { NzCheckboxModule } from 'ng-zorro-antd/checkbox';
import { NzSwitchModule } from 'ng-zorro-antd/switch';
import { NzPopconfirmModule } from 'ng-zorro-antd/popconfirm';
import { NzTagModule } from 'ng-zorro-antd/tag';
import { NzMessageService } from 'ng-zorro-antd/message';
import { NzTooltipModule } from 'ng-zorro-antd/tooltip';
import { CodificationsService } from '../../services/codifications.service';
import type { Service } from '../../models/codification.models';

@Component({
  selector: 'pli-services',
  standalone: true,
  imports: [
    ReactiveFormsModule,
    FormsModule,
    NzTableModule,
    NzButtonModule,
    NzInputModule,
    NzDrawerModule,
    NzFormModule,
    NzSelectModule,
    NzCheckboxModule,
    NzSwitchModule,
    NzPopconfirmModule,
    NzTagModule,
    NzTooltipModule,
  ],
  templateUrl: './services.component.html',
  styleUrl: './services.component.scss',
})
export class ServicesComponent implements OnInit {
  private readonly service = inject(CodificationsService);
  private readonly fb = inject(FormBuilder);
  private readonly msg = inject(NzMessageService);
  private readonly destroyRef = inject(DestroyRef);

  protected readonly allItems = signal<Service[]>([]);
  protected readonly items = signal<Service[]>([]);
  protected readonly isLoading = signal(false);
  protected readonly isSaving = signal(false);
  protected readonly drawerVisible = signal(false);
  protected readonly editingItem = signal<Service | null>(null);
  protected readonly popVisible = signal(false);
  protected readonly testingPop = signal(false);
  protected readonly popTestResult = signal<'ok' | 'err' | null>(null);

  protected searchModel = '';
  private readonly search$ = new Subject<string>();

  protected form = this.fb.group({
    nom:           ['', [Validators.required, Validators.maxLength(100)]],
    sigle:         ['', Validators.maxLength(20)],
    bal:           ['', Validators.maxLength(250)],
    hierarchie:    ['', [Validators.required, Validators.maxLength(50)]],
    parentId:      [null as number | null],
    actif:         [true],
    popCompte:     [''],
    popMotDePasse: [''],
    popServeur:    [''],
    imprimante:    [''],
    etiquettes:    [false],
    logoPdf:       [''],
  });

  ngOnInit(): void {
    this.loadData();
    this.search$.pipe(
      debounceTime(250),
      distinctUntilChanged(),
      takeUntilDestroyed(this.destroyRef),
    ).subscribe(() => this.applyFilter());
  }

  private loadData(): void {
    this.isLoading.set(true);
    this.service.getServices()
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (data) => { this.allItems.set(data); this.applyFilter(); this.isLoading.set(false); },
        error: () => { this.isLoading.set(false); this.msg.error('Erreur lors du chargement.'); },
      });
  }

  private applyFilter(): void {
    const q = this.searchModel.trim().toLowerCase();
    if (q) {
      this.items.set(this.allItems().filter(s =>
        s.nom.toLowerCase().includes(q) ||
        s.sigle?.toLowerCase().includes(q) ||
        s.hierarchie?.toLowerCase().includes(q)
      ));
    } else {
      this.items.set(this.allItems());
    }
  }

  protected onSearch(v: string): void { this.search$.next(v); }

  protected testPopConnection(): void {
    const v = this.form.value;
    this.testingPop.set(true);
    this.popTestResult.set(null);
    this.service.testMailConnection('pop', {
      compte:     v.popCompte     || '',
      serveur:    v.popServeur    || '',
      motDePasse: v.popMotDePasse || '',
    }).pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
      next:  () => { this.testingPop.set(false); this.popTestResult.set('ok'); },
      error: () => { this.testingPop.set(false); this.popTestResult.set('err'); },
    });
  }

  protected openAdd(): void {
    this.editingItem.set(null);
    this.popVisible.set(false);
    this.popTestResult.set(null);
    this.form.reset({ actif: true, etiquettes: false, parentId: null });
    this.drawerVisible.set(true);
  }

  protected openEdit(item: Service): void {
    this.editingItem.set(item);
    this.popVisible.set(false);
    this.popTestResult.set(null);
    this.form.patchValue({ ...item });
    this.drawerVisible.set(true);
  }

  protected saveDrawer(): void {
    if (this.form.invalid) { this.form.markAllAsTouched(); return; }
    this.isSaving.set(true);
    const body = this.form.value as Partial<Service>;
    const editing = this.editingItem();
    const obs = editing
      ? this.service.updateService(editing.id, body)
      : this.service.createService(body);

    obs.pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
      next: () => {
        this.isSaving.set(false);
        this.drawerVisible.set(false);
        this.msg.success(editing ? 'Service modifié.' : 'Service ajouté.');
        this.loadData();
      },
      error: () => { this.isSaving.set(false); this.msg.error('Erreur lors de l\'enregistrement.'); },
    });
  }

  protected confirmDelete(id: number): void {
    this.service.deleteService(id)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: () => { this.msg.success('Service supprimé.'); this.loadData(); },
        error: () => this.msg.error('Impossible de supprimer ce service.'),
      });
  }

  protected get drawerTitle(): string {
    const e = this.editingItem();
    return e ? `Modifier — ${e.nom}` : 'Nouveau service';
  }

  // ── Org hierarchy path preview (SIGNATURE ELEMENT) ────────────────────────

  protected get hierarchyPath(): { label: string; last: boolean }[] {
    const parentId = this.form.value.parentId;
    const nom = this.form.value.nom?.trim() || '';
    const segments: string[] = [];

    if (parentId) {
      const chain: string[] = [];
      let current = this.allItems().find(s => s.id === parentId);
      while (current) {
        chain.unshift(current.nom);
        current = current.parentId
          ? this.allItems().find(s => s.id === current!.parentId) ?? undefined
          : undefined;
      }
      segments.push(...chain);
    }

    segments.push(nom || '…');

    return segments.map((label, i) => ({ label, last: i === segments.length - 1 }));
  }

  /** Dropdown options: all services except the one being edited (no self-reference) */
  protected get parentOptions(): Service[] {
    const editing = this.editingItem();
    return this.allItems().filter(s => !editing || s.id !== editing.id);
  }

  protected hasPopConfig(item: Service): boolean {
    return !!(item.popCompte || item.popServeur);
  }
}
