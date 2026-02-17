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
        <div className="max-w-7xl mx-auto">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between mb-8">
            <div>
              <h1 className="text-3xl font-bold text-text mb-2">Véhicules</h1>
              <p className="text-text-muted">Gérer la flotte de véhicules</p>
            </div>
            {canManageVehicles && (
              <Link href="/agency/vehicles/new" className="w-full sm:w-auto block">
                <Button variant="primary" className="w-full sm:w-auto">
                  <Plus className="w-4 h-4 mr-2" />
                  Nouveau véhicule
                </Button>
              </Link>
            )}
          </div>

          {isError ? (
            <div className="flex flex-col items-center justify-center py-16 text-center">
              <p className="text-text-muted mb-4">Erreur lors du chargement des véhicules</p>
              <Button variant="primary" onClick={() => refetch()}>
                Réessayer
              </Button>
            </div>
          ) : isLoading ? (
            <LoadingState message="Chargement des véhicules..." />
          ) : filteredVehicles && filteredVehicles.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredVehicles.map((vehicle) => (
                <Card key={vehicle.id} className="hover:border-primary transition-colors">
                  {vehicle.imageUrl ? (
                    <img
                      src={getImageUrl(vehicle.imageUrl) || ''}
                      alt={`${vehicle.brand} ${vehicle.model}`}
                      className="w-full h-48 object-cover rounded-t-lg mb-4"
                    />
                  ) : (
                    <div className="w-full h-48 bg-background rounded-t-lg mb-4 flex items-center justify-center">
                      <Car className="w-12 h-12 text-text-muted" />
                    </div>
                  )}
                  <div className="px-4 pb-4">
                    <div className="flex items-start justify-between mb-4">
                      <div>
                        <h3 className="font-semibold text-text">
                          {vehicle.brand} {vehicle.model}
                        </h3>
                        <p className="text-sm text-text-muted">{vehicle.registrationNumber}</p>
                      </div>
                      <Badge status={vehicle.status.toLowerCase() as any}>
                        {vehicle.status}
                      </Badge>
                    </div>

                    <div className="space-y-2 mb-4">
                      {vehicle.year && (
                        <p className="text-sm text-text-muted">Année: {vehicle.year}</p>
                      )}
                      {vehicle.color && (
                        <p className="text-sm text-text-muted">Couleur: {vehicle.color}</p>
                      )}
                      {vehicle.horsepower && (
                        <p className="text-sm text-text-muted">Puissance: {vehicle.horsepower} CV</p>
                      )}
                      {vehicle.dailyRate && (
                        <p className="text-sm font-medium text-text">
                          {vehicle.dailyRate} MAD/jour
                        </p>
                      )}
                    </div>

                    <div className="flex items-center gap-2">
                      <Link href={`/agency/vehicles/${vehicle.id}`} className="flex-1">
                        <Button variant="ghost" size="sm" className="w-full">
                          <Edit className="w-4 h-4 mr-2" />
                          Modifier
                        </Button>
                      </Link>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => {
                          setVehicleToDelete(vehicle);
                          setDeleteDialogOpen(true);
                        }}
                      >
                        <Trash2 className="w-4 h-4 text-red-500" />
                      </Button>
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          ) : (
            <EmptyState
              icon={Car}
              title="Aucun véhicule trouvé"
              description={searchTerm ? "Aucun véhicule ne correspond à votre recherche" : "Commencez par ajouter votre premier véhicule"}
              action={
                !searchTerm && (
                  <Link href="/agency/vehicles/new">
                    <Button variant="primary">
                      <Plus className="w-4 h-4 mr-2" />
                      Ajouter un véhicule
                    </Button>
                  </Link>
                )
              }
            />
          )}

          <ConfirmDialog
            isOpen={deleteDialogOpen}
            title="Supprimer le véhicule"
            message={`Êtes-vous sûr de vouloir supprimer le véhicule "${vehicleToDelete?.brand} ${vehicleToDelete?.model}" ? Cette action est irréversible.`}
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
        </div>
      </MainLayout>
    </RouteGuard>
  );
}
