import { Component, afterNextRender, effect, inject } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { NzLayoutModule } from 'ng-zorro-antd/layout';
import { UiStore } from '../../state/ui.store';
import { SidebarComponent } from '../sidebar/sidebar.component';
import { BreadcrumbComponent } from '../breadcrumb/breadcrumb.component';
import { CommandPaletteComponent } from '../../shared/components/command-palette/command-palette.component';
import { DemoTourService } from '../../core/demo/demo-tour.service';
import { DemoUiService } from '../../core/demo/demo-ui.service';

@Component({
  selector: 'pli-main-layout',
  imports: [RouterOutlet, NzLayoutModule, SidebarComponent, BreadcrumbComponent, CommandPaletteComponent],
  templateUrl: './main-layout.component.html',
  styleUrl: './main-layout.component.scss',
})
export class MainLayoutComponent {
  protected readonly uiStore = inject(UiStore);
  private readonly tour = inject(DemoTourService);
  private readonly demo = inject(DemoUiService);

  /** Two-way binding bridge for nz-sider [(nzCollapsed)] */
  get sidebarCollapsed(): boolean {
    return this.uiStore.sidebarCollapsed();
  }
  set sidebarCollapsed(value: boolean) {
    this.uiStore.setSidebarCollapsed(value);
  }

  constructor() {
    // First visit: start the guided tour once the shell is painted.
    afterNextRender(() => {
      setTimeout(() => void this.tour.start(), 900);
    });

    // "Revoir la visite guidée" from the About drawer.
    effect(() => {
      if (this.demo.tourRequested()) {
        this.demo.tourRequested.set(false);
        setTimeout(() => void this.tour.start(true), 350);
      }
    });
  }
}
