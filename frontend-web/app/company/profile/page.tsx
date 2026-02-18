'use client';

import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select } from '@/components/ui/select';
import { MainLayout } from '@/components/layout/main-layout';
import { RouteGuard } from '@/components/auth/route-guard';
import { authApi } from '@/lib/api/auth';
import { agencyApi } from '@/lib/api/agency';
import { apiClient } from '@/lib/api/client';
import { toast } from '@/components/ui/toast';
import { User, Lock, MapPin } from 'lucide-react';
import Cookies from 'js-cookie';
import { LoadingState } from '@/components/ui/loading-state';

export default function CompanyProfilePage() {
  const queryClient = useQueryClient();
  const [name, setName] = useState('');
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [selectedAgencyId, setSelectedAgencyId] = useState<string>('');

  const { data: user, isLoading: userLoading } = useQuery({
    queryKey: ['me'],
    queryFn: () => authApi.getMe(),
    enabled: !!Cookies.get('accessToken'),
  });

  const { data: agencies } = useQuery({
    queryKey: ['agencies'],
    queryFn: () => agencyApi.getAll(),
    enabled: !!user?.companyId,
  });

  const companyAgencies = agencies?.filter((a) => a.companyId === user?.companyId) ?? [];

  useEffect(() => {
    if (user) {
      setName(user.name ?? '');
      setSelectedAgencyId(user.agencyIds?.[0] ?? '');
    }
  }, [user]);

  const updateNameMutation = useMutation({
    mutationFn: (payload: { name: string }) => apiClient.patch('/users/me', payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['me'] });
      toast.success('Profil mis à jour');
    },
    onError: (err: any) => {
      toast.error(err.response?.data?.message ?? 'Erreur lors de la mise à jour');
    },
  });

  const updatePasswordMutation = useMutation({
    mutationFn: (payload: { currentPassword: string; newPassword: string }) =>
      apiClient.patch('/users/me/password', payload),
    onSuccess: () => {
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
      toast.success('Mot de passe modifié');
    },
    onError: (err: any) => {
      const status = err.response?.status;
      const message = err.response?.data?.message;
      if (status === 403) {
        toast.error('Mot de passe actuel incorrect');
      } else {
        toast.error(message ?? 'Erreur lors du changement de mot de passe');
      }
    },
  });

  const updateAgencyMutation = useMutation({
    mutationFn: (agencyIds: string[]) => apiClient.patch(`/users/${user!.id}`, { agencyIds }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['me'] });
      queryClient.invalidateQueries({ queryKey: ['user', user?.id] });
      toast.success('Agence mise à jour');
    },
    onError: (err: any) => {
      toast.error(err.response?.data?.message ?? 'Erreur lors de la mise à jour');
    },
  });

  const handleSaveName = (e: React.FormEvent) => {
    e.preventDefault();
    updateNameMutation.mutate({ name });
  };

  const handleSavePassword = (e: React.FormEvent) => {
    e.preventDefault();
    if (newPassword !== confirmPassword) {
      toast.error('Les deux mots de passe ne correspondent pas');
      return;
    }
    updatePasswordMutation.mutate({ currentPassword, newPassword });
  };

  const handleSaveAgency = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedAgencyId) {
      toast.error('Veuillez sélectionner une agence');
      return;
    }
    updateAgencyMutation.mutate([selectedAgencyId]);
  };

  if (userLoading || !user) {
    return (
      <RouteGuard allowedRoles={['COMPANY_ADMIN', 'AGENCY_MANAGER', 'AGENT', 'SUPER_ADMIN']}>
        <MainLayout>
          <div className="max-w-7xl mx-auto">
            <LoadingState message="Chargement du profil..." />
          </div>
        </MainLayout>
      </RouteGuard>
    );
  }

  return (
    <RouteGuard allowedRoles={['COMPANY_ADMIN', 'AGENCY_MANAGER', 'AGENT', 'SUPER_ADMIN']}>
      <MainLayout>
        <div className="max-w-7xl mx-auto">
          <h1 className="text-xl md:text-2xl font-bold text-text mb-8">Mon Profil</h1>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Card 1: Mon Profil */}
            <Card variant="default" padding="md">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-text">
                  <User className="w-5 h-5" />
                  Mon Profil
                </CardTitle>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleSaveName} className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-text-muted mb-1">Email</label>
                    <Input
                      type="email"
                      value={user.email ?? ''}
                      readOnly
                      className="bg-muted/50 cursor-not-allowed"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-text-muted mb-1">Nom</label>
                    <Input
                      type="text"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      placeholder="Votre nom"
                      className="bg-card text-text border-border"
                    />
                  </div>
                  <Button
                    type="submit"
                    variant="primary"
                    disabled={updateNameMutation.isPending || name === (user.name ?? '')}
                  >
                    {updateNameMutation.isPending ? 'Enregistrement...' : 'Enregistrer'}
                  </Button>
                </form>
              </CardContent>
            </Card>

            {/* Card 2: Changer le mot de passe */}
            <Card variant="default" padding="md">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-text">
                  <Lock className="w-5 h-5" />
                  Changer le mot de passe
                </CardTitle>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleSavePassword} className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-text-muted mb-1">
                      Mot de passe actuel
                    </label>
                    <Input
                      type="password"
                      value={currentPassword}
                      onChange={(e) => setCurrentPassword(e.target.value)}
                      placeholder="••••••••"
                      className="bg-card text-text border-border"
                      autoComplete="current-password"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-text-muted mb-1">
                      Nouveau mot de passe
                    </label>
                    <Input
                      type="password"
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      placeholder="••••••••"
                      className="bg-card text-text border-border"
                      autoComplete="new-password"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-text-muted mb-1">
                      Confirmer le nouveau mot de passe
                    </label>
                    <Input
                      type="password"
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      placeholder="••••••••"
                      className="bg-card text-text border-border"
                      autoComplete="new-password"
                    />
                  </div>
                  <Button
                    type="submit"
                    variant="primary"
                    disabled={
                      updatePasswordMutation.isPending ||
                      !currentPassword ||
                      !newPassword ||
                      !confirmPassword
                    }
                  >
                    {updatePasswordMutation.isPending ? 'Enregistrement...' : 'Changer le mot de passe'}
                  </Button>
                </form>
              </CardContent>
            </Card>

            {/* Card 3: Mon Agence (only if user has companyId) */}
            {user.companyId && (
              <Card variant="default" padding="md" className="lg:col-span-2">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-text">
                    <MapPin className="w-5 h-5" />
                    Mon Agence
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <form onSubmit={handleSaveAgency} className="space-y-4 max-w-md">
                    <div>
                      <label className="block text-sm font-medium text-text-muted mb-1">
                        Agence assignée
                      </label>
                      <Select
                        value={selectedAgencyId}
                        onChange={(e) => setSelectedAgencyId(e.target.value)}
                        className="bg-card text-text border-border"
                      >
                        <option value="">— Sélectionner une agence —</option>
                        {companyAgencies.map((agency) => (
                          <option key={agency.id} value={agency.id}>
                            {agency.name}
                          </option>
                        ))}
                      </Select>
                    </div>
                    <Button
                      type="submit"
                      variant="primary"
                      disabled={updateAgencyMutation.isPending || !selectedAgencyId}
                    >
                      {updateAgencyMutation.isPending ? 'Enregistrement...' : 'Enregistrer'}
                    </Button>
                  </form>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </MainLayout>
    </RouteGuard>
  );
}
