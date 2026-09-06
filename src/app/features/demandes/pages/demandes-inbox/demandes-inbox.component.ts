import {
  Component,
  inject,
  OnInit,
  signal,
  computed,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { NzTableModule } from 'ng-zorro-antd/table';
import { NzButtonModule } from 'ng-zorro-antd/button';
import { NzInputModule } from 'ng-zorro-antd/input';
import { NzSelectModule } from 'ng-zorro-antd/select';
import { NzTagModule } from 'ng-zorro-antd/tag';
import { NzDrawerModule } from 'ng-zorro-antd/drawer';
import { NzFormModule } from 'ng-zorro-antd/form';
import { NzTooltipModule } from 'ng-zorro-antd/tooltip';
import { NzIconModule } from 'ng-zorro-antd/icon';
import { NzMessageService } from 'ng-zorro-antd/message';
import { FormsModule } from '@angular/forms';
import { DemandesStore } from '../../state/demandes.store';
import type { Demande, DemandeStatus, DemandeType, DemandePriorite } from '../../models/demande.model';

type ActiveTab = 'tous' | DemandeStatus;

@Component({
  selector: 'pli-demandes-inbox',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    NzTableModule,
    NzButtonModule,
    NzInputModule,
    NzSelectModule,
    NzTagModule,
    NzDrawerModule,
    NzFormModule,
    NzTooltipModule,
    NzIconModule,
  ],
  templateUrl: './demandes-inbox.component.html',
  styleUrls: ['./demandes-inbox.component.scss'],
})
export class DemandesInboxComponent implements OnInit {
  private readonly router = inject(Router);
  private readonly fb = inject(FormBuilder);
  private readonly message = inject(NzMessageService);
  protected readonly store = inject(DemandesStore);

  // ── Search ───────────────────────────────────────────────────
  protected searchQuery = '';

  // ── Drawers ──────────────────────────────────────────────────
  protected traiterDrawerVisible = signal(false);
  protected repondreDrawerVisible = signal(false);
  protected activeDemande = signal<Demande | null>(null);

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

  protected reponseCharCount = computed(() => {
    return this.repondreForm.get('corps')?.value?.length ?? 0;
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
    this.store.loadList();
  }

  // ── Tab counts ───────────────────────────────────────────────
  protected tabCount(tab: ActiveTab): number {
    const counts = this.store.tabCounts();
    if (tab === 'tous') return counts.tous;
    if (tab === 'nouveau') return counts.nouveau;
    if (tab === 'en_cours') return counts.en_cours;
    if (tab === 'traite') return counts.traite;
    return 0;
  }

  protected setTab(tab: ActiveTab): void {
    this.store.setStatut(tab);
  }

  protected onSearch(q: string): void {
    this.store.setSearch(q);
  }

  // ── Navigation ───────────────────────────────────────────────
  protected openDetail(demande: Demande): void {
    this.router.navigate(['/demandes', demande.id]);
  }

  // ── Pull from POP ────────────────────────────────────────────
  protected pull(): void {
    this.store.pullFromPop();
    // Watch for result — simple approach using effect-like pattern
    const interval = setInterval(() => {
      const result = this.store.pullResult();
      if (result !== null) {
        this.store.clearPullResult();
        clearInterval(interval);
        if (result.count > 0) {
          this.message.success(`${result.count} nouvelle${result.count > 1 ? 's' : ''} demande${result.count > 1 ? 's' : ''} récupérée${result.count > 1 ? 's' : ''}`);
        } else {
          this.message.info('Aucune nouvelle demande sur le serveur');
        }
      }
    }, 300);
  }

  // ── Traiter drawer ───────────────────────────────────────────
  protected openTraiter(demande: Demande, event: Event): void {
    event.stopPropagation();
    this.activeDemande.set(demande);
    this.traiterForm.reset({ nature: '', service: '', priorite: 'normale', commentaire: '' });
    this.traiterDrawerVisible.set(true);
  }

  protected closeTraiter(): void {
    this.traiterDrawerVisible.set(false);
    this.activeDemande.set(null);
  }

  protected confirmTraiter(): void {
    if (this.traiterForm.invalid) {
      this.traiterForm.markAllAsTouched();
      return;
    }
    const demande = this.activeDemande();
    if (!demande) return;
    const v = this.traiterForm.getRawValue();
    this.store.traiter({
      demandeId: demande.id,
      nature: v.nature!,
      service: v.service!,
      priorite: v.priorite!,
      commentaire: v.commentaire ?? undefined,
    });
    this.closeTraiter();
    this.message.success('Demande transmise au service concerné');
  }

  // ── Répondre drawer ──────────────────────────────────────────
  protected openRepondre(demande: Demande, event: Event): void {
    event.stopPropagation();
    this.activeDemande.set(demande);
    this.repondreForm.reset({ corps: '' });
    this.repondreDrawerVisible.set(true);
  }

  protected closeRepondre(): void {
    this.repondreDrawerVisible.set(false);
    this.activeDemande.set(null);
  }

  protected sendReponse(): void {
    if (this.repondreForm.invalid) {
      this.repondreForm.markAllAsTouched();
      return;
    }
    const demande = this.activeDemande();
    if (!demande) return;
    this.store.repondre({
      demandeId: demande.id,
      corps: this.repondreForm.get('corps')!.value!,
    });
    this.closeRepondre();
    this.message.success('Réponse envoyée');
  }

  // ── Display helpers ──────────────────────────────────────────
  protected statutLabel(statut: DemandeStatus): string {
    const map: Record<DemandeStatus, string> = {
      nouveau: 'Nouveau',
      en_cours: 'En cours',
      traite: 'Traité',
    };
    return map[statut];
  }

  protected typeLabel(type: DemandeType): string {
    const map: Record<DemandeType, string> = {
      mail: 'E-mail',
      sms: 'SMS',
      formulaire: 'Formulaire',
      guichet: 'Guichet',
    };
    return map[type];
  }

  protected typeIcon(type: DemandeType): string {
    const map: Record<DemandeType, string> = {
      mail: 'mail',
      sms: 'mobile',
      formulaire: 'form',
      guichet: 'user',
    };
    return map[type];
  }

  protected typeColor(type: DemandeType): string {
    const map: Record<DemandeType, string> = {
      mail: 'blue',
      sms: 'purple',
      formulaire: 'cyan',
      guichet: 'orange',
    };
    return map[type];
  }

  protected bodyExcerpt(corps: string): string {
    const text = corps.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim();
    return text.length > 120 ? text.slice(0, 120) + '…' : text;
  }
}
