'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { useQuery as useAuthQuery } from '@tanstack/react-query';
import { authApi } from '@/lib/api/auth';
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
import Cookies from 'js-cookie';

export default function CompanyAgenciesPage() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const [searchTerm, setSearchTerm] = useState('');
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [agencyToDelete, setAgencyToDelete] = useState<Agency | null>(null);

  const { data: user } = useAuthQuery({
    queryKey: ['me'],
    queryFn: () => authApi.getMe(),
    enabled: !!Cookies.get('accessToken'),
  });

  const { data: agencies, isLoading } = useQuery({
    queryKey: ['agencies'],
    queryFn: () => agencyApi.getAll(),
    enabled: !!user?.companyId,
  });

  // Filtrer les agences par companyId
  const companyAgencies = useMemo(() => {
    if (!agencies || !user?.companyId) return [];
    return agencies.filter((agency) => agency.companyId === user.companyId);
  }, [agencies, user?.companyId]);

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

  const filteredAgencies = companyAgencies?.filter(
    (agency) => agency.name.toLowerCase().includes(searchTerm.toLowerCase()),
  );

  return (
    <RouteGuard allowedRoles={['COMPANY_ADMIN', 'SUPER_ADMIN']}>
      <MainLayout>
        <div className="max-w-7xl mx-auto">
          <div className="flex items-center justify-between mb-8">
            <div>
              <h1 className="text-3xl font-bold text-text mb-2">Agences</h1>
              <p className="text-text-muted">Gérer les agences de votre entreprise</p>
            </div>
            <Link href="/company/agencies/new">
              <Button variant="primary">
                <Plus className="w-4 h-4 mr-2" />
                Nouvelle agence
              </Button>
            </Link>
          </div>

          <div className="mb-6">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-text-muted" />
              <Input
                type="search"
                placeholder="Rechercher une agence..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 max-w-md"
              />
            </div>
          </div>

          {isLoading ? (
            <LoadingState message="Chargement des agences..." />
          ) : filteredAgencies && filteredAgencies.length > 0 ? (
            <Card padding="none">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Nom</TableHead>
                    <TableHead>Téléphone</TableHead>
                    <TableHead>Adresse</TableHead>
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
                      <TableCell className="text-text-muted">{agency.phone || '-'}</TableCell>
                      <TableCell className="text-text-muted">{agency.address || '-'}</TableCell>
                      <TableCell>{agency._count?.vehicles || 0}</TableCell>
                      <TableCell>
                        <div className="flex items-center justify-end gap-2">
                          <Link href={`/company/agencies/${agency.id}`}>
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
              description={
                searchTerm
                  ? "Aucune agence ne correspond à votre recherche"
                  : 'Commencez par créer votre première agence'
              }
              action={
                !searchTerm && (
                  <Link href="/company/agencies/new">
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

