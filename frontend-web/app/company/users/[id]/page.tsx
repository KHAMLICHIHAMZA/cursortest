'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useQuery as useAuthQuery } from '@tanstack/react-query';
import { authApi } from '@/lib/api/auth';
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
import Cookies from 'js-cookie';

export default function EditCompanyUserPage() {
  const router = useRouter();
  const params = useParams();
  const id = params.id as string;
  const queryClient = useQueryClient();

  const { data: user: currentUser } = useAuthQuery({
    queryKey: ['me'],
    queryFn: () => authApi.getMe(),
    enabled: !!Cookies.get('accessToken'),
  });

  const { data: user, isLoading, error } = useQuery({
    queryKey: ['user', id],
    queryFn: () => userApi.getById(id),
    enabled: !!id,
  });

  const { data: agencies } = useQuery({
    queryKey: ['agencies'],
    queryFn: () => agencyApi.getAll(),
    enabled: !!currentUser?.companyId,
  });

  // Filtrer les agences par companyId
  const companyAgencies = agencies?.filter(
    (agency) => agency.companyId === currentUser?.companyId,
  ) || [];

  const [formData, setFormData] = useState<UpdateUserDto>({
    name: '',
    role: 'AGENT',
    isActive: true,
    agencyIds: [],
    agencyPermissions: [],
  });
  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    if (user) {
      setFormData({
        name: user.name,
        role: user.role,
        isActive: user.isActive,
        agencyIds: user.userAgencies?.map((ua) => ua.agency.id) || [],
        agencyPermissions: user.userAgencies?.map((ua) => ({
          agencyId: ua.agency.id,
          permission: ua.permission || 'FULL',
        })) || [],
      });
    }
  }, [user]);

  const updateMutation = useMutation({
    mutationFn: (data: UpdateUserDto) => userApi.update(id, data),
    onSuccess: () => {
      toast.success('Utilisateur mis à jour avec succès');
      queryClient.invalidateQueries({ queryKey: ['users'] });
      queryClient.invalidateQueries({ queryKey: ['user', id] });
      router.push('/company/users');
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
    const isIncluded = formData.agencyIds?.includes(agencyId);
    const newAgencyIds = isIncluded
      ? formData.agencyIds.filter((id) => id !== agencyId)
      : [...(formData.agencyIds || []), agencyId];
    
    const newAgencyPermissions = isIncluded
      ? formData.agencyPermissions?.filter((ap) => ap.agencyId !== agencyId) || []
      : [...(formData.agencyPermissions || []), { agencyId, permission: 'FULL' as const }];
    
    setFormData({
      ...formData,
      agencyIds: newAgencyIds,
      agencyPermissions: newAgencyPermissions,
    });
  };

  const updateAgencyPermission = (agencyId: string, permission: 'READ' | 'WRITE' | 'FULL') => {
    const existing = formData.agencyPermissions?.find((ap) => ap.agencyId === agencyId);
    const newPermissions = existing
      ? formData.agencyPermissions?.map((ap) =>
          ap.agencyId === agencyId ? { ...ap, permission } : ap
        ) || []
      : [...(formData.agencyPermissions || []), { agencyId, permission }];
    
    setFormData({
      ...formData,
      agencyPermissions: newPermissions,
    });
  };

  if (isLoading) {
    return (
      <RouteGuard allowedRoles={['COMPANY_ADMIN', 'SUPER_ADMIN']}>
        <MainLayout>
          <LoadingState message="Chargement de l'utilisateur..." />
        </MainLayout>
      </RouteGuard>
    );
  }

  if (error || !user) {
    return (
      <RouteGuard allowedRoles={['COMPANY_ADMIN', 'SUPER_ADMIN']}>
        <MainLayout>
          <ErrorState
            title="Utilisateur non trouvé"
            message="L'utilisateur demandé n'existe pas ou a été supprimé."
            onRetry={() => router.push('/company/users')}
          />
        </MainLayout>
      </RouteGuard>
    );
  }

  return (
    <RouteGuard allowedRoles={['COMPANY_ADMIN', 'SUPER_ADMIN']}>
      <MainLayout>
        <FormCard
          title="Modifier l'utilisateur"
          description="Mettez à jour les informations de l'utilisateur"
          backHref="/company/users"
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
            </Select>
          </div>

          {companyAgencies.length > 0 && (
            <div>
              <label className="block text-sm font-medium text-text mb-2">
                Agences et permissions (multi-sélection)
              </label>
              <div className="space-y-3 max-h-64 overflow-y-auto border border-border rounded-lg p-4 bg-background">
                {companyAgencies.map((agency) => {
                  const isSelected = formData.agencyIds?.includes(agency.id);
                  const permission = formData.agencyPermissions?.find((ap) => ap.agencyId === agency.id)?.permission || 'FULL';
                  return (
                    <div key={agency.id} className="flex items-start gap-3 p-2 rounded hover:bg-background/50">
                      <input
                        type="checkbox"
                        checked={isSelected}
                        onChange={() => toggleAgency(agency.id)}
                        className="w-4 h-4 rounded border-border text-primary focus:ring-primary mt-1"
                      />
                      <div className="flex-1">
                        <span className="text-text font-medium">{agency.name}</span>
                        {isSelected && (
                          <div className="mt-2">
                            <label className="block text-xs text-text-muted mb-1">Permission</label>
                            <Select
                              value={permission}
                              onChange={(e) => updateAgencyPermission(agency.id, e.target.value as 'READ' | 'WRITE' | 'FULL')}
                              className="text-sm"
                            >
                              <option value="READ">Lecture seule</option>
                              <option value="WRITE">Lecture et écriture</option>
                              <option value="FULL">Accès complet</option>
                            </Select>
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
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

