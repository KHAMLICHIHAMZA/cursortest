import { z } from 'zod';

export const createBookingSchema = z.object({
  agencyId: z.string().min(1, 'L\'agence est requise'),
  vehicleId: z.string().min(1, 'Le véhicule est requis'),
  clientId: z.string().min(1, 'Le client est requis'),
  startDate: z.string().min(1, 'La date de début est requise'),
  endDate: z.string().min(1, 'La date de fin est requise'),
  totalAmount: z.number().min(0, 'Le montant doit être positif').optional(),
  status: z.enum(['DRAFT', 'PENDING', 'CONFIRMED']).optional(),
  // Champs caution (R3)
  depositRequired: z.boolean().optional(),
  depositAmount: z.number().min(0, 'Le montant de la caution doit être positif').optional(),
  depositDecisionSource: z.enum(['COMPANY', 'AGENCY']).optional(),
}).refine((data) => {
  if (data.startDate && data.endDate) {
    return new Date(data.startDate) < new Date(data.endDate);
  }
  return true;
}, {
  message: 'La date de fin doit être après la date de début',
  path: ['endDate'],
}).refine((data) => {
  // Si une caution est requise, le montant et la source de décision sont obligatoires
  if (data.depositRequired === true) {
    return data.depositAmount !== undefined && data.depositAmount > 0 && data.depositDecisionSource !== undefined;
  }
  return true;
}, {
  message: 'Si une caution est requise, le montant et la source de décision sont obligatoires',
  path: ['depositAmount'],
});

export const updateBookingSchema = z.object({
  startDate: z.string().optional(),
  endDate: z.string().optional(),
  totalAmount: z.number().min(0, 'Le montant doit être positif').optional(),
  status: z.enum(['DRAFT', 'PENDING', 'CONFIRMED', 'IN_PROGRESS', 'RETURNED', 'CANCELLED', 'LATE', 'NO_SHOW']).optional(),
  depositRequired: z.boolean().optional(),
  depositAmount: z.number().min(0, 'Le montant de la caution doit être positif').optional().nullable(),
  depositDecisionSource: z.enum(['COMPANY', 'AGENCY']).optional().nullable(),
}).refine((data) => {
  if (data.startDate && data.endDate) {
    return new Date(data.startDate) < new Date(data.endDate);
  }
  return true;
}, {
  message: 'La date de fin doit être après la date de début',
  path: ['endDate'],
});

export type CreateBookingFormData = z.infer<typeof createBookingSchema>;
export type UpdateBookingFormData = z.infer<typeof updateBookingSchema>;



