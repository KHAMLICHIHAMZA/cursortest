'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { useQuery as useAuthQuery } from '@tanstack/react-query';
import { authApi } from '@/lib/api/auth';
import { userApi, User } from '@/lib/api/user';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { LoadingState } from '@/components/ui/loading-state';
import { EmptyState } from '@/components/ui/empty-state';
import { ConfirmDialog } from '@/components/ui/confirm-dialog';
import { Users, Plus, Edit, Trash2, Search, Key } from 'lucide-react';
import { useState } from 'react';
import Link from 'next/link';
import { MainLayout } from '@/components/layout/main-layout';
import { RouteGuard } from '@/components/auth/route-guard';
import { toast } from '@/components/ui/toast';
import Cookies from 'js-cookie';

export default function CompanyUsersPage() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const [searchTerm, setSearchTerm] = useState('');
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [userToDelete, setUserToDelete] = useState<User | null>(null);
  const [resetConfirmOpen, setResetConfirmOpen] = useState(false);
  const [userToReset, setUserToReset] = useState<User | null>(null);

  const { data: user } = useAuthQuery({
    queryKey: ['me'],
    queryFn: () => authApi.getMe(),
    enabled: !!Cookies.get('accessToken'),
  });

  const { data: users, isLoading } = useQuery({
    queryKey: ['users'],
    queryFn: () => userApi.getAll(),
    enabled: !!user?.companyId,
  });

  // Filtrer les utilisateurs par companyId
  const companyUsers = useMemo(() => {
    if (!users || !user?.companyId) return [];
    return users.filter((u) => u.companyId === user.companyId);
  }, [users, user?.companyId]);

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
      setResetConfirmOpen(false);
      setUserToReset(null);
    },
    onError: () => {
      toast.error("Erreur lors de l'envoi de l'email");
    },
  });

  const filteredUsers = companyUsers?.filter(
    (user) =>
      user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.role.toLowerCase().includes(searchTerm.toLowerCase()),
  );

  const getRoleStatus = (role: string): 'active' | 'pending' | 'completed' | 'inactive' => {
    switch (role) {
      case 'COMPANY_ADMIN':
        return 'active';
      case 'AGENCY_MANAGER':
        return 'pending';
      default:
        return 'inactive';
    }
  };

  return (
    <RouteGuard allowedRoles={['COMPANY_ADMIN', 'SUPER_ADMIN']}>
      <MainLayout>
        <div className="max-w-7xl mx-auto">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between mb-8">
            <div>
              <h1 className="text-3xl font-bold text-text mb-2">Utilisateurs</h1>
              <p className="text-text-muted">Gérer les utilisateurs de votre entreprise</p>
            </div>
            <Link href="/company/users/new">
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
                  {filteredUsers.map((userItem) => (
                    <TableRow key={userItem.id}>
                      <TableCell>
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                            <Users className="w-5 h-5 text-primary" />
                          </div>
                          <span className="font-medium text-text">{userItem.name}</span>
                        </div>
                      </TableCell>
                      <TableCell className="text-text-muted">{userItem.email}</TableCell>
                      <TableCell>
                        <Badge status={getRoleStatus(userItem.role)}>
                          {userItem.role.replace('_', ' ')}
                        </Badge>
                      </TableCell>
                      <TableCell>{userItem.userAgencies?.length || 0} agence(s)</TableCell>
                      <TableCell>
                        <Badge status={userItem.isActive ? 'active' : 'inactive'}>
                          {userItem.isActive ? 'Actif' : 'Inactif'}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center justify-end gap-2">
                          {!(user?.role === 'COMPANY_ADMIN' && userItem.role === 'COMPANY_ADMIN' && userItem.id !== user?.id) && (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => {
                              setUserToReset(userItem);
                              setResetConfirmOpen(true);
                            }}
                            title="Réinitialiser le mot de passe"
                          >
                            <Key className="w-4 h-4" />
                          </Button>
                          )}
                          {!(user?.role === 'COMPANY_ADMIN' && userItem.role === 'COMPANY_ADMIN' && userItem.id !== user?.id) && (
                          <Link href={`/company/users/${userItem.id}`}>
                            <Button variant="ghost" size="sm">
                              <Edit className="w-4 h-4" />
                            </Button>
                          </Link>
                          )}
                          {userItem.id === user?.id ? (
                            <span title="Vous ne pouvez pas supprimer votre propre compte">
                              <Button variant="ghost" size="sm" disabled className="opacity-50 cursor-not-allowed">
                                <Trash2 className="w-4 h-4 text-red-500" />
                              </Button>
                            </span>
                          ) : (
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => {
                                setUserToDelete(userItem);
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
              description={
                searchTerm
                  ? "Aucun utilisateur ne correspond à votre recherche"
                  : 'Commencez par créer votre premier utilisateur'
              }
              action={
                !searchTerm && (
                  <Link href="/company/users/new">
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

          <ConfirmDialog
            isOpen={resetConfirmOpen}
            title="Réinitialiser le mot de passe"
            message={`Envoyer un email de réinitialisation à ${userToReset?.name ?? userToReset?.email} ?`}
            confirmText="Envoyer"
            cancelText="Annuler"
            onConfirm={() => {
              if (userToReset) {
                resetPasswordMutation.mutate(userToReset.id);
              }
            }}
            onCancel={() => {
              setResetConfirmOpen(false);
              setUserToReset(null);
            }}
          />
        </div>
      </MainLayout>
    </RouteGuard>
  );
}

