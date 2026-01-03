'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useQuery as useAuthQuery } from '@tanstack/react-query';
import { authApi } from '@/lib/api/auth';
import { agencyApi, CreateAgencyDto } from '@/lib/api/agency';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select } from '@/components/ui/select';
import { FormCard } from '@/components/ui/form-card';
import { MainLayout } from '@/components/layout/main-layout';
import { RouteGuard } from '@/components/auth/route-guard';
import { toast } from '@/components/ui/toast';
import Cookies from 'js-cookie';

export default function NewCompanyAgencyPage() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const [formData, setFormData] = useState<CreateAgencyDto>({
    name: '',
    phone: '',
    address: '',
    companyId: '',
    status: 'ACTIVE',
    timezone: 'Africa/Casablanca',
    capacity: undefined,
  });
  const [errors, setErrors] = useState<Record<string, string>>({});

  const { data: user } = useAuthQuery({
    queryKey: ['me'],
    queryFn: () => authApi.getMe(),
    enabled: !!Cookies.get('accessToken'),
  });

  useEffect(() => {
    if (user?.companyId) {
      setFormData((prev) => ({ ...prev, companyId: user.companyId }));
    }
  }, [user?.companyId]);

  const createMutation = useMutation({
    mutationFn: (data: CreateAgencyDto) => agencyApi.create(data),
    onSuccess: () => {
      toast.success('Agence créée avec succès');
      queryClient.invalidateQueries({ queryKey: ['agencies'] });
      router.push('/company/agencies');
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

    if (!formData.companyId) {
      setErrors({ submit: 'Erreur: Entreprise non trouvée' });
      return;
    }

    createMutation.mutate(formData);
  };

  return (
    <RouteGuard allowedRoles={['COMPANY_ADMIN', 'SUPER_ADMIN']}>
      <MainLayout>
        <FormCard
          title="Nouvelle agence"
          description="Remplissez les informations pour créer une nouvelle agence"
          backHref="/company/agencies"
          onSubmit={handleSubmit}
          isLoading={createMutation.isPending}
          submitLabel="Créer l'agence"
        >
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
              Capacité (nombre max de véhicules)
            </label>
            <Input
              id="capacity"
              type="number"
              min="0"
              value={formData.capacity || ''}
              onChange={(e) => setFormData({ ...formData, capacity: e.target.value ? parseInt(e.target.value) : undefined })}
              placeholder="Laisser vide pour illimité"
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

