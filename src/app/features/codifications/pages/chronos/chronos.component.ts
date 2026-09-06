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
import { NzRadioModule } from 'ng-zorro-antd/radio';
import { NzPopconfirmModule } from 'ng-zorro-antd/popconfirm';
import { NzTagModule } from 'ng-zorro-antd/tag';
import { NzInputNumberModule } from 'ng-zorro-antd/input-number';
import { NzTabsModule } from 'ng-zorro-antd/tabs';
import { NzIconModule } from 'ng-zorro-antd/icon';
import { NzMessageService } from 'ng-zorro-antd/message';
import { CodificationsService } from '../../services/codifications.service';
import type { Chrono } from '../../models/codification.models';

@Component({
  selector: 'pli-chronos',
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
    NzRadioModule,
    NzPopconfirmModule,
    NzTagModule,
    NzInputNumberModule,
    NzTabsModule,
    NzIconModule,
  ],
  templateUrl: './chronos.component.html',
  styleUrl: './chronos.component.scss',
})
export class ChronosComponent implements OnInit {
  private readonly service = inject(CodificationsService);
  private readonly fb = inject(FormBuilder);
  private readonly msg = inject(NzMessageService);
  private readonly destroyRef = inject(DestroyRef);

  protected readonly allItems = signal<Chrono[]>([]);
  protected readonly items = signal<Chrono[]>([]);
  protected readonly isLoading = signal(false);
  protected readonly isSaving = signal(false);
  protected readonly drawerVisible = signal(false);
  protected readonly editingItem = signal<Chrono | null>(null);
  protected readonly tripletExpanded = signal(false);

  protected searchModel = '';
  private readonly search$ = new Subject<string>();

  protected readonly typeOptions = [
    { value: 'RECU',    label: 'Élément reçu' },
    { value: 'SORTANT', label: 'Élément sortant' },
    { value: 'INTERNE', label: 'Élément interne' },
    { value: 'FAX',     label: 'Fax' },
    { value: 'EMAIL',   label: 'Courriel' },
  ];

  protected readonly affectationOptions = [
    { value: 'CONNECTE',    label: 'Utilisateur connecté' },
    { value: 'SUIVEUSE',    label: 'Destinataire fiche suiveuse originale' },
    { value: 'PREMIER_SVC', label: 'Premier utilisateur du service' },
    { value: 'AUCUN',       label: 'Aucune affectation' },
  ];

  protected form = this.fb.group({
    nom:               ['', [Validators.required, Validators.maxLength(50)]],
    type:              ['RECU', Validators.required],
    prefixe:           [''],
    suffixe:           [''],
    separateur:        ['-'],
    sigleService:      [false],
    nbChiffresAnnee:   [4 as 2 | 4],
    nbChiffresNumero:  [5 as 3 | 4 | 5 | 6],
    // Libellés
    resumeLabel:          [''],
    tripletLabel:         [''],
    objetLabel:           [''],
    reference:            [''],
    dateArriveeLabel:     [''],
    showDateArrivee:      [true],
    dateExpeditionLabel:  [''],
    showDateExpedition:   [false],
    dateLimiteLabel:      [''],
    showDateLimite:       [false],
    premiereAffectation:  ['CONNECTE'],
    deuxiemeAffectation:  ['SUIVEUSE'],
    nbJoursDateLimite:    [0],
    criticiteLabel:       [''],
    showCriticite:        [false],
    sansJoursFeries:      [false],
    enJoursOuvres:        [false],
    clotureCopies:        [false],
    // Visibilité
    isPublic:    [true],
    tri:         [1],
    acces:       ['SERVICE' as 'SERVICE' | 'UTILISATEUR'],
    hierarchie:  [''],
    // Descriptif
    descriptif: [''],
    // Priorité et Nature
    hasPriorite: [false],
    hasNature:   [false],
    // Autres
    hasDoleances:  [false],
    specifique:    [''],
    coEmetteur:    [''],
    showCoEmetteur: [false],
    // Triplet
    tripletNom:       [''],
    tripletPrenom:    [''],
    tripletFonction:  [''],
    tripletOrganisme: [''],
    // Courrier
    affichageTickets: [false],
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
    this.service.getChronos()
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (data) => { this.allItems.set(data); this.applyFilter(); this.isLoading.set(false); },
        error: () => { this.isLoading.set(false); this.msg.error('Erreur lors du chargement.'); },
      });
  }

  private applyFilter(): void {
    const q = this.searchModel.trim().toLowerCase();
    if (q) {
      this.items.set(this.allItems().filter(c =>
        c.nom.toLowerCase().includes(q) || c.prefixe?.toLowerCase().includes(q)
      ));
    } else {
      this.items.set(this.allItems());
    }
  }

  protected onSearch(v: string): void { this.search$.next(v); }

  protected openAdd(): void {
    this.editingItem.set(null);
    this.tripletExpanded.set(false);
    this.form.reset({
      type: 'RECU', nbChiffresAnnee: 4, nbChiffresNumero: 5,
      separateur: '-', sigleService: false,
      isPublic: true, tri: 1, acces: 'SERVICE',
      showDateArrivee: true, showDateExpedition: false, showDateLimite: false,
      premiereAffectation: 'CONNECTE', deuxiemeAffectation: 'SUIVEUSE',
      nbJoursDateLimite: 0, showCriticite: false,
      sansJoursFeries: false, enJoursOuvres: false, clotureCopies: false,
      hasPriorite: false, hasNature: false, hasDoleances: false, showCoEmetteur: false,
      affichageTickets: false,
    });
    this.drawerVisible.set(true);
  }

  protected openEdit(item: Chrono): void {
    this.editingItem.set(item);
    this.tripletExpanded.set(false);
    this.form.patchValue({ ...item });
    this.drawerVisible.set(true);
  }

  protected saveDrawer(): void {
    if (this.form.invalid) { this.form.markAllAsTouched(); return; }
    this.isSaving.set(true);
    const body = this.form.value as Partial<Chrono>;
    const editing = this.editingItem();
    const obs = editing
      ? this.service.updateChrono(editing.id, body)
      : this.service.createChrono(body);

    obs.pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
      next: () => {
        this.isSaving.set(false);
        this.drawerVisible.set(false);
        this.msg.success(editing ? 'Chrono modifié.' : 'Chrono ajouté.');
        this.loadData();
      },
      error: () => { this.isSaving.set(false); this.msg.error('Erreur lors de l\'enregistrement.'); },
    });
  }

  protected confirmDelete(id: number): void {
    this.service.deleteChrono(id)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: () => { this.msg.success('Chrono supprimé.'); this.loadData(); },
        error: () => this.msg.error('Impossible de supprimer ce chrono.'),
      });
  }

  protected get drawerTitle(): string {
    const e = this.editingItem();
    return e ? `Modifier — ${e.nom}` : 'Nouveau chrono';
  }

  // ── Live format preview (SIGNATURE ELEMENT) ───────────────────────────────

  protected get formatParts(): { value: string; role: string }[] {
    const v = this.form.value;
    const prefix = v.sigleService ? 'SVC' : (v.prefixe || '');
    const year = v.nbChiffresAnnee === 2 ? '24' : '2024';
    const sep = v.separateur || '';
    const numDigits = v.nbChiffresNumero ?? 5;
    const num = '1'.padStart(numDigits, '0');
    const suffix = v.suffixe || '';

    const parts: { value: string; role: string }[] = [];
    if (prefix) {
      parts.push({ value: prefix, role: 'prefix' });
      parts.push({ value: sep || '–', role: 'sep' });
    }
    parts.push({ value: year, role: 'year' });
    parts.push({ value: sep || '–', role: 'sep' });
    parts.push({ value: num, role: 'num' });
    if (suffix) {
      parts.push({ value: sep || '–', role: 'sep' });
      parts.push({ value: suffix, role: 'suffix' });
    }
    return parts;
  }

  /** Assemble the full chrono string for the table column preview */
  protected buildPreview(item: Chrono): string {
    const prefix = item.sigleService ? 'SVC' : (item.prefixe || '');
    const year = item.nbChiffresAnnee === 2 ? '24' : '2024';
    const sep = item.separateur || '';
    const num = '1'.padStart(item.nbChiffresNumero, '0');
    const suffix = item.suffixe || '';
    const parts = [prefix, year, num, suffix].filter(Boolean);
    return parts.join(sep) || '—';
  }

  protected getTypeLabel(type: string): string {
    return this.typeOptions.find(t => t.value === type)?.label ?? type;
  }
}
