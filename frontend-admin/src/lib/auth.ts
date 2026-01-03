export interface User {
  id: string;
  email: string;
  name: string;
  role: string;
  companyId?: string;
  agencyIds?: string[];
}

export const getStoredUser = (): User | null => {
  const userStr = localStorage.getItem('user');
  if (!userStr) return null;
  try {
    return JSON.parse(userStr);
  } catch {
    return null;
  }
};

export const setStoredUser = (user: User): void => {
  localStorage.setItem('user', JSON.stringify(user));
};

export const getStoredToken = (): string | null => {
  return localStorage.getItem('token');
};

export const setStoredToken = (token: string): void => {
  localStorage.setItem('token', token);
};

export const clearAuth = (): void => {
  localStorage.removeItem('token');
  localStorage.removeItem('user');
};






