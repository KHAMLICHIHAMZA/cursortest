'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { vehicleApi, Vehicle } from '@/lib/api/vehicle';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { LoadingState } from '@/components/ui/loading-state';
import { EmptyState } from '@/components/ui/empty-state';
import { ConfirmDialog } from '@/components/ui/confirm-dialog';
import { Car, Plus, Edit, Trash2, AlertTriangle } from 'lucide-react';
import { useState } from 'react';
import Link from 'next/link';
import { MainLayout } from '@/components/layout/main-layout';
import { RouteGuard } from '@/components/auth/route-guard';
import { toast } from '@/components/ui/toast';
import { getImageUrl } from '@/lib/utils/image-url';
import { useSearch } from '@/contexts/search-context';
import { useModuleAccess } from '@/hooks/use-module-access';
import { ModuleNotIncluded } from '@/components/ui/module-not-included';
import { authApi } from '@/lib/api/auth';
import Cookies from 'js-cookie';

export default function VehiclesPage() {
  const queryClient = useQueryClient();
  const { searchTerm } = useSearch();
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [vehicleToDelete, setVehicleToDelete] = useState<Vehicle | null>(null);

  // Vérifier l'accès au module VEHICLES
  const userStr = typeof window !== 'undefined' ? Cookies.get('user') : null;
  const user = userStr ? JSON.parse(userStr) : null;
  const agencyId = user?.agencyId || user?.userAgencies?.[0]?.agencyId;
  const { isModuleActive, isLoading: isLoadingModule } = useModuleAccess('VEHICLES', agencyId);

  // Récupérer le rôle pour masquer les actions selon les specs
  const { data: currentUser } = useQuery({
    queryKey: ['me'],
    queryFn: () => authApi.getMe(),
    retry: false,
  });
  const userRole = currentUser?.role;
  const canManageVehicles = userRole !== 'AGENT'; // Spec: AGENT ne peut pas gérer la flotte

  const { data: vehicles, isLoading, isError, refetch } = useQuery({
    queryKey: ['vehicles'],
    queryFn: () => vehicleApi.getAll(),
    enabled: isModuleActive, // Ne charger que si le module est activé
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => vehicleApi.delete(id),
    onSuccess: () => {
      toast.success('Véhicule supprimé avec succès');
      queryClient.invalidateQueries({ queryKey: ['vehicles'] });
      setDeleteDialogOpen(false);
      setVehicleToDelete(null);
    },
    onError: () => {
      toast.error('Erreur lors de la suppression');
    },
  });

  const filteredVehicles = vehicles?.filter(
    (vehicle) => {
      const search = (searchTerm || '').toLowerCase();
      return (
        vehicle.brand.toLowerCase().includes(search) ||
        vehicle.model.toLowerCase().includes(search) ||
        vehicle.registrationNumber.toLowerCase().includes(search)
      );
    }
  );

  return (
    <RouteGuard allowedRoles={['SUPER_ADMIN', 'COMPANY_ADMIN', 'AGENCY_MANAGER', 'AGENT']}>
      <MainLayout>
        {/* Page header */}
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between mb-8">
          <div>
            <h1 className="text-2xl font-semibold tracking-tight text-foreground">Vehicules</h1>
            <p className="mt-1 text-sm text-foreground-muted">
              {filteredVehicles?.length || 0} vehicule{(filteredVehicles?.length || 0) > 1 ? 's' : ''} dans la flotte
            </p>
          </div>
          {canManageVehicles && (
            <Link href="/agency/vehicles/new">
              <Button variant="primary">
                <Plus className="h-4 w-4" />
                Nouveau vehicule
              </Button>
            </Link>
          )}
        </div>

        {isError ? (
          <div className="flex flex-col items-center justify-center rounded-lg border border-border bg-surface-1 py-16">
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-error/10 mb-4">
              <AlertTriangle className="h-5 w-5 text-error" />
            </div>
            <p className="text-sm text-foreground-muted mb-4">Erreur lors du chargement des vehicules</p>
            <Button variant="outline" size="sm" onClick={() => refetch()}>
              Reessayer
            </Button>
          </div>
        ) : isLoading || isLoadingModule ? (
          <LoadingState message="Chargement des vehicules..." />
        ) : !isModuleActive ? (
          <ModuleNotIncluded moduleName="Vehicules" />
        ) : filteredVehicles && filteredVehicles.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredVehicles.map((vehicle) => (
              <div
                key={vehicle.id}
                className="group overflow-hidden rounded-lg border border-border bg-surface-1 transition-all duration-200 hover:border-primary/30 hover:shadow-glow"
              >
                {/* Vehicle image */}
                {vehicle.imageUrl ? (
                  <div className="relative overflow-hidden">
                    <img
                      src={getImageUrl(vehicle.imageUrl) || ''}
                      alt={`${vehicle.brand} ${vehicle.model}`}
                      className="w-full h-40 object-cover transition-transform duration-300 group-hover:scale-105"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent" />
                  </div>
                ) : (
                  <div className="w-full h-40 bg-surface-2 flex items-center justify-center">
                    <Car className="h-10 w-10 text-foreground-subtle" />
                  </div>
                )}

                {/* Vehicle info */}
                <div className="p-4">
                  <div className="flex items-start justify-between gap-2 mb-3">
                    <div className="min-w-0">
                      <h3 className="text-sm font-semibold text-foreground truncate">
                        {vehicle.brand} {vehicle.model}
                      </h3>
                      <p className="text-xs text-foreground-subtle">{vehicle.registrationNumber}</p>
                    </div>
                    <Badge status={vehicle.status.toLowerCase() as any} size="sm">
                      {vehicle.status}
                    </Badge>
                  </div>

                  {/* Details grid */}
                  <div className="grid grid-cols-2 gap-x-4 gap-y-1.5 mb-4 text-xs">
                    {vehicle.year && (
                      <div className="flex items-center justify-between">
                        <span className="text-foreground-subtle">Annee</span>
                        <span className="text-foreground">{vehicle.year}</span>
                      </div>
                    )}
                    {vehicle.color && (
                      <div className="flex items-center justify-between">
                        <span className="text-foreground-subtle">Couleur</span>
                        <span className="text-foreground">{vehicle.color}</span>
                      </div>
                    )}
                    {vehicle.horsepower && (
                      <div className="flex items-center justify-between">
                        <span className="text-foreground-subtle">Puissance</span>
                        <span className="text-foreground">{vehicle.horsepower} CV</span>
                      </div>
                    )}
                  </div>

                  {/* Price + Actions */}
                  <div className="flex items-center justify-between pt-3 border-t border-border">
                    {vehicle.dailyRate ? (
                      <p className="text-sm font-semibold text-primary">
                        {vehicle.dailyRate} <span className="text-xs font-normal text-foreground-subtle">MAD/jour</span>
                      </p>
                    ) : (
                      <span />
                    )}
                    <div className="flex items-center gap-1">
                      <Link href={`/agency/vehicles/${vehicle.id}`}>
                        <button className="flex h-8 w-8 items-center justify-center rounded-md text-foreground-subtle hover:text-foreground hover:bg-surface-2 transition-colors">
                          <Edit className="h-4 w-4" />
                        </button>
                      </Link>
                      {canManageVehicles && (
                        <button
                          onClick={() => {
                            setVehicleToDelete(vehicle);
                            setDeleteDialogOpen(true);
                          }}
                          className="flex h-8 w-8 items-center justify-center rounded-md text-foreground-subtle hover:text-error hover:bg-error/10 transition-colors"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <EmptyState
            icon={Car}
            title="Aucun vehicule trouve"
            description={searchTerm ? "Aucun vehicule ne correspond a votre recherche" : "Commencez par ajouter votre premier vehicule"}
            action={
              !searchTerm && canManageVehicles && (
                <Link href="/agency/vehicles/new">
                  <Button variant="primary">
                    <Plus className="h-4 w-4" />
                    Ajouter un vehicule
                  </Button>
                </Link>
              )
            }
          />
        )}

        <ConfirmDialog
          isOpen={deleteDialogOpen}
          title="Supprimer le vehicule"
          message={`Etes-vous sur de vouloir supprimer le vehicule "${vehicleToDelete?.brand} ${vehicleToDelete?.model}" ? Cette action est irreversible.`}
          confirmText="Supprimer"
          cancelText="Annuler"
          variant="danger"
          onConfirm={() => {
            if (vehicleToDelete) {
              deleteMutation.mutate(vehicleToDelete.id);
            }
          }}
          onCancel={() => {
            setDeleteDialogOpen(false);
            setVehicleToDelete(null);
          }}
        />
      </MainLayout>
    </RouteGuard>
  );
}
