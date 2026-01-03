'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { agencyApi, UpdateAgencyDto } from '@/lib/api/agency';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { FormCard } from '@/components/ui/form-card';
import { LoadingState } from '@/components/ui/loading-state';
import { ErrorState } from '@/components/ui/error-state';
import { MainLayout } from '@/components/layout/main-layout';
import { RouteGuard } from '@/components/auth/route-guard';
import { toast } from '@/components/ui/toast';

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

  const [formData, setFormData] = useState<UpdateAgencyDto>({
    name: '',
    phone: '',
    address: '',
  });
  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    if (agency) {
      setFormData({
        name: agency.name,
        phone: agency.phone || '',
        address: agency.address || '',
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
        <FormCard
          title="Modifier l'agence"
          description="Mettez à jour les informations de l'agence"
          backHref="/admin/agencies"
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
