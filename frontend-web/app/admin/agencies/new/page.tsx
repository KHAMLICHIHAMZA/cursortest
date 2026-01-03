'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useMutation, useQuery } from '@tanstack/react-query';
import { agencyApi, CreateAgencyDto } from '@/lib/api/agency';
import { companyApi } from '@/lib/api/company';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select } from '@/components/ui/select';
import { FormCard } from '@/components/ui/form-card';
import { MainLayout } from '@/components/layout/main-layout';
import { RouteGuard } from '@/components/auth/route-guard';
import { toast } from '@/components/ui/toast';

export default function NewAgencyPage() {
  const router = useRouter();
  const [formData, setFormData] = useState<CreateAgencyDto>({
    name: '',
    phone: '',
    address: '',
    companyId: '',
  });
  const [errors, setErrors] = useState<Record<string, string>>({});

  const { data: companies } = useQuery({
    queryKey: ['companies'],
    queryFn: () => companyApi.getAll(),
  });

  const createMutation = useMutation({
    mutationFn: (data: CreateAgencyDto) => agencyApi.create(data),
    onSuccess: () => {
      toast.success('Agence créée avec succès');
      router.push('/admin/agencies');
    },
    onError: (error: any) => {
      const message = error.response?.data?.message || 'Erreur lors de la création';
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

    createMutation.mutate(formData);
  };

  return (
    <RouteGuard allowedRoles={['SUPER_ADMIN', 'COMPANY_ADMIN']}>
      <MainLayout>
        <FormCard
          title="Nouvelle agence"
          description="Remplissez les informations pour créer une nouvelle agence"
          backHref="/admin/agencies"
          onSubmit={handleSubmit}
          isLoading={createMutation.isPending}
          submitLabel="Créer l'agence"
        >
            <div>
              <label htmlFor="companyId" className="block text-sm font-medium text-text mb-2">
                Entreprise *
              </label>
              <Select
                id="companyId"
                value={formData.companyId}
                onChange={(e) => setFormData({ ...formData, companyId: e.target.value })}
                required
              >
                <option value="">Sélectionner une entreprise</option>
                {companies?.map((company) => (
                  <option key={company.id} value={company.id}>
                    {company.name}
                  </option>
                ))}
              </Select>
            </div>

            <div>
              <label htmlFor="name" className="block text-sm font-medium text-text mb-2">
                Nom de l'agence *
              </label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="Ex: Agence Casablanca Centre"
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
                placeholder="+212 6XX XXX XXX"
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
                placeholder="Adresse complète"
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

