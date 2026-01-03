'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { companyApi, UpdateCompanyDto } from '@/lib/api/company';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { FormCard } from '@/components/ui/form-card';
import { LoadingState } from '@/components/ui/loading-state';
import { ErrorState } from '@/components/ui/error-state';
import { MainLayout } from '@/components/layout/main-layout';
import { RouteGuard } from '@/components/auth/route-guard';
import { toast } from '@/components/ui/toast';

export default function EditCompanyPage() {
  const router = useRouter();
  const params = useParams();
  const id = params.id as string;
  const queryClient = useQueryClient();

  const { data: company, isLoading, error } = useQuery({
    queryKey: ['company', id],
    queryFn: () => companyApi.getById(id),
    enabled: !!id,
  });

  const [formData, setFormData] = useState<UpdateCompanyDto>({
    name: '',
    phone: '',
    address: '',
    isActive: true,
  });
  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    if (company) {
      setFormData({
        name: company.name,
        phone: company.phone || '',
        address: company.address || '',
        isActive: company.isActive,
      });
    }
  }, [company]);

  const updateMutation = useMutation({
    mutationFn: (data: UpdateCompanyDto) => companyApi.update(id, data),
    onSuccess: () => {
      toast.success('Entreprise mise à jour avec succès');
      queryClient.invalidateQueries({ queryKey: ['companies'] });
      queryClient.invalidateQueries({ queryKey: ['company', id] });
      router.push('/admin/companies');
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
      <RouteGuard allowedRoles={['SUPER_ADMIN']}>
        <MainLayout>
          <LoadingState message="Chargement de l'entreprise..." />
        </MainLayout>
      </RouteGuard>
    );
  }

  if (error || !company) {
    return (
      <RouteGuard allowedRoles={['SUPER_ADMIN']}>
        <MainLayout>
          <ErrorState
            title="Entreprise non trouvée"
            message="L'entreprise demandée n'existe pas ou a été supprimée."
            onRetry={() => router.push('/admin/companies')}
          />
        </MainLayout>
      </RouteGuard>
    );
  }

  return (
    <RouteGuard allowedRoles={['SUPER_ADMIN']}>
      <MainLayout>
        <FormCard
          title="Modifier l'entreprise"
          description="Mettez à jour les informations de l'entreprise"
          backHref="/admin/companies"
          onSubmit={handleSubmit}
          isLoading={updateMutation.isPending}
          submitLabel="Mettre à jour"
        >
          <div>
            <label htmlFor="name" className="block text-sm font-medium text-text mb-2">
              Nom de l'entreprise *
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
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={formData.isActive}
                onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
                className="w-4 h-4 rounded border-border text-primary focus:ring-primary"
              />
              <span className="text-sm font-medium text-text">Entreprise active</span>
            </label>
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
