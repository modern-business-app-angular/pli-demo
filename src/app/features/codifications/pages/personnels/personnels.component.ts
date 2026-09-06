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
import { NzDividerModule } from 'ng-zorro-antd/divider';
import { NzPopconfirmModule } from 'ng-zorro-antd/popconfirm';
import { NzTagModule } from 'ng-zorro-antd/tag';
import { NzRadioModule } from 'ng-zorro-antd/radio';
import { NzMessageService } from 'ng-zorro-antd/message';
import { CodificationsService } from '../../services/codifications.service';
import type { Personnel, ServiceCodif } from '../../models/codification.models';

@Component({
  selector: 'pli-personnels',
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
    NzDividerModule,
    NzPopconfirmModule,
    NzTagModule,
    NzRadioModule,
  ],
  templateUrl: './personnels.component.html',
  styleUrl: './personnels.component.scss',
})
export class PersonnelsComponent implements OnInit {
  private readonly service = inject(CodificationsService);
  private readonly fb = inject(FormBuilder);
  private readonly msg = inject(NzMessageService);
  private readonly destroyRef = inject(DestroyRef);

  protected readonly allItems = signal<Personnel[]>([]);
  protected readonly items = signal<Personnel[]>([]);
  protected readonly isLoading = signal(false);
  protected readonly isSaving = signal(false);
  protected readonly drawerVisible = signal(false);
  protected readonly editingItem = signal<Personnel | null>(null);
  protected readonly services = signal<ServiceCodif[]>([]);

  // ── Service change panel ───────────────────────────────────────────────────
  private originalServiceId: number | null | undefined = null;
  protected readonly showServiceChange = signal(false);

  protected serviceChangeForm = this.fb.group({
    transfertEncours:   ['SUIVENT', Validators.required],
    gestionProtections: ['LAISSER', Validators.required],
  });

  // ── Password visibility ────────────────────────────────────────────────────
  protected readonly passwordVisible = signal(false);

  // ── Mail connection test ───────────────────────────────────────────────────
  protected readonly testingPop = signal(false);
  protected readonly testingSmtp = signal(false);
  protected readonly popTestResult = signal<'success' | 'error' | null>(null);
  protected readonly smtpTestResult = signal<'success' | 'error' | null>(null);

  protected searchModel = '';
  protected filtreActif = 'TOUS';
  private readonly search$ = new Subject<string>();

  protected readonly filtreOptions = [
    { value: 'TOUS',    label: 'Tous' },
    { value: 'ACTIFS',  label: 'Actifs' },
    { value: 'INACTIFS', label: 'Inactifs' },
  ];

  protected form = this.fb.group({
    // Identification
    nom:        ['', [Validators.required, Validators.maxLength(250)]],
    prenom:     ['', [Validators.required, Validators.maxLength(250)]],
    login:      ['', [Validators.required, Validators.maxLength(250)]],
    motDePasse: [''],
    serviceId:  [null as number | null],
    email:      ['', Validators.maxLength(250)],
    // Type flags
    estBalService: [false],
    estListe:      [false],
    estResponsable: [false],
    estBal:        [false],
    estAgent:      [false],
    // Autorisations
    actif:                   [true],
    connecte:                [false],
    admin:                   [false],
    lectureSeule:            [false],
    parDefaut:               [false],
    fonctionsAvancees:       [false],
    adminMaqPubliques:       [false],
    adminMaqServices:        [false],
    creationClasseur:        [false],
    creationPersonne:        [false],
    creationOrganisme:       [false],
    droitSuppression:        [false],
    modifHierarchie:         [false],
    voitBalService:          [false],
    droitSuppressionSas:     [false],
    nonEnvoiCourrielSuiveuse: [false],
    droitProtocole:          [false],
    modifInfosSpecifiques:   [false],
    // POP
    popActif:     [false],
    popCompte:    [''],
    popServeur:   [''],
    popMotDePasse: [''],
    voirSas:      [false],
    // SMTP
    smtpCompte:    [''],
    smtpMotDePasse: [''],
    // Triplet
    tripletNom:        [''],
    tripletPrenom:     [''],
    tripletFonction:   [''],
    tripletOrganisme:  [''],
  });

  ngOnInit(): void {
    this.loadData();
    this.loadServices();
    this.search$.pipe(
      debounceTime(250),
      distinctUntilChanged(),
      takeUntilDestroyed(this.destroyRef),
    ).subscribe(() => this.applyFilter());

    // Watch serviceId changes to show/hide service change panel
    this.form.get('serviceId')!.valueChanges.pipe(
      takeUntilDestroyed(this.destroyRef),
    ).subscribe((val) => {
      if (this.editingItem() !== null) {
        this.showServiceChange.set(val !== this.originalServiceId);
      }
    });
  }

  private loadData(): void {
    this.isLoading.set(true);
    this.service.getPersonnels()
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (data) => {
          this.allItems.set(data);
          this.applyFilter();
          this.isLoading.set(false);
        },
        error: () => { this.isLoading.set(false); this.msg.error('Erreur lors du chargement.'); },
      });
  }

  private loadServices(): void {
    this.service.getServices()
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({ next: (data) => this.services.set(data) });
  }

  private applyFilter(): void {
    const q = this.searchModel.trim().toLowerCase();
    let data = this.allItems();
    if (q) data = data.filter((p) =>
      p.nom.toLowerCase().includes(q) || p.prenom.toLowerCase().includes(q) || p.login.toLowerCase().includes(q)
    );
    if (this.filtreActif === 'ACTIFS')   data = data.filter((p) => p.actif);
    if (this.filtreActif === 'INACTIFS') data = data.filter((p) => !p.actif);
    this.items.set(data);
  }

  protected onSearch(v: string): void { this.search$.next(v); }
  protected onFiltreChange(): void { this.applyFilter(); }

  protected openAdd(): void {
    this.editingItem.set(null);
    this.showServiceChange.set(false);
    this.originalServiceId = null;
    this.passwordVisible.set(false);
    this.form.reset({
      actif: true, connecte: false, admin: false, lectureSeule: false, parDefaut: false,
      fonctionsAvancees: false, adminMaqPubliques: false, adminMaqServices: false,
      creationClasseur: false, creationPersonne: false, creationOrganisme: false,
      droitSuppression: false, modifHierarchie: false, voitBalService: false,
      droitSuppressionSas: false, nonEnvoiCourrielSuiveuse: false, droitProtocole: false,
      modifInfosSpecifiques: false, estBalService: false, estListe: false,
      estResponsable: false, estBal: false, estAgent: true, popActif: false, voirSas: false,
    });
    this.drawerVisible.set(true);
  }

  protected openEdit(item: Personnel): void {
    this.editingItem.set(item);
    this.originalServiceId = item.serviceId;
    this.showServiceChange.set(false);
    this.passwordVisible.set(false);
    this.serviceChangeForm.reset({ transfertEncours: 'SUIVENT', gestionProtections: 'LAISSER' });
    this.form.patchValue({ ...item });
    this.drawerVisible.set(true);
  }

  protected cancelServiceChange(): void {
    this.form.patchValue({ serviceId: this.originalServiceId ?? null });
    this.showServiceChange.set(false);
    this.serviceChangeForm.reset({ transfertEncours: 'SUIVENT', gestionProtections: 'LAISSER' });
  }

  protected saveDrawer(): void {
    if (this.form.invalid || (this.showServiceChange() && this.serviceChangeForm.invalid)) {
      this.form.markAllAsTouched();
      this.serviceChangeForm.markAllAsTouched();
      return;
    }
    this.isSaving.set(true);
    const body = this.form.value as Partial<Personnel>;
    if (this.showServiceChange() && this.editingItem()) {
      (body as Partial<Personnel> & { serviceChange?: unknown }).serviceChange = this.serviceChangeForm.value;
    }
    const editing = this.editingItem();
    const obs = editing
      ? this.service.updatePersonnel(editing.id, body)
      : this.service.createPersonnel(body);

    obs.pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
      next: () => {
        this.isSaving.set(false);
        this.drawerVisible.set(false);
        this.msg.success(editing ? 'Personnel modifié.' : 'Personnel ajouté.');
        this.loadData();
      },
      error: () => { this.isSaving.set(false); this.msg.error('Erreur lors de l\'enregistrement.'); },
    });
  }

  protected confirmDelete(id: number): void {
    this.service.deletePersonnel(id)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: () => { this.msg.success('Personnel supprimé.'); this.loadData(); },
        error: () => this.msg.error('Impossible de supprimer ce personnel.'),
      });
  }

  /** Derive initials for avatar */
  protected getInitials(item: Personnel): string {
    const n = (item.nom ?? '').charAt(0);
    const p = (item.prenom ?? '').charAt(0);
    return (n + p).toUpperCase();
  }

  protected get drawerTitle(): string {
    const e = this.editingItem();
    return e ? `Modifier — ${e.nom} ${e.prenom}` : 'Nouveau personnel';
  }

  protected get popActif(): boolean { return !!this.form.value.popActif; }

  // ── Live identity preview (updates as user types) ─────────────────────────

  protected get previewInitials(): string {
    const n = (this.form.value.nom ?? '').charAt(0);
    const p = (this.form.value.prenom ?? '').charAt(0);
    return (n + p).toUpperCase() || '?';
  }

  protected get previewName(): string {
    const n = this.form.value.nom?.trim() ?? '';
    const p = this.form.value.prenom?.trim() ?? '';
    return `${n} ${p}`.trim() || 'Nouveau personnel';
  }

  protected get previewLogin(): string {
    return this.form.value.login?.trim() ?? '';
  }

  // ── Password strength ──────────────────────────────────────────────────────

  protected get passwordRules(): { label: string; met: boolean }[] {
    const v = this.form.value.motDePasse ?? '';
    return [
      { label: 'Au moins 8 caractères',  met: v.length >= 8 },
      { label: 'Une lettre majuscule',   met: /[A-Z]/.test(v) },
      { label: 'Une lettre minuscule',   met: /[a-z]/.test(v) },
      { label: 'Un chiffre',             met: /\d/.test(v) },
      { label: 'Un caractère spécial',   met: /[^A-Za-z0-9]/.test(v) },
    ];
  }

  protected get passwordStrength(): number {
    return this.passwordRules.filter(r => r.met).length;
  }

  protected getStrengthClass(segment: number): string {
    const s = this.passwordStrength;
    if (segment > s) return 'empty';
    if (s <= 1) return 'weak';
    if (s <= 2) return 'fair';
    if (s <= 3) return 'good';
    if (s <= 4) return 'strong';
    return 'perfect';
  }

  protected get passwordStrengthLabel(): string {
    const labels = ['', 'Très faible', 'Faible', 'Moyen', 'Fort', 'Très fort'];
    return labels[this.passwordStrength] ?? '';
  }

  // ── Mail connection test ───────────────────────────────────────────────────

  protected testPopConnection(): void {
    this.testingPop.set(true);
    this.popTestResult.set(null);
    this.service.testMailConnection('pop', {
      compte:     this.form.value.popCompte    ?? '',
      serveur:    this.form.value.popServeur   ?? '',
      motDePasse: this.form.value.popMotDePasse ?? '',
    }).pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
      next:  () => { this.testingPop.set(false); this.popTestResult.set('success'); },
      error: () => { this.testingPop.set(false); this.popTestResult.set('error'); },
    });
  }

  protected testSmtpConnection(): void {
    this.testingSmtp.set(true);
    this.smtpTestResult.set(null);
    this.service.testMailConnection('smtp', {
      compte:     this.form.value.smtpCompte    ?? '',
      motDePasse: this.form.value.smtpMotDePasse ?? '',
    }).pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
      next:  () => { this.testingSmtp.set(false); this.smtpTestResult.set('success'); },
      error: () => { this.testingSmtp.set(false); this.smtpTestResult.set('error'); },
    });
  }
}
