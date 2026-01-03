'use client';

import { useRouter } from 'next/navigation';
import { useMutation, useQuery } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { fineApi } from '@/lib/api/fine';
import { createFineSchema, CreateFineFormData } from '@/lib/validations/fine';
import { agencyApi } from '@/lib/api/agency';
import { bookingApi } from '@/lib/api/booking';
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

export default function NewFinePage() {
  const router = useRouter();

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors, isSubmitting },
  } = useForm<CreateFineFormData>({
    resolver: zodResolver(createFineSchema),
    defaultValues: {
      agencyId: '',
      bookingId: '',
      amount: 0,
      description: '',
    },
  });

  const agencyId = watch('agencyId');

  // Vérifier l'accès au module FINES
  const userStr = typeof window !== 'undefined' ? Cookies.get('user') : null;
  const user = userStr ? JSON.parse(userStr) : null;
  const currentAgencyId = agencyId || user?.agencyId || user?.userAgencies?.[0]?.agencyId;
  const { isModuleActive, isLoading: isLoadingModule } = useModuleAccess('FINES', currentAgencyId);

  const { data: agencies } = useQuery({
    queryKey: ['agencies'],
    queryFn: () => agencyApi.getAll(),
  });

  const { data: bookings } = useQuery({
    queryKey: ['bookings', agencyId],
    queryFn: () => bookingApi.getAll({ agencyId }),
    enabled: !!agencyId,
  });

  const createMutation = useMutation({
    mutationFn: (data: CreateFineFormData) => fineApi.create(data),
    onSuccess: () => {
      toast.success('Amende créée avec succès');
      router.push('/agency/fines');
    },
    onError: (error: any) => {
      const errorMessage = error?.response?.data?.message || error?.message || 'Erreur lors de la création';
      
      // Gérer les erreurs 403 liées aux modules
      if (error?.status === 403 && error?.isModuleError) {
        toast.error('Le module Gestion des amendes n\'est pas activé pour votre agence.');
      } else {
        toast.error(errorMessage);
      }
    },
  });

  const onSubmit = (data: CreateFineFormData) => {
    createMutation.mutate(data);
  };

  // Afficher le message si le module n'est pas activé
  if (!isLoadingModule && !isModuleActive) {
    return (
      <RouteGuard allowedRoles={['SUPER_ADMIN', 'COMPANY_ADMIN', 'AGENCY_MANAGER', 'AGENT']}>
        <MainLayout>
          <ModuleNotIncluded 
            moduleName="FINES"
            onUpgrade={() => router.push('/company')}
          />
        </MainLayout>
      </RouteGuard>
    );
  }

  return (
    <RouteGuard allowedRoles={['SUPER_ADMIN', 'COMPANY_ADMIN', 'AGENCY_MANAGER', 'AGENT']}>
      <MainLayout>
        {!isModuleActive && (
          <div className="mb-6">
            <FeatureNotIncluded 
              featureName="Création d'amende" 
              moduleName="FINES"
            />
          </div>
        )}
        <FormCard
          title="Nouvelle amende"
          description="Enregistrez une nouvelle amende ou contravention"
          backHref="/agency/fines"
          onSubmit={handleSubmit(onSubmit)}
          isLoading={isSubmitting || createMutation.isPending}
          submitLabel="Créer l'amende"
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
            <label htmlFor="bookingId" className="block text-sm font-medium text-text mb-2">
              Réservation *
            </label>
            <Select
              id="bookingId"
              {...register('bookingId')}
              disabled={!agencyId}
            >
              <option value="">Sélectionner une réservation</option>
              {bookings?.map((booking) => (
                <option key={booking.id} value={booking.id}>
                  {booking.vehicle?.brand} {booking.vehicle?.model} - {booking.client?.firstName}{' '}
                  {booking.client?.lastName} ({new Date(booking.startDate).toLocaleDateString('fr-FR')})
                </option>
              ))}
            </Select>
            {errors.bookingId && <p className="text-red-500 text-sm mt-1">{errors.bookingId.message}</p>}
          </div>

          <div>
            <label htmlFor="amount" className="block text-sm font-medium text-text mb-2">
              Montant (MAD) *
            </label>
            <Input
              id="amount"
              type="number"
              step="0.01"
              min="0"
              {...register('amount', { valueAsNumber: true })}
            />
            {errors.amount && <p className="text-red-500 text-sm mt-1">{errors.amount.message}</p>}
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
        </FormCard>
      </MainLayout>
    </RouteGuard>
  );
}
