/**
 * Design System - Palette de couleurs MalocAuto v2
 * Premium dark theme with warm amber automotive accent
 */

export const colors = {
  // Surfaces (dark depth system)
  background: '#0A0A0C',
  surface: {
    0: '#0E0E11',
    1: '#141418',
    2: '#1C1C21',
    3: '#26262C',
  },
  card: '#141418',

  // Text
  text: {
    primary: '#FAFAFA',
    secondary: '#A3A3A3',
    muted: '#737373',
  },

  // Borders
  border: {
    DEFAULT: '#26262C',
    hover: '#37373E',
  },

  // Brand
  primary: {
    DEFAULT: '#F5A623',
    hover: '#E09418',
    foreground: '#0A0A0C',
    light: 'rgba(245, 166, 35, 0.12)',
  },
  accent: {
    DEFAULT: '#3B82F6',
    hover: '#2563EB',
    light: 'rgba(59, 130, 246, 0.12)',
  },

  // Status colors (semantic business states)
  status: {
    confirmed: '#3B82F6',
    active: '#3B82F6',
    rented: '#3B82F6',

    pending: '#F5A623',
    option: '#F5A623',

    available: '#22C55E',
    success: '#22C55E',

    late: '#EF4444',
    incident: '#EF4444',
    alert: '#EF4444',
    error: '#EF4444',

    completed: '#737373',
    inactive: '#737373',
    blocked: '#737373',
    cancelled: '#737373',
  },

  // Status backgrounds (12% opacity)
  statusBg: {
    confirmed: 'rgba(59, 130, 246, 0.12)',
    active: 'rgba(59, 130, 246, 0.12)',
    rented: 'rgba(59, 130, 246, 0.12)',
    pending: 'rgba(245, 166, 35, 0.12)',
    option: 'rgba(245, 166, 35, 0.12)',
    available: 'rgba(34, 197, 94, 0.12)',
    success: 'rgba(34, 197, 94, 0.12)',
    late: 'rgba(239, 68, 68, 0.12)',
    incident: 'rgba(239, 68, 68, 0.12)',
    alert: 'rgba(239, 68, 68, 0.12)',
    error: 'rgba(239, 68, 68, 0.12)',
    completed: 'rgba(115, 115, 115, 0.12)',
    inactive: 'rgba(115, 115, 115, 0.12)',
    blocked: 'rgba(115, 115, 115, 0.12)',
    cancelled: 'rgba(115, 115, 115, 0.12)',
  },
} as const;



