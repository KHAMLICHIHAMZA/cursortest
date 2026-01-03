/**
 * Design System - Palette de couleurs unique
 * Utilisée dans toute l'application de manière cohérente
 */

export const colors = {
  // Couleurs de base
  background: '#1D1F23',
  card: '#2C2F36',
  border: '#374151',
  text: {
    primary: '#E5E7EB',
    secondary: '#9CA3AF',
    muted: '#6B7280',
  },
  primary: {
    DEFAULT: '#3E7BFA',
    hover: '#2563EB',
    light: 'rgba(62, 123, 250, 0.1)',
  },
  
  // Couleurs de statut métier (OBLIGATOIRES)
  status: {
    // Bleu : confirmé / actif / loué
    confirmed: '#3B82F6',
    active: '#3B82F6',
    rented: '#3B82F6',
    
    // Orange : en attente / option
    pending: '#F59E0B',
    option: '#F59E0B',
    
    // Vert : disponible / succès
    available: '#10B981',
    success: '#10B981',
    
    // Rouge : retard / incident / alerte
    late: '#EF4444',
    incident: '#EF4444',
    alert: '#EF4444',
    error: '#EF4444',
    
    // Gris : terminé / inactif / bloqué
    completed: '#6B7280',
    inactive: '#6B7280',
    blocked: '#6B7280',
    cancelled: '#6B7280',
  },
  
  // Variantes avec opacité pour les backgrounds
  statusBg: {
    confirmed: 'rgba(59, 130, 246, 0.15)',
    active: 'rgba(59, 130, 246, 0.15)',
    rented: 'rgba(59, 130, 246, 0.15)',
    pending: 'rgba(245, 158, 11, 0.15)',
    option: 'rgba(245, 158, 11, 0.15)',
    available: 'rgba(16, 185, 129, 0.15)',
    success: 'rgba(16, 185, 129, 0.15)',
    late: 'rgba(239, 68, 68, 0.15)',
    incident: 'rgba(239, 68, 68, 0.15)',
    alert: 'rgba(239, 68, 68, 0.15)',
    error: 'rgba(239, 68, 68, 0.15)',
    completed: 'rgba(107, 114, 128, 0.15)',
    inactive: 'rgba(107, 114, 128, 0.15)',
    blocked: 'rgba(107, 114, 128, 0.15)',
    cancelled: 'rgba(107, 114, 128, 0.15)',
  },
} as const;



