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
  const [phone, setPhone] = useState('');
  const [dateOfBirth, setDateOfBirth] = useState('');
  const [addressLine1, setAddressLine1] = useState('');
  const [addressLine2, setAddressLine2] = useState('');
  const [addressCity, setAddressCity] = useState('');
  const [addressPostalCode, setAddressPostalCode] = useState('');
  const [addressCountry, setAddressCountry] = useState('');
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
      setPhone(user.phone ?? '');
      setDateOfBirth(user.dateOfBirth ? new Date(user.dateOfBirth).toISOString().slice(0, 10) : '');
      const details = user.addressDetails || {};
      setAddressLine1(details.line1 || user.address || '');
      setAddressLine2(details.line2 || '');
      setAddressCity(details.city || '');
      setAddressPostalCode(details.postalCode || '');
      setAddressCountry(details.country || '');
      setSelectedAgencyId(user.agencyIds?.[0] ?? '');
    }
  }, [user]);

  const updateProfileMutation = useMutation({
    mutationFn: (payload: {
      name: string;
      phone?: string;
      dateOfBirth?: string;
      addressDetails?: {
        line1: string;
        line2?: string;
        city: string;
        postalCode: string;
        country: string;
      };
    }) => apiClient.patch('/users/me', payload),
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
    if (!name.trim()) {
      toast.error('Le nom est requis');
      return;
    }

    const payload: {
      name: string;
      phone?: string;
      dateOfBirth?: string;
      addressDetails?: {
        line1: string;
        line2?: string;
        city: string;
        postalCode: string;
        country: string;
      };
    } = { name: name.trim() };

    if (phone.trim()) payload.phone = phone.trim();
    if (dateOfBirth) {
      const parsed = new Date(dateOfBirth);
      if (Number.isNaN(parsed.getTime())) {
        toast.error('Date de naissance invalide');
        return;
      }
      payload.dateOfBirth = parsed.toISOString();
    }

    const hasAnyAddressInput = [
      addressLine1,
      addressLine2,
      addressCity,
      addressPostalCode,
      addressCountry,
    ].some((value) => value.trim().length > 0);

    if (hasAnyAddressInput) {
      if (!addressLine1.trim() || !addressCity.trim() || !addressPostalCode.trim() || !addressCountry.trim()) {
        toast.error('Adresse incomplète: ligne 1, ville, code postal et pays sont requis');
        return;
      }
      payload.addressDetails = {
        line1: addressLine1.trim(),
        line2: addressLine2.trim() || undefined,
        city: addressCity.trim(),
        postalCode: addressPostalCode.trim(),
        country: addressCountry.trim(),
      };
    }

    updateProfileMutation.mutate(payload);
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
                  <div>
                    <label className="block text-sm font-medium text-text-muted mb-1">Téléphone</label>
                    <Input
                      type="text"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      placeholder="Ex: +212600000000"
                      className="bg-card text-text border-border"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-text-muted mb-1">Date de naissance</label>
                    <Input
                      type="date"
                      value={dateOfBirth}
                      onChange={(e) => setDateOfBirth(e.target.value)}
                      className="bg-card text-text border-border"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="block text-sm font-medium text-text-muted">Adresse structurée</label>
                    <Input
                      type="text"
                      value={addressLine1}
                      onChange={(e) => setAddressLine1(e.target.value)}
                      placeholder="Ligne 1 (numéro, rue...)"
                      className="bg-card text-text border-border"
                    />
                    <Input
                      type="text"
                      value={addressLine2}
                      onChange={(e) => setAddressLine2(e.target.value)}
                      placeholder="Ligne 2 (bâtiment, quartier...)"
                      className="bg-card text-text border-border"
                    />
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                      <Input
                        type="text"
                        value={addressPostalCode}
                        onChange={(e) => setAddressPostalCode(e.target.value)}
                        placeholder="Code postal"
                        className="bg-card text-text border-border"
                      />
                      <Input
                        type="text"
                        value={addressCity}
                        onChange={(e) => setAddressCity(e.target.value)}
                        placeholder="Ville"
                        className="bg-card text-text border-border"
                      />
                      <Input
                        type="text"
                        value={addressCountry}
                        onChange={(e) => setAddressCountry(e.target.value)}
                        placeholder="Pays"
                        className="bg-card text-text border-border"
                      />
                    </div>
                  </div>
                  <Button
                    type="submit"
                    variant="primary"
                    disabled={updateProfileMutation.isPending}
                  >
                    {updateProfileMutation.isPending ? 'Enregistrement...' : 'Enregistrer'}
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

            {/* Card 3: Mon Agence (only for COMPANY_ADMIN and SUPER_ADMIN) */}
            {user.companyId && (user.role === 'COMPANY_ADMIN' || user.role === 'SUPER_ADMIN') && (
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
