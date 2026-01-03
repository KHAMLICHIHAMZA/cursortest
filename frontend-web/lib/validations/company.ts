import { z } from 'zod';

export const createCompanySchema = z.object({
  name: z.string().min(1, 'Le nom est requis'),
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



