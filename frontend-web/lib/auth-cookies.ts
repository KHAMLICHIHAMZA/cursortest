/** Options communes : path explicite évite un cookie limité à /login ; utile aussi en navigation privée. */
export const authCookieBase = {
  path: '/',
  sameSite: 'lax' as const,
  secure: process.env.NODE_ENV === 'production',
};
