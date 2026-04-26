'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { fineApi, Fine } from '@/lib/api/fine';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { PageHeader } from '@/components/ui/page-header';
import { PageFilters } from '@/components/ui/page-filters';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { LoadingState } from '@/components/ui/loading-state';
import { EmptyState } from '@/components/ui/empty-state';
import { ConfirmDialog } from '@/components/ui/confirm-dialog';
import { FileText, Plus, Edit, Trash2 } from 'lucide-react';
import { useState } from 'react';
import Link from 'next/link';
import { MainLayout } from '@/components/layout/main-layout';
import { RouteGuard } from '@/components/auth/route-guard';
import { formatDateTimeFr } from '@/lib/utils/list-dates';
import { TableRowLink } from '@/components/ui/table-row-link';
import { useModuleAccess } from '@/hooks/use-module-access';
import { ModuleNotIncluded } from '@/components/ui/module-not-included';
import { toast } from '@/components/ui/toast';
import Cookies from 'js-cookie';

export default function FinesPage() {
  const queryClient = useQueryClient();
  const [searchTerm, setSearchTerm] = useState('');
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [fineToDelete, setFineToDelete] = useState<Fine | null>(null);

  // Vérifier l'accès au module FINES
  const userStr = typeof window !== 'undefined' ? Cookies.get('user') : null;
  const user = userStr ? JSON.parse(userStr) : null;
  const agencyId = user?.agencyId || user?.userAgencies?.[0]?.agencyId;
  const { isModuleActive, isLoading: isLoadingModule } = useModuleAccess('FINES', agencyId);

  const { data: fines, isLoading, error } = useQuery({
    queryKey: ['fines'],
    queryFn: () => fineApi.getAll(),
    enabled: isModuleActive,
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => fineApi.delete(id),
    onSuccess: () => {
      toast.success('Amende supprimée avec succès');
      queryClient.invalidateQueries({ queryKey: ['fines'] });
      setDeleteDialogOpen(false);
      setFineToDelete(null);
    },
    onError: (error: any) => {
      const errorMessage = error?.response?.data?.message || error?.message || 'Erreur lors de la suppression';
      toast.error(errorMessage);
      
      if (error?.status === 403 && error?.isModuleError) {
        toast.error('Le module Gestion des amendes n\'est pas activé pour votre agence.');
      }
    },
  });

  const filteredFines = fines?.filter(
    (fine) =>
      fine.booking?.vehicle?.brand?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      fine.booking?.client?.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      fine.description.toLowerCase().includes(searchTerm.toLowerCase()),
  );

  // Afficher le message si le module n'est pas activé
  if (!isLoadingModule && !isModuleActive) {
    return (
      <RouteGuard allowedRoles={['SUPER_ADMIN', 'COMPANY_ADMIN', 'AGENCY_MANAGER']}>
        <MainLayout>
          <ModuleNotIncluded 
            moduleName="FINES"
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
              moduleName="FINES"
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
        <div className="max-w-7xl mx-auto pt-2">
          <PageHeader
            title="Amendes"
            description="Gérer les amendes et contraventions"
            actionHref={isModuleActive ? '/agency/fines/new' : undefined}
            actionLabel={isModuleActive ? 'Nouvelle amende' : undefined}
            actionIcon={<Plus className="w-4 h-4 mr-2" />}
          />

          <PageFilters
            searchValue={searchTerm}
            onSearchChange={setSearchTerm}
            searchPlaceholder="Rechercher une amende (véhicule, client, description)..."
            showReset={!!searchTerm}
            onReset={() => setSearchTerm('')}
          />


          {isLoadingModule || isLoading ? (
            <LoadingState message="Chargement des amendes..." />
          ) : filteredFines && filteredFines.length > 0 ? (
            <Card variant="elevated" padding="none" className="overflow-hidden">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Véhicule</TableHead>
                    <TableHead>Client</TableHead>
                    <TableHead>Description</TableHead>
                    <TableHead>Montant</TableHead>
                    <TableHead>Statut</TableHead>
                    <TableHead>Date</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredFines.map((fine) => (
                    <TableRowLink key={fine.id} href={`/agency/fines/${fine.id}`} aria-label="Ouvrir fiche amende">
                      <TableCell>
                        <div>
                          <p className="font-medium text-text">
                            {fine.booking?.vehicle?.brand} {fine.booking?.vehicle?.model}
                          </p>
                          <p className="text-xs text-text-muted">
                            {fine.booking?.vehicle?.registrationNumber}
                          </p>
                        </div>
                      </TableCell>
                      <TableCell>
                        {fine.booking?.client?.name || '—'}
                      </TableCell>
                      <TableCell>{fine.description}</TableCell>
                      <TableCell className="font-medium">{fine.amount} MAD</TableCell>
                      <TableCell>
                        <Badge status={fine.status === 'CLOTUREE' ? 'success' : fine.status === 'CONTESTEE' ? 'error' : 'pending'}>
                          {fine.status === 'RECUE' ? 'Reçue' : fine.status === 'CLIENT_IDENTIFIE' ? 'Client identifié' : fine.status === 'TRANSMISE' ? 'Transmise' : fine.status === 'CONTESTEE' ? 'Contestée' : fine.status === 'CLOTUREE' ? 'Clôturée' : fine.status || 'Reçue'}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-text-muted text-xs">
                        {formatDateTimeFr(fine.createdAt)}
                      </TableCell>
                      <TableCell onClick={(e) => e.stopPropagation()} className="text-right">
                        {isModuleActive && (
                          <div className="flex items-center justify-end gap-2">
                            <Link href={`/agency/fines/${fine.id}`}>
                              <Button
                                variant="ghost"
                                size="sm"
                                className="h-9 w-9 p-0"
                                aria-label="Modifier l'amende"
                                title="Modifier l'amende"
                              >
                                <Edit className="w-4 h-4" />
                              </Button>
                            </Link>
                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-9 w-9 p-0"
                              aria-label="Supprimer l'amende"
                              title="Supprimer l'amende"
                              onClick={() => {
                                setFineToDelete(fine);
                                setDeleteDialogOpen(true);
                              }}
                            >
                              <Trash2 className="w-4 h-4 text-red-500" />
                            </Button>
                          </div>
                        )}
                      </TableCell>
                    </TableRowLink>
                  ))}
                </TableBody>
              </Table>
            </Card>
          ) : (
            <EmptyState
              icon={FileText}
              title="Aucune amende trouvée"
              description={searchTerm ? "Aucune amende ne correspond à votre recherche" : "Commencez par créer votre première amende"}
              action={
                !searchTerm && isModuleActive && (
                  <Link href="/agency/fines/new">
                    <Button variant="primary">
                      <Plus className="w-4 h-4 mr-2" />
                      Créer une amende
                    </Button>
                  </Link>
                )
              }
            />
          )}

          <ConfirmDialog
            isOpen={deleteDialogOpen}
            title="Supprimer l'amende"
            message={`Êtes-vous sûr de vouloir supprimer cette amende ? Cette action est irréversible.`}
            confirmText="Supprimer"
            cancelText="Annuler"
            variant="danger"
            onConfirm={() => {
              if (fineToDelete) {
                deleteMutation.mutate(fineToDelete.id);
              }
            }}
            onCancel={() => {
              setDeleteDialogOpen(false);
              setFineToDelete(null);
            }}
          />
        </div>
      </MainLayout>
    </RouteGuard>
  );
}

