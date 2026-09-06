import { Component } from '@angular/core';
import { RouterLink } from '@angular/router';
import { NzResultModule } from 'ng-zorro-antd/result';
import { NzButtonModule } from 'ng-zorro-antd/button';

@Component({
  selector: 'pli-not-found',
  imports: [RouterLink, NzResultModule, NzButtonModule],
  template: `
    <div class="tw-flex tw-items-center tw-justify-center tw-h-full tw-min-h-96">
      <nz-result
        nzStatus="404"
        nzTitle="404"
        nzSubTitle="La page demandée n'existe pas.">
        <div nz-result-extra>
          <button nz-button nzType="primary" routerLink="/dashboard">
            Retour au tableau de bord
          </button>
        </div>
      </nz-result>
    </div>
  `,
})
export class NotFoundComponent {}
