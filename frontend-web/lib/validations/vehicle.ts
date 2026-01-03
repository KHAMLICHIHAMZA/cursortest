import { z } from 'zod';

export const createVehicleSchema = z.object({
  brand: z.string().min(1, 'La marque est requise'),
  model: z.string().min(1, 'Le modèle est requis'),
  registrationNumber: z.string().min(1, 'Le numéro d\'immatriculation est requis'),
  agencyId: z.string().min(1, 'L\'agence est requise'),
  year: z.number().int().min(1900).max(new Date().getFullYear() + 1).optional(),
  color: z.string().optional(),
  dailyRate: z.number().min(0).optional(),
  status: z.enum(['AVAILABLE', 'RENTED', 'MAINTENANCE', 'UNAVAILABLE']).optional(),
  imageUrl: z.string().optional().or(z.literal('')).refine(
    (val) => {
      if (!val || val === '') return true;
      // Accepter les URLs complètes (http://, https://) ou les chemins relatifs (/uploads/...)
      return val.startsWith('http://') || val.startsWith('https://') || val.startsWith('/');
    },
    {
      message: 'L\'URL de l\'image doit être valide (URL complète ou chemin relatif)',
    }
  ),
  horsepower: z.number().int().min(0).optional(),
  fuel: z.string().optional(),
  gearbox: z.string().optional(),
});

export const updateVehicleSchema = createVehicleSchema.partial();

export type CreateVehicleFormData = z.infer<typeof createVehicleSchema>;
export type UpdateVehicleFormData = z.infer<typeof updateVehicleSchema>;

