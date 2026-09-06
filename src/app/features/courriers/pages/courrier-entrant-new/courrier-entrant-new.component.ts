import {
  Component,
  OnInit,
  inject,
  signal,
  computed,
  DestroyRef,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterModule } from '@angular/router';
import {
  ReactiveFormsModule,
  FormsModule,
  FormBuilder,
  Validators,
} from '@angular/forms';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { debounceTime, distinctUntilChanged, Subject, switchMap, of } from 'rxjs';
import { NzFormModule } from 'ng-zorro-antd/form';
import { NzInputModule } from 'ng-zorro-antd/input';
import { NzSelectModule } from 'ng-zorro-antd/select';
import { NzDatePickerModule } from 'ng-zorro-antd/date-picker';
import { NzIconModule } from 'ng-zorro-antd/icon';
import { NzUploadModule } from 'ng-zorro-antd/upload';
import type { NzUploadChangeParam } from 'ng-zorro-antd/upload';
import { NzSwitchModule } from 'ng-zorro-antd/switch';
import { NzCheckboxModule } from 'ng-zorro-antd/checkbox';
import { NzRadioModule } from 'ng-zorro-antd/radio';
import { CourriersService } from '../../services/courriers.service';
import type { Action, ChronoType, Criticite, Nature, Priorite, Personnel } from '../../models/action.model';
import type { CourrierEntrant } from '../../models/courrier.model';

interface TripletOption {
  id: number;
  label: string;
  details: string;
}

@Component({
  selector: 'pli-courrier-entrant-new',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    ReactiveFormsModule,
    FormsModule,
    NzFormModule,
    NzInputModule,
    NzSelectModule,
    NzDatePickerModule,
    NzIconModule,
    NzUploadModule,
    NzSwitchModule,
    NzCheckboxModule,
    NzRadioModule,
  ],
  templateUrl: './courrier-entrant-new.component.html',
  styleUrl: './courrier-entrant-new.component.scss',
})
export class CourrierEntrantNewComponent implements OnInit {
  // ── Injections ────────────────────────────────────────────────────────────
  private readonly fb = inject(FormBuilder);
  private readonly service = inject(CourriersService);
  private readonly router = inject(Router);
  private readonly destroyRef = inject(DestroyRef);

  // ── Wizard state ──────────────────────────────────────────────────────────
  protected readonly currentStep = signal(0);
  protected readonly isSubmitting = signal(false);
  protected readonly errorMsg = signal<string | null>(null);
  protected readonly createdCourrier = signal<CourrierEntrant | null>(null);

  // ── Reference data ────────────────────────────────────────────────────────
  protected readonly chronoTypes = signal<ChronoType[]>([]);
  protected readonly natures = signal<Nature[]>([]);
  protected readonly priorites = signal<Priorite[]>([]);
  protected readonly criticites = signal<Criticite[]>([]);
  protected readonly actions = signal<Action[]>([]);
  protected readonly personnel = signal<Personnel[]>([]);
  protected readonly tripletOptions = signal<TripletOption[]>([]);
  protected readonly isLoadingRef = signal(false);
  protected readonly isLoadingPersonnel = signal(false);
  protected readonly isLoadingTriplets = signal(false);

  // ── Selected reference objects (for conditional display) ─────────────────
  protected readonly selectedChronoType = signal<ChronoType | null>(null);
  protected readonly selectedAction = signal<Action | null>(null);

  // ── Typeahead subjects ────────────────────────────────────────────────────
  private readonly tripletSearch$ = new Subject<string>();
  private readonly personnelSearch$ = new Subject<string>();

  // ── Tags (mots-clés) state ────────────────────────────────────────────────
  protected readonly tags = signal<string[]>([]);
  protected readonly tagInputVisible = signal(false);
  protected readonly tagInputValue = signal('');

  // ── Pièces jointes ────────────────────────────────────────────────────────
  protected readonly uploadedFiles = signal<{ nom: string; libelle: string; type: 'PJ' | 'AR' | 'REP' | 'BOR' }[]>([]);
  protected readonly selectedFileType = signal<'PJ' | 'AR' | 'REP' | 'BOR'>('PJ');

  // ── Forms ─────────────────────────────────────────────────────────────────

  /** Step 1 — Identification */
  protected readonly step1 = this.fb.group({
    chronoTypeId:   [null as number | null, Validators.required],
    dateArrivee:    [new Date(), Validators.required],
    dateExpedition: [null as Date | null],
    dateLimite:     [null as Date | null],
    objet:          ['', [Validators.required, Validators.maxLength(255)]],
    reference:      [''],
    natureId:       [null as number | null],
    prioriteId:     [null as number | null],
    criticiteId:    [null as number | null],
    commentaire:    ['', Validators.maxLength(4000)],
    favori:         [false],
    // adresse intervention (conditional, all optional)
    adresse:        [''],
    adresse2:       [''],
    cp:             [''],
    ville:          [''],
    pays:           [''],
  });

  /** Step 2 — Expéditeur */
  protected readonly step2 = this.fb.group({
    // existing triplet
    tripletId: [null as number | null],
    // or manual entry
    useManual:         [false],
    nom:               [''],
    prenom:            [''],
    libelleFunction:   [''],
    organisme:         [''],
    email:             ['', Validators.email],
    telephone:         [''],
    ville:             [''],
    pays:              [''],
  });

  /** Step 3 — Traitement */
  protected readonly step3 = this.fb.group({
    actionId:     [null as number | null, Validators.required],
    serviceId:    [null as number | null],
    personnelId:  [null as number | null],
    dateLimite:   [null as Date | null],
    commentaire:  ['', Validators.maxLength(3500)],
  });

  // Computed helpers
  protected readonly showNature = computed(() => this.selectedChronoType()?.showNature ?? false);
  protected readonly showPriorite = computed(() => this.selectedChronoType()?.showPriorite ?? false);
  protected readonly showCriticite = computed(() => this.selectedChronoType()?.showCriticite ?? false);
  protected readonly useManualExpediteur = computed(() => !!this.step2.value.useManual);

  protected readonly step1CommentaireLength = computed(
    () => (this.step1.value.commentaire ?? '').length
  );
  protected readonly step3CommentaireLength = computed(
    () => (this.step3.value.commentaire ?? '').length
  );

  protected readonly steps = [
    { title: 'Identification', icon: 'file-text' },
    { title: 'Expéditeur',     icon: 'user'      },
    { title: 'Traitement',     icon: 'deployment-unit' },
    { title: 'Pièces jointes', icon: 'paper-clip'  },
  ];

  // ── Lifecycle ─────────────────────────────────────────────────────────────
  ngOnInit(): void {
    this.loadReferenceData();
    this.setupTypeaheads();

    // On chrono change: update selectedChronoType + auto-fill date limite
    this.step1.get('chronoTypeId')!.valueChanges
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((id) => this.onChronoChange(id));

    // On action change: auto-fill step3 date limite
    this.step3.get('actionId')!.valueChanges
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((id) => this.onActionChange(id));

    // On personnel change: auto-set serviceId from the matched personnel record
    this.step3.get('personnelId')!.valueChanges
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((id) => {
        const p = this.personnel().find((x) => x.id === id);
        if (p) this.step3.patchValue({ serviceId: p.serviceId });
      });
  }

  private loadReferenceData(): void {
    this.isLoadingRef.set(true);
    let remaining = 5;
    const done = () => { if (--remaining === 0) this.isLoadingRef.set(false); };

    this.service.getChronoTypes().pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({ next: (v) => { this.chronoTypes.set(v); done(); }, error: done });
    this.service.getNatures().pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({ next: (v) => { this.natures.set(v); done(); }, error: done });
    this.service.getPriorites().pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({ next: (v) => { this.priorites.set(v); done(); }, error: done });
    this.service.getCriticites().pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({ next: (v) => { this.criticites.set(v); done(); }, error: done });
    this.service.getActions().pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({ next: (v) => { this.actions.set(v); done(); }, error: done });
  }

  private setupTypeaheads(): void {
    this.tripletSearch$
      .pipe(
        debounceTime(300),
        distinctUntilChanged(),
        switchMap((q) => {
          if (!q || q.length < 2) return of([]);
          this.isLoadingTriplets.set(true);
          return this.service.searchTriplets(q);
        }),
        takeUntilDestroyed(this.destroyRef)
      )
      .subscribe({
        next: (opts) => { this.tripletOptions.set(opts); this.isLoadingTriplets.set(false); },
        error: () => this.isLoadingTriplets.set(false),
      });

    this.personnelSearch$
      .pipe(
        debounceTime(300),
        distinctUntilChanged(),
        switchMap((q) => {
          if (!q || q.length < 2) return of([]);
          const action = this.selectedAction();
          this.isLoadingPersonnel.set(true);
          return this.service.searchPersonnel(q, action?.destMode);
        }),
        takeUntilDestroyed(this.destroyRef)
      )
      .subscribe({
        next: (list) => { this.personnel.set(list); this.isLoadingPersonnel.set(false); },
        error: () => this.isLoadingPersonnel.set(false),
      });
  }

  private onChronoChange(id: number | null): void {
    const ct = this.chronoTypes().find((c) => c.id === id) ?? null;
    this.selectedChronoType.set(ct);

    if (ct?.nbjDtLim != null) {
      const d = new Date();
      d.setDate(d.getDate() + ct.nbjDtLim);
      this.step1.patchValue({ dateLimite: d });
    }

    // Reset conditional fields when chrono changes
    if (!ct?.showNature) this.step1.patchValue({ natureId: null });
    if (!ct?.showPriorite) this.step1.patchValue({ prioriteId: null });
  }

  private onActionChange(id: number | null): void {
    const action = this.actions().find((a) => a.id === id) ?? null;
    this.selectedAction.set(action);
    if (action?.nbjDtLim != null) {
      const d = new Date();
      d.setDate(d.getDate() + action.nbjDtLim);
      this.step3.patchValue({ dateLimite: d });
    }
    this.step3.patchValue({ personnelId: null });
    this.personnel.set([]);
  }

  /** Prevent auto-upload — we handle files manually on submit */
  protected readonly preventAutoUpload = (): boolean => false;

  protected onUploadChange(info: NzUploadChangeParam): void {
    const type = this.selectedFileType();
    this.uploadedFiles.set(
      info.fileList.map((f) => ({
        nom:     f.name,
        libelle: f.name,
        type,
      }))
    );
  }

  // ── Navigation ────────────────────────────────────────────────────────────
  protected next(): void {
    if (!this.isCurrentStepValid()) {
      this.markCurrentStepTouched();
      return;
    }
    if (this.currentStep() < this.steps.length - 1) {
      this.currentStep.update((s) => s + 1);
    }
  }

  protected prev(): void {
    if (this.currentStep() > 0) {
      this.currentStep.update((s) => s - 1);
    }
  }

  private isCurrentStepValid(): boolean {
    switch (this.currentStep()) {
      case 0: return this.step1.valid;
      case 1: return true; // expéditeur is optional
      case 2: return this.step3.valid;
      case 3: return true; // PJ optional
      default: return true;
    }
  }

  private markCurrentStepTouched(): void {
    switch (this.currentStep()) {
      case 0: this.step1.markAllAsTouched(); break;
      case 2: this.step3.markAllAsTouched(); break;
    }
  }

  // ── Tags ──────────────────────────────────────────────────────────────────
  protected addTag(value: string): void {
    const v = value.trim();
    if (v && !this.tags().includes(v)) {
      this.tags.update((tags) => [...tags, v]);
    }
    this.tagInputValue.set('');
    this.tagInputVisible.set(false);
  }

  protected removeTag(tag: string): void {
    this.tags.update((tags) => tags.filter((t) => t !== tag));
  }

  // ── Typeahead handlers ────────────────────────────────────────────────────
  protected onTripletSearch(q: string): void { this.tripletSearch$.next(q); }
  protected onPersonnelSearch(q: string): void { this.personnelSearch$.next(q); }

  // ── Submit ────────────────────────────────────────────────────────────────
  protected submit(): void {
    if (this.isSubmitting()) return;

    const s1 = this.step1.value;
    const s2 = this.step2.value;
    const s3 = this.step3.value;

    const payload = {
      chronoTypeId:    s1.chronoTypeId!,
      dateArrivee:     (s1.dateArrivee instanceof Date ? s1.dateArrivee : new Date()).toISOString().split('T')[0],
      dateExpedition:  s1.dateExpedition ? s1.dateExpedition.toISOString().split('T')[0] : undefined,
      dateLimite:      s1.dateLimite ? s1.dateLimite.toISOString().split('T')[0] : undefined,
      objet:           s1.objet!,
      reference:       s1.reference || undefined,
      tags:            this.tags().join(',') || undefined,
      commentaire:     s1.commentaire || undefined,
      favori:          s1.favori || undefined,
      criticiteId:     s1.criticiteId ?? undefined,
      natureId:        s1.natureId ?? undefined,
      prioriteId:      s1.prioriteId ?? undefined,
      adresseIntervention: (s1.adresse || s1.adresse2 || s1.cp || s1.ville)
        ? { adresse: s1.adresse || undefined, adresse2: s1.adresse2 || undefined,
            cp: s1.cp || undefined, ville: s1.ville || undefined, pays: s1.pays || undefined }
        : undefined,
      tripletId:       !s2.useManual ? (s2.tripletId ?? undefined) : undefined,
      expediteurManuel: s2.useManual
        ? { nom: s2.nom!, prenom: s2.prenom || undefined, libelleFunction: s2.libelleFunction || undefined,
            organisme: s2.organisme || undefined, email: s2.email || undefined, telephone: s2.telephone || undefined,
            ville: s2.ville || undefined, pays: s2.pays || undefined }
        : undefined,
      traitement: {
        actionId:    s3.actionId!,
        serviceId:   s3.serviceId ?? undefined,
        personnelId: s3.personnelId ?? undefined,
        dateLimite:  s3.dateLimite ? s3.dateLimite.toISOString().split('T')[0] : undefined,
        commentaire: s3.commentaire || undefined,
      },
      piecesJointes: this.uploadedFiles().length > 0 ? this.uploadedFiles() : undefined,
    };

    this.isSubmitting.set(true);
    this.errorMsg.set(null);

    this.service
      .createCourrierEntrant(payload)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (courrier) => {
          this.createdCourrier.set(courrier);
          this.isSubmitting.set(false);
          this.currentStep.set(4); // success screen
        },
        error: (err: Error) => {
          this.errorMsg.set(err.message ?? 'Une erreur est survenue');
          this.isSubmitting.set(false);
        },
      });
  }

  protected goToList(): void {
    this.router.navigate(['/courriers/entrant']);
  }

  protected goToDetail(): void {
    const id = this.createdCourrier()?.id;
    if (id) this.router.navigate(['/courriers/entrant', id]);
  }
}
