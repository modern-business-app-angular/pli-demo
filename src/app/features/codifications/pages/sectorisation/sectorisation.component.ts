import {
  Component,
  OnInit,
  inject,
  signal,
  computed,
  DestroyRef,
} from '@angular/core';
import {
  ReactiveFormsModule,
  FormsModule,
  FormBuilder,
  Validators,
} from '@angular/forms';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { Subject, debounceTime, distinctUntilChanged } from 'rxjs';
import { NzTableModule } from 'ng-zorro-antd/table';
import { NzButtonModule } from 'ng-zorro-antd/button';
import { NzInputModule } from 'ng-zorro-antd/input';
import { NzDrawerModule } from 'ng-zorro-antd/drawer';
import { NzFormModule } from 'ng-zorro-antd/form';
import { NzSelectModule } from 'ng-zorro-antd/select';
import { NzInputNumberModule } from 'ng-zorro-antd/input-number';
import { NzPopconfirmModule } from 'ng-zorro-antd/popconfirm';
import { NzTagModule } from 'ng-zorro-antd/tag';
import { NzIconModule } from 'ng-zorro-antd/icon';
import { NzMessageService } from 'ng-zorro-antd/message';
import { NzTooltipModule } from 'ng-zorro-antd/tooltip';
import { CodificationsService } from '../../services/codifications.service';
import type { Sectorisation, TerritoireNiveau, TerritoireElement } from '../../models/codification.models';

type PariteKey = 'I' | 'P' | 'T';
type TypeKey = '' | 'B' | 'T' | 'Q';
const GEO_KEYS = ['geo1','geo2','geo3','geo4','geo5','geo6','geo7','geo8','geo9'] as const;

@Component({
  selector: 'pli-sectorisation',
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
    NzInputNumberModule,
    NzPopconfirmModule,
    NzTagModule,
    NzIconModule,
    NzTooltipModule,
  ],
  templateUrl: './sectorisation.component.html',
  styleUrl: './sectorisation.component.scss',
})
export class SectorisationComponent implements OnInit {
  private readonly svc = inject(CodificationsService);
  private readonly fb = inject(FormBuilder);
  private readonly msg = inject(NzMessageService);
  private readonly destroyRef = inject(DestroyRef);

  // ── State ────────────────────────────────────────────────────────────────

  protected readonly allItems = signal<Sectorisation[]>([]);
  protected readonly items = signal<Sectorisation[]>([]);
  protected readonly niveaux = signal<TerritoireNiveau[]>([]);
  protected readonly territoireElements = signal<TerritoireElement[]>([]);
  protected readonly isLoading = signal(false);
  protected readonly isSaving = signal(false);
  protected readonly drawerVisible = signal(false);
  protected readonly editingItem = signal<Sectorisation | null>(null);

  // ── Search ───────────────────────────────────────────────────────────────

  protected searchQuery = '';
  private readonly search$ = new Subject<string>();

  // ── Form ─────────────────────────────────────────────────────────────────

  protected form = this.fb.group({
    nomRue:    ['', [Validators.required, Validators.maxLength(100)]],
    codePostal:['', [Validators.required, Validators.maxLength(10)]],
    ville:     ['', [Validators.required, Validators.maxLength(60)]],
    codeVoie:  ['', Validators.maxLength(15)],
    motVoie:   ['', Validators.maxLength(50)],
    parite:    ['I' as PariteKey, Validators.required],
    numDebut:  [0,  [Validators.required, Validators.min(0)]],
    typeDebut: ['' as TypeKey],
    numFin:    [9999, [Validators.required, Validators.min(0)]],
    typeFin:   ['' as TypeKey],
    geo1: [''], geo2: [''], geo3: [''],
    geo4: [''], geo5: [''], geo6: [''],
    geo7: [''], geo8: [''], geo9: [''],
  });

  // ── Enums ────────────────────────────────────────────────────────────────

  protected readonly parites: { value: PariteKey; label: string }[] = [
    { value: 'I', label: 'Impair' },
    { value: 'P', label: 'Pair'   },
    { value: 'T', label: 'Tous'   },
  ];

  protected readonly types: { value: TypeKey; label: string }[] = [
    { value: '',  label: '—'      },
    { value: 'B', label: 'Bis'    },
    { value: 'T', label: 'Ter'    },
    { value: 'Q', label: 'Quater' },
  ];

  protected readonly geoKeys = GEO_KEYS;

  // ── Computed ─────────────────────────────────────────────────────────────

  protected readonly drawerTitle = computed(() =>
    this.editingItem() ? 'Modifier le tronçon' : 'Nouveau tronçon de rue'
  );

  // ── Lifecycle ────────────────────────────────────────────────────────────

  ngOnInit(): void {
    this.loadItems();
    this.loadNiveaux();
    this.search$.pipe(debounceTime(250), distinctUntilChanged(), takeUntilDestroyed(this.destroyRef))
      .subscribe(q => this.applyFilter(q));
  }

  // ── Data loading ─────────────────────────────────────────────────────────

  private loadItems(): void {
    this.isLoading.set(true);
    this.svc.getSectorisations()
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (data) => { this.allItems.set(data); this.items.set(data); this.isLoading.set(false); },
        error: ()    => { this.isLoading.set(false); },
      });
  }

  private loadNiveaux(): void {
    this.svc.getTerritoireNiveaux()
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({ next: (data) => this.niveaux.set(data) });
    // Load all elements for all levels for the dropdowns
    for (let n = 1; n <= 9; n++) {
      this.svc.getTerritoireElements(n)
        .pipe(takeUntilDestroyed(this.destroyRef))
        .subscribe({ next: (data) => this.territoireElements.update(all => [...all.filter(e => e.niveau !== n), ...data]) });
    }
  }

  // ── Search ───────────────────────────────────────────────────────────────

  protected onSearch(q: string): void {
    this.search$.next(q);
  }

  private applyFilter(q: string): void {
    const lq = q.toLowerCase();
    if (!lq) { this.items.set(this.allItems()); return; }
    this.items.set(this.allItems().filter(s =>
      s.nomRue.toLowerCase().includes(lq) ||
      s.codePostal.includes(lq) ||
      s.ville.toLowerCase().includes(lq)
    ));
  }

  // ── Drawer ───────────────────────────────────────────────────────────────

  protected openAdd(): void {
    this.editingItem.set(null);
    this.form.reset({
      parite: 'I', numDebut: 0, numFin: 9999,
      typeDebut: '', typeFin: '',
      geo1:'', geo2:'', geo3:'', geo4:'', geo5:'', geo6:'', geo7:'', geo8:'', geo9:'',
    });
    this.drawerVisible.set(true);
  }

  protected openEdit(item: Sectorisation): void {
    this.editingItem.set(item);
    this.form.patchValue(item as unknown as Record<string, unknown>);
    this.drawerVisible.set(true);
  }

  protected closeDrawer(): void {
    this.drawerVisible.set(false);
  }

  // ── Save ─────────────────────────────────────────────────────────────────

  protected save(): void {
    if (this.form.invalid) { this.form.markAllAsTouched(); return; }
    this.isSaving.set(true);
    const body = this.form.value as Partial<Sectorisation>;
    const editing = this.editingItem();

    const obs = editing
      ? this.svc.updateSectorisation(editing.id, body)
      : this.svc.createSectorisation(body);

    obs.pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
      next: (saved) => {
        if (editing) {
          this.allItems.update(list => list.map(s => s.id === editing.id ? saved : s));
        } else {
          this.allItems.update(list => [...list, saved]);
        }
        this.applyFilter(this.searchQuery);
        this.drawerVisible.set(false);
        this.isSaving.set(false);
        this.msg.success(editing ? 'Tronçon modifié' : 'Tronçon créé');
      },
      error: () => { this.isSaving.set(false); this.msg.error('Erreur lors de la sauvegarde'); },
    });
  }

  // ── Delete ───────────────────────────────────────────────────────────────

  protected delete(item: Sectorisation): void {
    this.svc.deleteSectorisation(item.id)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: () => {
          this.allItems.update(list => list.filter(s => s.id !== item.id));
          this.applyFilter(this.searchQuery);
          this.msg.success('Tronçon supprimé');
        },
        error: () => this.msg.error('Erreur lors de la suppression'),
      });
  }

  // ── Display helpers ──────────────────────────────────────────────────────

  protected pariteLabelShort(p: PariteKey): string {
    return p === 'I' ? 'Impair' : p === 'P' ? 'Pair' : 'Tous';
  }

  protected typeLabel(t: TypeKey): string {
    return t === 'B' ? 'Bis' : t === 'T' ? 'Ter' : t === 'Q' ? 'Quater' : '';
  }

  protected niveauLabel(n: number): string {
    return this.niveaux().find(nv => nv.niveau === n)?.nom ?? `Territoire ${n}`;
  }

  protected elementsForNiveau(n: number): TerritoireElement[] {
    return this.territoireElements().filter(e => e.niveau === n);
  }

  protected hasGeoValue(item: Sectorisation): boolean {
    return GEO_KEYS.some(k => !!(item as unknown as Record<string, unknown>)[k]);
  }

  protected geoCount(item: Sectorisation): number {
    return GEO_KEYS.filter(k => !!(item as unknown as Record<string, unknown>)[k]).length;
  }

  protected padLevel(n: number): string {
    return String(n).padStart(2, '0');
  }

  protected formGeoValue(key: string): string {
    return (this.form.get(key)?.value as string) ?? '';
  }
}
