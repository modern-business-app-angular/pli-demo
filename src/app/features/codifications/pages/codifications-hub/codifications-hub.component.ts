import { Component } from '@angular/core';
import { RouterModule } from '@angular/router';
import { CodifHubNavComponent } from '../../components/codif-hub-nav/codif-hub-nav.component';

@Component({
  selector: 'pli-codifications-hub',
  standalone: true,
  imports: [RouterModule, CodifHubNavComponent],
  templateUrl: './codifications-hub.component.html',
  styleUrl: './codifications-hub.component.scss',
})
export class CodificationsHubComponent {}
