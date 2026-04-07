'use client';

import { useEffect, useMemo, useState } from 'react';
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
import { Select } from '@/components/ui/select';
import { MainLayout } from '@/components/layout/main-layout';
import { RouteGuard } from '@/components/auth/route-guard';
import { ArrowLeft, Save, X, CheckCircle, Clock, Car, MessageCircle, Phone } from 'lucide-react';
import Link from 'next/link';
import { toast } from '@/components/ui/toast';
import { LoadingSpinner } from '@/components/ui/loading-spinner';
import { ConfirmDialog } from '@/components/ui/confirm-dialog';
import { useModuleAccess } from '@/hooks/use-module-access';
import { ModuleNotIncluded, FeatureNotIncluded } from '@/components/ui/module-not-included';
import Cookies from 'js-cookie';
import { BackendImage } from '@/components/ui/backend-image';
import { getImageUrl } from '@/lib/utils/image-url';

type AgencyOpeningHours = Record<
  string,
  { isOpen?: boolean; openTime?: string; closeTime?: string }
>;

function getOpeningHoursWarning(dateValue: string, openingHours?: AgencyOpeningHours): string | null {
  if (!dateValue || !openingHours) return null;
  const date = new Date(dateValue);
  if (Number.isNaN(date.getTime())) return null;

  const dayByIndex = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
  const dayKey = dayByIndex[date.getDay()];
  const dayHours = openingHours[dayKey];
  if (!dayHours || dayHours.isOpen === false) {
    return "L'agence est fermée sur ce créneau.";
  }
  if (!dayHours.openTime || !dayHours.closeTime) {
    return "Horaires d'agence non configurés pour ce jour.";
  }

  const current = `${String(date.getHours()).padStart(2, '0')}:${String(date.getMinutes()).padStart(2, '0')}`;
  if (current < dayHours.openTime || current > dayHours.closeTime) {
    return `Hors horaires d'ouverture (${dayHours.openTime} - ${dayHours.closeTime}).`;
  }
  return null;
}

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
  const [showManualTerrainStatus, setShowManualTerrainStatus] = useState(false);
  const invalidateBookingRelatedQueries = () =>
    queryClient.invalidateQueries({
      predicate: (query) =>
        Array.isArray(query.queryKey) &&
        query.queryKey.some((key) => typeof key === 'string' && key.toLowerCase().includes('booking')),
    });
  const invalidateInvoiceRelatedQueries = () =>
    queryClient.invalidateQueries({
      predicate: (query) =>
        Array.isArray(query.queryKey) &&
        query.queryKey.some((key) => typeof key === 'string' && key.toLowerCase().includes('invoice')),
    });

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
      depositRequired: false,
      depositAmount: undefined,
    },
  });

  const agencyId = booking?.agencyId;
  const startDate = watch('startDate');
  const endDate = watch('endDate');

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
        depositRequired: booking.depositRequired ?? false,
        depositAmount: booking.depositAmount ? Number(booking.depositAmount) : undefined,
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
  const selectedAgency = useMemo(
    () => agencies?.find((agency) => agency.id === agencyId),
    [agencies, agencyId]
  );
  const startHoursWarning = useMemo(
    () => getOpeningHoursWarning(startDate || '', selectedAgency?.openingHours as AgencyOpeningHours | undefined),
    [startDate, selectedAgency]
  );
  const endHoursWarning = useMemo(
    () => getOpeningHoursWarning(endDate || '', selectedAgency?.openingHours as AgencyOpeningHours | undefined),
    [endDate, selectedAgency]
  );
  const isInvalidDateRange = useMemo(() => {
    if (!startDate || !endDate) return false;
    const start = new Date(startDate);
    const end = new Date(endDate);
    if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime())) return false;
    return end.getTime() <= start.getTime();
  }, [startDate, endDate]);

  const updateMutation = useMutation({
    mutationFn: (data: UpdateBookingFormData) => {
      const updateData: any = {
        startDate: data.startDate ? new Date(data.startDate).toISOString() : undefined,
        endDate: data.endDate ? new Date(data.endDate).toISOString() : undefined,
        totalPrice: data.totalAmount,
        depositRequired: data.depositRequired,
        depositAmount: data.depositAmount,
      };
      return bookingApi.update(bookingId, updateData);
    },
    onSuccess: () => {
      toast.success('Réservation mise à jour avec succès');
      queryClient.invalidateQueries({ queryKey: ['booking', bookingId] });
      invalidateBookingRelatedQueries();
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
      invalidateBookingRelatedQueries();
      setConfirmDialog({ isOpen: false });
    },
    onError: (error: any) => {
      const message = error.response?.data?.message || 'Erreur lors du changement de statut';
      toast.error(message);
      setConfirmDialog({ isOpen: false });
    },
  });

  const onSubmit = (data: UpdateBookingFormData) => {
    if (isInvalidDateRange) {
      toast.error('Modification bloquée: la date de fin doit être après la date de début.');
      return;
    }
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
  const isFieldAgentRole = user?.role === 'AGENT';
  const isTerrainStatusManual = (s: BookingStatus) =>
    (currentStatus === 'CONFIRMED' && s === 'IN_PROGRESS') ||
    ((currentStatus === 'IN_PROGRESS' || currentStatus === 'LATE') && s === 'RETURNED');
  const visibleStatusTransitions = availableStatusTransitions.filter((s) => {
    if (!isTerrainStatusManual(s)) return true;
    if (isFieldAgentRole) return false;
    return showManualTerrainStatus;
  });
  
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
  const financialClosureMutation = useMutation({
    mutationFn: () => bookingApi.financialClosure(bookingId),
    onSuccess: () => {
      toast.success('Clôture financière exécutée');
      invalidateBookingRelatedQueries();
      invalidateInvoiceRelatedQueries();
    },
    onError: (error: any) => {
      const message = error.response?.data?.message || 'Erreur lors de la clôture financière';
      toast.error(message);
    },
  });
  const generateInvoiceMutation = useMutation({
    mutationFn: () => bookingApi.generateInvoice(bookingId),
    onSuccess: () => {
      toast.success('Facture générée avec succès');
      invalidateBookingRelatedQueries();
      invalidateInvoiceRelatedQueries();
    },
    onError: (error: any) => {
      const message = error.response?.data?.message || 'Erreur lors de la génération de facture';
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

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
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
                    {startHoursWarning && (
                      <p className="text-orange-500 text-sm mt-1">Attention: {startHoursWarning}</p>
                    )}
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
                    {isInvalidDateRange && (
                      <p className="text-red-500 text-sm mt-1">Blocage: la date de fin doit être après la date de début.</p>
                    )}
                    {endHoursWarning && (
                      <p className="text-orange-500 text-sm mt-1">Attention: {endHoursWarning}</p>
                    )}
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

                {/* Section Caution */}
                <div className="border-t border-border pt-6 mt-2">
                  <h3 className="text-sm font-semibold text-text mb-4">Caution</h3>
                  <div className="mb-4">
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="checkbox"
                        {...register('depositRequired')}
                        className="w-4 h-4 rounded border-border text-primary focus:ring-primary"
                      />
                      <span className="text-sm font-medium text-text">Caution requise</span>
                    </label>
                  </div>

                  {watch('depositRequired') && (
                    <div>
                      <label htmlFor="depositAmount" className="block text-sm font-medium text-text mb-2">
                        Montant (MAD)
                      </label>
                      <Input
                        id="depositAmount"
                        type="number"
                        step="0.01"
                        min="0"
                        {...register('depositAmount', { valueAsNumber: true })}
                      />
                    </div>
                  )}
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
                  <Button type="submit" variant="primary" disabled={isSubmitting || updateMutation.isPending || isInvalidDateRange}>
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
                {(currentStatus === 'CONFIRMED' ||
                  currentStatus === 'IN_PROGRESS' ||
                  currentStatus === 'LATE') && (
                  <div className="mb-4 rounded-lg border border-primary/25 bg-primary/5 p-4 space-y-3">
                    <p className="text-sm font-medium text-text">Terrain (remplacement agent)</p>
                    <p className="text-xs text-text-muted">
                      Depuis un PC ou une tablette, effectuez le check-in ou le check-out avec photos,
                      kilométrage et signature — comme sur l’app agent.
                    </p>
                    <div className="flex flex-col gap-2">
                      {currentStatus === 'CONFIRMED' && (
                        <Button
                          variant="primary"
                          className="w-full justify-center"
                          type="button"
                          onClick={() => router.push(`/agency/bookings/${bookingId}/check-in`)}
                        >
                          Ouvrir le check-in
                        </Button>
                      )}
                      {(currentStatus === 'IN_PROGRESS' || currentStatus === 'LATE') && (
                        <Button
                          variant="primary"
                          className="w-full justify-center"
                          type="button"
                          onClick={() => router.push(`/agency/bookings/${bookingId}/check-out`)}
                        >
                          Ouvrir le check-out
                        </Button>
                      )}
                    </div>
                  </div>
                )}
                {isAgencyManager && !isFieldAgentRole && (
                  <label className="flex items-center gap-2 text-xs text-text-muted mb-3 cursor-pointer select-none">
                    <input
                      type="checkbox"
                      checked={showManualTerrainStatus}
                      onChange={(e) => setShowManualTerrainStatus(e.target.checked)}
                      className="rounded border-border"
                    />
                    Autoriser le changement manuel « départ / retour » sans dossier check-in/out (cas exceptionnel)
                  </label>
                )}
                <div className="space-y-2">
                  {visibleStatusTransitions.length > 0 ? (
                    visibleStatusTransitions.map((status) => (
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
                  {isAgencyManager && (booking.status === 'RETURNED' || booking.status === 'LATE') && (
                    <div className="border-t border-border pt-3 mt-3 space-y-2">
                      <p className="text-text-muted text-xs">Intervention manuelle (si checkout en difficulté)</p>
                      <div className="flex flex-wrap gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => financialClosureMutation.mutate()}
                          disabled={financialClosureMutation.isPending || generateInvoiceMutation.isPending}
                        >
                          {financialClosureMutation.isPending ? 'Exécution...' : 'Clôture financière'}
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => generateInvoiceMutation.mutate()}
                          disabled={generateInvoiceMutation.isPending || financialClosureMutation.isPending}
                        >
                          {generateInvoiceMutation.isPending ? 'Génération...' : 'Générer facture'}
                        </Button>
                      </div>
                    </div>
                  )}
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
                        {booking.client.phone && (
                          <div className="flex items-center gap-2 mt-2">
                            <a
                              href={`https://wa.me/${booking.client.phone.replace(/\D/g, '').replace(/^0/, '212')}?text=${encodeURIComponent(`Bonjour ${booking.client.name}, concernant votre reservation #${String(booking.bookingNumber || booking.id.slice(-6)).toUpperCase()}...`)}`}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-md bg-green-500/10 text-green-500 hover:bg-green-500/20 transition-colors text-xs font-medium"
                            >
                              <MessageCircle className="h-3.5 w-3.5" />
                              WhatsApp
                            </a>
                            <a
                              href={`tel:${booking.client.phone}`}
                              className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-md bg-primary/10 text-primary hover:bg-primary/20 transition-colors text-xs font-medium"
                            >
                              <Phone className="h-3.5 w-3.5" />
                              Appeler
                            </a>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              )}

              {booking.documents && booking.documents.length > 0 && (
                <div className="bg-card border border-border rounded-lg p-6">
                  <h2 className="text-lg font-semibold text-text mb-1">Dossier terrain</h2>
                  <p className="text-xs text-text-muted mb-4">
                    Pièces enregistrées lors du check-in ou du check-out (lecture seule).
                  </p>
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                    {booking.documents.map((doc) => {
                      const isPdf =
                        doc.mimeType?.toLowerCase().includes('pdf') ||
                        doc.url.toLowerCase().endsWith('.pdf');
                      return (
                        <div key={doc.id} className="space-y-1 min-w-0">
                          {isPdf ? (
                            <a
                              href={getImageUrl(doc.url)}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="flex items-center justify-center h-28 rounded-md border border-border bg-background text-xs text-primary font-medium px-2 text-center hover:bg-background/80"
                            >
                              PDF — {doc.title}
                            </a>
                          ) : (
                            <BackendImage
                              imageUrl={doc.url}
                              alt={doc.title}
                              className="w-full h-28 object-cover rounded-md"
                              placeholderClassName="h-28 rounded-md"
                            />
                          )}
                          <p className="text-xs text-text font-medium truncate" title={doc.title}>
                            {doc.title}
                          </p>
                          <p className="text-[10px] text-text-muted truncate">{doc.type}</p>
                        </div>
                      );
                    })}
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
