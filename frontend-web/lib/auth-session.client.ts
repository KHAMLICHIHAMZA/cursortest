import Cookies from 'js-cookie';
import { authCookieBase } from './auth-cookies';
import { AUTH_SESSION_START_COOKIE } from './auth-session.constants';

const cookieRemovePath = { path: '/' as const };

export function setAuthSessionStartedAtClient(value: string): void {
  Cookies.set(AUTH_SESSION_START_COOKIE, value, {
    ...authCookieBase,
    expires: 30,
  });
}

/** À appeler au login et au début d’une impersonation. */
export function startNewAuthSessionClient(): void {
  setAuthSessionStartedAtClient(String(Date.now()));
}

/** Nettoie le stockage lié à l’impersonation (tokens admin sauvegardés, drapeaux UI). */
export function clearImpersonationStorageClient(): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.removeItem('impersonating');
    localStorage.removeItem('impersonatedUser');
    localStorage.removeItem('admin_accessToken');
    localStorage.removeItem('admin_refreshToken');
    localStorage.removeItem('admin_authSessionStartedAt');
    localStorage.removeItem('admin_user');
  } catch {
    // ignore
  }
}

export function clearAllAuthCookiesClient(): void {
  Cookies.remove('accessToken', cookieRemovePath);
  Cookies.remove('refreshToken', cookieRemovePath);
  Cookies.remove('user', cookieRemovePath);
  Cookies.remove(AUTH_SESSION_START_COOKIE, cookieRemovePath);
  clearImpersonationStorageClient();
}
