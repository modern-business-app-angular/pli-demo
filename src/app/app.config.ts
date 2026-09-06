import {
  ApplicationConfig,
  importProvidersFrom,
  provideBrowserGlobalErrorListeners,
} from '@angular/core';
import {
  TitleStrategy,
  provideRouter,
  withComponentInputBinding,
  withViewTransitions,
} from '@angular/router';
import { provideHttpClient, withInterceptors } from '@angular/common/http';
import { provideAnimationsAsync } from '@angular/platform-browser/animations/async';
import { registerLocaleData } from '@angular/common';
import localeFr from '@angular/common/locales/fr';
import { NzConfig, provideNzConfig } from 'ng-zorro-antd/core/config';
import { fr_FR, provideNzI18n } from 'ng-zorro-antd/i18n';
import { provideNzIcons } from 'ng-zorro-antd/icon';
import { NzModalModule } from 'ng-zorro-antd/modal';

import { appRoutes } from './app.routes';
import { authInterceptor } from './core/interceptors/auth.interceptor';
import { errorInterceptor } from './core/interceptors/error.interceptor';
import { loadingInterceptor } from './core/interceptors/loading.interceptor';
import { provideMockNetwork } from './core/mock-network';
import { DEMO_ICONS } from './core/icons/demo-icons';
import { PliTitleStrategy } from './core/routing/pli-title.strategy';

registerLocaleData(localeFr);

const nzConfig: NzConfig = {
  message: { nzDuration: 4000, nzMaxStack: 5, nzTop: 24 },
  notification: { nzPlacement: 'bottomRight', nzDuration: 5000 },
};

export const appConfig: ApplicationConfig = {
  providers: [
    provideBrowserGlobalErrorListeners(),

    provideRouter(appRoutes, withComponentInputBinding(), withViewTransitions()),
    { provide: TitleStrategy, useClass: PliTitleStrategy },

    // Real HTTP pipeline (auth → errors → loading indicator) …
    provideHttpClient(withInterceptors([authInterceptor, errorInterceptor, loadingInterceptor])),
    // … terminated by the in-browser mock instead of a network backend.
    provideMockNetwork(),

    provideAnimationsAsync(),

    provideNzI18n(fr_FR),
    provideNzConfig(nzConfig),
    // Icons are registered statically (tree-shaken) instead of fetched at runtime.
    provideNzIcons(DEMO_ICONS),

    // NzModalService requires the module to be imported at root level
    importProvidersFrom(NzModalModule),
  ],
};
