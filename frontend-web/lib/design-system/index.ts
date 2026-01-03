/**
 * Design System Centralisé
 * Point d'entrée unique pour tous les styles de l'application
 */

export { colors } from './colors';
export { typography } from './typography';
export { spacing } from './spacing';

// Types pour TypeScript
export type ColorKey = keyof typeof import('./colors').colors.status;
export type StatusKey = 'confirmed' | 'active' | 'rented' | 'pending' | 'option' | 'available' | 'success' | 'late' | 'incident' | 'alert' | 'error' | 'completed' | 'inactive' | 'blocked' | 'cancelled';



