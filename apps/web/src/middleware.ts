import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

const PUBLIC_PATHS = ['/login', '/register', '/'];
const ROLE_PATHS: Record<string, string[]> = {
  SUPER_ADMIN: ['/dashboard/super-admin'],
  PORTAL_TEAM: ['/dashboard/portal-team'],
  CMT: ['/dashboard/cmt'],
  LANDLORD: ['/dashboard/landlord'],
  TENANT: ['/dashboard/tenant'],
  SERVICE_PROVIDER: ['/dashboard/service-provider'],
};

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const accessToken = request.cookies.get('accessToken')?.value;
  const refreshToken = request.cookies.get('refreshToken')?.value;
  const userRole = request.cookies.get('userRole')?.value;

  const isAuthenticated = !!(accessToken || refreshToken);

  if (PUBLIC_PATHS.includes(pathname)) {
    if (isAuthenticated && userRole && pathname === '/login') {
      const dashboardPaths: Record<string, string> = {
        SUPER_ADMIN: '/dashboard/super-admin',
        PORTAL_TEAM: '/dashboard/portal-team',
        CMT: '/dashboard/cmt',
        LANDLORD: '/dashboard/landlord',
        TENANT: '/dashboard/tenant',
        SERVICE_PROVIDER: '/dashboard/service-provider',
      };
      return NextResponse.redirect(new URL(dashboardPaths[userRole] || '/', request.url));
    }
    return NextResponse.next();
  }

  if (pathname.startsWith('/dashboard')) {
    if (!isAuthenticated) {
      return NextResponse.redirect(new URL('/login', request.url));
    }

    if (userRole) {
      const allowedPaths = ROLE_PATHS[userRole] || [];
      const hasAccess = allowedPaths.some((p) => pathname.startsWith(p));
      if (!hasAccess) {
        const dashboardPaths: Record<string, string> = {
          SUPER_ADMIN: '/dashboard/super-admin',
          PORTAL_TEAM: '/dashboard/portal-team',
          CMT: '/dashboard/cmt',
          LANDLORD: '/dashboard/landlord',
          TENANT: '/dashboard/tenant',
          SERVICE_PROVIDER: '/dashboard/service-provider',
        };
        return NextResponse.redirect(new URL(dashboardPaths[userRole] || '/', request.url));
      }
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico|api).*)'],
};
