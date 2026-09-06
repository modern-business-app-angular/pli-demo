import { Injectable, inject } from '@angular/core';
import {
  HttpBackend,
  HttpErrorResponse,
  HttpEvent,
  HttpEventType,
  HttpHeaderResponse,
  HttpHeaders,
  HttpRequest,
  HttpResponse,
  HttpXhrBackend,
} from '@angular/common/http';
import { Observable, Subscription } from 'rxjs';
import {
  MOCK_NETWORK_LOADER,
  MOCK_NETWORK_OPTIONS,
  MockNetworkModule,
} from './mock-network.tokens';

type Resolution =
  | { kind: 'ok'; header: HttpHeaderResponse; response: HttpResponse<unknown> }
  | { kind: 'error'; error: HttpErrorResponse }
  | { kind: 'passthrough' };

const MUTATING_METHODS = new Set(['POST', 'PUT', 'PATCH', 'DELETE']);
const BODYLESS_STATUSES = new Set([204, 205, 304]);
const XSSI_PREFIX = /^\)\]\}',?\n/;

/**
 * `HttpBackend` that answers requests inside the browser.
 *
 * It sits at the end of Angular's interceptor chain, so the real `authInterceptor`,
 * `errorInterceptor` and `loadingInterceptor` run untouched. Requests aimed at the mock
 * origin are converted to a Fetch `Request`, resolved against the MSW request handlers
 * with `getResponse()` (no Service Worker involved) and converted back to Angular HTTP
 * events. Anything else is delegated to the regular XHR backend.
 */
@Injectable()
export class MockHttpBackend implements HttpBackend {
  private readonly realBackend = inject(HttpXhrBackend);
  private readonly options = inject(MOCK_NETWORK_OPTIONS);
  private readonly loader = inject(MOCK_NETWORK_LOADER);
  private readonly mockOrigin = new URL(this.options.origin).origin;
  private modulePromise: Promise<MockNetworkModule> | undefined;

  handle(req: HttpRequest<unknown>): Observable<HttpEvent<unknown>> {
    if (req.method === 'JSONP') {
      throw new Error('MockHttpBackend: JSONP requests are not supported.');
    }
    if (!this.isMockOrigin(req.urlWithParams)) {
      return this.realBackend.handle(req);
    }

    return new Observable<HttpEvent<unknown>>((observer) => {
      const aborter = new AbortController();
      let passthrough: Subscription | undefined;

      observer.next({ type: HttpEventType.Sent });

      this.resolve(req, aborter.signal).then(
        (result) => {
          if (aborter.signal.aborted) return;
          switch (result.kind) {
            case 'passthrough':
              passthrough = this.realBackend.handle(req).subscribe(observer);
              return;
            case 'error':
              observer.error(result.error);
              return;
            case 'ok':
              if (req.reportProgress) observer.next(result.header);
              observer.next(result.response);
              observer.complete();
          }
        },
        (err: unknown) => {
          if (aborter.signal.aborted) return;
          observer.error(err instanceof HttpErrorResponse ? err : this.handlerCrash(req, err));
        }
      );

      return () => {
        aborter.abort();
        passthrough?.unsubscribe();
      };
    });
  }

  // ── Resolution ──────────────────────────────────────────────────────────────

  private async resolve(req: HttpRequest<unknown>, signal: AbortSignal): Promise<Resolution> {
    const mod = await this.loadModule();
    await this.applyLatency();
    if (signal.aborted) return { kind: 'error', error: this.aborted(req) };

    const response = await mod.getResponse(mod.handlers, this.toFetchRequest(req, signal));

    if (!response) return { kind: 'error', error: this.unhandled(req) };
    if (response.status === 302 && response.headers.get('x-msw-intention') === 'passthrough') {
      return { kind: 'passthrough' };
    }
    if (response.type === 'error') {
      return {
        kind: 'error',
        error: new HttpErrorResponse({
          status: 0,
          statusText: 'Network error (mock)',
          url: req.urlWithParams,
        }),
      };
    }

    const resolution = await this.toAngularResponse(req, response);
    if (resolution.kind === 'ok' && MUTATING_METHODS.has(req.method)) mod.persist?.();
    return resolution;
  }

  private loadModule(): Promise<MockNetworkModule> {
    this.modulePromise ??= this.loader();
    return this.modulePromise;
  }

  private isMockOrigin(url: string): boolean {
    try {
      return new URL(url, document.baseURI).origin === this.mockOrigin;
    } catch {
      return false;
    }
  }

  private applyLatency(): Promise<void> {
    const latency = this.options.latency;
    if (!latency || latency.max <= 0) return Promise.resolve();
    const ms = latency.min + Math.random() * Math.max(0, latency.max - latency.min);
    return new Promise((resolve) => setTimeout(resolve, ms));
  }

  // ── Conversions ─────────────────────────────────────────────────────────────

  private toFetchRequest(req: HttpRequest<unknown>, signal: AbortSignal): Request {
    const headers = new Headers();
    for (const name of req.headers.keys()) {
      const values = req.headers.getAll(name);
      if (values?.length) headers.set(name, values.join(','));
    }
    if (!headers.has('Accept')) headers.set('Accept', 'application/json, text/plain, */*');
    if (!headers.has('Content-Type')) {
      // Returns null for FormData so the multipart boundary is generated by the platform.
      const contentType = req.detectContentTypeHeader();
      if (contentType) headers.set('Content-Type', contentType);
    }

    const canHaveBody = req.method !== 'GET' && req.method !== 'HEAD';
    return new Request(req.urlWithParams, {
      method: req.method,
      headers,
      signal,
      body: canHaveBody ? (req.serializeBody() as BodyInit | null) : null,
      credentials: req.withCredentials ? 'include' : 'same-origin',
    });
  }

  private async toAngularResponse(
    req: HttpRequest<unknown>,
    res: Response
  ): Promise<Resolution> {
    const headers = new HttpHeaders(res.headers);
    const url = res.url || req.urlWithParams;
    const status = res.status;
    const ok = status >= 200 && status < 300;
    const statusText = res.statusText || (ok ? 'OK' : '');

    let body: unknown = null;
    if (res.body && req.method !== 'HEAD' && !BODYLESS_STATUSES.has(status)) {
      const buffer = await res.arrayBuffer();
      const contentType = res.headers.get('content-type') ?? '';
      body = this.parseBody(req.responseType, buffer, contentType, ok);
    }

    if (!ok) {
      return {
        kind: 'error',
        error: new HttpErrorResponse({ error: body, headers, status, statusText, url }),
      };
    }
    return {
      kind: 'ok',
      header: new HttpHeaderResponse({ headers, status, statusText, url }),
      response: new HttpResponse({ body, headers, status, statusText, url }),
    };
  }

  private parseBody(
    responseType: HttpRequest<unknown>['responseType'],
    buffer: ArrayBuffer,
    contentType: string,
    ok: boolean
  ): unknown {
    switch (responseType) {
      case 'json': {
        // Same XSSI-prefix handling as Angular's own backends.
        const text = new TextDecoder().decode(buffer).replace(XSSI_PREFIX, '');
        if (text.trim() === '') return null;
        try {
          return JSON.parse(text);
        } catch (error) {
          if (ok) throw error;
          return text; // Non-JSON error bodies are surfaced as text.
        }
      }
      case 'text':
        return new TextDecoder().decode(buffer);
      case 'blob':
        return new Blob([buffer], { type: contentType });
      case 'arraybuffer':
        return buffer;
    }
  }

  // ── Errors ──────────────────────────────────────────────────────────────────

  private unhandled(req: HttpRequest<unknown>): HttpErrorResponse {
    const path = new URL(req.urlWithParams).pathname;
    if (this.options.log) {
      console.warn(`[mock-network] Aucune route simulée pour ${req.method} ${path}`);
    }
    return new HttpErrorResponse({
      status: 404,
      statusText: 'Not Found (mock)',
      url: req.urlWithParams,
      error: { message: `Aucune route simulée pour ${req.method} ${path}` },
    });
  }

  private aborted(req: HttpRequest<unknown>): HttpErrorResponse {
    return new HttpErrorResponse({ status: 0, statusText: 'Aborted', url: req.urlWithParams });
  }

  private handlerCrash(req: HttpRequest<unknown>, err: unknown): HttpErrorResponse {
    if (this.options.log) {
      console.error('[mock-network] Le handler a levé une exception', req.method, req.urlWithParams, err);
    }
    return new HttpErrorResponse({
      status: 500,
      statusText: 'Mock handler error',
      url: req.urlWithParams,
      error: { message: err instanceof Error ? err.message : String(err) },
    });
  }
}
