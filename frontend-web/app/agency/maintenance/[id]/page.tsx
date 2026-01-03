'use client';

import { useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { maintenanceApi, Maintenance } from '@/lib/api/maintenance';
import { updateMaintenanceSchema, UpdateMaintenanceFormData } from '@/lib/validations/maintenance';
import { agencyApi } from '@/lib/api/agency';
import { vehicleApi } from '@/lib/api/vehicle';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { FormCard } from '@/components/ui/form-card';
import { LoadingState } from '@/components/ui/loading-state';
import { ErrorState } from '@/components/ui/error-state';
import { MainLayout } from '@/components/layout/main-layout';
import { RouteGuard } from '@/components/auth/route-guard';
import { toast } from '@/components/ui/toast';

export default function EditMaintenancePage() {
  const router = useRouter();
  const params = useParams();
  const queryClient = useQueryClient();
  const maintenanceId = params.id as string;

  const { data: maintenance, isLoading } = useQuery({
    queryKey: ['maintenance', maintenanceId],
    queryFn: () => maintenanceApi.getById(maintenanceId),
    enabled: !!maintenanceId,
  });

  const { data: agencies } = useQuery({
    queryKey: ['agencies'],
    queryFn: () => agencyApi.getAll(),
  });

  const {
    register,
    handleSubmit,
    reset,
    watch,
    formState: { errors, isSubmitting },
  } = useForm<UpdateMaintenanceFormData>({
    resolver: zodResolver(updateMaintenanceSchema),
    defaultValues: {
      vehicleId: '',
      description: '',
      plannedAt: '',
      cost: undefined,
      status: 'PLANNED',
    },
  });

  const vehicleId = watch('vehicleId') || maintenance?.vehicleId;

  useEffect(() => {
    if (maintenance) {
      const plannedAt = maintenance.plannedAt ? new Date(maintenance.plannedAt).toISOString().slice(0, 16) : '';
      reset({
        vehicleId: maintenance.vehicleId || '',
        description: maintenance.description || '',
        plannedAt,
        cost: maintenance.cost,
        status: (maintenance.status as any) || 'PLANNED',
      });
    }
  }, [maintenance, reset]);

  const { data: vehicles } = useQuery({
    queryKey: ['vehicles', maintenance?.agencyId],
    queryFn: () => vehicleApi.getAll(maintenance?.agencyId),
    enabled: !!maintenance?.agencyId,
  });

  const updateMutation = useMutation({
    mutationFn: (data: UpdateMaintenanceFormData) => maintenanceApi.update(maintenanceId, data),
    onSuccess: () => {
      toast.success('Maintenance mise à jour avec succès');
      queryClient.invalidateQueries({ queryKey: ['maintenance', maintenanceId] });
      queryClient.invalidateQueries({ queryKey: ['maintenance'] });
      router.push('/agency/maintenance');
    },
    onError: (error: any) => {
      const message = error.response?.data?.message || 'Erreur lors de la mise à jour';
      toast.error(message);
    },
  });

  const onSubmit = (data: UpdateMaintenanceFormData) => {
    updateMutation.mutate(data);
  };

  if (isLoading) {
    return (
      <RouteGuard allowedRoles={['SUPER_ADMIN', 'COMPANY_ADMIN', 'AGENCY_MANAGER']}>
        <MainLayout>
          <LoadingState message="Chargement de la maintenance..." />
        </MainLayout>
      </RouteGuard>
    );
  }

  if (!maintenance) {
    return (
      <RouteGuard allowedRoles={['SUPER_ADMIN', 'COMPANY_ADMIN', 'AGENCY_MANAGER']}>
        <MainLayout>
          <ErrorState
            title="Maintenance non trouvée"
            message="La maintenance demandée n'existe pas ou a été supprimée."
            onRetry={() => router.push('/agency/maintenance')}
          />
        </MainLayout>
      </RouteGuard>
    );
  }

  return (
    <RouteGuard allowedRoles={['SUPER_ADMIN', 'COMPANY_ADMIN', 'AGENCY_MANAGER']}>
      <MainLayout>
        <FormCard
          title="Modifier la maintenance"
          description="Mettez à jour les informations de la maintenance"
          backHref="/agency/maintenance"
          onSubmit={handleSubmit(onSubmit)}
          isLoading={isSubmitting || updateMutation.isPending}
          submitLabel="Enregistrer"
        >
            <div>
              <label htmlFor="agencyId" className="block text-sm font-medium text-text mb-2">
                Agence
              </label>
              <Select
                id="agencyId"
                value={maintenance.agencyId}
                disabled
              >
                {agencies?.map((agency) => (
                  <option key={agency.id} value={agency.id}>
                    {agency.name}
                  </option>
                ))}
              </Select>
            </div>

            <div>
              <label htmlFor="vehicleId" className="block text-sm font-medium text-text mb-2">
                Véhicule *
              </label>
              <Select
                id="vehicleId"
                {...register('vehicleId')}
              >
                <option value="">Sélectionner un véhicule</option>
                {vehicles?.map((vehicle) => (
                  <option key={vehicle.id} value={vehicle.id}>
                    {vehicle.brand} {vehicle.model} - {vehicle.registrationNumber}
                  </option>
                ))}
              </Select>
              {errors.vehicleId && <p className="text-red-500 text-sm mt-1">{errors.vehicleId.message}</p>}
            </div>

            <div>
              <label htmlFor="description" className="block text-sm font-medium text-text mb-2">
                Description *
              </label>
              <Textarea
                id="description"
                {...register('description')}
              />
              {errors.description && <p className="text-red-500 text-sm mt-1">{errors.description.message}</p>}
            </div>

            <div>
              <label htmlFor="plannedAt" className="block text-sm font-medium text-text mb-2">
                Date prévue *
              </label>
              <Input
                id="plannedAt"
                type="datetime-local"
                {...register('plannedAt')}
              />
              {errors.plannedAt && <p className="text-red-500 text-sm mt-1">{errors.plannedAt.message}</p>}
            </div>

            <div>
              <label htmlFor="cost" className="block text-sm font-medium text-text mb-2">
                Coût (MAD)
              </label>
              <Input
                id="cost"
                type="number"
                step="0.01"
                {...register('cost', { valueAsNumber: true })}
              />
              {errors.cost && <p className="text-red-500 text-sm mt-1">{errors.cost.message}</p>}
            </div>

            <div>
              <label htmlFor="status" className="block text-sm font-medium text-text mb-2">
                Statut
              </label>
              <Select
                id="status"
                {...register('status')}
              >
                <option value="PLANNED">Planifiée</option>
                <option value="IN_PROGRESS">En cours</option>
                <option value="COMPLETED">Terminée</option>
                <option value="CANCELLED">Annulée</option>
              </Select>
              {errors.status && <p className="text-red-500 text-sm mt-1">{errors.status.message}</p>}
            </div>
        </FormCard>
      </MainLayout>
    </RouteGuard>
  );
}
