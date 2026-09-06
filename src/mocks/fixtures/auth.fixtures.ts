import type { AuthUser, LoginResponse } from '../../app/core/models/auth.model';

export const MOCK_ADMIN_USER: AuthUser = {
  id: 1,
  username: 'admin',
  displayName: 'Jean Dupont',
  email: 'jean.dupont@ville-exemple.fr',
  serviceId: 10,
  serviceName: 'Direction Générale',
  hierarchie: '001',
  hierarFonct: '001',
  database: 'DEMO',
  roles: ['ADMIN', 'USER'],
  permissions: [
    'COURRIER_ENTRANT',
    'COURRIER_SORTANT',
    'COURRIER_INTERNE',
    'PROTOCOLE_CONTACTS',
    'PROTOCOLE_ORGANISMES',
    'PROTOCOLE_DIFFUSION',
    'ADMIN',
  ],
};

export const MOCK_STANDARD_USER: AuthUser = {
  id: 2,
  username: 'mleblanc',
  displayName: 'Marie Leblanc',
  email: 'marie.leblanc@ville-exemple.fr',
  serviceId: 20,
  serviceName: 'Service des Relations Extérieures',
  hierarchie: '002',
  hierarFonct: '002',
  database: 'DEMO',
  roles: ['USER'],
  permissions: ['COURRIER_ENTRANT', 'COURRIER_SORTANT', 'PROTOCOLE_CONTACTS'],
};

/** Accounts accepted by the mock login endpoint. */
export const DEMO_USERS: readonly { username: string; password: string; user: AuthUser }[] = [
  { username: 'admin', password: 'admin', user: MOCK_ADMIN_USER },
  { username: 'mleblanc', password: 'password', user: MOCK_STANDARD_USER },
];

export function buildLoginResponse(user: AuthUser): LoginResponse {
  return {
    accessToken: `demo.jwt.access.token.${user.username}`,
    refreshToken: `demo.jwt.refresh.token.${user.username}`,
    expiresIn: 3600,
    user,
  };
}

export const MOCK_LOGIN_RESPONSE: LoginResponse = buildLoginResponse(MOCK_ADMIN_USER);
