import Cookies from 'js-cookie';
import type { Role, AuthTokens } from '@/types';

export function saveTokens(tokens: AuthTokens) {
  Cookies.set('accessToken', tokens.accessToken, { expires: 1 / 96, secure: true, sameSite: 'strict' });
  Cookies.set('refreshToken', tokens.refreshToken, { expires: 7, secure: true, sameSite: 'strict' });
  Cookies.set('userRole', tokens.role, { expires: 7, secure: true, sameSite: 'strict' });
}

export function clearTokens() {
  Cookies.remove('accessToken');
  Cookies.remove('refreshToken');
  Cookies.remove('userRole');
}

export function getRole(): Role | null {
  return (Cookies.get('userRole') as Role) || null;
}

export function isAuthenticated(): boolean {
  return !!Cookies.get('accessToken') || !!Cookies.get('refreshToken');
}

export function getDashboardPath(role: Role): string {
  const paths: Record<Role, string> = {
    SUPER_ADMIN: '/dashboard/super-admin',
    PORTAL_TEAM: '/dashboard/portal-team',
    CMT: '/dashboard/cmt',
    LANDLORD: '/dashboard/landlord',
    TENANT: '/dashboard/tenant',
    SERVICE_PROVIDER: '/dashboard/service-provider',
  };
  return paths[role] || '/';
}
