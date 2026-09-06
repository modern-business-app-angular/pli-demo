import {
  Component, inject, effect, output,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormControl, FormGroup, ReactiveFormsModule } from '@angular/forms';
import { NzCollapseModule }   from 'ng-zorro-antd/collapse';
import { NzFormModule }       from 'ng-zorro-antd/form';
import { NzInputModule }      from 'ng-zorro-antd/input';
import { NzInputNumberModule } from 'ng-zorro-antd/input-number';
import { NzSelectModule }     from 'ng-zorro-antd/select';
import { NzDatePickerModule } from 'ng-zorro-antd/date-picker';
import { NzSwitchModule }     from 'ng-zorro-antd/switch';
import { NzButtonModule }     from 'ng-zorro-antd/button';
import { NzIconModule }       from 'ng-zorro-antd/icon';
import { NzTagModule }        from 'ng-zorro-antd/tag';
import { CourrierSearchStore } from '../../state/courrier-search.store';
import type { ChampSpec }     from '../../../administration/models/administration.models';
import type { CourrierStatut } from '../../models/courrier.model';

export const STATUT_OPTIONS: { label: string; value: CourrierStatut }[] = [
  { label: 'En cours',  value: 'E' },
  { label: 'Transmise', value: 'T' },
  { label: 'Fini',      value: 'F' },
  { label: 'Clôturé',   value: 'C' },
  { label: 'Suspendu',  value: 'S' },
];

@Component({
  selector: 'pli-courrier-filter-panel',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    NzCollapseModule,
    NzFormModule,
    NzInputModule,
    NzInputNumberModule,
    NzSelectModule,
    NzDatePickerModule,
    NzSwitchModule,
    NzButtonModule,
    NzIconModule,
    NzTagModule,
  ],
  templateUrl: './courrier-filter-panel.component.html',
  styleUrl:    './courrier-filter-panel.component.scss',
})
export class CourrierFilterPanelComponent {
  readonly filterApplied = output<void>();

  protected readonly store      = inject(CourrierSearchStore);
  private   readonly fb         = inject(FormBuilder);
  protected readonly statutOptions = STATUT_OPTIONS;

  // ── Form groups per accordion section ───────────────────────────────────

  protected readonly elementsForm = this.fb.group({
    chrono:              [''],
    chronoTypeIds:       [[] as number[]],
    objet:               [''],
    reference:           [''],
    motsCles:            [''],
    natureIds:           [[] as number[]],
    dateArrivee:         [null as [Date, Date] | null],
    dateExpedition:      [null as [Date, Date] | null],
    dateLimite:          [null as [Date, Date] | null],
  });

  protected readonly contactForm = this.fb.group({
    tripletNom: [''],
    organisme:  [''],
    fonction:   [''],
    ville:      [''],
    cp:         [''],
  });

  protected readonly workflowForm = this.fb.group({
    etats:                [[] as CourrierStatut[]],
    emetteurId:           [null as number | null],
    destinataireId:       [null as number | null],
    actionId:             [null as number | null],
    original:             [false],
  });

  protected champsForm: FormGroup | null = null;

  // ── Sync store → forms ───────────────────────────────────────────────────

  constructor() {
    // When a saved model is applied, sync forms with the store query
    effect(() => {
      const q = this.store.query();
      const el = q.elements ?? {};
      this.elementsForm.patchValue({
        chrono:         el.chrono         ?? '',
        chronoTypeIds:  el.chronoTypeIds  ?? [],
        objet:          el.objet          ?? '',
        reference:      el.reference      ?? '',
        motsCles:       el.motsCles       ?? '',
        natureIds:      el.natureIds      ?? [],
        dateArrivee:    el.dateArriveeFrom && el.dateArriveeTo
                          ? [new Date(el.dateArriveeFrom), new Date(el.dateArriveeTo)] : null,
        dateExpedition: el.dateExpeditionFrom && el.dateExpeditionTo
                          ? [new Date(el.dateExpeditionFrom), new Date(el.dateExpeditionTo)] : null,
        dateLimite:     el.dateLimiteFrom && el.dateLimiteTo
                          ? [new Date(el.dateLimiteFrom), new Date(el.dateLimiteTo)] : null,
      }, { emitEvent: false });

      const ct = q.contact ?? {};
      this.contactForm.patchValue({
        tripletNom: ct.tripletNom ?? '',
        organisme:  ct.organisme  ?? '',
        fonction:   ct.fonction   ?? '',
        ville:      ct.ville      ?? '',
        cp:         ct.cp         ?? '',
      }, { emitEvent: false });

      const wf = q.workflow ?? {};
      this.workflowForm.patchValue({
        etats:           wf.etats          ?? [],
        emetteurId:      wf.emetteurId     ?? null,
        destinataireId:  wf.destinataireId ?? null,
        actionId:        wf.actionId       ?? null,
        original:        wf.original       ?? false,
      }, { emitEvent: false });
    });

    // Build dynamic ChampSpec form when refData changes
    effect(() => {
      const rd = this.store.refData();
      if (rd?.champsSpec?.length) {
        this._buildChampsForm(rd.champsSpec);
      }
    });
  }

  // ── Apply / Reset ────────────────────────────────────────────────────────

  protected applyElements(): void {
    const v = this.elementsForm.value;
    const dateArr = v.dateArrivee as [Date, Date] | null;
    const dateExp = v.dateExpedition as [Date, Date] | null;
    const dateLim = v.dateLimite as [Date, Date] | null;

    this.store.patchElements({
      chrono:              v.chrono         || undefined,
      chronoTypeIds:       v.chronoTypeIds?.length ? v.chronoTypeIds : undefined,
      objet:               v.objet          || undefined,
      reference:           v.reference      || undefined,
      motsCles:            v.motsCles       || undefined,
      natureIds:           v.natureIds?.length ? v.natureIds : undefined,
      dateArriveeFrom:     dateArr ? this._toIso(dateArr[0]) : undefined,
      dateArriveeTo:       dateArr ? this._toIso(dateArr[1]) : undefined,
      dateExpeditionFrom:  dateExp ? this._toIso(dateExp[0]) : undefined,
      dateExpeditionTo:    dateExp ? this._toIso(dateExp[1]) : undefined,
      dateLimiteFrom:      dateLim ? this._toIso(dateLim[0]) : undefined,
      dateLimiteTo:        dateLim ? this._toIso(dateLim[1]) : undefined,
    });
    this.filterApplied.emit();
  }

  protected resetElements(): void {
    this.elementsForm.reset({ chronoTypeIds: [], natureIds: [] });
    this.store.patchElements({});
    this.filterApplied.emit();
  }

  protected applyContact(): void {
    const v = this.contactForm.value;
    this.store.patchContact({
      tripletNom: v.tripletNom || undefined,
      organisme:  v.organisme  || undefined,
      fonction:   v.fonction   || undefined,
      ville:      v.ville      || undefined,
      cp:         v.cp         || undefined,
    });
    this.filterApplied.emit();
  }

  protected resetContact(): void {
    this.contactForm.reset();
    this.store.patchContact({});
    this.filterApplied.emit();
  }

  protected applyWorkflow(): void {
    const v = this.workflowForm.value;
    this.store.patchWorkflow({
      etats:           v.etats?.length    ? v.etats          : undefined,
      emetteurId:      v.emetteurId       ?? undefined,
      destinataireId:  v.destinataireId   ?? undefined,
      actionId:        v.actionId         ?? undefined,
      original:        v.original         || undefined,
    });
    this.filterApplied.emit();
  }

  protected resetWorkflow(): void {
    this.workflowForm.reset({ etats: [], original: false });
    this.store.patchWorkflow({});
    this.filterApplied.emit();
  }

  protected applySpecifiques(): void {
    if (!this.champsForm) return;
    const sp: Record<string, string | null> = {};
    for (const [k, v] of Object.entries(this.champsForm.value)) {
      sp[k] = v as string | null;
    }
    this.store.patchSpecifiques(sp);
    this.filterApplied.emit();
  }

  protected resetSpecifiques(): void {
    this.champsForm?.reset();
    this.store.patchSpecifiques({});
    this.filterApplied.emit();
  }

  // ── Dynamic form builder ─────────────────────────────────────────────────

  private _buildChampsForm(champs: ChampSpec[]): void {
    const controls: Record<string, FormControl> = {};
    for (const c of champs.filter(c => c.visible)) {
      controls[c.nom] = new FormControl(c.valeurDefaut ?? null);
    }
    this.champsForm = new FormGroup(controls);
  }

  protected getChampControls(champs: ChampSpec[]): ChampSpec[] {
    return champs.filter(c => c.visible).sort((a, b) => a.ordre - b.ordre);
  }

  private _toIso(date: Date): string {
    return date.toISOString().split('T')[0];
  }
}
