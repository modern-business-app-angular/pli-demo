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
import { takeUntilDestroyed, toSignal } from '@angular/core/rxjs-interop';
import { Subject, debounceTime, distinctUntilChanged, startWith } from 'rxjs';
import { DragDropModule, CdkDragDrop, moveItemInArray } from '@angular/cdk/drag-drop';
import { NzTableModule } from 'ng-zorro-antd/table';
import { NzButtonModule } from 'ng-zorro-antd/button';
import { NzInputModule } from 'ng-zorro-antd/input';
import { NzInputNumberModule } from 'ng-zorro-antd/input-number';
import { NzDrawerModule } from 'ng-zorro-antd/drawer';
import { NzFormModule } from 'ng-zorro-antd/form';
import { NzSelectModule } from 'ng-zorro-antd/select';
import { NzSwitchModule } from 'ng-zorro-antd/switch';
import { NzTabsModule } from 'ng-zorro-antd/tabs';
import { NzTagModule } from 'ng-zorro-antd/tag';
import { NzIconModule } from 'ng-zorro-antd/icon';
import { NzMessageService } from 'ng-zorro-antd/message';
import { NzTooltipModule } from 'ng-zorro-antd/tooltip';
import { NzRadioModule } from 'ng-zorro-antd/radio';
import { NzPopconfirmModule } from 'ng-zorro-antd/popconfirm';
import { SearchService } from '../../services/search.service';
import { CodificationsService } from '../../../codifications/services/codifications.service';
import type {
  SearchModel,
  SearchModelType,
  SearchVisibility,
  SearchColumnConfig,
  SearchColumnDef,
} from '../../models/search.models';
import {
  DEFAULT_CAPABILITIES,
  MODEL_TYPE_LABELS,
  COLUMN_CATALOG,
} from '../../models/search.models';
import type { ServiceCodif } from '../../../codifications/models/codification.models';

type TabFilter = 'all' | 'public' | 'private' | 'system';

interface CapabilityDef {
  key: keyof SearchModel['capabilities'];
  label: string;
  desc: string;
  icon: string;
}

const CAPABILITIES_GROUPS: { title: string; color: string; items: CapabilityDef[] }[] = [
  {
    title: 'Export & Édition',
    color: 'teal',
    items: [
      { key: 'tableur',   label: 'Tableur',        icon: 'file-excel',  desc: 'Export Excel des résultats' },
      { key: 'imprimer',  label: 'Imprimer',        icon: 'printer',     desc: 'Impression des résultats' },
      { key: 'mail',      label: 'Mail',             icon: 'mail',        desc: 'Envoi par email' },
      { key: 'selection', label: 'Sélection',        icon: 'check-square',desc: 'Cases à cocher par ligne' },
    ],
  },
  {
    title: 'Interface',
    color: 'brand',
    items: [
      { key: 'filtrer',   label: 'Filtrer',          icon: 'filter',      desc: 'Panneau de filtres personnalisés' },
      { key: 'colonnes',  label: 'Colonnes',          icon: 'table',       desc: 'Sélecteur de colonnes visibles' },
      { key: 'grouper',   label: 'Grouper',           icon: 'apartment',   desc: 'Regroupement des lignes' },
      { key: 'nbLignes',  label: 'Nombres de lignes', icon: 'ordered-list',desc: 'Affichage du total' },
    ],
  },
  {
    title: 'Avancé',
    color: 'amber',
    items: [
      { key: 'alerte',    label: 'Alerte',            icon: 'bell',        desc: 'Notifications sur ce modèle' },
      { key: 'favorite',  label: 'Favori',            icon: 'pushpin',     desc: 'Épinglé dans les favoris' },
      { key: 'sql',       label: 'SQL',               icon: 'database',    desc: 'Afficher la requête générée' },
    ],
  },
];

@Component({
  selector: 'pli-search-models',
  standalone: true,
  imports: [
    ReactiveFormsModule,
    FormsModule,
    DragDropModule,
    NzTableModule,
    NzButtonModule,
    NzInputModule,
    NzInputNumberModule,
    NzDrawerModule,
    NzFormModule,
    NzSelectModule,
    NzSwitchModule,
    NzTabsModule,
    NzTagModule,
    NzIconModule,
    NzTooltipModule,
    NzRadioModule,
    NzPopconfirmModule,
  ],
  templateUrl: './search-models.component.html',
  styleUrl: './search-models.component.scss',
})
export class SearchModelsComponent implements OnInit {
  private readonly svc = inject(SearchService);
  private readonly codifSvc = inject(CodificationsService);
  private readonly fb = inject(FormBuilder);
  private readonly msg = inject(NzMessageService);
  private readonly destroyRef = inject(DestroyRef);

  // ── State ────────────────────────────────────────────────────────────────

  protected readonly allModels = signal<SearchModel[]>([]);
  protected readonly models = signal<SearchModel[]>([]);
  protected readonly services = signal<ServiceCodif[]>([]);
  protected readonly isLoading = signal(false);
  protected readonly isSaving = signal(false);
  protected readonly drawerVisible = signal(false);
  protected readonly editingModel = signal<SearchModel | null>(null);
  protected readonly activeTab = signal<TabFilter>('all');

  // ── Column config state ──────────────────────────────────────────────────

  protected readonly colConfigs = signal<SearchColumnConfig[]>([]);

  // ── Search ───────────────────────────────────────────────────────────────

  protected searchQuery = '';
  private readonly search$ = new Subject<string>();

  // ── Static config ────────────────────────────────────────────────────────

  protected readonly capGroups = CAPABILITIES_GROUPS;
  protected readonly modelTypeLabels = MODEL_TYPE_LABELS;
  protected readonly modelTypes: SearchModelType[] = [
    'actions','chronos','civilites','courriers','demandes','dossiers',
    'elements','etats-classeur','etats-elements','fonctions','jours-feries',
    'natures','objets','personnels','protocoles','services',
  ];

  // ── Form ─────────────────────────────────────────────────────────────────

  protected form = this.fb.group({
    nom:        ['', [Validators.required, Validators.maxLength(128)]],
    libelle:    ['', [Validators.required, Validators.maxLength(128)]],
    type:       ['' as SearchModelType, Validators.required],
    visibility: ['public' as SearchVisibility, Validators.required],
    serviceId:  [null as number | null],
    // capabilities
    alerte:    [false], colonnes:  [true],  grouper:   [false],
    tableur:   [true],  imprimer:  [true],  filtrer:   [true],
    sql:       [false], mail:      [false], selection: [true],
    nbLignes:  [true],  favorite:  [false],
  });

  // ── Reactive form value signals ──────────────────────────────────────────
  // Form controls are not Angular signals — convert via toSignal so computed()
  // re-evaluates whenever the value changes.

  private readonly typeSignal = toSignal(
    this.form.get('type')!.valueChanges.pipe(startWith(this.form.get('type')!.value)),
    { initialValue: '' as SearchModelType }
  );

  private readonly visibilitySignal = toSignal(
    this.form.get('visibility')!.valueChanges.pipe(startWith(this.form.get('visibility')!.value)),
    { initialValue: 'public' as SearchVisibility }
  );

  // ── Computed ─────────────────────────────────────────────────────────────

  protected readonly drawerTitle = computed(() =>
    this.editingModel() ? 'Modifier le modèle' : 'Nouveau modèle de recherche'
  );

  protected readonly showServiceSelect = computed(() =>
    this.visibilitySignal() === 'service'
  );

  /** Available columns for the currently selected type */
  protected readonly availableCols = computed((): SearchColumnDef[] => {
    const type = this.typeSignal() as SearchModelType | '';
    return type ? (COLUMN_CATALOG[type] ?? []) : [];
  });

  /** Visible columns sorted by their order */
  protected readonly visibleCols = computed(() =>
    this.colConfigs()
      .filter(c => c.visible)
      .sort((a, b) => a.order - b.order)
  );

  /** Catalog entries not in the visible list */
  protected readonly hiddenCols = computed((): SearchColumnDef[] => {
    const visibleKeys = new Set(this.colConfigs().filter(c => c.visible).map(c => c.key));
    return this.availableCols().filter(d => !visibleKeys.has(d.key));
  });

  protected readonly colSummary = computed(() => {
    const total = this.availableCols().length;
    const active = this.visibleCols().length;
    return total > 0 ? `${active} / ${total} colonnes` : '';
  });

  /** Hidden columns grouped by their `group` field — Base first, then alphabetical */
  protected readonly hiddenColGroups = computed(() => {
    const groups = new Map<string, SearchColumnDef[]>();
    for (const def of this.hiddenCols()) {
      const g = def.group ?? 'Base';
      if (!groups.has(g)) groups.set(g, []);
      groups.get(g)!.push(def);
    }
    return [...groups.entries()]
      .sort(([a], [b]) => a === 'Base' ? -1 : b === 'Base' ? 1 : a.localeCompare(b, 'fr'))
      .map(([label, cols]) => ({ label, cols }));
  });

  // ── Lifecycle ────────────────────────────────────────────────────────────

  ngOnInit(): void {
    this.loadModels();
    this.codifSvc.getServices()
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({ next: (data) => this.services.set(data) });
    this.search$.pipe(debounceTime(250), distinctUntilChanged(), takeUntilDestroyed(this.destroyRef))
      .subscribe(() => this.applyFilters());

    // When type changes in "new model" mode, reinitialise column config
    this.form.get('type')!.valueChanges
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(() => {
        if (!this.editingModel()) this.initColConfigs();
      });
  }

  // ── Data loading ─────────────────────────────────────────────────────────

  private loadModels(): void {
    this.isLoading.set(true);
    this.svc.getModels()
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (data) => { this.allModels.set(data); this.applyFilters(); this.isLoading.set(false); },
        error: ()    => { this.isLoading.set(false); },
      });
  }

  // ── Filters ──────────────────────────────────────────────────────────────

  protected setTab(tab: TabFilter): void {
    this.activeTab.set(tab);
    this.applyFilters();
  }

  protected onSearch(q: string): void {
    this.search$.next(q);
  }

  private applyFilters(): void {
    let result = this.allModels();
    const tab = this.activeTab();
    const q = this.searchQuery.toLowerCase();

    if (tab === 'public')  result = result.filter(m => m.visibility === 'public');
    if (tab === 'private') result = result.filter(m => m.visibility === 'private');
    if (tab === 'system')  result = result.filter(m => m.isSystem);

    if (q) {
      result = result.filter(m =>
        m.nom.toLowerCase().includes(q) ||
        m.libelle.toLowerCase().includes(q) ||
        (MODEL_TYPE_LABELS[m.type] ?? '').toLowerCase().includes(q)
      );
    }
    this.models.set(result);
  }

  // ── Drawer ───────────────────────────────────────────────────────────────

  protected openAdd(): void {
    this.editingModel.set(null);
    this.form.reset({
      nom: '', libelle: '', type: '' as SearchModelType,
      visibility: 'public', serviceId: null,
      ...DEFAULT_CAPABILITIES,
    });
    this.colConfigs.set([]);
    this.drawerVisible.set(true);
  }

  protected openEdit(model: SearchModel): void {
    this.editingModel.set(model);
    this.form.patchValue({
      nom: model.nom, libelle: model.libelle,
      type: model.type, visibility: model.visibility,
      serviceId: model.serviceId ?? null,
      ...model.capabilities,
    });
    this.initColConfigs(model);
    this.drawerVisible.set(true);
  }

  protected closeDrawer(): void {
    this.drawerVisible.set(false);
  }

  // ── Column config management ─────────────────────────────────────────────

  private initColConfigs(model?: SearchModel): void {
    const type = (model?.type ?? this.form.get('type')?.value) as SearchModelType | '';
    if (!type) { this.colConfigs.set([]); return; }

    const catalog = COLUMN_CATALOG[type] ?? [];

    if (model?.columns?.length) {
      // Merge saved config with catalog: keep saved order/width, add missing as hidden
      const saved = new Map(model.columns.map(c => [c.key, c]));
      const merged: SearchColumnConfig[] = [];
      // First: all catalog columns that have a saved entry
      catalog.forEach(def => {
        if (saved.has(def.key)) {
          merged.push(saved.get(def.key)!);
        } else {
          merged.push({ key: def.key, visible: false, order: 9999 });
        }
      });
      // Re-normalise orders for visible entries
      const visible = merged.filter(c => c.visible).sort((a, b) => a.order - b.order);
      const hidden  = merged.filter(c => !c.visible);
      this.colConfigs.set([
        ...visible.map((c, i) => ({ ...c, order: i })),
        ...hidden,
      ]);
    } else {
      // New model or no saved config: apply catalog defaults
      const defaults = catalog
        .filter(d => d.defaultVisible)
        .map((d, i): SearchColumnConfig => ({ key: d.key, visible: true, order: i }));
      this.colConfigs.set(defaults);
    }
  }

  protected dropColumn(event: CdkDragDrop<SearchColumnConfig[]>): void {
    const arr = [...this.visibleCols()];
    moveItemInArray(arr, event.previousIndex, event.currentIndex);
    const reordered = arr.map((c, i) => ({ ...c, order: i }));
    this.colConfigs.update(configs => [
      ...reordered,
      ...configs.filter(c => !c.visible),
    ]);
  }

  protected showColumn(key: string): void {
    const nextOrder = this.visibleCols().length;
    this.colConfigs.update(configs => {
      const exists = configs.find(c => c.key === key);
      if (exists) {
        return configs.map(c => c.key === key ? { ...c, visible: true, order: nextOrder } : c);
      }
      return [...configs, { key, visible: true, order: nextOrder }];
    });
  }

  protected hideColumn(key: string): void {
    this.colConfigs.update(configs => {
      const updated = configs.map(c => c.key === key ? { ...c, visible: false } : c);
      // Recompact orders
      let i = 0;
      return updated.map(c => c.visible ? { ...c, order: i++ } : c);
    });
  }

  protected resetColumns(): void {
    this.initColConfigs(this.editingModel() ?? undefined);
  }

  protected colDef(key: string): SearchColumnDef | undefined {
    return this.availableCols().find(d => d.key === key);
  }

  protected colWidth(key: string): number | null {
    return this.colConfigs().find(c => c.key === key)?.width ?? null;
  }

  protected setColWidth(key: string, value: number | null): void {
    this.colConfigs.update(configs =>
      configs.map(c => c.key === key ? { ...c, width: value ?? undefined } : c)
    );
  }

  // ── Save ─────────────────────────────────────────────────────────────────

  protected save(): void {
    if (this.form.invalid) { this.form.markAllAsTouched(); return; }
    this.isSaving.set(true);
    const v = this.form.value;
    const body: Partial<SearchModel> = {
      nom: v.nom!, libelle: v.libelle!, type: v.type!, visibility: v.visibility!,
      serviceId: v.serviceId ?? undefined,
      capabilities: {
        alerte: !!v.alerte, colonnes: !!v.colonnes, grouper: !!v.grouper,
        tableur: !!v.tableur, imprimer: !!v.imprimer, filtrer: !!v.filtrer,
        sql: !!v.sql, mail: !!v.mail, selection: !!v.selection,
        nbLignes: !!v.nbLignes, favorite: !!v.favorite,
      },
      filters: [],
      columns: this.colConfigs(),
    };
    const editing = this.editingModel();
    const obs = editing ? this.svc.updateModel(editing.id, body) : this.svc.createModel(body);

    obs.pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
      next: (saved) => {
        if (editing) {
          this.allModels.update(list => list.map(m => m.id === editing.id ? saved : m));
        } else {
          this.allModels.update(list => [...list, saved]);
        }
        this.applyFilters();
        this.drawerVisible.set(false);
        this.isSaving.set(false);
        this.msg.success(editing ? 'Modèle mis à jour' : 'Modèle créé');
      },
      error: () => { this.isSaving.set(false); this.msg.error('Erreur lors de la sauvegarde'); },
    });
  }

  // ── Delete ───────────────────────────────────────────────────────────────

  protected delete(model: SearchModel): void {
    this.svc.deleteModel(model.id)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: () => {
          this.allModels.update(list => list.filter(m => m.id !== model.id));
          this.applyFilters();
          this.msg.success('Modèle supprimé');
        },
        error: () => this.msg.error('Erreur lors de la suppression'),
      });
  }

  // ── Display helpers ──────────────────────────────────────────────────────

  protected typeLabel(type: SearchModelType): string {
    return MODEL_TYPE_LABELS[type] ?? type;
  }

  protected typeColor(type: SearchModelType): string {
    const map: Partial<Record<SearchModelType, string>> = {
      courriers: 'blue', demandes: 'cyan', actions: 'green',
      personnels: 'purple', services: 'orange', elements: 'geekblue',
      dossiers: 'volcano', natures: 'gold', chronos: 'magenta',
    };
    return map[type] ?? 'default';
  }

  protected visibilityIcon(v: SearchVisibility): string {
    return v === 'public' ? 'global' : v === 'service' ? 'team' : 'lock';
  }

  protected visibilityLabel(v: SearchVisibility): string {
    return v === 'public' ? 'Public' : v === 'service' ? 'Service' : 'Privé';
  }

  protected enabledCaps(model: SearchModel): string[] {
    return (Object.entries(model.capabilities) as [string, boolean][])
      .filter(([, v]) => v).map(([k]) => k);
  }

  protected countEnabled(model: SearchModel): number {
    return this.enabledCaps(model).length;
  }

  protected tabCount(tab: TabFilter): number {
    const all = this.allModels();
    if (tab === 'all')     return all.length;
    if (tab === 'public')  return all.filter(m => m.visibility === 'public').length;
    if (tab === 'private') return all.filter(m => m.visibility === 'private').length;
    if (tab === 'system')  return all.filter(m => m.isSystem).length;
    return 0;
  }

  protected colDataTypeIcon(dataType: string): string {
    const map: Record<string, string> = {
      text: 'font-size', number: 'number', date: 'calendar', boolean: 'check-circle',
    };
    return map[dataType] ?? 'font-size';
  }

  protected colGroup(key: string): string | undefined {
    return this.availableCols().find(d => d.key === key)?.group;
  }
}
