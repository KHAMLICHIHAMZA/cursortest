'use client';

import { useRouter } from 'next/navigation';
import { useMutation, useQuery } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { maintenanceApi } from '@/lib/api/maintenance';
import { createMaintenanceSchema, CreateMaintenanceFormData } from '@/lib/validations/maintenance';
import { agencyApi } from '@/lib/api/agency';
import { vehicleApi } from '@/lib/api/vehicle';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { FormCard } from '@/components/ui/form-card';
import { MainLayout } from '@/components/layout/main-layout';
import { RouteGuard } from '@/components/auth/route-guard';
import { toast } from '@/components/ui/toast';
import { useModuleAccess } from '@/hooks/use-module-access';
import { ModuleNotIncluded, FeatureNotIncluded } from '@/components/ui/module-not-included';
import Cookies from 'js-cookie';

export default function NewMaintenancePage() {
  const router = useRouter();

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors, isSubmitting },
  } = useForm<CreateMaintenanceFormData>({
    resolver: zodResolver(createMaintenanceSchema),
    defaultValues: {
      agencyId: '',
      vehicleId: '',
      description: '',
      plannedAt: '',
      cost: undefined,
      status: 'PLANNED',
    },
  });

  const agencyId = watch('agencyId');

  // Vérifier l'accès au module MAINTENANCE
  const userStr = typeof window !== 'undefined' ? Cookies.get('user') : null;
  const user = userStr ? JSON.parse(userStr) : null;
  const currentAgencyId = agencyId || user?.agencyId || user?.userAgencies?.[0]?.agencyId;
  const { isModuleActive, isLoading: isLoadingModule } = useModuleAccess('MAINTENANCE', currentAgencyId);

  const { data: agencies } = useQuery({
    queryKey: ['agencies'],
    queryFn: () => agencyApi.getAll(),
  });

  const { data: vehicles } = useQuery({
    queryKey: ['vehicles', agencyId],
    queryFn: () => vehicleApi.getAll(agencyId),
    enabled: !!agencyId,
  });

  const createMutation = useMutation({
    mutationFn: (data: CreateMaintenanceFormData) => maintenanceApi.create(data),
    onSuccess: () => {
      toast.success('Maintenance créée avec succès');
      router.push('/agency/maintenance');
    },
    onError: (error: any) => {
      const errorMessage = error?.response?.data?.message || error?.message || 'Erreur lors de la création';
      
      // Gérer les erreurs 403 liées aux modules
      if (error?.status === 403 && error?.isModuleError) {
        toast.error('Le module Gestion de la maintenance n\'est pas activé pour votre agence.');
      } else {
        toast.error(errorMessage);
      }
    },
  });

  const onSubmit = (data: CreateMaintenanceFormData) => {
    createMutation.mutate(data);
  };

  // Afficher le message si le module n'est pas activé
  if (!isLoadingModule && !isModuleActive) {
    return (
      <RouteGuard allowedRoles={['SUPER_ADMIN', 'COMPANY_ADMIN', 'AGENCY_MANAGER']}>
        <MainLayout>
          <ModuleNotIncluded 
            moduleName="MAINTENANCE"
            onUpgrade={() => router.push('/company')}
          />
        </MainLayout>
      </RouteGuard>
    );
  }

  return (
    <RouteGuard allowedRoles={['SUPER_ADMIN', 'COMPANY_ADMIN', 'AGENCY_MANAGER']}>
      <MainLayout>
        {!isModuleActive && (
          <div className="mb-6">
            <FeatureNotIncluded 
              featureName="Création de maintenance" 
              moduleName="MAINTENANCE"
            />
          </div>
        )}
        <FormCard
          title="Nouvelle maintenance"
          description="Planifiez une nouvelle opération de maintenance"
          backHref="/agency/maintenance"
          onSubmit={handleSubmit(onSubmit)}
          isLoading={isSubmitting || createMutation.isPending}
          submitLabel="Créer la maintenance"
        >
          <div>
            <label htmlFor="agencyId" className="block text-sm font-medium text-text mb-2">
              Agence *
            </label>
            <Select
              id="agencyId"
              {...register('agencyId')}
            >
              <option value="">Sélectionner une agence</option>
              {agencies?.map((agency) => (
                <option key={agency.id} value={agency.id}>
                  {agency.name}
                </option>
              ))}
            </Select>
            {errors.agencyId && <p className="text-red-500 text-sm mt-1">{errors.agencyId.message}</p>}
          </div>

          <div>
            <label htmlFor="vehicleId" className="block text-sm font-medium text-text mb-2">
              Véhicule *
            </label>
            <Select
              id="vehicleId"
              {...register('vehicleId')}
              disabled={!agencyId}
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

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label htmlFor="plannedAt" className="block text-sm font-medium text-text mb-2">
                Date prévue
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
