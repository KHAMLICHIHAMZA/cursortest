'use client';

import { useQuery } from '@tanstack/react-query';
import { vehicleApi, Vehicle } from '@/lib/api/vehicle';
import { clientApi, Client } from '@/lib/api/client-api';
import { bookingApi } from '@/lib/api/booking';
import { Car, Users, Calendar, Plus } from 'lucide-react';
import Link from 'next/link';
import Image from 'next/image';
import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { StatCard } from '@/components/ui/stat-card';
import { LoadingState } from '@/components/ui/loading-state';
import { EmptyState } from '@/components/ui/empty-state';
import { MainLayout } from '@/components/layout/main-layout';
import { RouteGuard } from '@/components/auth/route-guard';
import { getImageUrl } from '@/lib/utils/image-url';

export default function AgencyDashboard() {
  
  const { data: vehicles, isLoading: vehiclesLoading } = useQuery({
    queryKey: ['vehicles'],
    queryFn: () => vehicleApi.getAll(),
    staleTime: 2 * 60 * 1000,
  });

  const { data: clients, isLoading: clientsLoading } = useQuery({
    queryKey: ['clients'],
    queryFn: () => clientApi.getAll(),
    staleTime: 2 * 60 * 1000,
  });

  const { data: bookingsSummary, isLoading: bookingsLoading } = useQuery({
    queryKey: ['bookings-summary'],
    queryFn: () => bookingApi.getSummary(),
    staleTime: 2 * 60 * 1000,
  });

  const availableVehicles = vehicles?.filter((v) => v.status === 'AVAILABLE').length || 0;
  const rentedVehicles = vehicles?.filter((v) => v.status === 'RENTED').length || 0;
  const activeBookings = bookingsSummary?.active || 0;

  return (
    <RouteGuard allowedRoles={['SUPER_ADMIN', 'COMPANY_ADMIN', 'AGENCY_MANAGER', 'AGENT']}>
      <MainLayout>
        <div className="max-w-7xl mx-auto">
          <div className="mb-8 flex flex-col gap-2">
            <Badge status="info" className="w-fit">Agence</Badge>
            <h1 className="text-3xl font-bold text-text">Tableau de bord Agence</h1>
            <p className="text-text-muted">Gestion de votre agence</p>
          </div>

          {/* Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 md:gap-6 mb-8">
            <StatCard
              title="Véhicules disponibles"
              value={availableVehicles}
              icon={Car}
              iconColor="text-green-500"
              isLoading={vehiclesLoading}
            />
            <StatCard
              title="Véhicules en location"
              value={rentedVehicles}
              icon={Car}
              isLoading={vehiclesLoading}
            />
            <StatCard
              title="Clients"
              value={clients?.length || 0}
              icon={Users}
              isLoading={clientsLoading}
            />
            <StatCard
              title="Locations actives"
              value={activeBookings}
              icon={Calendar}
              isLoading={bookingsLoading}
            />
          </div>

          {/* Quick Actions */}
          <div className="mb-3">
            <h2 className="text-lg font-semibold text-text">Actions rapides</h2>
            <p className="text-sm text-text-muted">Accès direct aux modules métier de l’agence.</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 md:gap-6 mb-8">
            <Link href="/agency/vehicles">
              <Card className="hover:border-primary/60 hover:shadow-md transition-all cursor-pointer h-full">
                <div className="flex items-center gap-4 min-h-[72px]">
                  <Car className="w-8 h-8 text-primary" />
                  <div>
                    <h3 className="font-semibold text-text mb-1">Véhicules</h3>
                    <p className="text-sm text-text-muted">Gérer la flotte</p>
                  </div>
                </div>
              </Card>
            </Link>

            <Link href="/agency/clients">
              <Card className="hover:border-primary/60 hover:shadow-md transition-all cursor-pointer h-full">
                <div className="flex items-center gap-4 min-h-[72px]">
                  <Users className="w-8 h-8 text-primary" />
                  <div>
                    <h3 className="font-semibold text-text mb-1">Clients</h3>
                    <p className="text-sm text-text-muted">Gérer les clients</p>
                  </div>
                </div>
              </Card>
            </Link>

            <Link href="/agency/bookings">
              <Card className="hover:border-primary/60 hover:shadow-md transition-all cursor-pointer h-full">
                <div className="flex items-center gap-4 min-h-[72px]">
                  <Calendar className="w-8 h-8 text-primary" />
                  <div>
                    <h3 className="font-semibold text-text mb-1">Locations</h3>
                    <p className="text-sm text-text-muted">Gérer les réservations</p>
                  </div>
                </div>
              </Card>
            </Link>

            <Link href="/agency/planning">
              <Card className="hover:border-primary/60 hover:shadow-md transition-all cursor-pointer h-full">
                <div className="flex items-center gap-4 min-h-[72px]">
                  <Calendar className="w-8 h-8 text-primary" />
                  <div>
                    <h3 className="font-semibold text-text mb-1">Planning</h3>
                    <p className="text-sm text-text-muted">Vue d&apos;ensemble</p>
                  </div>
                </div>
              </Card>
            </Link>
          </div>

          {/* Recent Vehicles */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>Véhicules récents</CardTitle>
                <Link href="/agency/vehicles">
                  <Button variant="primary" size="sm">
                    <Plus className="w-4 h-4 mr-2" />
                    Nouveau véhicule
                  </Button>
                </Link>
              </div>
            </CardHeader>
            <CardContent>
              {vehiclesLoading ? (
                <LoadingState message="Chargement des véhicules..." />
              ) : vehicles && vehicles.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {vehicles.slice(0, 6).map((vehicle) => (
                    <Card key={vehicle.id} variant="outlined" padding="sm" className="hover:border-primary/50 transition-colors">
                      {vehicle.imageUrl ? (
                        <Image
                          src={getImageUrl(vehicle.imageUrl) || ''}
                          alt={`${vehicle.brand} ${vehicle.model}`}
                          width={640}
                          height={320}
                          unoptimized
                          className="w-full h-32 object-cover rounded-lg mb-3"
                        />
                      ) : (
                        <div className="w-full h-32 bg-background rounded-lg mb-3 flex items-center justify-center">
                          <Car className="w-8 h-8 text-text-muted" />
                        </div>
                      )}
                      <div className="flex items-center justify-between mb-2">
                        <h3 className="font-medium text-text">
                          {vehicle.brand} {vehicle.model}
                        </h3>
                        <Badge status={vehicle.status.toLowerCase() as any}>
                          {vehicle.status}
                        </Badge>
                      </div>
                      <p className="text-sm text-text-muted">{vehicle.registrationNumber}</p>
                      {vehicle.dailyRate && (
                        <p className="text-sm text-text mt-2">
                          {vehicle.dailyRate} MAD/jour
                        </p>
                      )}
                    </Card>
                  ))}
                </div>
              ) : (
                <EmptyState
                  icon={Car}
                  title="Aucun véhicule"
                  description="Commencez par ajouter votre premier véhicule"
                  action={
                    <Link href="/agency/vehicles/new">
                      <Button variant="primary">
                        <Plus className="w-4 h-4 mr-2" />
                        Ajouter un véhicule
                      </Button>
                    </Link>
                  }
                />
              )}
            </CardContent>
          </Card>
        </div>
      </MainLayout>
    </RouteGuard>
  );
}
