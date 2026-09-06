import { Component, OnInit, inject } from '@angular/core';
import { ActivatedRoute, NavigationEnd, Router, RouterLink } from '@angular/router';
import { filter } from 'rxjs';
import { NzDropDownModule } from 'ng-zorro-antd/dropdown';
import { NzMenuModule } from 'ng-zorro-antd/menu';
import { Breadcrumb, UiStore } from '../../state/ui.store';
import { AuthStore } from '../../state/auth.store';
import { DemoUiService } from '../../core/demo/demo-ui.service';
import { DemoBadgeComponent } from '../../core/demo/demo-badge/demo-badge.component';

@Component({
  selector: 'pli-breadcrumb',
  imports: [RouterLink, NzDropDownModule, NzMenuModule, DemoBadgeComponent],
  templateUrl: './breadcrumb.component.html',
  styleUrl: './breadcrumb.component.scss',
})
export class BreadcrumbComponent implements OnInit {
  protected readonly uiStore = inject(UiStore);
  protected readonly authStore = inject(AuthStore);
  protected readonly demo = inject(DemoUiService);

  private readonly router = inject(Router);
  private readonly activatedRoute = inject(ActivatedRoute);

  ngOnInit(): void {
    this.router.events
      .pipe(filter((e) => e instanceof NavigationEnd))
      .subscribe(() => this.uiStore.setBreadcrumbs(this.buildBreadcrumbs()));

    this.uiStore.setBreadcrumbs(this.buildBreadcrumbs());
  }

  private buildBreadcrumbs(): Breadcrumb[] {
    const crumbs: Breadcrumb[] = [{ label: 'Accueil', route: '/dashboard' }];
    let route: ActivatedRoute | null = this.activatedRoute.root;

    while (route) {
      const children: ActivatedRoute[] = route.children;
      let found = false;
      for (const child of children) {
        const data = child.snapshot.data;
        // Only push breadcrumb for routes with a non-empty URL segment.
        // Empty-path routes (path: '') inherit parent data but must not re-add it.
        if (data['breadcrumb'] && child.snapshot.url.length > 0) {
          crumbs.push({
            label: data['breadcrumb'] as string,
            route: '/' + child.snapshot.url.map((seg: { path: string }) => seg.path).join('/'),
          });
        }
        route = child;
        found = true;
        break;
      }
      if (!found) break;
    }

    return crumbs;
  }
}
