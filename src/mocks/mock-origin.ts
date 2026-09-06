/**
 * Fake API origin used by the in-browser mock network layer.
 *
 * `.invalid` is reserved by RFC 2606 and can never resolve, so if a request ever
 * escaped the mock layer it would fail immediately instead of hitting a real host.
 * The same constant is shared by the MSW handlers and the app's runtime environment.
 */
export const MOCK_ORIGIN = 'https://api.pli-demo.invalid';
export const API_BASE = `${MOCK_ORIGIN}/api`;
export const AUTH_BASE = `${MOCK_ORIGIN}/auth`;
