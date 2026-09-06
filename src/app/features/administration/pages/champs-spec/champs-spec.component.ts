import {
  Component,
  OnInit,
  inject,
  signal,
  computed,
  DestroyRef,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, ReactiveFormsModule, Validators, AbstractControl } from '@angular/forms';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { toSignal } from '@angular/core/rxjs-interop';
import { startWith } from 'rxjs';
import { DragDropModule, CdkDragDrop, moveItemInArray } from '@angular/cdk/drag-drop';
import { NzTableModule } from 'ng-zorro-antd/table';
import { NzButtonModule } from 'ng-zorro-antd/button';
import { NzInputModule } from 'ng-zorro-antd/input';
import { NzSelectModule } from 'ng-zorro-antd/select';
import { NzDrawerModule } from 'ng-zorro-antd/drawer';
import { NzFormModule } from 'ng-zorro-antd/form';
import { NzPopconfirmModule } from 'ng-zorro-antd/popconfirm';
import { NzTooltipModule } from 'ng-zorro-antd/tooltip';
import { NzIconModule } from 'ng-zorro-antd/icon';
import { NzSwitchModule } from 'ng-zorro-antd/switch';
import { NzMessageService } from 'ng-zorro-antd/message';
import { NzSpinModule } from 'ng-zorro-antd/spin';
import { AdministrationService } from '../../services/administration.service';
import type { PageSpec, ChampSpec, ChampType } from '../../models/administration.models';

interface ChampTypeOption {
  value: ChampType;
  label: string;
  icon: string;
  color: string;
}

@Component({
  selector: 'pli-champs-spec',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    DragDropModule,
    NzTableModule,
    NzButtonModule,
    NzInputModule,
    NzSelectModule,
    NzDrawerModule,
    NzFormModule,
    NzPopconfirmModule,
    NzTooltipModule,
    NzIconModule,
    NzSwitchModule,
    NzSpinModule,
  ],
  templateUrl: './champs-spec.component.html',
  styleUrl: './champs-spec.component.scss',
})
export class ChampsSpecComponent implements OnInit {
  private readonly service = inject(AdministrationService);
  private readonly fb = inject(FormBuilder);
  private readonly msg = inject(NzMessageService);
  private readonly destroyRef = inject(DestroyRef);

  // ── State ────────────────────────────────────────────────────
  protected readonly pages = signal<PageSpec[]>([]);
  protected readonly champs = signal<ChampSpec[]>([]);
  protected readonly selectedPage = signal<PageSpec | null>(null);
  protected readonly isLoadingPages = signal(false);
  protected readonly isLoadingChamps = signal(false);
  protected readonly isSaving = signal(false);

  protected readonly totalChamps = computed(() =>
    this.pages().reduce((s, p) => s + p.champCount, 0)
  );

  // ── Drawers ──────────────────────────────────────────────────
  protected champDrawerVisible = signal(false);
  protected pageDrawerVisible = signal(false);
  protected editingChamp = signal<ChampSpec | null>(null);

  protected readonly champDrawerTitle = computed(() =>
    this.editingChamp() ? 'Modifier le champ' : 'Ajouter un champ'
  );

  // ── Champ form ───────────────────────────────────────────────
  protected readonly champForm = this.fb.group({
    nom:          ['', [Validators.required, Validators.maxLength(50), Validators.pattern(/^[a-zA-Z][a-zA-Z0-9_]*$/)]],
    libelle:      ['', [Validators.required, Validators.maxLength(250)]],
    infobulle:    ['', Validators.maxLength(250)],
    visible:      [true],
    obligatoire:  [false],
    majuscule:    [false],
    type:         ['chaine' as ChampType, Validators.required],
    valeurDefaut: ['', Validators.maxLength(250)],
    // Liste config
    listeMode:    ['static' as 'static' | 'query'],
    valeurs:      [''],
    identifiants: [''],
    requeteListe: [''],
  });

  private readonly typeSignal = toSignal(
    this.champForm.get('type')!.valueChanges.pipe(startWith(this.champForm.get('type')!.value)),
    { initialValue: 'chaine' as ChampType }
  );

  private readonly listeModeSignal = toSignal(
    this.champForm.get('listeMode')!.valueChanges.pipe(startWith(this.champForm.get('listeMode')!.value)),
    { initialValue: 'static' as 'static' | 'query' }
  );

  protected readonly showListeConfig = computed(() => this.typeSignal() === 'liste');
  protected readonly showStaticValues = computed(
    () => this.showListeConfig() && this.listeModeSignal() === 'static'
  );
  protected readonly showQueryConfig = computed(
    () => this.showListeConfig() && this.listeModeSignal() === 'query'
  );

  // ── Page form ────────────────────────────────────────────────
  protected readonly pageForm = this.fb.group({
    nom:      ['', [Validators.required, Validators.maxLength(100), Validators.pattern(/^[a-zA-Z][a-zA-Z0-9_]*$/)]],
    nomTable: ['', Validators.maxLength(50)],
  });

  // ── Field type definitions ───────────────────────────────────
  protected readonly champTypes: ChampTypeOption[] = [
    { value: 'chaine',     label: 'Chaîne',    icon: 'font-size',    color: 'blue'   },
    { value: 'date',       label: 'Date',       icon: 'calendar',     color: 'cyan'   },
    { value: 'numerique',  label: 'Numérique',  icon: 'number',       color: 'gold'   },
    { value: 'liste',      label: 'Liste',      icon: 'bars',       color: 'purple' },
    { value: 'multiligne', label: 'Multiligne', icon: 'file-text',  color: 'default' },
  ];

  ngOnInit(): void {
    this.loadPages();
  }

  // ── Load ─────────────────────────────────────────────────────
  private loadPages(): void {
    this.isLoadingPages.set(true);
    this.service.getPages()
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (pages) => { this.pages.set(pages); this.isLoadingPages.set(false); },
        error: () => { this.isLoadingPages.set(false); this.msg.error('Erreur lors du chargement des pages.'); },
      });
  }

  protected selectPage(page: PageSpec): void {
    this.selectedPage.set(page);
    this.loadChamps(page.nom);
  }

  private loadChamps(pageNom: string): void {
    this.isLoadingChamps.set(true);
    this.service.getChamps(pageNom)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (champs) => { this.champs.set(champs); this.isLoadingChamps.set(false); },
        error: () => { this.isLoadingChamps.set(false); this.msg.error('Erreur lors du chargement des champs.'); },
      });
  }

  // ── Page CRUD ────────────────────────────────────────────────
  protected openAddPage(): void {
    this.pageForm.reset({ nom: '', nomTable: '' });
    this.pageDrawerVisible.set(true);
  }

  protected closePageDrawer(): void {
    this.pageDrawerVisible.set(false);
  }

  protected savePage(): void {
    if (this.pageForm.invalid) { this.pageForm.markAllAsTouched(); return; }
    this.isSaving.set(true);
    const v = this.pageForm.getRawValue();
    this.service.createPage({ nom: v.nom!, nomTable: v.nomTable ?? undefined })
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (page) => {
          this.pages.update((ps) => [...ps, page]);
          this.isSaving.set(false);
          this.closePageDrawer();
          this.msg.success(`Page "${page.nom}" créée.`);
        },
        error: () => { this.isSaving.set(false); this.msg.error('Erreur lors de la création.'); },
      });
  }

  protected deletePage(page: PageSpec): void {
    this.service.deletePage(page.nom)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: () => {
          this.pages.update((ps) => ps.filter((p) => p.nom !== page.nom));
          if (this.selectedPage()?.nom === page.nom) {
            this.selectedPage.set(null);
            this.champs.set([]);
          }
          this.msg.success(`Page "${page.nom}" supprimée.`);
        },
        error: () => this.msg.error('Erreur lors de la suppression.'),
      });
  }

  // ── Champ CRUD ───────────────────────────────────────────────
  protected openAddChamp(): void {
    this.editingChamp.set(null);
    this.champForm.reset({ nom: '', libelle: '', infobulle: '', visible: true, obligatoire: false, majuscule: false, type: 'chaine', valeurDefaut: '', listeMode: 'static', valeurs: '', identifiants: '', requeteListe: '' });
    this.champDrawerVisible.set(true);
  }

  protected openEditChamp(champ: ChampSpec): void {
    this.editingChamp.set(champ);
    this.champForm.patchValue({
      nom:          champ.nom,
      libelle:      champ.libelle,
      infobulle:    champ.infobulle ?? '',
      visible:      champ.visible,
      obligatoire:  champ.obligatoire,
      majuscule:    champ.majuscule,
      type:         champ.type,
      valeurDefaut: champ.valeurDefaut ?? '',
      listeMode:    champ.requeteListe ? 'query' : 'static',
      valeurs:      champ.valeurs ?? '',
      identifiants: champ.identifiants ?? '',
      requeteListe: champ.requeteListe ?? '',
    });
    this.champDrawerVisible.set(true);
  }

  protected closeChampDrawer(): void {
    this.champDrawerVisible.set(false);
    this.editingChamp.set(null);
  }

  protected saveChamp(): void {
    if (this.champForm.invalid) { this.champForm.markAllAsTouched(); return; }
    const page = this.selectedPage();
    if (!page) return;

    const v = this.champForm.getRawValue();
    const body: Partial<ChampSpec> = {
      nom:          v.nom!,
      libelle:      v.libelle!,
      infobulle:    v.infobulle || undefined,
      visible:      !!v.visible,
      obligatoire:  !!v.obligatoire,
      majuscule:    !!v.majuscule,
      type:         v.type as ChampType,
      valeurDefaut: v.valeurDefaut || undefined,
      valeurs:      v.type === 'liste' && v.listeMode === 'static' ? (v.valeurs || undefined) : undefined,
      identifiants: v.type === 'liste' && v.listeMode === 'static' ? (v.identifiants || undefined) : undefined,
      requeteListe: v.type === 'liste' && v.listeMode === 'query' ? (v.requeteListe || undefined) : undefined,
    };

    this.isSaving.set(true);
    const editing = this.editingChamp();

    const op$ = editing
      ? this.service.updateChamp(page.nom, editing.id, body)
      : this.service.createChamp(page.nom, body);

    op$.pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
      next: (champ) => {
        this.champs.update((cs) =>
          editing ? cs.map((c) => (c.id === champ.id ? champ : c)) : [...cs, champ]
        );
        if (!editing) {
          this.pages.update((ps) =>
            ps.map((p) => p.nom === page.nom ? { ...p, champCount: p.champCount + 1 } : p)
          );
        }
        this.isSaving.set(false);
        this.closeChampDrawer();
        this.msg.success(editing ? 'Champ mis à jour.' : 'Champ ajouté.');
      },
      error: () => { this.isSaving.set(false); this.msg.error('Erreur lors de l\'enregistrement.'); },
    });
  }

  protected deleteChamp(champ: ChampSpec): void {
    const page = this.selectedPage();
    if (!page) return;
    this.service.deleteChamp(page.nom, champ.id)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: () => {
          this.champs.update((cs) => cs.filter((c) => c.id !== champ.id));
          this.pages.update((ps) =>
            ps.map((p) => p.nom === page.nom ? { ...p, champCount: Math.max(0, p.champCount - 1) } : p)
          );
          this.msg.success('Champ supprimé.');
        },
        error: () => this.msg.error('Erreur lors de la suppression.'),
      });
  }

  // ── Drag & drop reorder ──────────────────────────────────────
  protected dropChamp(event: CdkDragDrop<ChampSpec[]>): void {
    const page = this.selectedPage();
    if (!page || event.previousIndex === event.currentIndex) return;

    const arr = [...this.champs()];
    moveItemInArray(arr, event.previousIndex, event.currentIndex);
    this.champs.set(arr.map((c, i) => ({ ...c, ordre: i })));

    this.service.reorderChamps(page.nom, arr.map((c) => c.id))
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({ error: () => this.msg.error('Erreur lors du réordonnancement.') });
  }

  // ── Display helpers ──────────────────────────────────────────
  protected typeOption(type: ChampType): ChampTypeOption {
    return this.champTypes.find((t) => t.value === type) ?? this.champTypes[0];
  }

  protected getControl(name: string): AbstractControl {
    return this.champForm.get(name)!;
  }
}
