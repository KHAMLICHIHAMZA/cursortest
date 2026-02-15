'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { maintenanceApi, Maintenance } from '@/lib/api/maintenance';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { LoadingState } from '@/components/ui/loading-state';
import { EmptyState } from '@/components/ui/empty-state';
import { ConfirmDialog } from '@/components/ui/confirm-dialog';
import { Wrench, Plus, Edit, Trash2 } from 'lucide-react';
import { useState } from 'react';
import Link from 'next/link';
import { MainLayout } from '@/components/layout/main-layout';
import { RouteGuard } from '@/components/auth/route-guard';
import { AgencyFilter } from '@/components/ui/agency-filter';
import { useSearch } from '@/contexts/search-context';
import { useModuleAccess } from '@/hooks/use-module-access';
import { ModuleNotIncluded } from '@/components/ui/module-not-included';
import { toast } from '@/components/ui/toast';
import Cookies from 'js-cookie';

export default function MaintenancePage() {
  const queryClient = useQueryClient();
  const { searchTerm } = useSearch();
  const [selectedAgencyId, setSelectedAgencyId] = useState<string | null>(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [maintenanceToDelete, setMaintenanceToDelete] = useState<Maintenance | null>(null);

  // Vérifier l'accès au module MAINTENANCE
  const userStr = typeof window !== 'undefined' ? Cookies.get('user') : null;
  const user = userStr ? JSON.parse(userStr) : null;
  const agencyId = selectedAgencyId || user?.agencyId || user?.userAgencies?.[0]?.agencyId;
  const { isModuleActive, isLoading: isLoadingModule } = useModuleAccess('MAINTENANCE', agencyId);

  const { data: maintenance, isLoading, error } = useQuery({
    queryKey: ['maintenance', selectedAgencyId],
    queryFn: () => maintenanceApi.getAll({ agencyId: selectedAgencyId || undefined }),
    enabled: isModuleActive,
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => maintenanceApi.delete(id),
    onSuccess: () => {
      toast.success('Maintenance supprimée avec succès');
      queryClient.invalidateQueries({ queryKey: ['maintenance'] });
      setDeleteDialogOpen(false);
      setMaintenanceToDelete(null);
    },
    onError: (error: any) => {
      const errorMessage = error?.response?.data?.message || error?.message || 'Erreur lors de la suppression';
      toast.error(errorMessage);
      
      if (error?.status === 403 && error?.isModuleError) {
        toast.error('Le module Gestion de la maintenance n\'est pas activé pour votre agence.');
      }
    },
  });

  const getStatusBadge = (status: string) => {
    const statusMap: Record<string, { status: any; label: string }> = {
      PLANNED: { status: 'pending', label: 'Planifiée' },
      IN_PROGRESS: { status: 'active', label: 'En cours' },
      COMPLETED: { status: 'completed', label: 'Terminée' },
      CANCELLED: { status: 'cancelled', label: 'Annulée' },
    };
    return statusMap[status] || { status: 'completed', label: status };
  };

  const filteredMaintenance = maintenance?.filter(
    (m) =>
      m.vehicle?.brand?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      m.vehicle?.model?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      m.description.toLowerCase().includes(searchTerm.toLowerCase()),
  );

  // Afficher le message si le module n'est pas activé
  if (!isLoadingModule && !isModuleActive) {
    return (
      <RouteGuard allowedRoles={['SUPER_ADMIN', 'COMPANY_ADMIN', 'AGENCY_MANAGER']}>
        <MainLayout>
          <ModuleNotIncluded 
            moduleName="MAINTENANCE"
            onUpgrade={() => window.location.href = '/company'}
          />
        </MainLayout>
      </RouteGuard>
    );
  }

  // Gérer les erreurs 403
  if (error && (error as any)?.status === 403) {
    const isModuleError = (error as any)?.isModuleError;
    if (isModuleError) {
      return (
        <RouteGuard allowedRoles={['SUPER_ADMIN', 'COMPANY_ADMIN', 'AGENCY_MANAGER']}>
          <MainLayout>
            <ModuleNotIncluded 
              moduleName="MAINTENANCE"
              onUpgrade={() => window.location.href = '/company'}
            />
          </MainLayout>
        </RouteGuard>
      );
    }
  }

  return (
    <RouteGuard allowedRoles={['SUPER_ADMIN', 'COMPANY_ADMIN', 'AGENCY_MANAGER']}>
      <MainLayout>
        <div className="max-w-7xl mx-auto">
          <div className="flex items-center justify-between mb-8">
            <div>
              <h1 className="text-3xl font-bold text-text mb-2">Maintenance</h1>
              <p className="text-text-muted">Gérer les opérations de maintenance</p>
            </div>
            {isModuleActive && (
              <Link href="/agency/maintenance/new">
                <Button variant="primary">
                  <Plus className="w-4 h-4 mr-2" />
                  Nouvelle maintenance
                </Button>
              </Link>
            )}
          </div>

          <div className="mb-6 flex items-center gap-4">
            <AgencyFilter
              selectedAgencyId={selectedAgencyId}
              onAgencyChange={setSelectedAgencyId}
            />
          </div>

          {isLoadingModule || isLoading ? (
            <LoadingState message="Chargement des maintenances..." />
          ) : filteredMaintenance && filteredMaintenance.length > 0 ? (
            <Card padding="none">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Véhicule</TableHead>
                    <TableHead>Description</TableHead>
                    <TableHead>Date prévue</TableHead>
                    <TableHead>Coût</TableHead>
                    <TableHead>Statut</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredMaintenance.map((m) => {
                    const statusInfo = getStatusBadge(m.status);
                    return (
                      <TableRow key={m.id}>
                        <TableCell>
                          <div>
                            <p className="font-medium text-text">
                              {m.vehicle?.brand} {m.vehicle?.model}
                            </p>
                            <p className="text-xs text-text-muted">
                              {m.vehicle?.registrationNumber}
                            </p>
                          </div>
                        </TableCell>
                        <TableCell>{m.description}</TableCell>
                        <TableCell className="text-text-muted">
                          {m.plannedAt ? new Date(m.plannedAt).toLocaleDateString('fr-FR') : '-'}
                        </TableCell>
                        <TableCell>
                          {m.cost ? `${m.cost} MAD` : '-'}
                        </TableCell>
                        <TableCell>
                          <Badge status={statusInfo.status}>
                            {statusInfo.label}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          {isModuleActive && (
                            <div className="flex items-center justify-end gap-2">
                              <Link href={`/agency/maintenance/${m.id}`}>
                                <Button variant="ghost" size="sm">
                                  <Edit className="w-4 h-4" />
                                </Button>
                              </Link>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => {
                                  setMaintenanceToDelete(m);
                                  setDeleteDialogOpen(true);
                                }}
                              >
                                <Trash2 className="w-4 h-4 text-red-500" />
                              </Button>
                            </div>
                          )}
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </Card>
          ) : (
            <EmptyState
              icon={Wrench}
              title="Aucune maintenance trouvée"
              description={searchTerm ? "Aucune maintenance ne correspond à votre recherche" : "Commencez par créer votre première maintenance"}
              action={
                !searchTerm && isModuleActive && (
                  <Link href="/agency/maintenance/new">
                    <Button variant="primary">
                      <Plus className="w-4 h-4 mr-2" />
                      Créer une maintenance
                    </Button>
                  </Link>
                )
              }
            />
          )}

          <ConfirmDialog
            isOpen={deleteDialogOpen}
            title="Supprimer la maintenance"
            message={`Êtes-vous sûr de vouloir supprimer cette maintenance ? Cette action est irréversible.`}
            confirmText="Supprimer"
            cancelText="Annuler"
            variant="danger"
            onConfirm={() => {
              if (maintenanceToDelete) {
                deleteMutation.mutate(maintenanceToDelete.id);
              }
            }}
            onCancel={() => {
              setDeleteDialogOpen(false);
              setMaintenanceToDelete(null);
            }}
          />
        </div>
      </MainLayout>
    </RouteGuard>
  );
}

