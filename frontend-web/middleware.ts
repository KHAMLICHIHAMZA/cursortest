import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

// Routes protégées par rôle
const ROLE_ROUTES: Record<string, string[]> = {
  '/admin': ['SUPER_ADMIN'],
  '/company': ['SUPER_ADMIN', 'COMPANY_ADMIN'],
  '/agency': ['SUPER_ADMIN', 'COMPANY_ADMIN', 'AGENCY_MANAGER', 'AGENT'],
};

// Routes publiques (pas besoin d'authentification)
const PUBLIC_ROUTES = ['/login', '/forgot-password', '/reset-password', '/'];

// Décoder le JWT pour extraire le payload (sans vérification signature côté client)
function decodeJwtPayload(token: string): { role?: string; exp?: number } | null {
  try {
    const parts = token.split('.');
    if (parts.length !== 3) return null;
    const payload = JSON.parse(atob(parts[1]));
    return payload;
  } catch {
    return null;
  }
}

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Routes publiques - laisser passer
  if (PUBLIC_ROUTES.some(route => pathname === route || pathname.startsWith('/_next'))) {
    return NextResponse.next();
  }

  // Récupérer le token
  const token = request.cookies.get('accessToken')?.value;

  // Pas de token - rediriger vers login
  if (!token) {
    const loginUrl = new URL('/login', request.url);
    loginUrl.searchParams.set('redirect', pathname);
    return NextResponse.redirect(loginUrl);
  }

  // Décoder le token pour obtenir le rôle
  const payload = decodeJwtPayload(token);
  if (!payload || !payload.role) {
    const loginUrl = new URL('/login', request.url);
    return NextResponse.redirect(loginUrl);
  }

  // Vérifier si le token est expiré
  if (payload.exp && payload.exp * 1000 < Date.now()) {
    const loginUrl = new URL('/login', request.url);
    loginUrl.searchParams.set('expired', 'true');
    return NextResponse.redirect(loginUrl);
  }

  const userRole = payload.role;

  // Vérifier les permissions par préfixe de route
  for (const [routePrefix, allowedRoles] of Object.entries(ROLE_ROUTES)) {
    if (pathname.startsWith(routePrefix)) {
      if (!allowedRoles.includes(userRole)) {
        // Rediriger vers la bonne section selon le rôle
        let redirectPath = '/login';
        if (userRole === 'SUPER_ADMIN') redirectPath = '/admin';
        else if (userRole === 'COMPANY_ADMIN') redirectPath = '/company';
        else if (userRole === 'AGENCY_MANAGER' || userRole === 'AGENT') redirectPath = '/agency';

        return NextResponse.redirect(new URL(redirectPath, request.url));
      }
      break;
    }
  }

  return NextResponse.next();
}

// Configuration du matcher - appliquer le middleware à toutes les routes sauf assets
export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - api (API routes)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public folder
     */
    '/((?!api|_next/static|_next/image|favicon.ico|.*\\..*).*)' 
  ],
};
