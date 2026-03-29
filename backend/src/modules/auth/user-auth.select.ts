import type { Prisma } from "@prisma/client";

/**
 * Champs nécessaires aux flux d’auth sans dépendre de colonnes absentes en prod
 * (ex. migrations non appliquées → `User.phone` manquant).
 */
const companyAuthSelect = {
  id: true,
  name: true,
  deletedAt: true,
  isActive: true,
  status: true,
} satisfies Prisma.CompanySelect;

const agencyAuthSelect = {
  id: true,
  name: true,
  deletedAt: true,
  status: true,
} satisfies Prisma.AgencySelect;

const userAgencyAuthSelect = {
  agencyId: true,
  permission: true,
  agency: {
    select: agencyAuthSelect,
  },
} satisfies Prisma.UserAgencySelect;

/** Session JWT / refresh / impersonation (sans mot de passe). */
export const userSessionSelect = {
  id: true,
  email: true,
  name: true,
  role: true,
  companyId: true,
  isActive: true,
  company: {
    select: companyAuthSelect,
  },
  userAgencies: {
    select: userAgencyAuthSelect,
  },
} satisfies Prisma.UserSelect;

/** Login (vérif mot de passe). */
export const userLoginSelect = {
  ...userSessionSelect,
  password: true,
} satisfies Prisma.UserSelect;

/**
 * Détail profil, listes admin, create/update user — exclut `phone` si la colonne
 * n’existe pas encore en base. Mot de passe jamais chargé.
 */
export const userProfileSelect = {
  id: true,
  email: true,
  name: true,
  address: true,
  dateOfBirth: true,
  role: true,
  companyId: true,
  isActive: true,
  twoFactorSecret: true,
  twoFactorEnabled: true,
  deletedAt: true,
  createdByUserId: true,
  updatedByUserId: true,
  deletedByUserId: true,
  deletedReason: true,
  createdAt: true,
  updatedAt: true,
  company: true,
  userAgencies: {
    select: {
      id: true,
      userId: true,
      agencyId: true,
      permission: true,
      agency: true,
    },
  },
} satisfies Prisma.UserSelect;

/** Mot de passe oublié (pas de mot de passe chargé). */
export const userForgotPasswordSelect = {
  id: true,
  email: true,
  name: true,
  isActive: true,
  companyId: true,
  company: {
    select: {
      isActive: true,
      status: true,
      deletedAt: true,
    },
  },
} satisfies Prisma.UserSelect;
