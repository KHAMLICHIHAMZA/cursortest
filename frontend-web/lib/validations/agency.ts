import { z } from 'zod';

export const createAgencySchema = z.object({
  name: z.string().min(1, 'Le nom est requis'),
  phone: z.string().optional(),
  address: z.string().optional(),
  companyId: z.string().min(1, 'L\'entreprise est requise'),
});

export const updateAgencySchema = createAgencySchema.partial();

export type CreateAgencyFormData = z.infer<typeof createAgencySchema>;
export type UpdateAgencyFormData = z.infer<typeof updateAgencySchema>;



