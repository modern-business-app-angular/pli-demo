import { ChangeDetectionStrategy, Component, input, output } from '@angular/core';
import { DEMO_CONFIG, DemoPersona } from '../demo.config';

/**
 * One-click login cards shown on the sign-in page.
 * Emits the chosen persona; the login page performs the real login request.
 */
@Component({
  selector: 'pli-demo-persona-bar',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="personas" role="group" aria-label="Comptes de démonstration">
      <p class="personas__hint">Choisissez un profil pour entrer en un clic :</p>
      <div class="personas__grid">
        @for (p of personas; track p.key) {
          <button
            type="button"
            class="persona"
            [class.persona--admin]="p.key === 'admin'"
            [disabled]="disabled()"
            (click)="pick.emit(p)"
            [attr.aria-label]="'Se connecter en tant que ' + p.title + ' (' + p.name + ')'">
            <span class="persona__avatar" aria-hidden="true">{{ initials(p.name) }}</span>
            <span class="persona__body">
              <span class="persona__title">{{ p.title }}</span>
              <span class="persona__name">{{ p.name }} · {{ p.service }}</span>
              <span class="persona__hint">{{ p.hint }}</span>
            </span>
            <span class="persona__arrow" aria-hidden="true">→</span>
          </button>
        }
      </div>
      <div class="personas__divider" aria-hidden="true"><span>ou connectez-vous manuellement</span></div>
    </div>
  `,
  styles: [
    `
      .personas {
        margin: 4px 0 20px;
      }
      .personas__hint {
        margin: 0 0 10px;
        color: #595959;
        font-size: 13px;
      }
      .personas__grid {
        display: grid;
        gap: 10px;
      }
      .persona {
        display: flex;
        align-items: center;
        gap: 12px;
        width: 100%;
        min-height: 64px;
        padding: 10px 12px;
        border: 1px solid #d9d9d9;
        border-radius: 8px;
        background: #fff;
        text-align: left;
        cursor: pointer;
        transition: border-color 0.15s ease, box-shadow 0.15s ease, transform 0.15s ease;
        font-family: inherit;
      }
      .persona:hover:not(:disabled) {
        border-color: #6a6af4;
        box-shadow: 0 4px 12px rgba(0, 0, 145, 0.1);
        transform: translateY(-1px);
      }
      .persona:focus-visible {
        outline: 3px solid #000091;
        outline-offset: 2px;
      }
      .persona:disabled {
        opacity: 0.6;
        cursor: progress;
      }
      .persona__avatar {
        flex: none;
        width: 40px;
        height: 40px;
        border-radius: 50%;
        display: grid;
        place-items: center;
        background: #f0f2f5;
        color: #141414;
        font-weight: 700;
        font-size: 14px;
      }
      .persona--admin .persona__avatar {
        background: #000091;
        color: #fff;
      }
      .persona__body {
        flex: 1;
        display: flex;
        flex-direction: column;
        gap: 1px;
        min-width: 0;
      }
      .persona__title {
        font-weight: 600;
        color: #141414;
        font-size: 14px;
      }
      .persona__name {
        color: #595959;
        font-size: 12.5px;
      }
      .persona__hint {
        color: #767676;
        font-size: 12px;
      }
      .persona__arrow {
        color: #000091;
        font-size: 18px;
        opacity: 0;
        transform: translateX(-4px);
        transition: opacity 0.15s ease, transform 0.15s ease;
      }
      .persona:hover:not(:disabled) .persona__arrow {
        opacity: 1;
        transform: translateX(0);
      }
      .personas__divider {
        display: flex;
        align-items: center;
        gap: 12px;
        margin-top: 18px;
        color: #767676;
        font-size: 12px;
      }
      .personas__divider::before,
      .personas__divider::after {
        content: '';
        flex: 1;
        height: 1px;
        background: #e5e5e5;
      }
    `,
  ],
})
export class DemoPersonaBarComponent {
  protected readonly personas = DEMO_CONFIG.personas;
  readonly disabled = input(false);
  readonly pick = output<DemoPersona>();

  protected initials(name: string): string {
    return name
      .split(' ')
      .slice(0, 2)
      .map((n) => n[0]?.toUpperCase() ?? '')
      .join('');
  }
}
