import { z } from 'zod';

export const createVehicleSchema = z.object({
  brand: z.string().min(1, 'La marque est requise'),
  model: z.string().min(1, 'Le modèle est requis'),
  registrationNumber: z.string().min(1, 'Le numéro d\'immatriculation est requis'),
  agencyId: z.string().min(1, 'L\'agence est requise'),
  year: z.number().int().min(1900).max(new Date().getFullYear() + 1).optional(),
  color: z.string().optional(),
  mileage: z.number().int().min(0).optional(),
  dailyRate: z.number().min(0).optional(),
  depositAmount: z.number().min(0).optional(),
  status: z.enum(['AVAILABLE', 'RENTED', 'MAINTENANCE', 'UNAVAILABLE']).optional(),
  imageUrl: z.string().optional().or(z.literal('')).refine(
    (val) => {
      if (!val || val === '') return true;
      return val.startsWith('http://') || val.startsWith('https://') || val.startsWith('/');
    },
    {
      message: 'L\'URL de l\'image doit être valide (URL complète ou chemin relatif)',
    }
  ),
  horsepower: z.number().int().min(0).optional(),
  fuel: z.string().optional(),
  gearbox: z.string().optional(),
  purchasePrice: z.number().min(0, 'Le prix d\'achat doit être positif').optional(),
  acquisitionDate: z.string().optional(),
  amortizationYears: z.number().int().min(1, 'Minimum 1 an').max(30, 'Maximum 30 ans').optional(),
  financingType: z.enum(['CASH', 'CREDIT', 'MIXED']).or(z.literal('')).optional(),
  downPayment: z.number().min(0, 'L\'apport doit être positif').optional(),
  monthlyPayment: z.number().min(0, 'La mensualité doit être positive').optional(),
  financingDurationMonths: z.number().int().min(1).max(120, 'Maximum 10 ans').optional(),
  creditStartDate: z.string().optional(),
});

export const updateVehicleSchema = createVehicleSchema.partial();

export type CreateVehicleFormData = z.infer<typeof createVehicleSchema>;
export type UpdateVehicleFormData = z.infer<typeof updateVehicleSchema>;

