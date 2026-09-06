import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { NzResultModule } from 'ng-zorro-antd/result';
import { NzButtonModule } from 'ng-zorro-antd/button';
import { DemoUiService } from '../../../core/demo/demo-ui.service';

/**
 * Placeholder for modules that exist in the product but are outside the demo's scope.
 */
@Component({
  selector: 'pli-out-of-scope',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [RouterLink, NzResultModule, NzButtonModule],
  template: `
    <div class="pli-page-enter oos">
      <nz-result
        nzStatus="info"
        [nzTitle]="title"
        nzSubTitle="Ce module fait partie du produit mais n’est pas inclus dans cette démonstration.">
        <div nz-result-extra>
          <a nz-button nzType="primary" routerLink="/dashboard">Retour au tableau de bord</a>
          <button nz-button nzType="default" type="button" (click)="demo.openAbout()">
            Périmètre de la démo
          </button>
        </div>
      </nz-result>
    </div>
  `,
  styles: [
    `
      .oos {
        padding: 40px 24px;
        display: flex;
        justify-content: center;
      }
    `,
  ],
})
export class OutOfScopeComponent {
  protected readonly demo = inject(DemoUiService);
  private readonly route = inject(ActivatedRoute);

  protected get title(): string {
    const crumb = this.route.snapshot.data['breadcrumb'] as string | undefined;
    return crumb ? `${crumb} — hors périmètre de la démo` : 'Module hors périmètre de la démo';
  }
}
