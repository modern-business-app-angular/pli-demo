import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { NZ_MODAL_DATA, NzModalRef } from 'ng-zorro-antd/modal';
import { NzListModule } from 'ng-zorro-antd/list';
import { NzTagModule } from 'ng-zorro-antd/tag';
import { NzSpinModule } from 'ng-zorro-antd/spin';
import { NzEmptyModule } from 'ng-zorro-antd/empty';
import { NzButtonModule } from 'ng-zorro-antd/button';
import { NzIconModule } from 'ng-zorro-antd/icon';
import { NzTooltipModule } from 'ng-zorro-antd/tooltip';
import { CourriersService } from '../../services/courriers.service';
import type { Maquette } from '../../../administration/models/administration.models';

@Component({
  selector: 'pli-maquette-selector-modal',
  standalone: true,
  imports: [CommonModule, NzListModule, NzTagModule, NzSpinModule, NzEmptyModule, NzButtonModule, NzTooltipModule, NzIconModule],
  template: `
    <div class="msm-wrap">
      @if (loading()) {
        <nz-spin nzSimple style="display:flex;justify-content:center;padding:40px"></nz-spin>
      } @else if (maquettes().length === 0) {
        <nz-empty nzDescription="Aucune maquette disponible pour ce type" />
      } @else {
        <nz-list [nzDataSource]="maquettes()" [nzRenderItem]="maqItem" nzBordered>
          <ng-template #maqItem let-m>
            <nz-list-item class="msm-item" (click)="select(m)">
              <div class="msm-item__row">
                <div class="msm-item__name">{{ m.nom }}</div>
                @if (m.fileUrl) {
                  <a class="msm-item__dl" [href]="m.fileUrl" target="_blank"
                     (click)="$event.stopPropagation()"
                     nz-tooltip nzTooltipTitle="Télécharger le modèle .docx">
                    <span nz-icon nzType="download" nzTheme="outline"></span>
                    .docx
                  </a>
                }
              </div>
              <div class="msm-item__meta">
                <nz-tag [nzColor]="typeColor[m.type]">{{ m.type }}</nz-tag>
                <nz-tag [nzColor]="m.acces === 'PUBLIC' ? 'default' : 'blue'">{{ m.acces }}</nz-tag>
                @if (m.serviceNom) {
                  <span class="msm-item__service">{{ m.serviceNom }}</span>
                }
              </div>
            </nz-list-item>
          </ng-template>
        </nz-list>
      }
    </div>
  `,
  styles: [`
    .msm-wrap { min-height: 200px; }
    .msm-item {
      cursor: pointer;
      transition: background 0.1s;
      padding: 10px 16px !important;
      display: flex;
      flex-direction: column;
      align-items: flex-start !important;
      gap: 6px;
    }
    .msm-item:hover { background: #f8faff; }
    .msm-item__row { display: flex; align-items: center; justify-content: space-between; width: 100%; gap: 8px; }
    .msm-item__name { font-size: 13px; font-weight: 500; color: #0f172a; flex: 1; }
    .msm-item__dl { font-size: 11px; color: #4f46e5; display: flex; align-items: center; gap: 3px; text-decoration: none; white-space: nowrap; flex-shrink: 0; }
    .msm-item__dl:hover { color: #3730a3; }
    .msm-item__meta { display: flex; align-items: center; gap: 6px; flex-wrap: wrap; }
    .msm-item__service { font-size: 11px; color: #64748b; }
  `],
})
export class MaquetteSelectorModalComponent implements OnInit {
  private readonly service = inject(CourriersService);
  private readonly modalRef = inject(NzModalRef);
  readonly type = inject(NZ_MODAL_DATA) as 'AR' | 'REP' | 'BOR';

  readonly maquettes = signal<Maquette[]>([]);
  readonly loading = signal(true);

  readonly typeColor: Record<string, string> = {
    AR: 'geekblue', REP: 'gold', BOR: 'cyan', ML: 'default',
  };

  ngOnInit(): void {
    this.service.getMaquettesByType(this.type).subscribe({
      next: m => { this.maquettes.set(m); this.loading.set(false); },
      error: () => this.loading.set(false),
    });
  }

  select(m: Maquette): void {
    this.modalRef.close(m);
  }
}
