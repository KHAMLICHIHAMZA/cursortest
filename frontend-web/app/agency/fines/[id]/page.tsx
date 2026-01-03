'use client';

import { useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { fineApi, Fine } from '@/lib/api/fine';
import { updateFineSchema, UpdateFineFormData } from '@/lib/validations/fine';
import { agencyApi } from '@/lib/api/agency';
import { bookingApi } from '@/lib/api/booking';
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

export default function EditFinePage() {
  const router = useRouter();
  const params = useParams();
  const queryClient = useQueryClient();
  const fineId = params.id as string;

  const { data: fine, isLoading } = useQuery({
    queryKey: ['fine', fineId],
    queryFn: () => fineApi.getById(fineId),
    enabled: !!fineId,
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
  } = useForm<UpdateFineFormData>({
    resolver: zodResolver(updateFineSchema),
    defaultValues: {
      bookingId: '',
      amount: 0,
      description: '',
      isPaid: false,
    },
  });

  const agencyId = fine?.agencyId;

  useEffect(() => {
    if (fine) {
      reset({
        bookingId: fine.bookingId || '',
        amount: fine.amount || 0,
        description: fine.description || '',
        isPaid: fine.isPaid || false,
      });
    }
  }, [fine, reset]);

  const { data: bookings } = useQuery({
    queryKey: ['bookings', agencyId],
    queryFn: () => bookingApi.getAll({ agencyId }),
    enabled: !!agencyId,
  });

  const updateMutation = useMutation({
    mutationFn: (data: UpdateFineFormData) => fineApi.update(fineId, data),
    onSuccess: () => {
      toast.success('Amende mise à jour avec succès');
      queryClient.invalidateQueries({ queryKey: ['fine', fineId] });
      queryClient.invalidateQueries({ queryKey: ['fines'] });
      router.push('/agency/fines');
    },
    onError: (error: any) => {
      const message = error.response?.data?.message || 'Erreur lors de la mise à jour';
      toast.error(message);
    },
  });

  const onSubmit = (data: UpdateFineFormData) => {
    updateMutation.mutate(data);
  };

  if (isLoading) {
    return (
      <RouteGuard allowedRoles={['SUPER_ADMIN', 'COMPANY_ADMIN', 'AGENCY_MANAGER', 'AGENT']}>
        <MainLayout>
          <LoadingState message="Chargement de l'amende..." />
        </MainLayout>
      </RouteGuard>
    );
  }

  if (!fine) {
    return (
      <RouteGuard allowedRoles={['SUPER_ADMIN', 'COMPANY_ADMIN', 'AGENCY_MANAGER', 'AGENT']}>
        <MainLayout>
          <ErrorState
            title="Amende non trouvée"
            message="L'amende demandée n'existe pas ou a été supprimée."
            onRetry={() => router.push('/agency/fines')}
          />
        </MainLayout>
      </RouteGuard>
    );
  }

  return (
    <RouteGuard allowedRoles={['SUPER_ADMIN', 'COMPANY_ADMIN', 'AGENCY_MANAGER', 'AGENT']}>
      <MainLayout>
        <FormCard
          title="Modifier l'amende"
          description="Mettez à jour les informations de l'amende"
          backHref="/agency/fines"
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
                value={fine.agencyId}
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
              <label htmlFor="bookingId" className="block text-sm font-medium text-text mb-2">
                Réservation
              </label>
              <Select
                id="bookingId"
                {...register('bookingId')}
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
                Montant (MAD)
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
                Description
              </label>
              <Textarea
                id="description"
                {...register('description')}
              />
              {errors.description && <p className="text-red-500 text-sm mt-1">{errors.description.message}</p>}
            </div>

            <div>
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  {...register('isPaid')}
                  className="w-4 h-4 rounded border-border text-primary focus:ring-primary"
                />
                <span className="text-sm text-text">Payée</span>
              </label>
            </div>
        </FormCard>
      </MainLayout>
    </RouteGuard>
  );
}
