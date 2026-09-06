import {
  Component,
  inject,
  OnInit,
  signal,
  computed,
  DestroyRef,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { switchMap } from 'rxjs';
import { NzButtonModule } from 'ng-zorro-antd/button';
import { NzInputModule } from 'ng-zorro-antd/input';
import { NzTagModule } from 'ng-zorro-antd/tag';
import { NzDrawerModule } from 'ng-zorro-antd/drawer';
import { NzFormModule } from 'ng-zorro-antd/form';
import { NzSelectModule } from 'ng-zorro-antd/select';
import { NzIconModule } from 'ng-zorro-antd/icon';
import { NzSpinModule } from 'ng-zorro-antd/spin';
import { NzMessageService } from 'ng-zorro-antd/message';
import { NzTooltipModule } from 'ng-zorro-antd/tooltip';
import { FormsModule } from '@angular/forms';
import { DemandesStore } from '../../state/demandes.store';
import { DemandesService } from '../../services/demandes.service';
import type { Demande, DemandeStatus, DemandeType, DemandePriorite } from '../../models/demande.model';

@Component({
  selector: 'pli-demande-detail',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    NzButtonModule,
    NzInputModule,
    NzTagModule,
    NzDrawerModule,
    NzFormModule,
    NzSelectModule,
    NzIconModule,
    NzSpinModule,
    NzTooltipModule,
  ],
  templateUrl: './demande-detail.component.html',
  styleUrls: ['./demande-detail.component.scss'],
})
export class DemandeDetailComponent implements OnInit {
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly fb = inject(FormBuilder);
  private readonly message = inject(NzMessageService);
  private readonly service = inject(DemandesService);
  private readonly destroyRef = inject(DestroyRef);
  protected readonly store = inject(DemandesStore);

  protected demande = signal<Demande | null>(null);
  protected isLoading = signal(true);

  // ── Drawers ──────────────────────────────────────────────────
  protected traiterDrawerVisible = signal(false);
  protected repondreDrawerVisible = signal(false);

  // ── Traiter form ─────────────────────────────────────────────
  protected readonly traiterForm = this.fb.group({
    nature: ['', Validators.required],
    service: ['', Validators.required],
    priorite: ['normale' as DemandePriorite, Validators.required],
    commentaire: [''],
  });

  // ── Répondre form ────────────────────────────────────────────
  protected readonly repondreForm = this.fb.group({
    corps: ['', [Validators.required, Validators.minLength(10)]],
  });

  // ── Navigation: prev / next ──────────────────────────────────
  protected readonly currentIndex = computed(() => {
    const dem = this.demande();
    if (!dem) return -1;
    return this.store.filteredItems().findIndex((d) => d.id === dem.id);
  });

  protected readonly hasPrev = computed(() => this.currentIndex() > 0);
  protected readonly hasNext = computed(
    () => this.currentIndex() < this.store.filteredItems().length - 1
  );

  protected readonly prevId = computed(() => {
    const idx = this.currentIndex();
    return idx > 0 ? this.store.filteredItems()[idx - 1].id : null;
  });

  protected readonly nextId = computed(() => {
    const idx = this.currentIndex();
    const items = this.store.filteredItems();
    return idx >= 0 && idx < items.length - 1 ? items[idx + 1].id : null;
  });

  // ── Static data ──────────────────────────────────────────────
  protected readonly natures = [
    'Renseignement', 'Réclamation', 'Signalement', 'Demande de document',
    'Demande de rendez-vous', 'Autre',
  ];

  protected readonly services = [
    'Accueil général', 'État civil', 'Urbanisme', 'Culture', 'Sport',
    'Collecte & Propreté', 'Direction générale',
  ];

  protected readonly priorites: { value: DemandePriorite; label: string; desc: string; icon: string }[] = [
    { value: 'normale', label: 'Normale', desc: 'Traitement standard', icon: 'check-circle' },
    { value: 'urgente', label: 'Urgente', desc: 'Traiter sous 24h', icon: 'clock-circle' },
    { value: 'bloquante', label: 'Bloquante', desc: 'Action immédiate', icon: 'warning' },
  ];

  ngOnInit(): void {
    // Load list if not yet loaded (direct URL access)
    if (this.store.items().length === 0) {
      this.store.loadList();
    }

    this.route.paramMap
      .pipe(
        takeUntilDestroyed(this.destroyRef),
        switchMap((params) => {
          const id = Number(params.get('id'));
          this.isLoading.set(true);
          return this.service.getById(id);
        })
      )
      .subscribe({
        next: (dem) => {
          this.demande.set(dem);
          this.isLoading.set(false);
        },
        error: () => {
          this.isLoading.set(false);
          this.message.error('Demande introuvable');
          this.router.navigate(['/demandes']);
        },
      });
  }

  protected goBack(): void {
    this.router.navigate(['/demandes']);
  }

  protected goToPrev(): void {
    const id = this.prevId();
    if (id) this.router.navigate(['/demandes', id]);
  }

  protected goToNext(): void {
    const id = this.nextId();
    if (id) this.router.navigate(['/demandes', id]);
  }

  // ── Traiter ──────────────────────────────────────────────────
  protected openTraiter(): void {
    this.traiterForm.reset({ nature: '', service: '', priorite: 'normale', commentaire: '' });
    this.traiterDrawerVisible.set(true);
  }

  protected closeTraiter(): void {
    this.traiterDrawerVisible.set(false);
  }

  protected confirmTraiter(): void {
    if (this.traiterForm.invalid) {
      this.traiterForm.markAllAsTouched();
      return;
    }
    const dem = this.demande();
    if (!dem) return;
    const v = this.traiterForm.getRawValue();
    this.store.traiter({
      demandeId: dem.id,
      nature: v.nature!,
      service: v.service!,
      priorite: v.priorite!,
      commentaire: v.commentaire ?? undefined,
    });
    // Reload detail from store after save
    setTimeout(() => {
      const updated = this.store.items().find((d) => d.id === dem.id);
      if (updated) this.demande.set(updated);
    }, 500);
    this.closeTraiter();
    this.message.success('Demande transmise au service concerné');
  }

  // ── Répondre ─────────────────────────────────────────────────
  protected openRepondre(): void {
    this.repondreForm.reset({ corps: '' });
    this.repondreDrawerVisible.set(true);
  }

  protected closeRepondre(): void {
    this.repondreDrawerVisible.set(false);
  }

  protected sendReponse(): void {
    if (this.repondreForm.invalid) {
      this.repondreForm.markAllAsTouched();
      return;
    }
    const dem = this.demande();
    if (!dem) return;
    this.store.repondre({
      demandeId: dem.id,
      corps: this.repondreForm.get('corps')!.value!,
    });
    setTimeout(() => {
      const updated = this.store.items().find((d) => d.id === dem.id);
      if (updated) this.demande.set(updated);
    }, 500);
    this.closeRepondre();
    this.message.success('Réponse envoyée');
  }

  // ── Display helpers ──────────────────────────────────────────
  protected statutLabel(statut: DemandeStatus): string {
    const map: Record<DemandeStatus, string> = {
      nouveau: 'Nouveau', en_cours: 'En cours', traite: 'Traité',
    };
    return map[statut];
  }

  protected typeLabel(type: DemandeType): string {
    const map: Record<DemandeType, string> = {
      mail: 'E-mail', sms: 'SMS', formulaire: 'Formulaire', guichet: 'Guichet',
    };
    return map[type];
  }

  protected typeColor(type: DemandeType): string {
    const map: Record<DemandeType, string> = {
      mail: 'blue', sms: 'purple', formulaire: 'cyan', guichet: 'orange',
    };
    return map[type];
  }

  protected typeIcon(type: DemandeType): string {
    const map: Record<DemandeType, string> = {
      mail: 'mail', sms: 'mobile', formulaire: 'form', guichet: 'user',
    };
    return map[type];
  }
}
