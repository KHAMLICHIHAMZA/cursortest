/**
 * Session navigateur (limite absolue après connexion). Utilisable dans le middleware Edge.
 * Durée : NEXT_PUBLIC_AUTH_SESSION_MAX_HOURS (défaut 24).
 */
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

import { AUTH_SESSION_START_COOKIE } from './auth-session.constants';

export { AUTH_SESSION_START_COOKIE };

export function getAuthSessionMaxMs(): number {
  const h = Number(process.env.NEXT_PUBLIC_AUTH_SESSION_MAX_HOURS ?? 24);
  if (!Number.isFinite(h) || h <= 0) {
    return 24 * 60 * 60 * 1000;
  }
  return h * 60 * 60 * 1000;
}

export function redirectLoginClearSession(request: NextRequest): NextResponse {
  const loginUrl = new URL('/login', request.url);
  loginUrl.searchParams.set('reason', 'session_expired');
  const res = NextResponse.redirect(loginUrl);
  res.cookies.delete('accessToken');
  res.cookies.delete('refreshToken');
  res.cookies.delete('user');
  res.cookies.delete(AUTH_SESSION_START_COOKIE);
  return res;
}
