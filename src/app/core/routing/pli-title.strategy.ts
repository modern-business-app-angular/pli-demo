import { Injectable, inject } from '@angular/core';
import { Title } from '@angular/platform-browser';
import { RouterStateSnapshot, TitleStrategy } from '@angular/router';

export const APP_NAME = 'Pli';

/** Builds "<Page> · Pli" from the route `title`, falling back to the deepest breadcrumb. */
@Injectable({ providedIn: 'root' })
export class PliTitleStrategy extends TitleStrategy {
  private readonly title = inject(Title);

  override updateTitle(snapshot: RouterStateSnapshot): void {
    const page = this.buildTitle(snapshot) ?? this.deepestBreadcrumb(snapshot);
    this.title.setTitle(page ? `${page} · ${APP_NAME}` : `${APP_NAME} — Gestion du courrier`);
  }

  private deepestBreadcrumb(snapshot: RouterStateSnapshot): string | undefined {
    let route = snapshot.root;
    let label: string | undefined;
    while (route) {
      const crumb = route.data['breadcrumb'];
      if (typeof crumb === 'string' && route.url.length > 0) label = crumb;
      if (!route.firstChild) break;
      route = route.firstChild;
    }
    return label;
  }
}
