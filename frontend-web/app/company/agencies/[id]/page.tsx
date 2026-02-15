'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { agencyApi, UpdateAgencyDto } from '@/lib/api/agency';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select } from '@/components/ui/select';
import { FormCard } from '@/components/ui/form-card';
import { LoadingState } from '@/components/ui/loading-state';
import { ErrorState } from '@/components/ui/error-state';
import { MainLayout } from '@/components/layout/main-layout';
import { RouteGuard } from '@/components/auth/route-guard';
import { toast } from '@/components/ui/toast';

export default function EditCompanyAgencyPage() {
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
    address: '',
    status: 'ACTIVE',
    timezone: 'Africa/Casablanca',
    capacity: undefined,
    preparationTimeMinutes: undefined,
  });
  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    if (agency) {
      setFormData({
        name: agency.name,
        phone: agency.phone || '',
        address: agency.address || '',
        status: agency.status || 'ACTIVE',
        timezone: agency.timezone || 'Africa/Casablanca',
        capacity: agency.capacity || undefined,
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
      router.push('/company/agencies');
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

    updateMutation.mutate(formData);
  };

  if (isLoading) {
    return (
      <RouteGuard allowedRoles={['COMPANY_ADMIN', 'SUPER_ADMIN']}>
        <MainLayout>
          <LoadingState message="Chargement de l'agence..." />
        </MainLayout>
      </RouteGuard>
    );
  }

  if (error || !agency) {
    return (
      <RouteGuard allowedRoles={['COMPANY_ADMIN', 'SUPER_ADMIN']}>
        <MainLayout>
          <ErrorState
            title="Agence non trouvée"
            message="L'agence demandée n'existe pas ou a été supprimée."
            onRetry={() => router.push('/company/agencies')}
          />
        </MainLayout>
      </RouteGuard>
    );
  }

  return (
    <RouteGuard allowedRoles={['COMPANY_ADMIN', 'SUPER_ADMIN']}>
      <MainLayout>
        <FormCard
          title="Modifier l'agence"
          description="Mettez à jour les informations de l'agence"
          backHref="/company/agencies"
          onSubmit={handleSubmit}
          isLoading={updateMutation.isPending}
          submitLabel="Mettre à jour"
        >
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

          <div>
            <label htmlFor="address" className="block text-sm font-medium text-text mb-2">
              Adresse
            </label>
            <Input
              id="address"
              value={formData.address}
              onChange={(e) => setFormData({ ...formData, address: e.target.value })}
            />
          </div>

          <div>
            <label htmlFor="status" className="block text-sm font-medium text-text mb-2">
              Statut
            </label>
            <Select
              id="status"
              value={formData.status}
              onChange={(e) => setFormData({ ...formData, status: e.target.value as any })}
            >
              <option value="ACTIVE">Actif</option>
              <option value="SUSPENDED">Suspendu</option>
              <option value="DELETED">Supprimé</option>
            </Select>
          </div>

          <div>
            <label htmlFor="timezone" className="block text-sm font-medium text-text mb-2">
              Fuseau horaire
            </label>
            <Select
              id="timezone"
              value={formData.timezone}
              onChange={(e) => setFormData({ ...formData, timezone: e.target.value })}
            >
              <option value="Africa/Casablanca">Africa/Casablanca (GMT+1)</option>
              <option value="Europe/Paris">Europe/Paris (GMT+1)</option>
              <option value="UTC">UTC (GMT+0)</option>
              <option value="America/New_York">America/New_York (GMT-5)</option>
            </Select>
          </div>

          <div>
            <label htmlFor="capacity" className="block text-sm font-medium text-text mb-2">
              Capacite (nombre max de vehicules)
            </label>
            <Input
              id="capacity"
              type="number"
              min="0"
              value={formData.capacity || ''}
              onChange={(e) => setFormData({ ...formData, capacity: e.target.value ? parseInt(e.target.value) : undefined })}
            />
            <p className="text-sm text-text-muted mt-1">Laisser vide pour illimite</p>
          </div>

          <div>
            <label htmlFor="preparationTimeMinutes" className="block text-sm font-medium text-text mb-2">
              Temps de preparation apres retour (minutes)
            </label>
            <Input
              id="preparationTimeMinutes"
              type="number"
              min="1"
              value={formData.preparationTimeMinutes ?? ''}
              onChange={(e) => setFormData({ ...formData, preparationTimeMinutes: e.target.value ? parseInt(e.target.value) : undefined })}
              placeholder="60"
            />
            <p className="text-xs text-text-muted mt-1">Temps minimum entre la fin d&apos;une location et le debut de la suivante</p>
          </div>

          {agency?.suspendedAt && (
            <div className="bg-yellow-500/10 border border-yellow-500/20 rounded-lg p-4">
              <p className="text-sm font-medium text-yellow-400 mb-1">Agence suspendue</p>
              <p className="text-sm text-text-muted">
                Suspendue le: {new Date(agency.suspendedAt).toLocaleDateString('fr-FR')}
              </p>
              {agency.suspendedReason && (
                <p className="text-sm text-text-muted mt-1">Raison: {agency.suspendedReason}</p>
              )}
            </div>
          )}

          {errors.submit && (
            <div className="bg-red-500/10 border border-red-500/20 rounded-lg p-4 text-red-500 text-sm">
              {errors.submit}
            </div>
          )}
        </FormCard>
      </MainLayout>
    </RouteGuard>
  );
}

