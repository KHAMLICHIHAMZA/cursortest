'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { agencyApi, Agency } from '@/lib/api/agency';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { PageHeader } from '@/components/ui/page-header';
import { PageFilters } from '@/components/ui/page-filters';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { LoadingState } from '@/components/ui/loading-state';
import { EmptyState } from '@/components/ui/empty-state';
import { ConfirmDialog } from '@/components/ui/confirm-dialog';
import { MapPin, Plus, Edit, Trash2 } from 'lucide-react';
import { useDeferredValue, useEffect, useState } from 'react';
import Link from 'next/link';
import { MainLayout } from '@/components/layout/main-layout';
import { RouteGuard } from '@/components/auth/route-guard';
import { formatDateTimeFr } from '@/lib/utils/list-dates';
import { TableRowLink } from '@/components/ui/table-row-link';
import { toast } from '@/components/ui/toast';

export default function AgenciesPage() {
  const queryClient = useQueryClient();
  const [searchTerm, setSearchTerm] = useState('');
  const deferredSearchTerm = useDeferredValue(searchTerm);
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 25;
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [agencyToDelete, setAgencyToDelete] = useState<Agency | null>(null);

  const { data: agenciesPage, isLoading } = useQuery({
    queryKey: ['agencies', 'light', currentPage, pageSize, deferredSearchTerm],
    queryFn: () => agencyApi.getLight(currentPage, pageSize, deferredSearchTerm),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => agencyApi.delete(id),
    onSuccess: () => {
      toast.success('Agence supprimée avec succès');
      queryClient.invalidateQueries({ queryKey: ['agencies'] });
      setDeleteDialogOpen(false);
      setAgencyToDelete(null);
    },
    onError: () => {
      toast.error('Erreur lors de la suppression');
    },
  });

  const agencies = agenciesPage?.items || [];
  const totalAgencies = agenciesPage?.total || 0;
  const visibleAgencies = agencies.length;
  const totalPages = agenciesPage?.totalPages || 1;

  useEffect(() => {
    if (currentPage > totalPages) setCurrentPage(totalPages);
  }, [currentPage, totalPages]);

  useEffect(() => {
    setCurrentPage(1);
  }, [deferredSearchTerm]);

  return (
    <RouteGuard allowedRoles={['SUPER_ADMIN', 'COMPANY_ADMIN']}>
      <MainLayout>
        <div className="max-w-7xl mx-auto pt-2">
          <PageHeader
            title="Agences"
            description="Gérer les agences"
            actionHref="/admin/agencies/new"
            actionLabel="Nouvelle agence"
            actionIcon={<Plus className="w-4 h-4 mr-2" />}
          />

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6">
            <Card className="p-4 border-l-4 border-l-primary/40">
              <p className="text-xs uppercase tracking-wide text-text-muted">Total agences</p>
              <p className="mt-1 text-3xl font-bold text-text">{totalAgencies}</p>
            </Card>
            <Card className="p-4 border-l-4 border-l-indigo-500/35">
              <p className="text-xs uppercase tracking-wide text-text-muted">Résultats affichés</p>
              <p className="mt-1 text-3xl font-bold text-text">{visibleAgencies}</p>
            </Card>
          </div>

          <PageFilters
            searchValue={searchTerm}
            onSearchChange={setSearchTerm}
            searchPlaceholder="Rechercher une agence ou une entreprise..."
            showReset={!!searchTerm}
            onReset={() => setSearchTerm('')}
          />

          <div className="mb-4 flex items-center justify-between text-sm text-text-muted">
            <span>
              {totalAgencies === 0
                ? 'Aucune agence'
                : `${(currentPage - 1) * pageSize + 1}-${Math.min(currentPage * pageSize, totalAgencies)} sur ${totalAgencies}`}
            </span>
            {totalAgencies > pageSize && (
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
            <LoadingState message="Chargement des agences..." />
          ) : agencies.length > 0 ? (
            <Card variant="elevated" padding="none" className="overflow-hidden">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Nom</TableHead>
                    <TableHead>Entreprise</TableHead>
                    <TableHead>Téléphone</TableHead>
                    <TableHead>Véhicules</TableHead>
                    <TableHead>Créée le</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {agencies.map((agency) => (
                    <TableRowLink
                      key={agency.id}
                      href={`/admin/agencies/${agency.id}`}
                      aria-label={`Ouvrir agence ${agency.name}`}
                    >
                      <TableCell>
                        <div className="flex items-center gap-3">
                          <MapPin className="w-5 h-5 text-primary" />
                          <span className="font-medium text-text">{agency.name}</span>
                        </div>
                      </TableCell>
                      <TableCell className="text-text-muted">{agency.company?.name || '-'}</TableCell>
                      <TableCell className="text-text-muted">{agency.phone || '-'}</TableCell>
                      <TableCell>{agency._count?.vehicles || 0}</TableCell>
                      <TableCell className="text-text-muted text-xs whitespace-nowrap">
                        {formatDateTimeFr(agency.createdAt)}
                      </TableCell>
                      <TableCell onClick={(e) => e.stopPropagation()} className="text-right">
                        <div className="flex items-center justify-end gap-2">
                          <Link href={`/admin/agencies/${agency.id}`}>
                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-9 w-9 p-0"
                              aria-label="Modifier l'agence"
                              title="Modifier l'agence"
                            >
                              <Edit className="w-4 h-4" />
                            </Button>
                          </Link>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-9 w-9 p-0"
                            aria-label="Supprimer l'agence"
                            title="Supprimer l'agence"
                            onClick={() => {
                              setAgencyToDelete(agency);
                              setDeleteDialogOpen(true);
                            }}
                          >
                            <Trash2 className="w-4 h-4 text-red-500" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRowLink>
                  ))}
                </TableBody>
              </Table>
            </Card>
          ) : (
            <EmptyState
              icon={MapPin}
              title="Aucune agence trouvée"
              description={searchTerm ? "Aucune agence ne correspond à votre recherche" : "Commencez par créer votre première agence"}
              action={
                !searchTerm && (
                  <Link href="/admin/agencies/new">
                    <Button variant="primary">
                      <Plus className="w-4 h-4 mr-2" />
                      Créer une agence
                    </Button>
                  </Link>
                )
              }
            />
          )}

          <ConfirmDialog
            isOpen={deleteDialogOpen}
            title="Supprimer l'agence"
            message={`Êtes-vous sûr de vouloir supprimer l'agence "${agencyToDelete?.name}" ? Cette action est irréversible.`}
            confirmText="Supprimer"
            cancelText="Annuler"
            variant="danger"
            onConfirm={() => {
              if (agencyToDelete) {
                deleteMutation.mutate(agencyToDelete.id);
              }
            }}
            onCancel={() => {
              setDeleteDialogOpen(false);
              setAgencyToDelete(null);
            }}
          />
        </div>
      </MainLayout>
    </RouteGuard>
  );
}

