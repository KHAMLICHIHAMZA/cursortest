import { z } from 'zod';

const COMPANY_LEGAL_FORMS = [
  'SARL',
  'SAS',
  'SA',
  'EI',
  'AUTO_ENTREPRENEUR',
  'ASSOCIATION',
  'AUTRE',
] as const;

export const createCompanySchema = z.object({
  name: z.string().min(1, 'Le nom est requis'),
  raisonSociale: z.string().min(1, 'La raison sociale est requise'),
  identifiantLegal: z.string().min(1, "L'identifiant légal est requis"),
  formeJuridique: z.enum(COMPANY_LEGAL_FORMS, { message: 'Forme juridique invalide' }),
  phone: z.string().optional(),
  address: z.string().optional(),
  adminEmail: z.string().email('Email invalide').optional().or(z.literal('')),
  adminName: z.string().optional(),
});

export const updateCompanySchema = z.object({
  name: z.string().min(1, 'Le nom est requis').optional(),
  phone: z.string().optional(),
  address: z.string().optional(),
  isActive: z.boolean().optional(),
});

export type CreateCompanyFormData = z.infer<typeof createCompanySchema>;
export type UpdateCompanyFormData = z.infer<typeof updateCompanySchema>;



