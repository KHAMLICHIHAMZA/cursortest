'use client';

import { useRouter } from 'next/navigation';
import { useMutation, useQuery } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { bookingApi } from '@/lib/api/booking';
import { createBookingSchema, CreateBookingFormData } from '@/lib/validations/booking';
import { agencyApi } from '@/lib/api/agency';
import { vehicleApi } from '@/lib/api/vehicle';
import { clientApi } from '@/lib/api/client-api';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select } from '@/components/ui/select';
import { FormCard } from '@/components/ui/form-card';
import { MainLayout } from '@/components/layout/main-layout';
import { RouteGuard } from '@/components/auth/route-guard';
import { toast } from '@/components/ui/toast';
import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';
import { useModuleAccess } from '@/hooks/use-module-access';
import { ModuleNotIncluded, FeatureNotIncluded } from '@/components/ui/module-not-included';
import Cookies from 'js-cookie';
import { useState, useEffect, useMemo } from 'react';

export default function NewBookingPage() {
  const router = useRouter();
  
  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm<CreateBookingFormData>({
    resolver: zodResolver(createBookingSchema),
    defaultValues: {
      agencyId: '',
      vehicleId: '',
      clientId: '',
      startDate: '',
      endDate: '',
      totalAmount: 0,
      status: 'DRAFT',
      depositRequired: false,
      depositAmount: undefined,
      depositDecisionSource: undefined,
    },
  });

  const agencyId = watch('agencyId');

  // Vérifier l'accès au module BOOKINGS
  const userStr = typeof window !== 'undefined' ? Cookies.get('user') : null;
  const user = userStr ? JSON.parse(userStr) : null;
  const currentAgencyId = agencyId || user?.agencyId || user?.userAgencies?.[0]?.agencyId;
  const { isModuleActive, isLoading: isLoadingModule } = useModuleAccess('BOOKINGS', currentAgencyId);

  const { data: agencies } = useQuery({
    queryKey: ['agencies'],
    queryFn: () => agencyApi.getAll(),
  });

  const { data: vehicles } = useQuery({
    queryKey: ['vehicles', agencyId],
    queryFn: () => vehicleApi.getAll(agencyId),
    enabled: !!agencyId,
  });

  const { data: clients } = useQuery({
    queryKey: ['clients', agencyId],
    queryFn: () => clientApi.getAll(agencyId),
    enabled: !!agencyId,
  });

  // Auto-calcul du prix total = tarif journalier × nombre de jours
  const vehicleId = watch('vehicleId');
  const startDate = watch('startDate');
  const endDate = watch('endDate');

  const selectedVehicle = useMemo(
    () => vehicles?.find((v) => v.id === vehicleId),
    [vehicles, vehicleId]
  );

  useEffect(() => {
    if (!selectedVehicle?.dailyRate || !startDate || !endDate) return;

    const start = new Date(startDate);
    const end = new Date(endDate);
    const diffMs = end.getTime() - start.getTime();
    const diffDays = Math.ceil(diffMs / (1000 * 60 * 60 * 24));

    if (diffDays > 0) {
      const total = Math.round(selectedVehicle.dailyRate * diffDays * 100) / 100;
      setValue('totalAmount', total);
    }
  }, [selectedVehicle, startDate, endDate, setValue]);

  const createMutation = useMutation({
    mutationFn: (data: CreateBookingFormData) => {
      const bookingData: any = {
        agencyId: data.agencyId,
        vehicleId: data.vehicleId,
        clientId: data.clientId,
        startDate: data.startDate,
        endDate: data.endDate,
        totalPrice: data.totalAmount || 0,
        status: data.status || 'DRAFT',
        // Champs caution (R3)
        depositRequired: data.depositRequired || false,
        depositAmount: data.depositAmount,
        depositDecisionSource: data.depositDecisionSource,
      };
      return bookingApi.create(bookingData);
    },
    onSuccess: () => {
      toast.success('Réservation créée avec succès');
      router.push('/agency/bookings');
    },
    onError: (error: any) => {
      const errorMessage = error?.response?.data?.message || error?.message || 'Erreur lors de la création';
      
      // Gérer les erreurs 403 liées aux modules
      if (error?.status === 403 && error?.isModuleError) {
        toast.error('Le module Gestion des réservations n\'est pas activé pour votre agence.');
      } else {
        toast.error(errorMessage);
      }
    },
  });

  const onSubmit = (data: CreateBookingFormData) => {
    createMutation.mutate(data);
  };

  return (
    <RouteGuard allowedRoles={['SUPER_ADMIN', 'COMPANY_ADMIN', 'AGENCY_MANAGER', 'AGENT']}>
      <MainLayout>
        <FormCard
          title="Nouvelle réservation"
          description="Créez une nouvelle réservation de location"
          backHref="/agency/bookings"
          onSubmit={handleSubmit(onSubmit)}
          isLoading={isSubmitting || createMutation.isPending}
          submitLabel="Créer la réservation"
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
                    {vehicle.brand} {vehicle.model} - {vehicle.registrationNumber} ({vehicle.status === 'AVAILABLE' ? 'Disponible' : vehicle.status}){vehicle.dailyRate ? ` — ${vehicle.dailyRate} MAD/jour` : ''}
                  </option>
                ))}
              </Select>
              {errors.vehicleId && <p className="text-red-500 text-sm mt-1">{errors.vehicleId.message}</p>}
            </div>

            <div>
              <label htmlFor="clientId" className="block text-sm font-medium text-text mb-2">
                Client *
              </label>
              <Select
                id="clientId"
                {...register('clientId')}
                disabled={!agencyId}
              >
                <option value="">Sélectionner un client</option>
                {clients?.map((client) => (
                  <option key={client.id} value={client.id}>
                    {client.name} - {client.email}
                  </option>
                ))}
              </Select>
              {errors.clientId && <p className="text-red-500 text-sm mt-1">{errors.clientId.message}</p>}
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label htmlFor="startDate" className="block text-sm font-medium text-text mb-2">
                  Date de début *
                </label>
                <Input
                  id="startDate"
                  type="datetime-local"
                  {...register('startDate')}
                />
                {errors.startDate && <p className="text-red-500 text-sm mt-1">{errors.startDate.message}</p>}
              </div>

              <div>
                <label htmlFor="endDate" className="block text-sm font-medium text-text mb-2">
                  Date de fin *
                </label>
                <Input
                  id="endDate"
                  type="datetime-local"
                  {...register('endDate')}
                />
                {errors.endDate && <p className="text-red-500 text-sm mt-1">{errors.endDate.message}</p>}
              </div>
            </div>

            <div>
              <label htmlFor="totalAmount" className="block text-sm font-medium text-text mb-2">
                Montant total (MAD)
              </label>
              <Input
                id="totalAmount"
                type="number"
                step="0.01"
                min="0"
                {...register('totalAmount', { valueAsNumber: true })}
              />
              {selectedVehicle?.dailyRate && startDate && endDate && (() => {
                const diffDays = Math.ceil((new Date(endDate).getTime() - new Date(startDate).getTime()) / (1000 * 60 * 60 * 24));
                if (diffDays > 0) {
                  return (
                    <p className="text-xs text-text-muted mt-1">
                      Calcul : {selectedVehicle.dailyRate} MAD/jour × {diffDays} jour{diffDays > 1 ? 's' : ''} = {Math.round(selectedVehicle.dailyRate * diffDays * 100) / 100} MAD
                    </p>
                  );
                }
                return null;
              })()}
              {errors.totalAmount && <p className="text-red-500 text-sm mt-1">{errors.totalAmount.message}</p>}
            </div>

            <div>
              <label htmlFor="status" className="block text-sm font-medium text-text mb-2">
                Statut
              </label>
              <Select
                id="status"
                {...register('status')}
              >
                <option value="DRAFT">Brouillon</option>
                <option value="PENDING">En attente</option>
                <option value="CONFIRMED">Confirmée</option>
              </Select>
              {errors.status && <p className="text-red-500 text-sm mt-1">{errors.status.message}</p>}
            </div>

            {/* Section Caution (R3) */}
            <div className="border-t border-border pt-6 mt-6">
              <h3 className="text-lg font-semibold text-text mb-4">Caution</h3>
              
              <div className="mb-4">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    {...register('depositRequired')}
                    className="w-4 h-4 rounded border-border text-primary focus:ring-primary"
                  />
                  <span className="text-sm font-medium text-text">Caution requise</span>
                </label>
                <p className="text-xs text-text-muted mt-1 ml-6">
                  Si coché, une caution devra être collectée avant le check-in
                </p>
              </div>

              {watch('depositRequired') && (
                <>
                  <div className="mb-4">
                    <label htmlFor="depositAmount" className="block text-sm font-medium text-text mb-2">
                      Montant de la caution (MAD) *
                    </label>
                    <Input
                      id="depositAmount"
                      type="number"
                      step="0.01"
                      min="0"
                      {...register('depositAmount', { valueAsNumber: true })}
                    />
                    {errors.depositAmount && <p className="text-red-500 text-sm mt-1">{errors.depositAmount.message}</p>}
                  </div>

                  <div>
                    <label htmlFor="depositDecisionSource" className="block text-sm font-medium text-text mb-2">
                      Source de décision *
                    </label>
                    <Select
                      id="depositDecisionSource"
                      {...register('depositDecisionSource')}
                    >
                      <option value="">Sélectionner une source</option>
                      <option value="COMPANY">Entreprise (règle globale)</option>
                      <option value="AGENCY">Agence (décision locale)</option>
                    </Select>
                    {errors.depositDecisionSource && <p className="text-red-500 text-sm mt-1">{errors.depositDecisionSource.message}</p>}
                    <p className="text-xs text-text-muted mt-1">
                      Indique si la caution est requise par une règle de l'entreprise ou par décision de l'agence
                    </p>
                  </div>
                </>
              )}
            </div>

        </FormCard>
      </MainLayout>
    </RouteGuard>
  );
}
