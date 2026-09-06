import { Component, inject } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { DemoUiService } from './core/demo/demo-ui.service';
import { DemoAboutDrawerComponent } from './core/demo/demo-about-drawer/demo-about-drawer.component';

/**
 * Root component — minimal shell.
 * Routing and layout live in app.routes.ts and MainLayoutComponent; the "À propos" drawer is
 * mounted here so it is reachable from the login page as well.
 */
@Component({
  imports: [RouterOutlet, DemoAboutDrawerComponent],
  selector: 'pli-root',
  template: `
    <router-outlet />
    @defer (when demo.aboutOpen()) {
      <pli-demo-about-drawer />
    }
  `,
})
export class App {
  protected readonly demo = inject(DemoUiService);
}
