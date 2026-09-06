import { ChangeDetectionStrategy, Component, inject, input } from '@angular/core';
import { DemoUiService } from '../demo-ui.service';

/**
 * Discreet "Démo · données fictives" pill. Clicking it opens the "À propos" drawer.
 * `tone="light"` is meant for dark backgrounds (login brand panel).
 */
@Component({
  selector: 'pli-demo-badge',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <button
      type="button"
      class="demo-badge"
      [class.demo-badge--light]="tone() === 'light'"
      (click)="demo.openAbout()"
      title="En savoir plus sur cette démonstration"
      aria-label="Démo : données fictives. En savoir plus">
      <span class="demo-badge__dot" aria-hidden="true"></span>
      <span class="demo-badge__text">Démo</span>
      <span class="demo-badge__sep" aria-hidden="true">·</span>
      <span class="demo-badge__text demo-badge__text--muted">données fictives</span>
    </button>
  `,
  styles: [
    `
      .demo-badge {
        display: inline-flex;
        align-items: center;
        gap: 6px;
        height: 28px;
        padding: 0 10px 0 8px;
        border: 1px solid #cacafb;
        border-radius: 999px;
        background: #e3e3fd;
        color: #000091;
        font: 600 12px/1 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
        letter-spacing: 0.01em;
        cursor: pointer;
        transition: background 0.15s ease, border-color 0.15s ease;
        white-space: nowrap;
      }
      .demo-badge:hover {
        background: #cacafb;
        border-color: #adadf9;
      }
      .demo-badge:focus-visible {
        outline: 3px solid #000091;
        outline-offset: 2px;
      }
      .demo-badge__dot {
        width: 7px;
        height: 7px;
        border-radius: 50%;
        background: #c9860a;
        box-shadow: 0 0 0 3px rgba(201, 134, 10, 0.18);
      }
      .demo-badge__text--muted {
        font-weight: 500;
        opacity: 0.8;
      }
      .demo-badge__sep {
        opacity: 0.5;
      }
      .demo-badge--light {
        background: rgba(255, 255, 255, 0.1);
        border-color: rgba(255, 255, 255, 0.28);
        color: #fff;
      }
      .demo-badge--light:hover {
        background: rgba(255, 255, 255, 0.18);
        border-color: rgba(255, 255, 255, 0.4);
      }
      .demo-badge--light .demo-badge__dot {
        background: #edb732;
        box-shadow: 0 0 0 3px rgba(237, 183, 50, 0.25);
      }
      .demo-badge--light:focus-visible {
        outline-color: #edb732;
      }
    `,
  ],
})
export class DemoBadgeComponent {
  protected readonly demo = inject(DemoUiService);
  readonly tone = input<'default' | 'light'>('default');
}
