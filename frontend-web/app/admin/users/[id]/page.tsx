'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { userApi, UpdateUserDto } from '@/lib/api/user';
import { agencyApi } from '@/lib/api/agency';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select } from '@/components/ui/select';
import { FormCard } from '@/components/ui/form-card';
import { LoadingState } from '@/components/ui/loading-state';
import { ErrorState } from '@/components/ui/error-state';
import { MainLayout } from '@/components/layout/main-layout';
import { RouteGuard } from '@/components/auth/route-guard';
import { toast } from '@/components/ui/toast';

export default function EditUserPage() {
  const router = useRouter();
  const params = useParams();
  const id = params.id as string;
  const queryClient = useQueryClient();

  const { data: user, isLoading, error } = useQuery({
    queryKey: ['user', id],
    queryFn: () => userApi.getById(id),
    enabled: !!id,
  });

  const { data: agencies } = useQuery({
    queryKey: ['agencies'],
    queryFn: () => agencyApi.getAll(),
  });

  const [formData, setFormData] = useState<UpdateUserDto>({
    name: '',
    role: 'AGENT',
    isActive: true,
    agencyIds: [],
  });
  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    if (user) {
      setFormData({
        name: user.name,
        role: user.role,
        isActive: user.isActive,
        agencyIds: user.userAgencies?.map((ua) => ua.agency.id) || [],
      });
    }
  }, [user]);

  const updateMutation = useMutation({
    mutationFn: (data: UpdateUserDto) => userApi.update(id, data),
    onSuccess: () => {
      toast.success('Utilisateur mis à jour avec succès');
      queryClient.invalidateQueries({ queryKey: ['users'] });
      queryClient.invalidateQueries({ queryKey: ['user', id] });
      router.push('/admin/users');
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
    updateMutation.mutate(formData);
  };

  const toggleAgency = (agencyId: string) => {
    setFormData({
      ...formData,
      agencyIds: formData.agencyIds?.includes(agencyId)
        ? formData.agencyIds.filter((id) => id !== agencyId)
        : [...(formData.agencyIds || []), agencyId],
    });
  };

  if (isLoading) {
    return (
      <RouteGuard allowedRoles={['SUPER_ADMIN', 'COMPANY_ADMIN']}>
        <MainLayout>
          <LoadingState message="Chargement de l'utilisateur..." />
        </MainLayout>
      </RouteGuard>
    );
  }

  if (error || !user) {
    return (
      <RouteGuard allowedRoles={['SUPER_ADMIN', 'COMPANY_ADMIN']}>
        <MainLayout>
          <ErrorState
            title="Utilisateur non trouvé"
            message="L'utilisateur demandé n'existe pas ou a été supprimé."
            onRetry={() => router.push('/admin/users')}
          />
        </MainLayout>
      </RouteGuard>
    );
  }

  const availableAgencies = agencies?.filter((a) => a.companyId === user.companyId) || [];

  return (
    <RouteGuard allowedRoles={['SUPER_ADMIN', 'COMPANY_ADMIN']}>
      <MainLayout>
        <FormCard
          title="Modifier l'utilisateur"
          description="Mettez à jour les informations de l'utilisateur"
          backHref="/admin/users"
          onSubmit={handleSubmit}
          isLoading={updateMutation.isPending}
          submitLabel="Mettre à jour"
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
              {user.role === 'SUPER_ADMIN' && <option value="SUPER_ADMIN">Super Administrateur</option>}
            </Select>
          </div>

          {availableAgencies.length > 0 && (
            <div>
              <label className="block text-sm font-medium text-text mb-2">
                Agences (multi-sélection)
              </label>
              <div className="space-y-2 max-h-48 overflow-y-auto border border-border rounded-lg p-4 bg-background">
                {availableAgencies.map((agency) => (
                  <label key={agency.id} className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={formData.agencyIds?.includes(agency.id)}
                      onChange={() => toggleAgency(agency.id)}
                      className="w-4 h-4 rounded border-border text-primary focus:ring-primary"
                    />
                    <span className="text-text">{agency.name}</span>
                  </label>
                ))}
              </div>
            </div>
          )}

          <div>
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={formData.isActive}
                onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
                className="w-4 h-4 rounded border-border text-primary focus:ring-primary"
              />
              <span className="text-sm font-medium text-text">Utilisateur actif</span>
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
