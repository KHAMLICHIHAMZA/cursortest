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
import { useState } from 'react';
import Link from 'next/link';
import { MainLayout } from '@/components/layout/main-layout';
import { RouteGuard } from '@/components/auth/route-guard';
import { toast } from '@/components/ui/toast';

export default function AgenciesPage() {
  const queryClient = useQueryClient();
  const [searchTerm, setSearchTerm] = useState('');
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [agencyToDelete, setAgencyToDelete] = useState<Agency | null>(null);

  const { data: agencies, isLoading } = useQuery({
    queryKey: ['agencies'],
    queryFn: () => agencyApi.getAll(),
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

  const normalizedSearch = searchTerm.trim().toLowerCase();

  const filteredAgencies = agencies?.filter((agency) => {
    const agencyName = (agency.name || '').toLowerCase();
    const companyName = (agency.company?.name || '').toLowerCase();
    return agencyName.includes(normalizedSearch) || companyName.includes(normalizedSearch);
  });

  const totalAgencies = agencies?.length || 0;
  const visibleAgencies = filteredAgencies?.length || 0;

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

          {isLoading ? (
            <LoadingState message="Chargement des agences..." />
          ) : filteredAgencies && filteredAgencies.length > 0 ? (
            <Card variant="elevated" padding="none" className="overflow-hidden">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Nom</TableHead>
                    <TableHead>Entreprise</TableHead>
                    <TableHead>Téléphone</TableHead>
                    <TableHead>Véhicules</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredAgencies.map((agency) => (
                    <TableRow key={agency.id}>
                      <TableCell>
                        <div className="flex items-center gap-3">
                          <MapPin className="w-5 h-5 text-primary" />
                          <span className="font-medium text-text">{agency.name}</span>
                        </div>
                      </TableCell>
                      <TableCell className="text-text-muted">{agency.company?.name || '-'}</TableCell>
                      <TableCell className="text-text-muted">{agency.phone || '-'}</TableCell>
                      <TableCell>{agency._count?.vehicles || 0}</TableCell>
                      <TableCell>
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
                    </TableRow>
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

