'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useMutation } from '@tanstack/react-query';
import { companyApi, CreateCompanyDto } from '@/lib/api/company';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { FormCard } from '@/components/ui/form-card';
import { MainLayout } from '@/components/layout/main-layout';
import { RouteGuard } from '@/components/auth/route-guard';
import { toast } from '@/components/ui/toast';

export default function NewCompanyPage() {
  const router = useRouter();
  const [formData, setFormData] = useState<CreateCompanyDto>({
    name: '',
    phone: '',
    address: '',
    adminEmail: '',
    adminName: '',
  });
  const [errors, setErrors] = useState<Record<string, string>>({});

  const createMutation = useMutation({
    mutationFn: (data: CreateCompanyDto) => companyApi.create(data),
    onSuccess: () => {
      toast.success('Entreprise créée avec succès');
      router.push('/admin/companies');
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
    <RouteGuard allowedRoles={['SUPER_ADMIN']}>
      <MainLayout>
        <FormCard
          title="Nouvelle entreprise"
          description="Remplissez les informations pour créer une nouvelle entreprise"
          backHref="/admin/companies"
          onSubmit={handleSubmit}
          isLoading={createMutation.isPending}
          submitLabel="Créer l'entreprise"
        >
            <div>
              <label htmlFor="name" className="block text-sm font-medium text-text mb-2">
                Nom de l'entreprise *
              </label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="Ex: Location Auto Maroc"
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

            <div className="border-t border-border pt-6">
              <h2 className="text-lg font-semibold text-text mb-4">Administrateur (optionnel)</h2>
              <p className="text-sm text-text-muted mb-4">
                Créer un compte administrateur pour cette entreprise
              </p>

              <div className="space-y-4">
                <div>
                  <label htmlFor="adminName" className="block text-sm font-medium text-text mb-2">
                    Nom de l'administrateur
                  </label>
                  <Input
                    id="adminName"
                    value={formData.adminName}
                    onChange={(e) => setFormData({ ...formData, adminName: e.target.value })}
                    placeholder="Nom complet"
                  />
                </div>

                <div>
                  <label htmlFor="adminEmail" className="block text-sm font-medium text-text mb-2">
                    Email de l'administrateur
                  </label>
                  <Input
                    id="adminEmail"
                    type="email"
                    value={formData.adminEmail}
                    onChange={(e) => setFormData({ ...formData, adminEmail: e.target.value })}
                    placeholder="admin@entreprise.com"
                  />
                </div>
              </div>
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

