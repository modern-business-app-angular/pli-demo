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
  FormBuilder,
  FormControl,
  Validators,
} from '@angular/forms';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { NzTableModule } from 'ng-zorro-antd/table';
import { NzButtonModule } from 'ng-zorro-antd/button';
import { NzInputModule } from 'ng-zorro-antd/input';
import { NzFormModule } from 'ng-zorro-antd/form';
import { NzInputNumberModule } from 'ng-zorro-antd/input-number';
import { NzPopconfirmModule } from 'ng-zorro-antd/popconfirm';
import { NzTagModule } from 'ng-zorro-antd/tag';
import { NzIconModule } from 'ng-zorro-antd/icon';
import { NzMessageService } from 'ng-zorro-antd/message';
import { NzTooltipModule } from 'ng-zorro-antd/tooltip';
import { NzModalModule } from 'ng-zorro-antd/modal';
import { CodificationsService } from '../../services/codifications.service';
import type { TerritoireNiveau, TerritoireElement } from '../../models/codification.models';

@Component({
  selector: 'pli-territoires',
  standalone: true,
  imports: [
    ReactiveFormsModule,
    NzTableModule,
    NzButtonModule,
    NzInputModule,
    NzFormModule,
    NzInputNumberModule,
    NzPopconfirmModule,
    NzTagModule,
    NzIconModule,
    NzTooltipModule,
    NzModalModule,
  ],
  templateUrl: './territoires.component.html',
  styleUrl: './territoires.component.scss',
})
export class TerritoiresComponent implements OnInit {
  private readonly svc = inject(CodificationsService);
  private readonly fb = inject(FormBuilder);
  private readonly msg = inject(NzMessageService);
  private readonly destroyRef = inject(DestroyRef);

  // ── State ────────────────────────────────────────────────────────────────

  protected readonly niveaux = signal<TerritoireNiveau[]>([]);
  protected readonly elements = signal<TerritoireElement[]>([]);
  protected readonly selectedNiveau = signal<number>(1);
  protected readonly isLoadingNiveaux = signal(false);
  protected readonly isLoadingElements = signal(false);
  protected readonly isSaving = signal(false);
  protected readonly editingId = signal<number | null>(null);
  protected readonly addingNew = signal(false);
  protected readonly renamingNiveau = signal(false);
  protected readonly affectationModalVisible = signal(false);
  protected readonly isAffecting = signal(false);

  // ── Forms ────────────────────────────────────────────────────────────────

  protected readonly inlineForm = this.fb.group({
    cle:        ['', [Validators.required, Validators.maxLength(6)]],
    labelCourt: ['', [Validators.required, Validators.maxLength(250)]],
    labelLong:  ['', [Validators.required, Validators.maxLength(250)]],
    rang:       [1,  [Validators.required, Validators.min(1), Validators.max(999)]],
  });

  protected readonly renameControl = new FormControl('', Validators.required);

  // ── Computed ─────────────────────────────────────────────────────────────

  protected readonly currentNiveauElements = computed(() =>
    this.elements().filter(e => e.niveau === this.selectedNiveau())
  );

  protected readonly currentNiveau = computed(() =>
    this.niveaux().find(n => n.niveau === this.selectedNiveau())
  );

  protected readonly maxElementCount = computed(() =>
    Math.max(1, ...this.niveaux().map(n => this.levelElementCount(n.niveau)))
  );

  // ── Lifecycle ────────────────────────────────────────────────────────────

  ngOnInit(): void {
    this.loadNiveaux();
    this.loadElements(1);
  }

  // ── Data loading ─────────────────────────────────────────────────────────

  private loadNiveaux(): void {
    this.isLoadingNiveaux.set(true);
    this.svc.getTerritoireNiveaux()
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next:  (data) => { this.niveaux.set(data); this.isLoadingNiveaux.set(false); },
        error: ()     => { this.isLoadingNiveaux.set(false); },
      });
  }

  private loadElements(niveau: number): void {
    this.isLoadingElements.set(true);
    this.cancelInline();
    this.svc.getTerritoireElements(niveau)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next:  (data) => {
          // Merge into global elements list (replace rows for this niveau)
          this.elements.update(all => [
            ...all.filter(e => e.niveau !== niveau),
            ...data,
          ]);
          this.isLoadingElements.set(false);
        },
        error: () => { this.isLoadingElements.set(false); },
      });
  }

  // ── Level selection ──────────────────────────────────────────────────────

  protected selectNiveau(n: number): void {
    if (n === this.selectedNiveau()) return;
    this.selectedNiveau.set(n);
    this.cancelInline();
    this.renamingNiveau.set(false);
    // Only load if not yet fetched
    if (!this.elements().some(e => e.niveau === n)) {
      this.loadElements(n);
    } else {
      this.isLoadingElements.set(false);
    }
  }

  // ── Level rename ─────────────────────────────────────────────────────────

  protected startRename(): void {
    const current = this.currentNiveau();
    if (!current) return;
    this.renameControl.setValue(current.nom);
    this.renamingNiveau.set(true);
  }

  protected confirmRename(): void {
    if (this.renameControl.invalid) return;
    const n = this.selectedNiveau();
    const nom = this.renameControl.value!.trim();
    this.svc.renameTerritoireNiveau(n, nom)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (updated) => {
          this.niveaux.update(list =>
            list.map(item => item.niveau === n ? updated : item)
          );
          this.renamingNiveau.set(false);
          this.msg.success('Niveau renommé');
        },
        error: () => this.msg.error('Erreur lors du renommage'),
      });
  }

  protected cancelRename(): void {
    this.renamingNiveau.set(false);
  }

  // ── Inline add ───────────────────────────────────────────────────────────

  protected startAdd(): void {
    this.editingId.set(null);
    this.inlineForm.reset({ cle: '', labelCourt: '', labelLong: '', rang: this.currentNiveauElements().length + 1 });
    this.addingNew.set(true);
  }

  protected saveNew(): void {
    if (this.inlineForm.invalid) return;
    this.isSaving.set(true);
    const v = this.inlineForm.value;
    this.svc.createTerritoireElement({
      ...v,
      rang: v.rang ?? 1,
      niveau: this.selectedNiveau(),
    } as Partial<TerritoireElement>)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (created) => {
          this.elements.update(all => [...all, created]);
          this.addingNew.set(false);
          this.isSaving.set(false);
          this.msg.success('Élément ajouté');
        },
        error: () => { this.isSaving.set(false); this.msg.error('Erreur lors de la création'); },
      });
  }

  // ── Inline edit ──────────────────────────────────────────────────────────

  protected startEdit(el: TerritoireElement): void {
    this.addingNew.set(false);
    this.inlineForm.setValue({ cle: el.cle, labelCourt: el.labelCourt, labelLong: el.labelLong, rang: el.rang });
    this.editingId.set(el.id);
  }

  protected saveEdit(el: TerritoireElement): void {
    if (this.inlineForm.invalid) return;
    this.isSaving.set(true);
    const v = this.inlineForm.value;
    this.svc.updateTerritoireElement(el.id, {
      ...v,
      rang: v.rang ?? el.rang,
    } as Partial<TerritoireElement>)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (updated) => {
          this.elements.update(all => all.map(e => e.id === el.id ? updated : e));
          this.editingId.set(null);
          this.isSaving.set(false);
          this.msg.success('Élément modifié');
        },
        error: () => { this.isSaving.set(false); this.msg.error('Erreur lors de la modification'); },
      });
  }

  protected cancelInline(): void {
    this.editingId.set(null);
    this.addingNew.set(false);
  }

  // ── Delete ───────────────────────────────────────────────────────────────

  protected deleteElement(el: TerritoireElement): void {
    this.svc.deleteTerritoireElement(el.id)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: () => {
          this.elements.update(all => all.filter(e => e.id !== el.id));
          this.msg.success('Élément supprimé');
        },
        error: () => this.msg.error('Erreur lors de la suppression'),
      });
  }

  // ── Helpers ──────────────────────────────────────────────────────────────

  protected levelElementCount(n: number): number {
    return this.elements().filter(e => e.niveau === n).length;
  }

  protected levelFillPercent(n: number): number {
    const max = this.maxElementCount();
    if (max === 0) return 0;
    return Math.round((this.levelElementCount(n) / max) * 100);
  }

  protected isEditing(el: TerritoireElement): boolean {
    return this.editingId() === el.id;
  }

  /** Pad level number to 2 digits: 1 → "01" */
  protected padLevel(n: number): string {
    return String(n).padStart(2, '0');
  }

  // ── Affectation des adresses ─────────────────────────────────────────────

  protected openAffectationModal(): void {
    this.affectationModalVisible.set(true);
  }

  protected runAffectation(updateAll: boolean): void {
    this.affectationModalVisible.set(false);
    this.isAffecting.set(true);
    this.svc.affecterAdresses(this.selectedNiveau(), updateAll)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: ({ updated }) => {
          this.isAffecting.set(false);
          this.msg.success(`${updated} organisation${updated > 1 ? 's mises' : ' mise'} à jour`);
        },
        error: () => {
          this.isAffecting.set(false);
          this.msg.error('Erreur lors de l\'affectation des adresses');
        },
      });
  }
}
