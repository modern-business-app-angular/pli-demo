import { beforeEach, describe, expect, it, vi, type Mock } from 'vitest';
import { TestBed } from '@angular/core/testing';
import {
  HttpBackend,
  HttpClient,
  HttpErrorResponse,
  HttpEvent,
  HttpEventType,
  HttpResponse,
  HttpXhrBackend,
  provideHttpClient,
} from '@angular/common/http';
import { firstValueFrom, lastValueFrom, of, toArray } from 'rxjs';
import { HttpResponse as MswResponse, getResponse, http, passthrough } from 'msw';
import { provideMockNetwork } from './provide-mock-network';
import { MockHttpBackend } from './mock-http.backend';

const ORIGIN = 'https://api.test.invalid';

const handlers = [
  http.get(`${ORIGIN}/api/ping`, () => MswResponse.json({ ok: true })),
  http.post(`${ORIGIN}/api/echo`, async ({ request }) =>
    MswResponse.json(
      { echoed: await request.json(), auth: request.headers.get('authorization') },
      { status: 201 }
    )
  ),
  http.get(`${ORIGIN}/api/secret`, () =>
    MswResponse.json({ message: 'Identifiants invalides' }, { status: 401 })
  ),
  http.get(
    `${ORIGIN}/api/file`,
    () =>
      new MswResponse(new Uint8Array([1, 2, 3]), {
        headers: {
          'Content-Type': 'application/octet-stream',
          'Content-Disposition': 'attachment; filename="x.bin"',
        },
      })
  ),
  http.head(
    `${ORIGIN}/api/file`,
    () => new MswResponse(null, { headers: { 'Last-Modified': 'Mon, 01 Jan 2026 00:00:00 GMT' } })
  ),
  http.delete(`${ORIGIN}/api/item/:id`, () => new MswResponse(null, { status: 204 })),
  http.get(`${ORIGIN}/api/real`, () => passthrough()),
];

describe('MockHttpBackend', () => {
  let client: HttpClient;
  let persist: Mock<() => void>;

  beforeEach(() => {
    persist = vi.fn<() => void>();
    TestBed.configureTestingModule({
      providers: [
        provideHttpClient(),
        provideMockNetwork({ origin: ORIGIN, latency: null, log: false }, async () => ({
          handlers,
          getResponse,
          persist,
        })),
      ],
    });
    client = TestBed.inject(HttpClient);
  });

  it('replaces the HttpBackend token', () => {
    expect(TestBed.inject(HttpBackend)).toBeInstanceOf(MockHttpBackend);
  });

  it('answers a GET with the handler body', async () => {
    const body = await firstValueFrom(client.get<{ ok: boolean }>(`${ORIGIN}/api/ping`));
    expect(body).toEqual({ ok: true });
  });

  it('emits a Sent event before the response', async () => {
    const events = await lastValueFrom(
      client.get(`${ORIGIN}/api/ping`, { observe: 'events' }).pipe(toArray())
    );
    expect(events.map((e: HttpEvent<unknown>) => e.type)).toEqual([
      HttpEventType.Sent,
      HttpEventType.Response,
    ]);
    expect((events[1] as HttpResponse<unknown>).status).toBe(200);
  });

  it('forwards headers and JSON bodies, and persists after a mutation', async () => {
    const res = await firstValueFrom(
      client.post<{ echoed: unknown; auth: string | null }>(
        `${ORIGIN}/api/echo`,
        { a: 1 },
        { headers: { Authorization: 'Bearer demo' }, observe: 'response' }
      )
    );
    expect(res.status).toBe(201);
    expect(res.body).toEqual({ echoed: { a: 1 }, auth: 'Bearer demo' });
    expect(persist).toHaveBeenCalledTimes(1);
  });

  it('turns non-2xx responses into HttpErrorResponse with the parsed body', async () => {
    const error = await firstValueFrom(client.get(`${ORIGIN}/api/secret`)).catch((e) => e);
    expect(error).toBeInstanceOf(HttpErrorResponse);
    expect(error.status).toBe(401);
    expect(error.error).toEqual({ message: 'Identifiants invalides' });
    expect(persist).not.toHaveBeenCalled();
  });

  it('supports responseType blob and exposes response headers', async () => {
    const res = await firstValueFrom(
      client.get(`${ORIGIN}/api/file`, { responseType: 'blob', observe: 'response' })
    );
    expect(res.body).toBeInstanceOf(Blob);
    expect(res.body?.size).toBe(3);
    expect(res.body?.type).toBe('application/octet-stream');
    expect(res.headers.get('Content-Disposition')).toContain('x.bin');
  });

  it('handles HEAD requests without reading a body', async () => {
    const res = await firstValueFrom(client.head(`${ORIGIN}/api/file`, { observe: 'response' }));
    expect(res.body).toBeNull();
    expect(res.headers.get('Last-Modified')).toBe('Mon, 01 Jan 2026 00:00:00 GMT');
  });

  it('returns null for 204 responses and persists deletes', async () => {
    const res = await firstValueFrom(
      client.delete(`${ORIGIN}/api/item/7`, { observe: 'response' })
    );
    expect(res.status).toBe(204);
    expect(res.body).toBeNull();
    expect(persist).toHaveBeenCalledTimes(1);
  });

  it('synthesises a 404 for routes the mock does not know', async () => {
    const error = await firstValueFrom(client.get(`${ORIGIN}/api/nowhere`)).catch((e) => e);
    expect(error).toBeInstanceOf(HttpErrorResponse);
    expect(error.status).toBe(404);
    expect(error.error.message).toContain('/api/nowhere');
  });

  it('delegates other origins to the real XHR backend', async () => {
    const xhr = TestBed.inject(HttpXhrBackend);
    const spy = vi
      .spyOn(xhr, 'handle')
      .mockReturnValue(of(new HttpResponse({ body: 'real', status: 200 })));
    const body = await firstValueFrom(client.get('https://example.org/data'));
    expect(body).toBe('real');
    expect(spy).toHaveBeenCalledTimes(1);
  });

  it('delegates passthrough() responses to the real XHR backend', async () => {
    const xhr = TestBed.inject(HttpXhrBackend);
    const spy = vi
      .spyOn(xhr, 'handle')
      .mockReturnValue(of(new HttpResponse({ body: 'network', status: 200 })));
    const body = await firstValueFrom(client.get(`${ORIGIN}/api/real`));
    expect(body).toBe('network');
    expect(spy).toHaveBeenCalledTimes(1);
  });
});
