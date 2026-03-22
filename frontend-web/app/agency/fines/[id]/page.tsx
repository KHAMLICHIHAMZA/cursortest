'use client';

import { useEffect, useState } from 'react';
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
import { Card } from '@/components/ui/card';
import { FormCard } from '@/components/ui/form-card';
import { LoadingState } from '@/components/ui/loading-state';
import { ErrorState } from '@/components/ui/error-state';
import { MainLayout } from '@/components/layout/main-layout';
import { RouteGuard } from '@/components/auth/route-guard';
import { toast } from '@/components/ui/toast';
import { getImageUrl } from '@/lib/utils/image-url';

export default function EditFinePage() {
  const router = useRouter();
  const params = useParams();
  const queryClient = useQueryClient();
  const fineId = params.id as string;
  const [attachmentFile, setAttachmentFile] = useState<File | null>(null);
  const [isUploadingAttachment, setIsUploadingAttachment] = useState(false);

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
      status: 'RECUE',
    },
  });

  const agencyId = fine?.agencyId;

  useEffect(() => {
    if (fine) {
      reset({
        bookingId: fine.bookingId || '',
        amount: fine.amount || 0,
        description: fine.description || '',
        status: fine.status || 'RECUE',
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

  const onSubmit = async (data: UpdateFineFormData) => {
    const payload: UpdateFineFormData = { ...data };
    if (attachmentFile) {
      setIsUploadingAttachment(true);
      try {
        const uploadResult = await fineApi.uploadAttachment(attachmentFile);
        payload.attachmentUrl = uploadResult.attachmentUrl;
      } catch (error: any) {
        const message = error?.response?.data?.message || 'Erreur lors de l\'upload de la pièce jointe';
        toast.error(message);
        setIsUploadingAttachment(false);
        return;
      }
      setIsUploadingAttachment(false);
    }
    updateMutation.mutate(payload);
  };

  if (isLoading) {
    return (
      <RouteGuard allowedRoles={['SUPER_ADMIN', 'COMPANY_ADMIN', 'AGENCY_MANAGER']}>
        <MainLayout>
          <LoadingState message="Chargement de l'amende..." />
        </MainLayout>
      </RouteGuard>
    );
  }

  if (!fine) {
    return (
      <RouteGuard allowedRoles={['SUPER_ADMIN', 'COMPANY_ADMIN', 'AGENCY_MANAGER']}>
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
    <RouteGuard allowedRoles={['SUPER_ADMIN', 'COMPANY_ADMIN', 'AGENCY_MANAGER']}>
      <MainLayout>
        <div className="max-w-4xl mx-auto space-y-6">
          <Card className="p-4">
            <p className="text-sm text-text-muted">
              Vérifiez le montant et l&apos;état de règlement avant validation pour garder un suivi financier cohérent.
            </p>
          </Card>
          <FormCard
            title="Modifier l'amende"
            description="Mettez à jour les informations de l'amende"
            backHref="/agency/fines"
            onSubmit={handleSubmit(onSubmit)}
            isLoading={isSubmitting || updateMutation.isPending || isUploadingAttachment}
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
                    {booking.vehicle?.brand} {booking.vehicle?.model} - {booking.client?.name || 'Client'} ({new Date(booking.startDate).toLocaleDateString('fr-FR')})
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
              <label htmlFor="status" className="block text-sm font-medium text-text mb-2">
                Statut
              </label>
              <select
                {...register('status')}
                className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm text-text"
              >
                <option value="RECUE">Reçue</option>
                <option value="CLIENT_IDENTIFIE">Client identifié</option>
                <option value="TRANSMISE">Transmise</option>
                <option value="CONTESTEE">Contestée</option>
                <option value="CLOTUREE">Clôturée</option>
              </select>
            </div>

            <div>
              <label htmlFor="attachment" className="block text-sm font-medium text-text mb-2">
                Pièce jointe (preuve)
              </label>
              <Input
                id="attachment"
                type="file"
                accept=".jpg,.jpeg,.png,.pdf"
                onChange={(e) => setAttachmentFile(e.target.files?.[0] || null)}
              />
              <p className="text-xs text-text-muted mt-1">
                Optionnel - formats acceptés: JPG, PNG, PDF (max 10MB).
              </p>
              {attachmentFile && (
                <p className="text-xs text-text-muted mt-1">
                  Nouveau fichier: {attachmentFile.name}
                </p>
              )}
              {fine.attachmentUrl && (
                <a
                  href={getImageUrl(fine.attachmentUrl)}
                  target="_blank"
                  rel="noreferrer"
                  className="text-xs text-primary underline mt-1 inline-block"
                >
                  Voir la pièce jointe actuelle
                </a>
              )}
            </div>
          </FormCard>
        </div>
      </MainLayout>
    </RouteGuard>
  );
}
