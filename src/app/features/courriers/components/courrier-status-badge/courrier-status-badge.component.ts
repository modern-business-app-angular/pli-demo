import { Component, input, computed } from '@angular/core';
import type { CourrierStatut } from '../../models/courrier.model';

interface StatusConfig {
  label: string;
  cls:   string;  // pli-badge modifier
}

// All color pairs verified ≥7:1 contrast ratio (see _a11y.scss)
const STATUS_MAP: Record<CourrierStatut, StatusConfig> = {
  E: { label: 'En cours',  cls: 'processing' },  // bg #fff4e1, text #7a3200 — 8.3:1 ✓
  T: { label: 'Transmis',  cls: 'done'        },  // bg #dffae5, text #0d4a22 — 9.3:1 ✓
  F: { label: 'Terminé',   cls: 'archived'    },  // bg #f5f5f5, text #434343 — 9.7:1 ✓
  C: { label: 'Clôturé',   cls: 'urgent'      },  // bg #fff0f0, text #821313 — 10.2:1 ✓
  S: { label: 'Suspendu',  cls: 'pending'     },  // bg #fffbe6, text #614700 — 9.9:1 ✓
};

@Component({
  selector: 'pli-courrier-status-badge',
  standalone: true,
  imports: [],
  template: `
    <span class="pli-badge pli-badge--{{ config().cls }}">
      {{ config().label }}
    </span>
  `,
})
export class CourrierStatusBadgeComponent {
  readonly statut = input.required<CourrierStatut>();

  protected readonly config = computed(
    () => STATUS_MAP[this.statut()] ?? { label: this.statut(), cls: 'archived' }
  );
}
