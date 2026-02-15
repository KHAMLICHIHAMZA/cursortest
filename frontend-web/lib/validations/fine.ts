import { z } from 'zod';

export const createFineSchema = z.object({
  agencyId: z.string().min(1, 'L\'agence est requise'),
  bookingId: z.string().min(1, 'La réservation est requise'),
  amount: z.number().min(0.01, 'Le montant doit être supérieur à 0'),
  description: z.string().min(1, 'La description est requise'),
});

export const updateFineSchema = z.object({
  bookingId: z.string().optional(),
  amount: z.number().min(0.01, 'Le montant doit être supérieur à 0').optional(),
  description: z.string().min(1, 'La description est requise').optional(),
  status: z.enum(['RECUE', 'CLIENT_IDENTIFIE', 'TRANSMISE', 'CONTESTEE', 'CLOTUREE']).optional(),
});

export type CreateFineFormData = z.infer<typeof createFineSchema>;
export type UpdateFineFormData = z.infer<typeof updateFineSchema>;



