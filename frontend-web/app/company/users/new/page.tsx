'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useQuery as useAuthQuery } from '@tanstack/react-query';
import { authApi } from '@/lib/api/auth';
import { userApi, CreateUserDto } from '@/lib/api/user';
import { agencyApi } from '@/lib/api/agency';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select } from '@/components/ui/select';
import { FormCard } from '@/components/ui/form-card';
import { Card } from '@/components/ui/card';
import { MainLayout } from '@/components/layout/main-layout';
import { RouteGuard } from '@/components/auth/route-guard';
import { toast } from '@/components/ui/toast';
import Cookies from 'js-cookie';

export default function NewCompanyUserPage() {
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

  const { data: user } = useAuthQuery({
    queryKey: ['me'],
    queryFn: () => authApi.getMe(),
    enabled: !!Cookies.get('accessToken'),
  });

  const { data: agencies } = useQuery({
    queryKey: ['agencies'],
    queryFn: () => agencyApi.getAll(),
    enabled: !!user?.companyId,
  });

  // Filtrer les agences par companyId
  const companyAgencies = agencies?.filter(
    (agency) => agency.companyId === user?.companyId,
  ) || [];

  useEffect(() => {
    if (user?.companyId) {
      setFormData((prev) => ({ ...prev, companyId: user.companyId }));
    }
  }, [user?.companyId]);

  const createMutation = useMutation({
    mutationFn: (data: CreateUserDto) => userApi.create(data),
    onSuccess: () => {
      toast.success('Utilisateur créé avec succès');
      queryClient.invalidateQueries({ queryKey: ['users'] });
      router.push('/company/users');
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

    if (!formData.companyId) {
      setErrors({ submit: 'Erreur: Entreprise non trouvée' });
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
    <RouteGuard allowedRoles={['COMPANY_ADMIN', 'SUPER_ADMIN']}>
      <MainLayout>
        <FormCard
          title="Nouvel utilisateur"
          description="Remplissez les informations pour créer un nouvel utilisateur"
          backHref="/company/users"
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

          {companyAgencies.length > 0 && (
            <div>
              <label className="block text-sm font-medium text-text mb-2">
                Agences (multi-sélection)
              </label>
              <Card variant="outlined" padding="sm" className="max-h-48 overflow-y-auto">
                {companyAgencies.map((agency) => (
                  <label key={agency.id} className="flex items-center gap-2 cursor-pointer p-2 hover:bg-background rounded">
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

