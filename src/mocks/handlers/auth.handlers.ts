import { http, HttpResponse, delay } from 'msw';
import { API_BASE, AUTH_BASE } from '../mock-origin';
import { DEMO_USERS, MOCK_ADMIN_USER, buildLoginResponse } from '../fixtures/auth.fixtures';
import type { LoginRequest } from '../../app/core/models/auth.model';

/**
 * Demo credentials:
 *  - `admin` / `admin`            → administrateur (accès complet)
 *  - `mleblanc` / `password`      → agent (droits restreints)
 *  - any other login / `password` → administrateur
 */
export const authHandlers = [
  http.post(`${AUTH_BASE}/login`, async ({ request }) => {
    await delay(400);
    const body = (await request.json()) as LoginRequest;
    const username = (body.username ?? '').trim().toLowerCase();

    const known = DEMO_USERS.find((u) => u.username === username);
    const validCredentials =
      (known && body.password === known.password) ||
      (!known && body.password === 'password');

    if (!validCredentials) {
      return HttpResponse.json(
        { message: 'Identifiant ou mot de passe incorrect.' },
        { status: 401 }
      );
    }

    return HttpResponse.json(buildLoginResponse(known?.user ?? MOCK_ADMIN_USER));
  }),

  http.post(`${AUTH_BASE}/refresh`, async () => {
    await delay(200);
    return HttpResponse.json({ accessToken: 'demo.jwt.access.token.refreshed' });
  }),

  http.get(`${API_BASE}/me`, () => HttpResponse.json(MOCK_ADMIN_USER)),
];
