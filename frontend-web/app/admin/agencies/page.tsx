'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { agencyApi, Agency } from '@/lib/api/agency';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { LoadingState } from '@/components/ui/loading-state';
import { EmptyState } from '@/components/ui/empty-state';
import { ConfirmDialog } from '@/components/ui/confirm-dialog';
import { MapPin, Plus, Edit, Trash2, Search } from 'lucide-react';
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
          <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between mb-8">
            <div>
              <h1 className="text-3xl font-bold text-text mb-2">Agences</h1>
              <p className="text-text-muted">Gérer les agences</p>
            </div>
            <Link href="/admin/agencies/new" className="w-full sm:w-auto block md:shrink-0">
              <Button variant="primary" className="w-full sm:w-auto whitespace-nowrap">
                <Plus className="w-4 h-4 mr-2" />
                Nouvelle agence
              </Button>
            </Link>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6">
            <Card className="p-4">
              <p className="text-xs uppercase tracking-wide text-text-muted">Total agences</p>
              <p className="text-2xl font-bold text-text">{totalAgencies}</p>
            </Card>
            <Card className="p-4">
              <p className="text-xs uppercase tracking-wide text-text-muted">Résultats affichés</p>
              <p className="text-2xl font-bold text-text">{visibleAgencies}</p>
            </Card>
          </div>

          <Card className="mb-6 p-4">
            <div className="flex flex-col sm:flex-row sm:items-center gap-3">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-muted" />
                <Input
                  type="search"
                  placeholder="Rechercher une agence ou une entreprise..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
              {searchTerm && (
                <Button variant="secondary" onClick={() => setSearchTerm('')}>
                  Réinitialiser
                </Button>
              )}
            </div>
          </Card>

          {isLoading ? (
            <LoadingState message="Chargement des agences..." />
          ) : filteredAgencies && filteredAgencies.length > 0 ? (
            <Card padding="none">
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
                            <Button variant="ghost" size="sm">
                              <Edit className="w-4 h-4" />
                            </Button>
                          </Link>
                          <Button
                            variant="ghost"
                            size="sm"
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

