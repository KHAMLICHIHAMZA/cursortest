'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { agencyApi, UpdateAgencyDto } from '@/lib/api/agency';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { LoadingState } from '@/components/ui/loading-state';
import { ErrorState } from '@/components/ui/error-state';
import { MainLayout } from '@/components/layout/main-layout';
import { RouteGuard } from '@/components/auth/route-guard';
import { toast } from '@/components/ui/toast';
import {
  AgencyAddressHoursFields,
  createDefaultOpeningHours,
  hasInvalidOpeningHours,
} from '@/components/agency/agency-address-hours-fields';

export default function EditAgencyPage() {
  const router = useRouter();
  const params = useParams();
  const id = params.id as string;
  const queryClient = useQueryClient();

  const { data: agency, isLoading, error } = useQuery({
    queryKey: ['agency', id],
    queryFn: () => agencyApi.getById(id),
    enabled: !!id,
  });

  const [formData, setFormData] = useState<UpdateAgencyDto & { preparationTimeMinutes?: number }>({
    name: '',
    phone: '',
    addressDetails: undefined,
    openingHours: undefined,
    preparationTimeMinutes: undefined,
  });
  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    if (agency) {
      setFormData({
        name: agency.name,
        phone: agency.phone || '',
        address: agency.address || '',
        addressDetails: agency.addressDetails || undefined,
        openingHours: agency.openingHours || undefined,
        preparationTimeMinutes: (agency as any).preparationTimeMinutes ?? undefined,
      });
    }
  }, [agency]);

  const updateMutation = useMutation({
    mutationFn: (data: UpdateAgencyDto) => agencyApi.update(id, data),
    onSuccess: () => {
      toast.success('Agence mise à jour avec succès');
      queryClient.invalidateQueries({ queryKey: ['agencies'] });
      queryClient.invalidateQueries({ queryKey: ['agency', id] });
      router.push('/admin/agencies');
    },
    onError: (error: any) => {
      const message = error.response?.data?.message || 'Erreur lors de la mise à jour';
      setErrors({ submit: message });
      toast.error(message);
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrors({});

    if (!formData.name) {
      setErrors({ name: 'Le nom est requis' });
      return;
    }

    if (hasInvalidOpeningHours(formData.openingHours)) {
      setErrors({ submit: 'Corrigez les horaires d ouverture invalides avant de continuer.' });
      return;
    }

    updateMutation.mutate(formData);
  };

  if (isLoading) {
    return (
      <RouteGuard allowedRoles={['SUPER_ADMIN', 'COMPANY_ADMIN']}>
        <MainLayout>
          <LoadingState message="Chargement de l'agence..." />
        </MainLayout>
      </RouteGuard>
    );
  }

  if (error || !agency) {
    return (
      <RouteGuard allowedRoles={['SUPER_ADMIN', 'COMPANY_ADMIN']}>
        <MainLayout>
          <ErrorState
            title="Agence non trouvée"
            message="L'agence demandée n'existe pas ou a été supprimée."
            onRetry={() => router.push('/admin/agencies')}
          />
        </MainLayout>
      </RouteGuard>
    );
  }

  return (
    <RouteGuard allowedRoles={['SUPER_ADMIN', 'COMPANY_ADMIN']}>
      <MainLayout>
        <div className="max-w-6xl xl:max-w-7xl mx-auto space-y-6 px-2 sm:px-0">
          <Card className="p-4">
            <p className="text-sm text-text-muted">
              Entreprise liée: <span className="font-medium text-text">{agency.company?.name || '-'}</span>
            </p>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle>Modifier l&apos;agence</CardTitle>
              <p className="text-sm text-text-muted mt-1">Mettez à jour les informations de l&apos;agence.</p>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-6" noValidate>
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                  <div>
                    <label htmlFor="name" className="block text-sm font-medium text-text mb-2">
                      Nom de l'agence *
                    </label>
                    <Input
                      id="name"
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      required
                    />
                    {errors.name && <p className="text-red-500 text-sm mt-1">{errors.name}</p>}
                  </div>

                  <div>
                    <label htmlFor="phone" className="block text-sm font-medium text-text mb-2">
                      Téléphone
                    </label>
                    <Input
                      id="phone"
                      value={formData.phone}
                      onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    />
                  </div>
                </div>

                <AgencyAddressHoursFields
                  addressDetails={formData.addressDetails || {}}
                  onAddressDetailsChange={(next) => setFormData({ ...formData, addressDetails: next })}
                  openingHours={formData.openingHours || createDefaultOpeningHours()}
                  onOpeningHoursChange={(next) => setFormData({ ...formData, openingHours: next })}
                />

                <div>
                  <label htmlFor="preparationTimeMinutes" className="block text-sm font-medium text-text mb-2">
                    Temps de preparation apres retour (minutes)
                  </label>
                  <Input
                    id="preparationTimeMinutes"
                    type="number"
                    min="1"
                    value={formData.preparationTimeMinutes ?? ''}
                    onChange={(e) => setFormData({ ...formData, preparationTimeMinutes: e.target.value ? parseInt(e.target.value, 10) : undefined })}
                    placeholder="60"
                  />
                  <p className="text-xs text-text-muted mt-1">
                    Temps minimum entre la fin d&apos;une location et le debut de la suivante
                  </p>
                </div>

                {errors.submit && (
                  <div className="bg-red-500/10 border border-red-500/20 rounded-lg p-4 text-red-500 text-sm">
                    {errors.submit}
                  </div>
                )}

                <div className="pt-2 flex justify-end border-t border-border">
                  <Button type="submit" variant="primary" disabled={updateMutation.isPending}>
                    {updateMutation.isPending ? 'Mise à jour...' : 'Mettre à jour'}
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        </div>
      </MainLayout>
    </RouteGuard>
  );
}
