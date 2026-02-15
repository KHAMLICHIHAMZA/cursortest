'use client';

import { useEffect, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { bookingApi, Booking } from '@/lib/api/booking';
import { updateBookingSchema, UpdateBookingFormData } from '@/lib/validations/booking';
import { agencyApi } from '@/lib/api/agency';
import { vehicleApi } from '@/lib/api/vehicle';
import { clientApi } from '@/lib/api/client-api';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { MainLayout } from '@/components/layout/main-layout';
import { RouteGuard } from '@/components/auth/route-guard';
import { ArrowLeft, Save, X, CheckCircle, Clock, Car } from 'lucide-react';
import Link from 'next/link';
import { toast } from '@/components/ui/toast';
import { LoadingSpinner } from '@/components/ui/loading-spinner';
import { ConfirmDialog } from '@/components/ui/confirm-dialog';
import { useModuleAccess } from '@/hooks/use-module-access';
import { ModuleNotIncluded, FeatureNotIncluded } from '@/components/ui/module-not-included';
import Cookies from 'js-cookie';

type BookingStatus = 'DRAFT' | 'PENDING' | 'CONFIRMED' | 'IN_PROGRESS' | 'RETURNED' | 'CANCELLED' | 'LATE' | 'NO_SHOW';

const STATUS_TRANSITIONS: Record<BookingStatus, BookingStatus[]> = {
  DRAFT: ['PENDING', 'CANCELLED'],
  PENDING: ['CONFIRMED', 'CANCELLED'],
  CONFIRMED: ['IN_PROGRESS', 'CANCELLED', 'NO_SHOW'],
  IN_PROGRESS: ['RETURNED', 'LATE'],
  LATE: ['RETURNED'],
  RETURNED: [],
  CANCELLED: [],
  NO_SHOW: [],
};

const STATUS_LABELS: Record<BookingStatus, string> = {
  DRAFT: 'Brouillon',
  PENDING: 'En attente',
  CONFIRMED: 'Confirmée',
  IN_PROGRESS: 'ACTIVE',
  LATE: 'En retard',
  RETURNED: 'TERMINÉE',
  CANCELLED: 'Annulée',
  NO_SHOW: 'Client absent',
};

const STATUS_COLORS: Record<BookingStatus, string> = {
  DRAFT: 'bg-gray-500/20 text-gray-500',
  PENDING: 'bg-yellow-500/20 text-yellow-500',
  CONFIRMED: 'bg-blue-500/20 text-blue-500',
  IN_PROGRESS: 'bg-green-500/20 text-green-500',
  LATE: 'bg-orange-500/20 text-orange-500',
  RETURNED: 'bg-gray-500/20 text-gray-500',
  CANCELLED: 'bg-red-500/20 text-red-500',
  NO_SHOW: 'bg-red-500/20 text-red-500',
};

export default function EditBookingPage() {
  const router = useRouter();
  const params = useParams();
  const queryClient = useQueryClient();
  const bookingId = params.id as string;
  const [confirmDialog, setConfirmDialog] = useState<{ isOpen: boolean; status?: BookingStatus }>({ isOpen: false });

  const { data: booking, isLoading } = useQuery({
    queryKey: ['booking', bookingId],
    queryFn: () => bookingApi.getOne(bookingId),
    enabled: !!bookingId,
  });

  const { data: agencies } = useQuery({
    queryKey: ['agencies'],
    queryFn: () => agencyApi.getAll(),
  });

  const {
    register,
    handleSubmit,
    watch,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<UpdateBookingFormData>({
    resolver: zodResolver(updateBookingSchema),
    defaultValues: {
      startDate: '',
      endDate: '',
      totalAmount: 0,
    },
  });

  const agencyId = booking?.agencyId;

  // Vérifier l'accès au module BOOKINGS
  const userStr = typeof window !== 'undefined' ? Cookies.get('user') : null;
  const user = userStr ? JSON.parse(userStr) : null;
  const { isModuleActive, isLoading: isLoadingModule } = useModuleAccess('BOOKINGS', agencyId);

  useEffect(() => {
    if (booking) {
      const startDate = booking.startDate ? new Date(booking.startDate).toISOString().slice(0, 16) : '';
      const endDate = booking.endDate ? new Date(booking.endDate).toISOString().slice(0, 16) : '';
      
      reset({
        startDate,
        endDate,
        totalAmount: booking.totalAmount || booking.totalPrice || 0,
      });
    }
  }, [booking, reset]);

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

  const updateMutation = useMutation({
    mutationFn: (data: UpdateBookingFormData) => {
      const updateData: any = {
        startDate: data.startDate ? new Date(data.startDate).toISOString() : undefined,
        endDate: data.endDate ? new Date(data.endDate).toISOString() : undefined,
        totalPrice: data.totalAmount,
      };
      return bookingApi.update(bookingId, updateData);
    },
    onSuccess: () => {
      toast.success('Réservation mise à jour avec succès');
      queryClient.invalidateQueries({ queryKey: ['booking', bookingId] });
      queryClient.invalidateQueries({ queryKey: ['bookings'] });
    },
    onError: (error: any) => {
      const message = error.response?.data?.message || 'Erreur lors de la mise à jour';
      toast.error(message);
    },
  });

  const statusChangeMutation = useMutation({
    mutationFn: (newStatus: BookingStatus) => bookingApi.update(bookingId, { status: newStatus }),
    onSuccess: (_, newStatus) => {
      toast.success(`Statut changé en ${STATUS_LABELS[newStatus]}`);
      queryClient.invalidateQueries({ queryKey: ['booking', bookingId] });
      queryClient.invalidateQueries({ queryKey: ['bookings'] });
      setConfirmDialog({ isOpen: false });
    },
    onError: (error: any) => {
      const message = error.response?.data?.message || 'Erreur lors du changement de statut';
      toast.error(message);
      setConfirmDialog({ isOpen: false });
    },
  });

  const onSubmit = (data: UpdateBookingFormData) => {
    updateMutation.mutate(data);
  };

  const handleStatusChange = (newStatus: BookingStatus) => {
    setConfirmDialog({ isOpen: true, status: newStatus });
  };

  const confirmStatusChange = () => {
    if (confirmDialog.status) {
      statusChangeMutation.mutate(confirmDialog.status);
    }
  };

  const currentStatus = (booking?.status as BookingStatus) || 'DRAFT';
  const availableStatusTransitions = STATUS_TRANSITIONS[currentStatus] || [];
  
  // Vérifier si l'utilisateur est Agency Manager pour l'override des frais
  const isAgencyManager = user?.role === 'AGENCY_MANAGER' || user?.role === 'COMPANY_ADMIN' || user?.role === 'SUPER_ADMIN';
  
  // États pour l'override des frais de retard
  const [overrideLateFeeDialog, setOverrideLateFeeDialog] = useState<{ isOpen: boolean }>({ isOpen: false });
  const [overrideJustification, setOverrideJustification] = useState('');
  const [overrideAmount, setOverrideAmount] = useState('');

  // Mutation pour override frais de retard
  const overrideLateFeeMutation = useMutation({
    mutationFn: (data: { newAmount: number; justification: string }) => 
      bookingApi.overrideLateFee(bookingId, data),
    onSuccess: () => {
      toast.success('Frais de retard modifiés avec succès');
      queryClient.invalidateQueries({ queryKey: ['booking', bookingId] });
      setOverrideLateFeeDialog({ isOpen: false });
      setOverrideJustification('');
      setOverrideAmount('');
    },
    onError: (error: any) => {
      const message = error.response?.data?.message || 'Erreur lors de la modification des frais de retard';
      toast.error(message);
    },
  });

  const handleOverrideLateFee = () => {
    if (!overrideAmount || !overrideJustification || overrideJustification.length < 10) {
      toast.error('Le montant et une justification d\'au moins 10 caractères sont requis');
      return;
    }
    overrideLateFeeMutation.mutate({
      newAmount: parseFloat(overrideAmount),
      justification: overrideJustification,
    });
  };

  if (isLoading) {
    return (
      <RouteGuard allowedRoles={['SUPER_ADMIN', 'COMPANY_ADMIN', 'AGENCY_MANAGER', 'AGENT']}>
        <MainLayout>
          <div className="flex justify-center items-center h-96">
            <LoadingSpinner />
          </div>
        </MainLayout>
      </RouteGuard>
    );
  }

  if (!booking) {
    return (
      <RouteGuard allowedRoles={['SUPER_ADMIN', 'COMPANY_ADMIN', 'AGENCY_MANAGER', 'AGENT']}>
        <MainLayout>
          <div className="text-center py-12">
            <p className="text-text-muted">Réservation non trouvée</p>
            <Link href="/agency/bookings">
              <Button variant="ghost" className="mt-4">
                Retour à la liste
              </Button>
            </Link>
          </div>
        </MainLayout>
      </RouteGuard>
    );
  }

  return (
    <RouteGuard allowedRoles={['SUPER_ADMIN', 'COMPANY_ADMIN', 'AGENCY_MANAGER', 'AGENT']}>
      <MainLayout>
        <div className="max-w-4xl mx-auto">
          <Link href="/agency/bookings">
            <Button variant="ghost" className="mb-6">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Retour
            </Button>
          </Link>

          <div className="flex items-center justify-between mb-8">
            <h1 className="text-3xl font-bold text-text">Modifier la réservation</h1>
            <div className="flex items-center gap-3">
              <span className={`px-3 py-1 rounded-full text-sm font-medium ${STATUS_COLORS[currentStatus]}`}>
                {STATUS_LABELS[currentStatus]}
              </span>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Formulaire principal */}
            <div className="lg:col-span-2 space-y-6">
              <form onSubmit={handleSubmit(onSubmit)} className="space-y-6 bg-card border border-border rounded-lg p-6">
                <div>
                  <label htmlFor="agencyId" className="block text-sm font-medium text-text mb-2">
                    Agence
                  </label>
                  <select
                    id="agencyId"
                    value={booking.agencyId}
                    className="w-full px-4 py-2 rounded-lg border border-border bg-background text-text"
                    disabled
                  >
                    {agencies?.map((agency) => (
                      <option key={agency.id} value={agency.id}>
                        {agency.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label htmlFor="vehicleId" className="block text-sm font-medium text-text mb-2">
                    Véhicule
                  </label>
                  <select
                    id="vehicleId"
                    value={booking.vehicleId}
                    className="w-full px-4 py-2 rounded-lg border border-border bg-background text-text"
                    disabled
                  >
                    {vehicles?.map((vehicle) => (
                      <option key={vehicle.id} value={vehicle.id}>
                        {vehicle.brand} {vehicle.model} - {vehicle.registrationNumber}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label htmlFor="clientId" className="block text-sm font-medium text-text mb-2">
                    Client
                  </label>
                  <select
                    id="clientId"
                    value={booking.clientId}
                    className="w-full px-4 py-2 rounded-lg border border-border bg-background text-text"
                    disabled
                  >
                    {clients?.map((client) => (
                      <option key={client.id} value={client.id}>
                        {client.name} - {client.email}
                      </option>
                    ))}
                  </select>
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
                  {errors.totalAmount && <p className="text-red-500 text-sm mt-1">{errors.totalAmount.message}</p>}
                </div>

                <div className="flex items-center gap-4">
                  <Button
                    type="button"
                    variant="ghost"
                    onClick={() => router.back()}
                    disabled={isSubmitting || updateMutation.isPending}
                  >
                    Annuler
                  </Button>
                  <Button type="submit" variant="primary" disabled={isSubmitting || updateMutation.isPending}>
                    <Save className="w-4 h-4 mr-2" />
                    {isSubmitting || updateMutation.isPending ? 'Enregistrement...' : 'Enregistrer'}
                  </Button>
                </div>
              </form>
            </div>

            {/* Panneau de statut */}
            <div className="space-y-6">
              <div className="bg-card border border-border rounded-lg p-6">
                <h2 className="text-lg font-semibold text-text mb-4">Changer le statut</h2>
                <div className="space-y-2">
                  {availableStatusTransitions.length > 0 ? (
                    availableStatusTransitions.map((status) => (
                      <Button
                        key={status}
                        variant="ghost"
                        className="w-full justify-start"
                        onClick={() => handleStatusChange(status)}
                        disabled={statusChangeMutation.isPending}
                      >
                        {status === 'CONFIRMED' && <CheckCircle className="w-4 h-4 mr-2" />}
                        {status === 'IN_PROGRESS' && <Car className="w-4 h-4 mr-2" />}
                        {status === 'RETURNED' && <CheckCircle className="w-4 h-4 mr-2" />}
                        {status === 'CANCELLED' && <X className="w-4 h-4 mr-2" />}
                        {!['CONFIRMED', 'IN_PROGRESS', 'RETURNED', 'CANCELLED'].includes(status) && (
                          <Clock className="w-4 h-4 mr-2" />
                        )}
                        {STATUS_LABELS[status]}
                      </Button>
                    ))
                  ) : (
                    <p className="text-sm text-text-muted">Aucune transition disponible</p>
                  )}
                </div>
              </div>

              {/* Informations financières (R3, R4) */}
              <div className="bg-card border border-border rounded-lg p-6">
                <h2 className="text-lg font-semibold text-text mb-4">Informations financières</h2>
                <div className="space-y-3 text-sm">
                  {/* Caution */}
                  {booking.depositRequired && (
                    <div>
                      <p className="text-text-muted">Caution</p>
                      <p className="text-text font-medium">
                        {Number(booking.depositAmount || 0).toFixed(2)} MAD
                      </p>
                      <p className="text-text-muted text-xs">
                        Statut: {booking.depositStatusCheckIn === 'COLLECTED' ? 'Collectée' : 'En attente'}
                        {booking.depositDecisionSource && ` • Source: ${booking.depositDecisionSource === 'COMPANY' ? 'Entreprise' : 'Agence'}`}
                      </p>
                      {booking.depositStatusCheckIn === 'COLLECTED' && booking.totalPrice && booking.depositAmount && (
                        <p className="text-text-muted text-xs mt-1">
                          Paiement restant: {(Number(booking.totalPrice || 0) - Number(booking.depositAmount || 0)).toFixed(2)} MAD
                        </p>
                      )}
                    </div>
                  )}

                  {/* Frais de retard */}
                  {booking.lateFeeAmount && booking.lateFeeAmount > 0 && (
                    <div>
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-text-muted">Frais de retard</p>
                          <p className="text-text font-medium">
                            {Number(booking.lateFeeAmount || 0).toFixed(2)} MAD
                          </p>
                          {booking.lateFeeCalculatedAt && (
                            <p className="text-text-muted text-xs">
                              Calculé le: {new Date(booking.lateFeeCalculatedAt).toLocaleDateString('fr-FR')}
                            </p>
                          )}
                          {booking.lateFeeOverride && (
                            <p className="text-yellow-500 text-xs mt-1">
                              ⚠️ Modifié manuellement
                              {booking.lateFeeOverrideJustification && ` • ${booking.lateFeeOverrideJustification}`}
                            </p>
                          )}
                        </div>
                        {isAgencyManager && booking.status === 'RETURNED' && (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => {
                              setOverrideAmount(booking.lateFeeAmount?.toString() || '0');
                              setOverrideLateFeeDialog({ isOpen: true });
                            }}
                          >
                            Modifier
                          </Button>
                        )}
                      </div>
                    </div>
                  )}

                  {/* Temps de préparation (R2.2) */}
                  {booking.agency?.preparationTimeMinutes && (
                    <div>
                      <p className="text-text-muted">Temps de préparation</p>
                      <p className="text-text font-medium">
                        {booking.agency.preparationTimeMinutes} minutes
                      </p>
                      {booking.computedEndWithPreparation && (
                        <p className="text-text-muted text-xs">
                          Véhicule disponible après: {new Date(booking.computedEndWithPreparation).toLocaleString('fr-FR')}
                        </p>
                      )}
                    </div>
                  )}

                  {/* Montant total */}
                  <div className="border-t border-border pt-3 mt-3">
                    <p className="text-text-muted">Montant total</p>
                    <p className="text-text font-bold text-lg">
                      {(booking.totalPrice || 0) + (booking.lateFeeAmount || 0)} MAD
                    </p>
                  </div>
                </div>
              </div>

              {/* Informations */}
              {booking.vehicle && (
                <div className="bg-card border border-border rounded-lg p-6">
                  <h2 className="text-lg font-semibold text-text mb-4">Informations</h2>
                  <div className="space-y-3 text-sm">
                    <div>
                      <p className="text-text-muted">N° Réservation</p>
                      <p className="text-text font-medium">
                        #{String(booking.bookingNumber || booking.id.slice(-6)).toUpperCase()}
                      </p>
                    </div>
                    <div>
                      <p className="text-text-muted">Véhicule</p>
                      <p className="text-text font-medium">
                        {booking.vehicle.brand} {booking.vehicle.model}
                      </p>
                      <p className="text-text-muted text-xs">{booking.vehicle.registrationNumber}</p>
                    </div>
                    {booking.client && (
                      <div>
                        <p className="text-text-muted">Client</p>
                        <p className="text-text font-medium">
                          {booking.client.name}
                        </p>
                        {booking.client.email && (
                          <p className="text-text-muted text-xs">{booking.client.email}</p>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>

          <ConfirmDialog
            isOpen={confirmDialog.isOpen}
            title="Changer le statut"
            message={`Êtes-vous sûr de vouloir changer le statut en "${confirmDialog.status ? STATUS_LABELS[confirmDialog.status] : ''}" ?`}
            confirmText="Confirmer"
            cancelText="Annuler"
            onConfirm={confirmStatusChange}
            onCancel={() => setConfirmDialog({ isOpen: false })}
            variant="default"
          />

          {/* Dialog Override Frais de Retard */}
          {overrideLateFeeDialog.isOpen && (
            <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
              <div className="bg-card border border-border rounded-lg p-6 max-w-md w-full mx-4">
                <h2 className="text-xl font-semibold text-text mb-4">Modifier les frais de retard</h2>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-text mb-2">
                      Nouveau montant (MAD) *
                    </label>
                    <Input
                      type="number"
                      step="0.01"
                      min="0"
                      value={overrideAmount}
                      onChange={(e) => setOverrideAmount(e.target.value)}
                      placeholder="0.00"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-text mb-2">
                      Justification (min 10 caractères) *
                    </label>
                    <textarea
                      className="w-full px-4 py-2 rounded-lg border border-border bg-background text-text focus:outline-none focus:ring-2 focus:ring-primary"
                      rows={4}
                      value={overrideJustification}
                      onChange={(e) => setOverrideJustification(e.target.value)}
                      placeholder="Expliquez pourquoi vous modifiez les frais de retard..."
                    />
                    <p className="text-xs text-text-muted mt-1">
                      {overrideJustification.length}/10 caractères minimum
                    </p>
                  </div>
                  <div className="flex gap-3 justify-end">
                    <Button
                      variant="ghost"
                      onClick={() => {
                        setOverrideLateFeeDialog({ isOpen: false });
                        setOverrideJustification('');
                        setOverrideAmount('');
                      }}
                    >
                      Annuler
                    </Button>
                    <Button
                      variant="primary"
                      onClick={handleOverrideLateFee}
                      disabled={overrideLateFeeMutation.isPending || !overrideAmount || overrideJustification.length < 10}
                    >
                      {overrideLateFeeMutation.isPending ? 'Enregistrement...' : 'Confirmer'}
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </MainLayout>
    </RouteGuard>
  );
}
