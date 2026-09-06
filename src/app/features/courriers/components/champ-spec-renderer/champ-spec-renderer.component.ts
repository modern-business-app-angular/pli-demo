import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormGroup } from '@angular/forms';
import { NzFormModule } from 'ng-zorro-antd/form';
import { NzInputModule } from 'ng-zorro-antd/input';
import { NzInputNumberModule } from 'ng-zorro-antd/input-number';
import { NzSelectModule } from 'ng-zorro-antd/select';
import { NzDatePickerModule } from 'ng-zorro-antd/date-picker';
import type { ChampSpec } from '../../../administration/models/administration.models';

@Component({
  selector: 'pli-champ-spec-renderer',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    NzFormModule,
    NzInputModule,
    NzInputNumberModule,
    NzSelectModule,
    NzDatePickerModule,
  ],
  template: `
    @if (champs.length > 0) {
      <div class="csr-section">
        <div class="csr-section__title">Champs personnalisés</div>
        <div class="csr-grid" [formGroup]="formGroup">
          @for (champ of champs; track champ.id) {
            <nz-form-item class="csr-item">
              <nz-form-label [nzRequired]="champ.obligatoire">{{ champ.libelle }}</nz-form-label>
              <nz-form-control [nzExtra]="champ.infobulle ?? ''">
                @switch (champ.type) {
                  @case ('chaine') {
                    <input nz-input
                      [formControlName]="'spec_' + champ.nom"
                      [placeholder]="champ.valeurDefaut ?? ''"
                      [attr.maxlength]="255" />
                  }
                  @case ('multiligne') {
                    <textarea nz-input
                      [formControlName]="'spec_' + champ.nom"
                      [placeholder]="champ.valeurDefaut ?? ''"
                      [nzAutosize]="{ minRows: 2, maxRows: 5 }"></textarea>
                  }
                  @case ('numerique') {
                    <nz-input-number
                      [formControlName]="'spec_' + champ.nom"
                      style="width:100%" />
                  }
                  @case ('date') {
                    <nz-date-picker
                      [formControlName]="'spec_' + champ.nom"
                      nzFormat="dd/MM/yyyy"
                      style="width:100%" />
                  }
                  @case ('liste') {
                    <nz-select
                      [formControlName]="'spec_' + champ.nom"
                      nzAllowClear
                      [nzPlaceHolder]="champ.valeurDefaut ?? 'Sélectionner…'">
                      @for (val of getListeValues(champ); track val) {
                        <nz-option [nzValue]="val" [nzLabel]="val" />
                      }
                    </nz-select>
                  }
                }
              </nz-form-control>
            </nz-form-item>
          }
        </div>
      </div>
    }
  `,
  styles: [`
    .csr-section {
      margin-top: 24px;
      padding-top: 20px;
      border-top: 1px solid #e5e7eb;
    }
    .csr-section__title {
      font-size: 10px;
      font-weight: 700;
      letter-spacing: 0.10em;
      text-transform: uppercase;
      color: #0f766e;
      margin-bottom: 16px;
      display: flex;
      align-items: center;
      gap: 6px;
    }
    .csr-section__title::before {
      content: '';
      display: inline-block;
      width: 3px;
      height: 12px;
      background: #0f766e;
      border-radius: 2px;
    }
    .csr-grid {
      display: grid;
      grid-template-columns: repeat(2, 1fr);
      gap: 0 24px;
    }
  `],
})
export class ChampSpecRendererComponent {
  @Input() formGroup!: FormGroup;
  @Input() champs: ChampSpec[] = [];

  getListeValues(champ: ChampSpec): string[] {
    return (champ.valeurs ?? '').split(',').map(v => v.trim()).filter(Boolean);
  }
}
