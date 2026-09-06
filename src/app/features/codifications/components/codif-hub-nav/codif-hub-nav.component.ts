import { Component, OnInit, inject, signal, DestroyRef } from '@angular/core';
import { RouterModule } from '@angular/router';
import { NzTagModule } from 'ng-zorro-antd/tag';
import { NzTooltipModule } from 'ng-zorro-antd/tooltip';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { CodificationsService } from '../../services/codifications.service';

interface NavItem {
  label: string;
  path: string;
  wip?: boolean;
}

interface NavGroup {
  label: string;
  items: NavItem[];
}

const NAV_GROUPS: NavGroup[] = [
  {
    label: 'Workflow',
    items: [
      { label: 'Actions',         path: 'actions',         wip: true },
      { label: 'Chronos',         path: 'chronos'                    },
      { label: 'États Classeurs', path: 'etats-classeur'             },
      { label: 'États Éléments',  path: 'etats-elements'             },
    ],
  },
  {
    label: 'Contacts',
    items: [
      { label: 'Civilités',   path: 'civilites'             },
      { label: 'Criticités',  path: 'criticites'            },
      { label: 'Délégations', path: 'delegations'           },
      { label: 'Fonctions',   path: 'fonctions'             },
      { label: 'Personnels',  path: 'personnels' },
    ],
  },
  {
    label: 'Courriers',
    items: [
      { label: 'Natures',   path: 'natures'   },
      { label: 'Objets',    path: 'objets'    },
      { label: 'Priorités', path: 'priorites' },
    ],
  },
  {
    label: 'Organisation',
    items: [
      { label: 'Dossiers', path: 'dossiers' },
      { label: 'Services', path: 'services' },
    ],
  },
  {
    label: 'Géographie',
    items: [
      { label: 'Rues',          path: 'rues'                         },
      { label: 'Villes',        path: 'villes'                       },
      { label: 'Sectorisation', path: 'sectorisation'               },
      { label: 'Territoires',   path: 'territoires'                  },
    ],
  },
  {
    label: 'Calendrier',
    items: [
      { label: 'Jours fériés', path: 'jours-feries' },
    ],
  },
];

@Component({
  selector: 'pli-codif-hub-nav',
  standalone: true,
  imports: [RouterModule, NzTagModule, NzTooltipModule],
  templateUrl: './codif-hub-nav.component.html',
  styleUrl: './codif-hub-nav.component.scss',
})
export class CodifHubNavComponent implements OnInit {
  private readonly service = inject(CodificationsService);
  private readonly destroyRef = inject(DestroyRef);

  protected readonly groups = NAV_GROUPS;
  protected readonly counts = signal<Record<string, number>>({});
  protected readonly statsLoading = signal(true);

  ngOnInit(): void {
    this.service.getCodifStats()
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next:  (data) => { this.counts.set(data); this.statsLoading.set(false); },
        error: ()     => { this.statsLoading.set(false); },
      });
  }
}
