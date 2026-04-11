/** Routes statiques à vérifier (chargement sans erreur serveur évidente). */

export const ADMIN_PATHS = [
  '/admin',
  '/admin/companies',
  '/admin/companies/new',
  '/admin/companies/new-validated',
  '/admin/agencies',
  '/admin/agencies/new',
  '/admin/users',
  '/admin/users/new',
  '/admin/subscriptions',
  '/admin/plans',
  '/admin/settings',
  '/admin/company-health',
  '/admin/notifications',
  '/admin/profile',
] as const;

export const COMPANY_PATHS = [
  '/company',
  '/company/agencies',
  '/company/agencies/new',
  '/company/users',
  '/company/users/new',
  '/company/analytics',
  '/company/planning',
  '/company/notifications',
  '/company/profile',
] as const;

/** Manager + agent peuvent ouvrir ; certaines pages redirigent l’agent (journal métier). */
export const AGENCY_PATHS = [
  '/agency',
  '/agency/bookings',
  '/agency/bookings/new',
  '/agency/vehicles',
  '/agency/vehicles/new',
  '/agency/clients',
  '/agency/clients/new',
  '/agency/invoices',
  '/agency/contracts',
  '/agency/journal',
  '/agency/fines',
  '/agency/fines/new',
  '/agency/maintenance',
  '/agency/maintenance/new',
  '/agency/kpi',
  '/agency/gps',
  '/agency/gps-kpi',
  '/agency/planning',
  '/agency/charges',
  '/agency/notifications',
  '/agency/profile',
] as const;
