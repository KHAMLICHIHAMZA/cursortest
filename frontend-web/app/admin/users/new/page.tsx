'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { userApi, CreateUserDto } from '@/lib/api/user';
import { agencyApi } from '@/lib/api/agency';
import { companyApi } from '@/lib/api/company';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select } from '@/components/ui/select';
import { FormCard } from '@/components/ui/form-card';
import { Card } from '@/components/ui/card';
import { MainLayout } from '@/components/layout/main-layout';
import { RouteGuard } from '@/components/auth/route-guard';
import { toast } from '@/components/ui/toast';

export default function NewUserPage() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const [formData, setFormData] = useState<CreateUserDto>({
    email: '',
    name: '',
    role: 'AGENT',
    companyId: '',
    agencyIds: [],
  });
  const [errors, setErrors] = useState<Record<string, string>>({});

  const { data: companies } = useQuery({
    queryKey: ['companies'],
    queryFn: () => companyApi.getAll(),
  });

  const { data: agencies } = useQuery({
    queryKey: ['agencies', formData.companyId],
    queryFn: () => agencyApi.getAll(),
    enabled: !!formData.companyId,
  });

  const createMutation = useMutation({
    mutationFn: (data: CreateUserDto) => userApi.create(data),
    onSuccess: () => {
      toast.success('Utilisateur créé avec succès');
      queryClient.invalidateQueries({ queryKey: ['users'] });
      router.push('/admin/users');
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

    if (!formData.email || !formData.name || !formData.role) {
      setErrors({ submit: 'Veuillez remplir tous les champs obligatoires' });
      return;
    }

    createMutation.mutate(formData);
  };

  const toggleAgency = (agencyId: string) => {
    setFormData({
      ...formData,
      agencyIds: formData.agencyIds?.includes(agencyId)
        ? formData.agencyIds.filter((id) => id !== agencyId)
        : [...(formData.agencyIds || []), agencyId],
    });
  };

  return (
    <RouteGuard allowedRoles={['SUPER_ADMIN', 'COMPANY_ADMIN']}>
      <MainLayout>
        <FormCard
          title="Nouvel utilisateur"
          description="Remplissez les informations pour créer un nouvel utilisateur"
          backHref="/admin/users"
          onSubmit={handleSubmit}
          isLoading={createMutation.isPending}
          submitLabel="Créer l'utilisateur"
        >
            <div>
              <label htmlFor="name" className="block text-sm font-medium text-text mb-2">
                Nom complet *
              </label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                required
              />
            </div>

            <div>
              <label htmlFor="email" className="block text-sm font-medium text-text mb-2">
                Email *
              </label>
              <Input
                id="email"
                type="email"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                required
              />
            </div>

            <div>
              <label htmlFor="role" className="block text-sm font-medium text-text mb-2">
                Rôle *
              </label>
              <Select
                id="role"
                value={formData.role}
                onChange={(e) => setFormData({ ...formData, role: e.target.value as any })}
                required
              >
                <option value="AGENT">Agent</option>
                <option value="AGENCY_MANAGER">Gestionnaire d'agence</option>
                <option value="COMPANY_ADMIN">Administrateur d'entreprise</option>
              </Select>
            </div>

            <div>
              <label htmlFor="companyId" className="block text-sm font-medium text-text mb-2">
                Entreprise
              </label>
              <Select
                id="companyId"
                value={formData.companyId}
                onChange={(e) => setFormData({ ...formData, companyId: e.target.value, agencyIds: [] })}
              >
                <option value="">Sélectionner une entreprise</option>
                {companies?.map((company) => (
                  <option key={company.id} value={company.id}>
                    {company.name}
                  </option>
                ))}
              </Select>
            </div>

            {formData.companyId && agencies && agencies.length > 0 && (
              <div>
                <label className="block text-sm font-medium text-text mb-2">
                  Agences (multi-sélection)
                </label>
                <Card variant="outlined" padding="sm" className="max-h-48 overflow-y-auto">
                  {agencies
                    .filter((a) => a.companyId === formData.companyId)
                    .map((agency) => (
                      <label key={agency.id} className="flex items-center gap-2 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={formData.agencyIds?.includes(agency.id)}
                          onChange={() => toggleAgency(agency.id)}
                          className="w-4 h-4 rounded border-border"
                        />
                        <span className="text-text">{agency.name}</span>
                      </label>
                    ))}
                </Card>
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

