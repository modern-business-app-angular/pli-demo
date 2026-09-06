import { Component, OnInit, inject, signal, DestroyRef } from '@angular/core';
import { Router, NavigationEnd, RouterOutlet, RouterLink, RouterLinkActive } from '@angular/router';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { filter } from 'rxjs/operators';
import { NzButtonModule } from 'ng-zorro-antd/button';
import { NzIconModule } from 'ng-zorro-antd/icon';

@Component({
  selector: 'pli-courriers-hub',
  standalone: true,
  imports: [RouterOutlet, RouterLink, RouterLinkActive, NzButtonModule, NzIconModule],
  templateUrl: './courriers-hub.component.html',
  styleUrl: './courriers-hub.component.scss',
})
export class CourriersHubComponent implements OnInit {
  private readonly router = inject(Router);
  private readonly destroyRef = inject(DestroyRef);

  readonly isFormRoute = signal(false);
  readonly activeTab = signal<'entrant' | 'sortant' | 'interne'>('entrant');

  ngOnInit(): void {
    this.updateFromUrl(this.router.url);
    this.router.events.pipe(
      filter(e => e instanceof NavigationEnd),
      takeUntilDestroyed(this.destroyRef),
    ).subscribe((e: NavigationEnd) => this.updateFromUrl(e.urlAfterRedirects));
  }

  private updateFromUrl(url: string): void {
    this.isFormRoute.set(url.includes('/nouveau'));
    if (url.includes('sortant')) this.activeTab.set('sortant');
    else if (url.includes('interne')) this.activeTab.set('interne');
    else this.activeTab.set('entrant');
  }
}
