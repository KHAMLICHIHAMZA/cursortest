/**
 * Design System - Typographie MalocAuto v2
 * Two-font system: Inter for body, Inter for headings (with tracking)
 */

export const typography = {
  fontFamily: {
    sans: ['Inter', 'system-ui', 'sans-serif'],
  },

  // Heading scale with negative tracking for premium feel
  heading: {
    h1: 'text-3xl font-semibold tracking-tight leading-tight',      // Page titles
    h2: 'text-2xl font-semibold tracking-tight leading-tight',      // Section titles
    h3: 'text-xl font-medium tracking-tight leading-snug',          // Card titles
    h4: 'text-lg font-medium leading-snug',                         // Subsection titles
    h5: 'text-base font-medium leading-normal',                     // Small titles
  },

  // Body text scale
  body: {
    lg: 'text-base font-normal leading-relaxed',                    // Primary body
    base: 'text-sm font-normal leading-relaxed',                    // Default body
    sm: 'text-xs font-normal leading-normal',                       // Small text
  },

  // Label scale (uppercase micro labels for sections)
  label: {
    section: 'text-[11px] font-semibold uppercase tracking-widest text-foreground-subtle',
    field: 'text-sm font-medium text-foreground-muted',
    caption: 'text-xs text-foreground-subtle',
  },

  fontSize: {
    xs: '0.75rem',
    sm: '0.875rem',
    base: '1rem',
    lg: '1.125rem',
    xl: '1.25rem',
    '2xl': '1.5rem',
    '3xl': '1.875rem',
  },

  fontWeight: {
    normal: 400,
    medium: 500,
    semibold: 600,
    bold: 700,
  },

  lineHeight: {
    tight: 1.25,
    snug: 1.375,
    normal: 1.5,
    relaxed: 1.625,
  },
} as const;



