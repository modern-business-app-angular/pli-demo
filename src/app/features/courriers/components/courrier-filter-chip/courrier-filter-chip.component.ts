import { Component, input, output, computed } from '@angular/core';
import { NzTagModule } from 'ng-zorro-antd/tag';
import type { ActiveFilterChip } from '../../models/courrier.model';
import { COURRIER_FILTER_GROUP_META } from '../../models/courrier.model';

@Component({
  selector: 'pli-courrier-filter-chip',
  standalone: true,
  imports: [NzTagModule],
  template: `
    <nz-tag
      [nzColor]="color()"
      [nzMode]="'closeable'"
      (nzOnClose)="remove.emit(chip())"
      class="filter-chip">
      <span class="filter-chip__label">{{ chip().label }}</span>
      <span class="filter-chip__sep">·</span>
      <span class="filter-chip__value">{{ chip().displayValue }}</span>
    </nz-tag>
  `,
  styles: [`
    .filter-chip {
      display: inline-flex !important;
      align-items: center;
      gap: 4px;
      height: 26px;
      padding: 0 8px 0 10px;
      font-size: 12px;
    }
    .filter-chip__label { font-weight: 600; }
    .filter-chip__sep   { opacity: 0.5; margin: 0 2px; }
    .filter-chip__value { font-weight: 400; max-width: 160px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
  `],
})
export class CourrierFilterChipComponent {
  readonly chip   = input.required<ActiveFilterChip>();
  readonly remove = output<ActiveFilterChip>();

  protected color = computed(() => {
    const meta = COURRIER_FILTER_GROUP_META[this.chip().group];
    // Map hex to nz-tag color alias or use hex directly
    const colorMap: Record<string, string> = {
      '#4f46e5': 'geekblue',
      '#7c3aed': 'purple',
      '#b45309': 'gold',
      '#0f766e': 'cyan',
    };
    return colorMap[meta.color] ?? 'blue';
  });
}
