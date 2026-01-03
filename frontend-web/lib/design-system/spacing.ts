/**
 * Design System - Espacements standardisés
 * Utilisés dans toute l'application de manière cohérente
 */

export const spacing = {
  // Padding des cartes
  card: {
    sm: 'p-4',
    md: 'p-6',
    lg: 'p-8',
  },
  
  // Marges entre sections
  section: {
    sm: 'mb-4',
    md: 'mb-6',
    lg: 'mb-8',
    xl: 'mb-12',
  },
  
  // Espacements entre éléments
  gap: {
    xs: 'gap-2',
    sm: 'gap-4',
    md: 'gap-6',
    lg: 'gap-8',
  },
  
  // Padding des boutons
  button: {
    sm: 'px-3 py-1.5',
    md: 'px-4 py-2',
    lg: 'px-6 py-3',
  },
} as const;



