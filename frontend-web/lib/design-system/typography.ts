/**
 * Design System - Typographie unique
 * Utilisée dans toute l'application de manière cohérente
 */

export const typography = {
  fontFamily: {
    sans: ['Inter', 'system-ui', 'sans-serif'],
  },
  
  fontSize: {
    xs: '0.75rem',    // 12px - Badges, labels
    sm: '0.875rem',   // 14px - Textes secondaires
    base: '1rem',     // 16px - Textes principaux
    lg: '1.125rem',   // 18px - Sous-titres
    xl: '1.25rem',    // 20px - Titres de section
    '2xl': '1.5rem',  // 24px - Titres moyens
    '3xl': '1.875rem', // 30px - Titres principaux
  },
  
  fontWeight: {
    normal: 400,
    medium: 500,
    semibold: 600,
    bold: 700,
  },
  
  lineHeight: {
    tight: 1.25,
    normal: 1.5,
    relaxed: 1.75,
  },
} as const;



