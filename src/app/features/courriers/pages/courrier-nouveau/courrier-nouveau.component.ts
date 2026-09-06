import {
  Component, OnInit, OnDestroy, inject, signal, computed,
  DestroyRef, ViewChildren, QueryList, ElementRef, AfterViewInit,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, ActivatedRoute, Router } from '@angular/router';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { Subject } from 'rxjs';
import { debounceTime, distinctUntilChanged, switchMap, tap } from 'rxjs/operators';
import { NzFormModule } from 'ng-zorro-antd/form';
import { NzInputModule } from 'ng-zorro-antd/input';
import { NzButtonModule } from 'ng-zorro-antd/button';
import { NzSelectModule } from 'ng-zorro-antd/select';
import { NzDatePickerModule } from 'ng-zorro-antd/date-picker';
import { NzIconModule } from 'ng-zorro-antd/icon';
import { NzTagModule } from 'ng-zorro-antd/tag';
import { NzMessageService } from 'ng-zorro-antd/message';
import { NzSpinModule } from 'ng-zorro-antd/spin';
import { NzUploadModule } from 'ng-zorro-antd/upload';
import { NzTooltipModule } from 'ng-zorro-antd/tooltip';
import { CourriersService } from '../../services/courriers.service';
import { ChampSpecRendererComponent } from '../../components/champ-spec-renderer/champ-spec-renderer.component';
import { MaquetteDocumentPanelComponent } from '../../components/maquette-document-panel/maquette-document-panel.component';
import type { CourrierListConfig, CourrierType, CreateCourrierRequest, DocumentLie } from '../../models/courrier.model';
import { COURRIER_LIST_CONFIG } from '../../models/courrier.model';
import type { ChampSpec } from '../../../administration/models/administration.models';
import type { Action, ChronoType, Nature, Priorite, Personnel } from '../../models/action.model';

@Component({
  selector: 'pli-courrier-nouveau',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    ReactiveFormsModule,
    NzFormModule,
    NzInputModule,
    NzButtonModule,
    NzSelectModule,
    NzDatePickerModule,
    NzIconModule,
    NzTagModule,
    NzSpinModule,
    NzUploadModule,
    NzTooltipModule,
    ChampSpecRendererComponent,
    MaquetteDocumentPanelComponent,
  ],
  templateUrl: './courrier-nouveau.component.html',
  styleUrl:    './courrier-nouveau.component.scss',
})
export class CourrierNouveauComponent implements OnInit, AfterViewInit, OnDestroy {
  private readonly service    = inject(CourriersService);
  private readonly route      = inject(ActivatedRoute);
  private readonly router     = inject(Router);
  private readonly fb         = inject(FormBuilder);
  private readonly message    = inject(NzMessageService);
  private readonly destroyRef = inject(DestroyRef);

  // ── Config per courrier type ───────────────────────────────────────────────
  protected readonly config = signal<CourrierListConfig>(COURRIER_LIST_CONFIG['entrant']);

  // ── Reference data ─────────────────────────────────────────────────────────
  protected readonly chronoTypes  = signal<ChronoType[]>([]);
  protected readonly natures      = signal<Nature[]>([]);
  protected readonly priorites    = signal<Priorite[]>([]);
  protected readonly actions      = signal<Action[]>([]);
  protected readonly champSpecs   = signal<ChampSpec[]>([]);

  protected readonly selectedChronoType = signal<ChronoType | null>(null);
  protected readonly selectedAction     = signal<Action | null>(null);

  // ── Typeaheads ─────────────────────────────────────────────────────────────
  protected readonly tripletResults   = signal<{ id: number; label: string; details: string }[]>([]);
  protected readonly personnelResults = signal<Personnel[]>([]);
  protected readonly tripletLoading   = signal(false);
  protected readonly personnelLoading = signal(false);

  private readonly tripletSearch$   = new Subject<string>();
  private readonly personnelSearch$ = new Subject<string>();

  // ── Form state ─────────────────────────────────────────────────────────────
  protected readonly useManualExpediteur = signal(false);
  protected readonly tagInput = signal('');
  protected readonly tags = signal<string[]>([]);

  // ── Navigator (IntersectionObserver) ──────────────────────────────────────
  protected readonly activeCardIndex = signal(0);
  private observer: IntersectionObserver | null = null;
  @ViewChildren('cardAnchor') cardRefs!: QueryList<ElementRef>;

  // ── Documents & attachments ────────────────────────────────────────────────
  protected readonly documents = signal<DocumentLie[]>([]);
  protected readonly fileList  = signal<File[]>([]);

  // ── Submission state ───────────────────────────────────────────────────────
  protected readonly submitting = signal(false);

  // ── Cards metadata ─────────────────────────────────────────────────────────
  readonly CARDS = [
    { title: 'Identification',  icon: 'file-text'  },
    { title: 'Expéditeur',      icon: 'user'        },
    { title: 'Traitement',      icon: 'apartment'   },
    { title: 'Documents liés',  icon: 'file-done'   },
    { title: 'Pièces jointes',  icon: 'paper-clip'  },
  ];

  // ── Forms ──────────────────────────────────────────────────────────────────
  protected readonly identificationForm: FormGroup = this.fb.group({
    chronoTypeId:   [null, Validators.required],
    dateArrivee:    [null, Validators.required],
    objet:          ['',   Validators.required],
    dateExpedition: [null],
    dateLimite:     [null],
    reference:      [''],
    natureId:       [null],
    prioriteId:     [null],
    commentaire:    [''],
    adresse:        [''],
    cp:             [''],
    ville:          [''],
    pays:           [''],
  });

  protected readonly expediteurForm: FormGroup = this.fb.group({
    tripletId:    [null],
    nom:          [''],
    prenom:       [''],
    organisme:    [''],
    fonction:     [''],
    email:        [''],
    telephone:    [''],
  });

  protected readonly traitementForm: FormGroup = this.fb.group({
    actionId:    [null, Validators.required],
    personnelId: [null],
    serviceId:   [null],
    dateLimite:  [null],
    commentaire: [''],
  });

  // ── Computed card completion states ────────────────────────────────────────
  protected readonly cardStates = computed<('incomplete' | 'complete' | 'optional')[]>(() => [
    this.identificationForm.valid ? 'complete' : 'incomplete',
    (this.expediteurForm.value['tripletId'] || this.useManualExpediteur()) ? 'complete' : 'optional',
    this.traitementForm.valid ? 'complete' : 'incomplete',
    this.documents().length > 0 ? 'complete' : 'optional',
    this.fileList().length > 0 ? 'complete' : 'optional',
  ]);

  protected readonly formSnapshot = computed<Partial<CreateCourrierRequest>>(() => {
    const iVal = this.identificationForm.value;
    const eVal = this.expediteurForm.value;
    const snap: Partial<CreateCourrierRequest> = {
      objet: iVal['objet'] || undefined,
      dateArrivee: iVal['dateArrivee']
        ? new Date(iVal['dateArrivee']).toISOString().split('T')[0]
        : undefined,
    };
    if (this.useManualExpediteur() && (eVal['nom'] || eVal['prenom'])) {
      snap.expediteurManuel = {
        nom: eVal['nom'] || '',
        prenom: eVal['prenom'] || undefined,
      };
    }
    return snap;
  });

  // ── Derived helpers ────────────────────────────────────────────────────────
  protected get backRoute(): string {
    return `/courriers/${this.config().type}`;
  }

  protected get showNature(): boolean {
    return this.selectedChronoType()?.showNature ?? false;
  }

  protected get showPriorite(): boolean {
    return this.selectedChronoType()?.showPriorite ?? false;
  }

  // ── Lifecycle ──────────────────────────────────────────────────────────────
  ngOnInit(): void {
    const type = (this.route.snapshot.data['courrierType'] as CourrierType) ?? 'entrant';
    this.config.set(COURRIER_LIST_CONFIG[type]);

    // Load reference data
    this.service.getChronoTypes().subscribe(v => this.chronoTypes.set(v));
    this.service.getNatures().subscribe(v => this.natures.set(v));
    this.service.getPriorites().subscribe(v => this.priorites.set(v));
    this.service.getActions().subscribe(v => this.actions.set(v));

    // Load ChampSpec for this courrier type
    this.service.getChampSpecPourCourrier(this.config().pageSpecNom).subscribe(champs => {
      const visible = champs.filter(c => c.visible).sort((a, b) => a.ordre - b.ordre);
      this.champSpecs.set(visible);
      visible.forEach(c => {
        const validators = c.obligatoire ? [Validators.required] : [];
        this.identificationForm.addControl(`spec_${c.nom}`, this.fb.control(c.valeurDefaut ?? '', validators));
      });
    });

    // Triplet typeahead
    this.tripletSearch$.pipe(
      debounceTime(300),
      distinctUntilChanged(),
      tap(() => this.tripletLoading.set(true)),
      switchMap(q => this.service.searchTriplets(q)),
      takeUntilDestroyed(this.destroyRef),
    ).subscribe(results => {
      this.tripletResults.set(results);
      this.tripletLoading.set(false);
    });

    // Personnel typeahead
    this.personnelSearch$.pipe(
      debounceTime(300),
      distinctUntilChanged(),
      tap(() => this.personnelLoading.set(true)),
      switchMap(q => {
        const mode = this.selectedAction()?.destMode;
        return this.service.searchPersonnel(q, mode);
      }),
      takeUntilDestroyed(this.destroyRef),
    ).subscribe(results => {
      this.personnelResults.set(results);
      this.personnelLoading.set(false);
    });
  }

  ngAfterViewInit(): void {
    this.cardRefs.changes
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(() => this.setupObserver());
    this.setupObserver();
  }

  ngOnDestroy(): void {
    this.observer?.disconnect();
  }

  // ── IntersectionObserver for active card ──────────────────────────────────
  private setupObserver(): void {
    this.observer?.disconnect();
    const elements = this.cardRefs.toArray().map(r => r.nativeElement as HTMLElement);
    if (!elements.length) return;
    this.observer = new IntersectionObserver(
      entries => {
        for (const entry of entries) {
          if (entry.isIntersecting) {
            const idx = elements.indexOf(entry.target as HTMLElement);
            if (idx >= 0) this.activeCardIndex.set(idx);
          }
        }
      },
      { threshold: 0.3 }
    );
    elements.forEach(el => this.observer!.observe(el));
  }

  protected scrollToCard(idx: number): void {
    const el = this.cardRefs.toArray()[idx]?.nativeElement as HTMLElement;
    el?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    this.activeCardIndex.set(idx);
  }

  // ── Event handlers ─────────────────────────────────────────────────────────
  protected onChronoChange(id: number): void {
    const ct = this.chronoTypes().find(c => c.id === id) ?? null;
    this.selectedChronoType.set(ct);
    if (ct?.nbjDtLim && this.identificationForm.value['dateArrivee']) {
      const limit = new Date(this.identificationForm.value['dateArrivee']);
      limit.setDate(limit.getDate() + ct.nbjDtLim);
      this.identificationForm.patchValue({ dateLimite: limit });
    }
  }

  protected onActionChange(id: number): void {
    const action = this.actions().find(a => a.id === id) ?? null;
    this.selectedAction.set(action);
    this.traitementForm.patchValue({ personnelId: null, serviceId: null });
    if (action?.nbjDtLim && this.identificationForm.value['dateArrivee']) {
      const limit = new Date(this.identificationForm.value['dateArrivee']);
      limit.setDate(limit.getDate() + action.nbjDtLim);
      this.traitementForm.patchValue({ dateLimite: limit });
    }
  }

  protected onPersonnelSelect(personnelId: number): void {
    const p = this.personnelResults().find(x => x.id === personnelId);
    if (p?.serviceId) this.traitementForm.patchValue({ serviceId: p.serviceId });
  }

  protected searchTriplets(q: string): void {
    if (q.length >= 2) this.tripletSearch$.next(q);
  }

  protected searchPersonnel(q: string): void {
    if (q.length >= 2) this.personnelSearch$.next(q);
  }

  protected addTag(): void {
    const v = this.tagInput().trim();
    if (v && !this.tags().includes(v)) this.tags.set([...this.tags(), v]);
    this.tagInput.set('');
  }

  protected removeTag(tag: string): void {
    this.tags.set(this.tags().filter(t => t !== tag));
  }

  protected onDocumentsChange(docs: DocumentLie[]): void {
    this.documents.set(docs);
  }

  /** Filter option for nz-select typeaheads — always return true (server-side filtering) */
  protected readonly noFilter = (): boolean => true;
  /** Before-upload handler — prevent automatic upload */
  protected readonly noop = (): boolean => false;

  // ── Submit ────────────────────────────────────────────────────────────────
  protected submit(): void {
    this.identificationForm.markAllAsTouched();
    this.traitementForm.markAllAsTouched();

    if (this.identificationForm.invalid || this.traitementForm.invalid) {
      this.message.warning('Veuillez compléter les champs obligatoires');
      return;
    }

    this.submitting.set(true);

    const iVal = this.identificationForm.value;
    const tVal = this.traitementForm.value;
    const eVal = this.expediteurForm.value;

    // Build specifiques from ChampSpec controls
    const specifiques: Record<string, unknown> = {};
    this.champSpecs().forEach(c => {
      specifiques[c.nom] = iVal[`spec_${c.nom}`];
    });

    const req: CreateCourrierRequest = {
      chronoTypeId:   iVal['chronoTypeId'],
      dateArrivee:    new Date(iVal['dateArrivee']).toISOString().split('T')[0],
      objet:          iVal['objet'],
      dateExpedition: iVal['dateExpedition']
        ? new Date(iVal['dateExpedition']).toISOString().split('T')[0]
        : undefined,
      dateLimite: iVal['dateLimite']
        ? new Date(iVal['dateLimite']).toISOString().split('T')[0]
        : undefined,
      reference:    iVal['reference'] || undefined,
      tags:         this.tags().join(',') || undefined,
      commentaire:  iVal['commentaire'] || undefined,
      natureId:     iVal['natureId'] || undefined,
      prioriteId:   iVal['prioriteId'] || undefined,
      adresseIntervention: (iVal['adresse'] || iVal['cp'] || iVal['ville'])
        ? { adresse: iVal['adresse'], cp: iVal['cp'], ville: iVal['ville'], pays: iVal['pays'] }
        : undefined,
      tripletId: !this.useManualExpediteur() && eVal['tripletId'] ? eVal['tripletId'] : undefined,
      expediteurManuel: this.useManualExpediteur() ? {
        nom:       eVal['nom'],
        prenom:    eVal['prenom'] || undefined,
        organisme: eVal['organisme'] || undefined,
        libelleFunction: eVal['fonction'] || undefined,
        email:     eVal['email'] || undefined,
        telephone: eVal['telephone'] || undefined,
      } : undefined,
      traitement: {
        actionId:    tVal['actionId'],
        personnelId: tVal['personnelId'] || undefined,
        serviceId:   tVal['serviceId'] || undefined,
        dateLimite:  tVal['dateLimite']
          ? new Date(tVal['dateLimite']).toISOString().split('T')[0]
          : undefined,
        commentaire: tVal['commentaire'] || undefined,
      },
      specifiques: Object.keys(specifiques).length ? specifiques : undefined,
      documentsLies: this.documents().length ? this.documents() : undefined,
    };

    const type = this.config().type;
    const call = type === 'sortant'
      ? this.service.createCourrierSortant(req)
      : type === 'interne'
        ? this.service.createCourrierInterne(req)
        : this.service.createCourrierEntrant(req);

    call.subscribe({
      next: () => {
        this.message.success('Courrier enregistré avec succès');
        this.router.navigate([`/courriers/${type}`]);
      },
      error: () => {
        this.message.error("Erreur lors de l'enregistrement");
        this.submitting.set(false);
      },
    });
  }
}
