import { z } from 'zod';

// Fonction helper pour valider les dates d'expiration
const validateExpiryDate = (date: string | undefined, fieldName: string) => {
  if (!date) return true;
  const expiryDate = new Date(date);
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  return expiryDate >= today;
};

// Fonction helper pour valider les dates passées (date de naissance)
const validatePastDate = (date: string | undefined) => {
  if (!date) return true;
  const birthDate = new Date(date);
  const today = new Date();
  return birthDate <= today;
};

export const createClientSchema = z.object({
  firstName: z.string().min(1, 'Le prénom est requis').max(100, 'Le prénom ne peut pas dépasser 100 caractères'),
  lastName: z.string().min(1, 'Le nom est requis').max(100, 'Le nom ne peut pas dépasser 100 caractères'),
  email: z.string().email('Email invalide').max(255, 'L\'email ne peut pas dépasser 255 caractères'),
  phone: z.string().min(1, 'Le téléphone est requis').max(20, 'Le téléphone ne peut pas dépasser 20 caractères'),
  agencyId: z.string().min(1, 'L\'agence est requise'),
  dateOfBirth: z.string().optional().refine(
    (val) => validatePastDate(val),
    { message: 'La date de naissance doit être dans le passé' }
  ),
  address: z.string().max(500, 'L\'adresse ne peut pas dépasser 500 caractères').optional(),
  licenseNumber: z.string().max(50, 'Le numéro de permis ne peut pas dépasser 50 caractères').optional(),
  licenseImageUrl: z.string().optional().or(z.literal('')).refine(
    (val) => {
      if (!val || val === '') return true;
      return val.startsWith('http://') || val.startsWith('https://') || val.startsWith('/');
    },
    {
      message: 'L\'URL de l\'image doit être valide (URL complète ou chemin relatif)',
    }
  ),
  isMoroccan: z.boolean().optional().default(true),
  countryOfOrigin: z.string().max(100, 'Le pays d\'origine ne peut pas dépasser 100 caractères').optional(),
  licenseExpiryDate: z.string().optional().refine(
    (val) => validateExpiryDate(val, 'permis'),
    { message: 'La date d\'expiration du permis doit être dans le futur' }
  ),
  isForeignLicense: z.boolean().optional().default(false),
  idCardNumber: z.string().max(50, 'Le numéro de pièce d\'identité ne peut pas dépasser 50 caractères').optional(),
  idCardExpiryDate: z.string().optional().refine(
    (val) => validateExpiryDate(val, 'pièce d\'identité'),
    { message: 'La date d\'expiration de la pièce d\'identité doit être dans le futur' }
  ),
  passportNumber: z.string().max(50, 'Le numéro de passeport ne peut pas dépasser 50 caractères').optional(),
  passportExpiryDate: z.string().optional().refine(
    (val) => validateExpiryDate(val, 'passeport'),
    { message: 'La date d\'expiration du passeport doit être dans le futur' }
  ),
}).refine(
  (data) => {
    // Règle: Si non-marocain, le pays d'origine est obligatoire
    if (data.isMoroccan === false && !data.countryOfOrigin) {
      return false;
    }
    return true;
  },
  {
    message: 'Le pays d\'origine est obligatoire pour les clients non-marocains',
    path: ['countryOfOrigin'],
  }
).refine(
  (data) => {
    // Règle: Si non-marocain ou marocain résidant à l'étranger, au moins une pièce d'identité ou un passeport est requis
    if ((data.isMoroccan === false || (data.isMoroccan === true && data.countryOfOrigin)) && 
        !data.idCardNumber && !data.passportNumber) {
      return false;
    }
    return true;
  },
  {
    message: 'Au moins une pièce d\'identité ou un passeport est requis pour les non-marocains ou marocains résidant à l\'étranger',
    path: ['idCardNumber'],
  }
).refine(
  (data) => {
    // Règle: Si numéro de pièce d'identité, la date d'expiration est requise
    if (data.idCardNumber && !data.idCardExpiryDate) {
      return false;
    }
    return true;
  },
  {
    message: 'La date d\'expiration de la pièce d\'identité est requise',
    path: ['idCardExpiryDate'],
  }
).refine(
  (data) => {
    // Règle: Si numéro de passeport, la date d'expiration est requise
    if (data.passportNumber && !data.passportExpiryDate) {
      return false;
    }
    return true;
  },
  {
    message: 'La date d\'expiration du passeport est requise',
    path: ['passportExpiryDate'],
  }
).refine(
  (data) => {
    // Règle: Si numéro de permis, la date d'expiration est recommandée mais pas obligatoire
    // (on laisse cette règle optionnelle pour plus de flexibilité)
    return true;
  }
);

export const updateClientSchema = z.object({
  firstName: z.string().min(1, 'Le prénom est requis').max(100, 'Le prénom ne peut pas dépasser 100 caractères').optional(),
  lastName: z.string().min(1, 'Le nom est requis').max(100, 'Le nom ne peut pas dépasser 100 caractères').optional(),
  email: z.string().email('Email invalide').max(255, 'L\'email ne peut pas dépasser 255 caractères').optional(),
  phone: z.string().min(1, 'Le téléphone est requis').max(20, 'Le téléphone ne peut pas dépasser 20 caractères').optional(),
  dateOfBirth: z.string().optional().refine(
    (val) => validatePastDate(val),
    { message: 'La date de naissance doit être dans le passé' }
  ),
  address: z.string().max(500, 'L\'adresse ne peut pas dépasser 500 caractères').optional(),
  licenseNumber: z.string().max(50, 'Le numéro de permis ne peut pas dépasser 50 caractères').optional(),
  licenseImageUrl: z.string().optional().or(z.literal('')).refine(
    (val) => {
      if (!val || val === '') return true;
      return val.startsWith('http://') || val.startsWith('https://') || val.startsWith('/');
    },
    {
      message: 'L\'URL de l\'image doit être valide (URL complète ou chemin relatif)',
    }
  ),
  isMoroccan: z.boolean().optional(),
  countryOfOrigin: z.string().max(100, 'Le pays d\'origine ne peut pas dépasser 100 caractères').optional(),
  licenseExpiryDate: z.string().optional().refine(
    (val) => validateExpiryDate(val, 'permis'),
    { message: 'La date d\'expiration du permis doit être dans le futur' }
  ),
  isForeignLicense: z.boolean().optional(),
  idCardNumber: z.string().max(50, 'Le numéro de pièce d\'identité ne peut pas dépasser 50 caractères').optional(),
  idCardExpiryDate: z.string().optional().refine(
    (val) => validateExpiryDate(val, 'pièce d\'identité'),
    { message: 'La date d\'expiration de la pièce d\'identité doit être dans le futur' }
  ),
  passportNumber: z.string().max(50, 'Le numéro de passeport ne peut pas dépasser 50 caractères').optional(),
  passportExpiryDate: z.string().optional().refine(
    (val) => validateExpiryDate(val, 'passeport'),
    { message: 'La date d\'expiration du passeport doit être dans le futur' }
  ),
  isActive: z.boolean().optional(),
});

export type CreateClientFormData = z.infer<typeof createClientSchema>;
export type UpdateClientFormData = z.infer<typeof updateClientSchema>;


