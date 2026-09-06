import {
  Component,
  OnInit,
  inject,
  signal,
  computed,
  DestroyRef,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import {
  ReactiveFormsModule,
  FormBuilder,
  Validators,
  AbstractControl,
  ValidationErrors,
} from '@angular/forms';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import {
  debounceTime,
  distinctUntilChanged,
  switchMap,
  of,
  Subject,
} from 'rxjs';
import { NzModalRef, NZ_MODAL_DATA } from 'ng-zorro-antd/modal';
import { NzMessageService } from 'ng-zorro-antd/message';
import { NzFormModule } from 'ng-zorro-antd/form';
import { NzSelectModule } from 'ng-zorro-antd/select';
import { NzDatePickerModule } from 'ng-zorro-antd/date-picker';
import { NzInputModule } from 'ng-zorro-antd/input';
import { NzButtonModule } from 'ng-zorro-antd/button';
import { NzSpinModule } from 'ng-zorro-antd/spin';
import { NzAlertModule } from 'ng-zorro-antd/alert';
import { CourriersService } from '../../services/courriers.service';
import { CourriersStore } from '../../state/courriers.store';
import type { CourrierEntrant } from '../../models/courrier.model';
import type { Action, Personnel } from '../../models/action.model';

/** Custom validator: date must not be in the past */
function notInPastValidator(control: AbstractControl): ValidationErrors | null {
  if (!control.value) return null;
  const val = control.value instanceof Date ? control.value : new Date(control.value);
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  return val < today ? { pastDate: true } : null;
}

@Component({
  selector: 'pli-faire-suivre-modal',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    NzFormModule,
    NzSelectModule,
    NzDatePickerModule,
    NzInputModule,
    NzButtonModule,
    NzSpinModule,
    NzAlertModule,
  ],
  templateUrl: './faire-suivre-modal.component.html',
  styleUrl: './faire-suivre-modal.component.scss',
})
export class FaireSuivreModalComponent implements OnInit {
  // ── Injections ────────────────────────────────────────────────────────────
  private readonly fb = inject(FormBuilder);
  private readonly service = inject(CourriersService);
  private readonly store = inject(CourriersStore);
  private readonly modalRef = inject(NzModalRef);
  private readonly message = inject(NzMessageService);
  private readonly destroyRef = inject(DestroyRef);

  /** Courrier passed from the list via NzModal data */
  protected readonly courrier = inject<CourrierEntrant>(NZ_MODAL_DATA);

  // ── State ─────────────────────────────────────────────────────────────────
  protected readonly actions = signal<Action[]>([]);
  protected readonly personnel = signal<Personnel[]>([]);
  protected readonly isLoadingActions = signal(false);
  protected readonly isLoadingPersonnel = signal(false);
  protected readonly isSubmitting = signal(false);
  protected readonly errorMsg = signal<string | null>(null);

  private readonly recipientSearch$ = new Subject<string>();

  // ── Form ──────────────────────────────────────────────────────────────────
  protected readonly form = this.fb.group({
    actionId: [null as number | null, Validators.required],
    destinataireId: [null as number | null, Validators.required],
    dateLimite: [null as Date | null, notInPastValidator],
    commentaire: ['', Validators.maxLength(3500)],
  });

  protected readonly commentaireLength = computed(
    () => (this.form.value.commentaire ?? '').length
  );

  protected readonly selectedAction = computed(
    () => this.actions().find((a) => a.id === this.form.value.actionId) ?? null
  );

  // ── Lifecycle ─────────────────────────────────────────────────────────────
  ngOnInit(): void {
    this.loadActions();
    this.setupRecipientTypeahead();

    // On action change: auto-fill date + reload recipients
    this.form.get('actionId')!.valueChanges
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((actionId) => this.onActionChange(actionId));
  }

  private loadActions(): void {
    this.isLoadingActions.set(true);
    this.service
      .getActions()
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (actions) => { this.actions.set(actions); this.isLoadingActions.set(false); },
        error: () => this.isLoadingActions.set(false),
      });
  }

  private setupRecipientTypeahead(): void {
    this.recipientSearch$
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

  private onActionChange(actionId: number | null): void {
    if (!actionId) return;
    const action = this.actions().find((a) => a.id === actionId);
    if (!action) return;

    // Auto-fill date limite from action.nbjDtLim
    if (action.nbjDtLim != null) {
      const date = new Date();
      date.setDate(date.getDate() + action.nbjDtLim);
      this.form.patchValue({ dateLimite: date });
    }

    // Reset recipient when action changes (destMode may differ)
    this.form.patchValue({ destinataireId: null });
    this.personnel.set([]);
  }

  // ── Template handlers ─────────────────────────────────────────────────────
  protected onRecipientSearch(q: string): void {
    this.recipientSearch$.next(q);
  }

  protected onSubmit(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    const { actionId, destinataireId, dateLimite, commentaire } = this.form.value;
    this.isSubmitting.set(true);
    this.errorMsg.set(null);

    this.service
      .faireSuivre(this.courrier.id, {
        actionId: actionId!,
        destinataireId: destinataireId!,
        dateLimite: dateLimite ? dateLimite.toISOString().split('T')[0] : undefined,
        commentaire: commentaire ?? undefined,
      })
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: () => {
          this.store.markAsTransmis(this.courrier.id);
          this.message.success('Courrier transmis avec succès');
          this.modalRef.close(true);
        },
        error: (err: Error) => {
          this.errorMsg.set(err.message ?? 'Une erreur est survenue');
          this.isSubmitting.set(false);
        },
      });
  }

  protected onCancel(): void {
    this.modalRef.close(false);
  }
}
