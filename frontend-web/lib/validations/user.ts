import { z } from 'zod';

export const createUserSchema = z.object({
  email: z.string().email('Email invalide'),
  name: z.string().min(1, 'Le nom est requis'),
  role: z.enum(['SUPER_ADMIN', 'COMPANY_ADMIN', 'AGENCY_MANAGER', 'AGENT']),
  companyId: z.string().optional(),
  agencyIds: z.array(z.string()).optional(),
});

export const updateUserSchema = z.object({
  name: z.string().min(1, 'Le nom est requis').optional(),
  role: z.enum(['SUPER_ADMIN', 'COMPANY_ADMIN', 'AGENCY_MANAGER', 'AGENT']).optional(),
  isActive: z.boolean().optional(),
  agencyIds: z.array(z.string()).optional(),
});

export type CreateUserFormData = z.infer<typeof createUserSchema>;
export type UpdateUserFormData = z.infer<typeof updateUserSchema>;

