import { HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { finalize } from 'rxjs';
import { UiStore } from '../../state/ui.store';

/**
 * Tracks in-flight HTTP requests via UiStore.pendingRequests.
 * Components can read UiStore.isLoading() to show/hide global spinner.
 *
 * Add header 'X-Silent: true' to a request to skip the loading indicator
 * (useful for background polls like notifications).
 */
export const loadingInterceptor: HttpInterceptorFn = (req, next) => {
  if (req.headers.has('X-Silent')) {
    return next(req);
  }

  const uiStore = inject(UiStore);
  uiStore.incrementPendingRequests();

  return next(req).pipe(
    finalize(() => uiStore.decrementPendingRequests())
  );
};
