'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { useQuery as useAuthQuery } from '@tanstack/react-query';
import { authApi } from '@/lib/api/auth';
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
import { Users, Plus, Edit, Trash2, Key } from 'lucide-react';
import { useState } from 'react';
import Link from 'next/link';
import { MainLayout } from '@/components/layout/main-layout';
import { RouteGuard } from '@/components/auth/route-guard';
import { toast } from '@/components/ui/toast';
import Cookies from 'js-cookie';
import { formatDateTimeFr } from '@/lib/utils/list-dates';
import { TableRowLink } from '@/components/ui/table-row-link';

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

  const normalizedSearch = searchTerm.trim().toLowerCase();
  const filteredUsers = companyUsers?.filter((user) => {
    const name = (user.name || '').toLowerCase();
    const email = (user.email || '').toLowerCase();
    const role = (user.role || '').toLowerCase();
    return (
      name.includes(normalizedSearch) ||
      email.includes(normalizedSearch) ||
      role.includes(normalizedSearch)
    );
  });

  const totalUsers = companyUsers?.length || 0;
  const activeUsers = companyUsers?.filter((item) => item.isActive).length || 0;
  const visibleUsers = filteredUsers?.length || 0;

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
        <div className="max-w-7xl mx-auto pt-2">
          <PageHeader
            title="Utilisateurs"
            description="Gérer les utilisateurs de votre entreprise"
            actionHref="/company/users/new"
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
            showReset={!!searchTerm}
            onReset={() => setSearchTerm('')}
          />

          {isLoading ? (
            <LoadingState message="Chargement des utilisateurs..." />
          ) : filteredUsers && filteredUsers.length > 0 ? (
            <Card variant="elevated" padding="none" className="overflow-hidden">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Utilisateur</TableHead>
                    <TableHead>Email</TableHead>
                    <TableHead>Rôle</TableHead>
                    <TableHead>Agences</TableHead>
                    <TableHead>Créé le</TableHead>
                    <TableHead>Statut</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredUsers.map((userItem) => (
                    <TableRowLink
                      key={userItem.id}
                      href={`/company/users/${userItem.id}`}
                      aria-label={`Ouvrir fiche ${userItem.name || userItem.email}`}
                    >
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
                      <TableCell className="text-text-muted text-xs whitespace-nowrap">
                        {formatDateTimeFr(userItem.createdAt)}
                      </TableCell>
                      <TableCell>
                        <Badge status={userItem.isActive ? 'active' : 'inactive'}>
                          {userItem.isActive ? 'Actif' : 'Inactif'}
                        </Badge>
                      </TableCell>
                      <TableCell onClick={(e) => e.stopPropagation()} className="text-right">
                        <div className="flex items-center justify-end gap-2">
                          {!(user?.role === 'COMPANY_ADMIN' && userItem.role === 'COMPANY_ADMIN' && userItem.id !== user?.id) && (
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-9 w-9 p-0"
                            onClick={() => {
                              setUserToReset(userItem);
                              setResetConfirmOpen(true);
                            }}
                            aria-label="Réinitialiser le mot de passe"
                            title="Réinitialiser le mot de passe"
                          >
                            <Key className="w-4 h-4" />
                          </Button>
                          )}
                          {!(user?.role === 'COMPANY_ADMIN' && userItem.role === 'COMPANY_ADMIN' && userItem.id !== user?.id) && (
                          <Link href={`/company/users/${userItem.id}`}>
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
                          )}
                          {user?.role === 'SUPER_ADMIN' && (
                            userItem.id === user?.id ? (
                              <span title="Vous ne pouvez pas supprimer votre propre compte">
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  disabled
                                  className="h-9 w-9 p-0 opacity-50 cursor-not-allowed"
                                  aria-label="Supprimer l'utilisateur"
                                >
                                  <Trash2 className="w-4 h-4 text-red-500" />
                                </Button>
                              </span>
                            ) : (
                              <Button
                                variant="ghost"
                                size="sm"
                                className="h-9 w-9 p-0"
                                aria-label="Supprimer l'utilisateur"
                                title="Supprimer l'utilisateur"
                                onClick={() => {
                                  setUserToDelete(userItem);
                                  setDeleteDialogOpen(true);
                                }}
                              >
                                <Trash2 className="w-4 h-4 text-red-500" />
                              </Button>
                            )
                          )}
                        </div>
                      </TableCell>
                    </TableRowLink>
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

