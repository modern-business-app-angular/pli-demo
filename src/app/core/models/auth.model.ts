// ============================================================
// Pli — Auth Models
// Typed session: identity, organisational scope and permissions
// ============================================================

export interface LoginRequest {
  username: string;
  password: string;
  /** Optional tenant / environment selector (unused in the demo). */
  database?: string;
}

export interface LoginResponse {
  accessToken: string;
  refreshToken: string;
  expiresIn: number;
  user: AuthUser;
}

export interface AuthUser {
  id: number;
  username: string;
  displayName: string;
  email: string;
  serviceId: number;
  serviceName: string;
  /** Organisational hierarchy code driving visibility rules */
  hierarchie: string;
  hierarFonct: string;
  /** Tenant / environment the session is bound to */
  database: string;
  roles: string[];
  /** Flat list of permission keys granted at login */
  permissions: string[];
}

export interface TokenPayload {
  sub: number;
  username: string;
  roles: string[];
  iat: number;
  exp: number;
}

export interface RefreshTokenRequest {
  refreshToken: string;
}

export interface RefreshTokenResponse {
  accessToken: string;
}
