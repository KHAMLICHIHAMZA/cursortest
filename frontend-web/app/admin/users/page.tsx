'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { userApi, User } from '@/lib/api/user';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { PageHeader } from '@/components/ui/page-header';
import { PageFilters } from '@/components/ui/page-filters';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { LoadingState } from '@/components/ui/loading-state';
import { EmptyState } from '@/components/ui/empty-state';
import { ConfirmDialog } from '@/components/ui/confirm-dialog';
import { Users, Plus, Edit, Trash2, Key, LogIn } from 'lucide-react';
import { useDeferredValue, useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import Cookies from 'js-cookie';
import { MainLayout } from '@/components/layout/main-layout';
import { RouteGuard } from '@/components/auth/route-guard';
import { toast } from '@/components/ui/toast';
import { apiClient } from '@/lib/api/client';
import { authApi } from '@/lib/api/auth';

export default function UsersPage() {
  const queryClient = useQueryClient();
  const router = useRouter();
  const [searchTerm, setSearchTerm] = useState('');
  const [agencyFilter, setAgencyFilter] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 25;
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [userToDelete, setUserToDelete] = useState<User | null>(null);
  const deferredSearchTerm = useDeferredValue(searchTerm);

  const { data: currentUser } = useQuery({
    queryKey: ['me'],
    queryFn: () => authApi.getMe(),
  });

  const isSuperAdmin = currentUser?.role === 'SUPER_ADMIN';

  const { data: agenciesLookup = [] } = useQuery({
    queryKey: ['agencies', 'lookup'],
    queryFn: async () => {
      const res = await apiClient.get('/agencies/lookup');
      return res.data as Array<{ id: string; name: string }>;
    },
  });

  const { data: usersPage, isLoading } = useQuery({
    queryKey: ['users', 'light', currentPage, pageSize, deferredSearchTerm, agencyFilter],
    queryFn: () => userApi.getLight(currentPage, pageSize, deferredSearchTerm, agencyFilter),
  });

  const users = usersPage?.items || [];
  const totalUsers = usersPage?.total || 0;
  const activeUsers = usersPage?.activeTotal || 0;
  const totalPages = usersPage?.totalPages || 1;

  useEffect(() => {
    if (currentPage > totalPages) {
      setCurrentPage(totalPages);
    }
  }, [currentPage, totalPages]);

  useEffect(() => {
    setCurrentPage(1);
  }, [deferredSearchTerm, agencyFilter]);

  const deleteMutation = useMutation({
    mutationFn: (id: string) => userApi.delete(id),
    onSuccess: () => {
      toast.success('Utilisateur supprimé avec succès');
      queryClient.invalidateQueries({ queryKey: ['users'] });
      setDeleteDialogOpen(false);
      setUserToDelete(null);
    },
    onError: () => {
      toast.error('Erreur lors de la suppression');
    },
  });

  const resetPasswordMutation = useMutation({
    mutationFn: (id: string) => userApi.resetPassword(id),
    onSuccess: () => {
      toast.success('Email de réinitialisation envoyé');
    },
    onError: () => {
      toast.error('Erreur lors de l\'envoi de l\'email');
    },
  });

  const impersonateMutation = useMutation({
    mutationFn: async (userId: string) => {
      const res = await apiClient.post(`/auth/impersonate/${userId}`);
      return res.data;
    },
    onSuccess: (data) => {
      // Sauvegarder les tokens admin actuels pour pouvoir revenir
      const currentAccessToken = Cookies.get('accessToken');
      const currentRefreshToken = Cookies.get('refreshToken');
      if (currentAccessToken) {
        localStorage.setItem('admin_accessToken', currentAccessToken);
      }
      if (currentRefreshToken) {
        localStorage.setItem('admin_refreshToken', currentRefreshToken);
      }
      localStorage.setItem('impersonating', 'true');
      localStorage.setItem('impersonatedUser', JSON.stringify(data.user));

      // Remplacer par les tokens de l'utilisateur cible
      Cookies.set('accessToken', data.access_token, { expires: 1 });
      Cookies.set('refreshToken', data.refresh_token, { expires: 1 });

      toast.success(`Connecte en tant que ${data.user.email}`);

      // Rediriger selon le role
      const role = data.user.role;
      if (role === 'COMPANY_ADMIN') {
        router.push('/company');
      } else if (role === 'AGENCY_MANAGER' || role === 'AGENT') {
        router.push('/agency');
      } else {
        router.push('/admin');
      }
      // Force page reload pour reinitialiser le state
      setTimeout(() => window.location.reload(), 100);
    },
    onError: (err: any) => {
      toast.error(err?.response?.data?.message || 'Erreur lors de l\'impersonation');
    },
  });

  const visibleUsers = users.length;

  const getRoleStatus = (role: string): 'active' | 'pending' | 'completed' | 'inactive' => {
    switch (role) {
      case 'SUPER_ADMIN':
      case 'COMPANY_ADMIN':
        return 'active';
      case 'AGENCY_MANAGER':
        return 'pending';
      default:
        return 'inactive';
    }
  };

  return (
    <RouteGuard allowedRoles={['SUPER_ADMIN', 'COMPANY_ADMIN']}>
      <MainLayout>
        <div className="max-w-7xl mx-auto pt-2">
          <PageHeader
            title="Utilisateurs"
            description="Gérer les utilisateurs de la plateforme"
            actionHref="/admin/users/new"
            actionLabel="Nouvel utilisateur"
            actionIcon={<Plus className="w-4 h-4 mr-2" />}
          />

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
            <Card className="p-4 border-l-4 border-l-primary/40">
              <p className="text-xs uppercase tracking-wide text-text-muted">Total utilisateurs</p>
              <p className="mt-1 text-3xl font-bold text-text">{totalUsers}</p>
            </Card>
            <Card className="p-4 border-l-4 border-l-green-500/40">
              <p className="text-xs uppercase tracking-wide text-text-muted">Actifs</p>
              <p className="mt-1 text-3xl font-bold text-text">{activeUsers}</p>
            </Card>
            <Card className="p-4 border-l-4 border-l-indigo-500/35">
              <p className="text-xs uppercase tracking-wide text-text-muted">Résultats affichés</p>
              <p className="mt-1 text-3xl font-bold text-text">{visibleUsers}</p>
            </Card>
          </div>

          <PageFilters
            searchValue={searchTerm}
            onSearchChange={setSearchTerm}
            searchPlaceholder="Rechercher un utilisateur..."
            rightSlot={(
              <select
                value={agencyFilter}
                onChange={(e) => setAgencyFilter(e.target.value)}
                aria-label="Filtrer par agence"
                className="px-3 py-2 border border-border rounded-lg bg-card text-text text-sm min-w-[220px]"
              >
                <option value="">Toutes les agences</option>
                {agenciesLookup.map((agency) => (
                  <option key={agency.id} value={agency.id}>
                    {agency.name}
                  </option>
                ))}
              </select>
            )}
            showReset={!!searchTerm || !!agencyFilter}
            onReset={() => {
              setSearchTerm('');
              setAgencyFilter('');
            }}
          />

          <div className="mb-4 flex items-center justify-between text-sm text-text-muted">
            <span>
              {totalUsers === 0
                ? 'Aucun utilisateur'
                : `${(currentPage - 1) * pageSize + 1}-${Math.min(currentPage * pageSize, totalUsers)} sur ${totalUsers}`}
            </span>
            {totalUsers > pageSize && (
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  disabled={currentPage === 1}
                  onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                >
                  Précédent
                </Button>
                <span className="text-xs text-text-muted">
                  Page {currentPage}/{totalPages}
                </span>
                <Button
                  variant="outline"
                  size="sm"
                  disabled={currentPage >= totalPages}
                  onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                >
                  Suivant
                </Button>
              </div>
            )}
          </div>

          {isLoading ? (
            <LoadingState message="Chargement des utilisateurs..." />
          ) : users.length > 0 ? (
            <Card variant="elevated" padding="none" className="overflow-hidden">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Utilisateur</TableHead>
                    <TableHead>Email</TableHead>
                    <TableHead>Rôle</TableHead>
                    <TableHead>Agences</TableHead>
                    <TableHead>Statut</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {users.map((user) => (
                    <TableRow key={user.id}>
                      <TableCell>
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                            <Users className="w-5 h-5 text-primary" />
                          </div>
                          <span className="font-medium text-text">{user.name || 'Utilisateur sans nom'}</span>
                        </div>
                      </TableCell>
                      <TableCell className="text-text-muted">{user.email || '-'}</TableCell>
                      <TableCell>
                        <Badge status={getRoleStatus(user.role)}>
                          {user.role.replace('_', ' ')}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        {user.userAgencies && user.userAgencies.length > 0 ? (
                          <div className="flex flex-wrap gap-1">
                            {user.userAgencies.map((ua) => (
                              <span
                                key={ua.agency.id}
                                className="inline-block px-2 py-0.5 text-xs font-medium rounded-full bg-primary/10 text-primary"
                              >
                                {ua.agency.name}
                              </span>
                            ))}
                          </div>
                        ) : (
                          <span className="text-text-muted text-sm">Aucune</span>
                        )}
                      </TableCell>
                      <TableCell>
                        <Badge status={user.isActive ? 'active' : 'inactive'}>
                          {user.isActive ? 'Actif' : 'Inactif'}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center justify-end gap-2">
                          {isSuperAdmin && (
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-9 w-9 p-0"
                            onClick={() => impersonateMutation.mutate(user.id)}
                            aria-label="Se connecter en tant que cet utilisateur"
                            title="Se connecter en tant que cet utilisateur"
                            disabled={impersonateMutation.isPending}
                          >
                            <LogIn className="w-4 h-4 text-blue-500" />
                          </Button>
                          )}
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-9 w-9 p-0"
                            onClick={() => resetPasswordMutation.mutate(user.id)}
                            aria-label="Réinitialiser le mot de passe"
                            title="Réinitialiser le mot de passe"
                          >
                            <Key className="w-4 h-4" />
                          </Button>
                          <Link href={`/admin/users/${user.id}`}>
                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-9 w-9 p-0"
                              aria-label="Modifier l'utilisateur"
                              title="Modifier l'utilisateur"
                            >
                              <Edit className="w-4 h-4" />
                            </Button>
                          </Link>
                          {isSuperAdmin && (
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-9 w-9 p-0"
                            aria-label="Supprimer l'utilisateur"
                            title="Supprimer l'utilisateur"
                            onClick={() => {
                              setUserToDelete(user);
                              setDeleteDialogOpen(true);
                            }}
                          >
                            <Trash2 className="w-4 h-4 text-red-500" />
                          </Button>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </Card>
          ) : (
            <EmptyState
              icon={Users}
              title="Aucun utilisateur trouvé"
              description={searchTerm ? "Aucun utilisateur ne correspond à votre recherche" : "Commencez par créer votre premier utilisateur"}
              action={
                !searchTerm && (
                  <Link href="/admin/users/new">
                    <Button variant="primary">
                      <Plus className="w-4 h-4 mr-2" />
                      Créer un utilisateur
                    </Button>
                  </Link>
                )
              }
            />
          )}

          <ConfirmDialog
            isOpen={deleteDialogOpen}
            title="Supprimer l'utilisateur"
            message={`Êtes-vous sûr de vouloir supprimer l'utilisateur "${userToDelete?.name}" ? Cette action est irréversible.`}
            confirmText="Supprimer"
            cancelText="Annuler"
            variant="danger"
            onConfirm={() => {
              if (userToDelete) {
                deleteMutation.mutate(userToDelete.id);
              }
            }}
            onCancel={() => {
              setDeleteDialogOpen(false);
              setUserToDelete(null);
            }}
          />
        </div>
      </MainLayout>
    </RouteGuard>
  );
}

