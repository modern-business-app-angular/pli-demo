import { describe, expect, it } from 'vitest';
import { getResponse } from 'msw';
import { authHandlers } from './auth.handlers';
import { AUTH_BASE } from '../mock-origin';

async function login(username: string, password: string) {
  const request = new Request(`${AUTH_BASE}/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ username, password }),
  });
  const response = await getResponse(authHandlers, request);
  return { status: response?.status, body: await response?.json() };
}

describe('auth handlers (demo accounts)', () => {
  it('logs the administrator in with admin / admin', async () => {
    const { status, body } = await login('admin', 'admin');
    expect(status).toBe(200);
    expect(body.user.roles).toContain('ADMIN');
    expect(body.accessToken).toBeTruthy();
  });

  it('logs the agent persona in with restricted roles', async () => {
    const { status, body } = await login('MLeblanc', 'password');
    expect(status).toBe(200);
    expect(body.user.displayName).toBe('Marie Leblanc');
    expect(body.user.roles).toEqual(['USER']);
  });

  it('rejects wrong credentials with a French message', async () => {
    const { status, body } = await login('admin', 'nope');
    expect(status).toBe(401);
    expect(body.message).toMatch(/incorrect/);
  });
});
