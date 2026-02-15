'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { userApi, User } from '@/lib/api/user';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { LoadingState } from '@/components/ui/loading-state';
import { EmptyState } from '@/components/ui/empty-state';
import { ConfirmDialog } from '@/components/ui/confirm-dialog';
import { Users, Plus, Edit, Trash2, Search, Key, LogIn } from 'lucide-react';
import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import Cookies from 'js-cookie';
import { MainLayout } from '@/components/layout/main-layout';
import { RouteGuard } from '@/components/auth/route-guard';
import { toast } from '@/components/ui/toast';
import { apiClient } from '@/lib/api/client';

export default function UsersPage() {
  const queryClient = useQueryClient();
  const router = useRouter();
  const [searchTerm, setSearchTerm] = useState('');
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [userToDelete, setUserToDelete] = useState<User | null>(null);

  const { data: users, isLoading } = useQuery({
    queryKey: ['users'],
    queryFn: () => userApi.getAll(),
  });

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

  const filteredUsers = users?.filter(
    (user) =>
      user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.role.toLowerCase().includes(searchTerm.toLowerCase()),
  );

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
        <div className="max-w-7xl mx-auto">
          <div className="flex items-center justify-between mb-8">
            <div>
              <h1 className="text-3xl font-bold text-text mb-2">Utilisateurs</h1>
              <p className="text-text-muted">Gérer les utilisateurs de la plateforme</p>
            </div>
            <Link href="/admin/users/new">
              <Button variant="primary">
                <Plus className="w-4 h-4 mr-2" />
                Nouvel utilisateur
              </Button>
            </Link>
          </div>

          <div className="mb-6">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-text-muted" />
              <Input
                type="search"
                placeholder="Rechercher un utilisateur..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 max-w-md"
              />
            </div>
          </div>

          {isLoading ? (
            <LoadingState message="Chargement des utilisateurs..." />
          ) : filteredUsers && filteredUsers.length > 0 ? (
            <Card padding="none">
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
                  {filteredUsers.map((user) => (
                    <TableRow key={user.id}>
                      <TableCell>
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                            <Users className="w-5 h-5 text-primary" />
                          </div>
                          <span className="font-medium text-text">{user.name}</span>
                        </div>
                      </TableCell>
                      <TableCell className="text-text-muted">{user.email}</TableCell>
                      <TableCell>
                        <Badge status={getRoleStatus(user.role)}>
                          {user.role.replace('_', ' ')}
                        </Badge>
                      </TableCell>
                      <TableCell>{user.userAgencies?.length || 0} agence(s)</TableCell>
                      <TableCell>
                        <Badge status={user.isActive ? 'active' : 'inactive'}>
                          {user.isActive ? 'Actif' : 'Inactif'}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center justify-end gap-2">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => impersonateMutation.mutate(user.id)}
                            title="Se connecter en tant que cet utilisateur"
                            disabled={impersonateMutation.isPending}
                          >
                            <LogIn className="w-4 h-4 text-blue-500" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => resetPasswordMutation.mutate(user.id)}
                            title="Réinitialiser le mot de passe"
                          >
                            <Key className="w-4 h-4" />
                          </Button>
                          <Link href={`/admin/users/${user.id}`}>
                            <Button variant="ghost" size="sm">
                              <Edit className="w-4 h-4" />
                            </Button>
                          </Link>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => {
                              setUserToDelete(user);
                              setDeleteDialogOpen(true);
                            }}
                          >
                            <Trash2 className="w-4 h-4 text-red-500" />
                          </Button>
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

