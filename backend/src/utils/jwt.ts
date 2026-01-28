import jwt from 'jsonwebtoken';
import { JwtPayload } from '../types';

// ⚠️ SECURITE: En production, JWT_SECRET DOIT être défini dans les variables d'environnement
// Ne JAMAIS utiliser la valeur par défaut en production
const JWT_SECRET = process.env.JWT_SECRET || 'dev-secret-key-not-for-production-use-only';
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '7d';

// Export JwtPayload for use in middleware
export type { JwtPayload };

export const generateToken = (payload: JwtPayload): string => {
  // @ts-ignore - JWT_EXPIRES_IN is valid string for expiresIn
  return jwt.sign(payload, JWT_SECRET, { expiresIn: JWT_EXPIRES_IN });
};

export const verifyToken = (token: string): JwtPayload => {
  try {
    return jwt.verify(token, JWT_SECRET) as JwtPayload;
  } catch (error) {
    throw new Error('Invalid or expired token');
  }
};

export const generateResetToken = (): string => {
  return jwt.sign({ type: 'reset' }, JWT_SECRET, { expiresIn: '1h' });
};




