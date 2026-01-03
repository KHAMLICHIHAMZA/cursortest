import { z } from 'zod';

export const createMaintenanceSchema = z.object({
  agencyId: z.string().min(1, 'L\'agence est requise'),
  vehicleId: z.string().min(1, 'Le véhicule est requis'),
  description: z.string().min(1, 'La description est requise'),
  plannedAt: z.string().optional(),
  cost: z.number().min(0, 'Le coût doit être positif').optional(),
  status: z.enum(['PLANNED', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED']).optional(),
});

export const updateMaintenanceSchema = z.object({
  vehicleId: z.string().optional(),
  description: z.string().min(1, 'La description est requise').optional(),
  plannedAt: z.string().optional(),
  cost: z.number().min(0, 'Le coût doit être positif').optional(),
  status: z.enum(['PLANNED', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED']).optional(),
});

export type CreateMaintenanceFormData = z.infer<typeof createMaintenanceSchema>;
export type UpdateMaintenanceFormData = z.infer<typeof updateMaintenanceSchema>;



