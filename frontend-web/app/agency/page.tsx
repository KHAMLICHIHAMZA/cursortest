'use client';

import { useQuery } from '@tanstack/react-query';
import { vehicleApi, Vehicle } from '@/lib/api/vehicle';
import { clientApi, Client } from '@/lib/api/client-api';
import { bookingApi } from '@/lib/api/booking';
import { Car, Users, Calendar, Plus } from 'lucide-react';
import Link from 'next/link';
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
  });

  const { data: clients, isLoading: clientsLoading } = useQuery({
    queryKey: ['clients'],
    queryFn: () => clientApi.getAll(),
  });

  const { data: bookings, isLoading: bookingsLoading } = useQuery({
    queryKey: ['bookings'],
    queryFn: () => bookingApi.getAll(),
  });

  const availableVehicles = vehicles?.filter((v) => v.status === 'AVAILABLE').length || 0;
  const rentedVehicles = vehicles?.filter((v) => v.status === 'RENTED').length || 0;
  const activeBookings = bookings?.filter((b) => b.status === 'IN_PROGRESS').length || 0;

  return (
    <RouteGuard allowedRoles={['SUPER_ADMIN', 'COMPANY_ADMIN', 'AGENCY_MANAGER', 'AGENT']}>
      <MainLayout>
        {/* Page header */}
        <div className="mb-8">
          <h1 className="text-2xl font-semibold tracking-tight text-foreground">Tableau de bord</h1>
          <p className="mt-1 text-sm text-foreground-muted">Vue d&apos;ensemble de votre agence</p>
        </div>

        {/* Stats row */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          <StatCard
            title="Disponibles"
            value={availableVehicles}
            icon={Car}
            iconColor="text-emerald-400"
            isLoading={vehiclesLoading}
          />
          <StatCard
            title="En location"
            value={rentedVehicles}
            icon={Car}
            iconColor="text-blue-400"
            isLoading={vehiclesLoading}
          />
          <StatCard
            title="Clients"
            value={clients?.length || 0}
            icon={Users}
            iconColor="text-primary"
            isLoading={clientsLoading}
          />
          <StatCard
            title="Locations actives"
            value={activeBookings}
            icon={Calendar}
            iconColor="text-amber-400"
            isLoading={bookingsLoading}
          />
        </div>

        {/* Quick actions grid */}
        <div className="mb-8">
          <h2 className="text-[11px] font-semibold uppercase tracking-widest text-foreground-subtle mb-3">
            Actions rapides
          </h2>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
            {[
              { href: '/agency/vehicles', icon: Car, label: 'Vehicules', desc: 'Gerer la flotte' },
              { href: '/agency/clients', icon: Users, label: 'Clients', desc: 'Gerer les clients' },
              { href: '/agency/bookings', icon: Calendar, label: 'Locations', desc: 'Reservations' },
              { href: '/agency/planning', icon: Calendar, label: 'Planning', desc: 'Vue d\'ensemble' },
            ].map((action) => (
              <Link key={action.href} href={action.href}>
                <div className="group flex items-center gap-3 rounded-lg border border-border bg-surface-1 p-4 transition-all duration-200 hover:border-primary/30 hover:bg-surface-2 cursor-pointer">
                  <div className="flex h-9 w-9 items-center justify-center rounded-md bg-primary/10 group-hover:bg-primary/15 transition-colors">
                    <action.icon className="h-4 w-4 text-primary" />
                  </div>
                  <div className="min-w-0">
                    <h3 className="text-sm font-medium text-foreground truncate">{action.label}</h3>
                    <p className="text-xs text-foreground-subtle truncate">{action.desc}</p>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </div>

        {/* Recent Vehicles */}
        <div className="rounded-lg border border-border bg-surface-1">
          <div className="flex items-center justify-between px-5 py-4 border-b border-border">
            <h2 className="text-sm font-semibold text-foreground">Vehicules recents</h2>
            <Link href="/agency/vehicles">
              <Button variant="primary" size="sm">
                <Plus className="h-3.5 w-3.5" />
                Nouveau vehicule
              </Button>
            </Link>
          </div>
          <div className="p-5">
            {vehiclesLoading ? (
              <LoadingState message="Chargement des vehicules..." />
            ) : vehicles && vehicles.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {vehicles.slice(0, 6).map((vehicle) => (
                  <div
                    key={vehicle.id}
                    className="group overflow-hidden rounded-lg border border-border bg-surface-0 transition-all duration-200 hover:border-border-hover"
                  >
                    {vehicle.imageUrl ? (
                      <img
                        src={getImageUrl(vehicle.imageUrl) || ''}
                        alt={`${vehicle.brand} ${vehicle.model}`}
                        className="w-full h-32 object-cover"
                      />
                    ) : (
                      <div className="w-full h-32 bg-surface-2 flex items-center justify-center">
                        <Car className="h-6 w-6 text-foreground-subtle" />
                      </div>
                    )}
                    <div className="p-3.5">
                      <div className="flex items-center justify-between mb-1.5">
                        <h3 className="text-sm font-medium text-foreground truncate">
                          {vehicle.brand} {vehicle.model}
                        </h3>
                        <Badge status={vehicle.status.toLowerCase() as any} size="sm">
                          {vehicle.status}
                        </Badge>
                      </div>
                      <p className="text-xs text-foreground-subtle">{vehicle.registrationNumber}</p>
                      {vehicle.dailyRate && (
                        <p className="text-xs font-medium text-primary mt-2">
                          {vehicle.dailyRate} MAD/jour
                        </p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <EmptyState
                icon={Car}
                title="Aucun vehicule"
                description="Commencez par ajouter votre premier vehicule"
                action={
                  <Link href="/agency/vehicles/new">
                    <Button variant="primary">
                      <Plus className="h-4 w-4" />
                      Ajouter un vehicule
                    </Button>
                  </Link>
                }
              />
            )}
          </div>
        </div>
      </MainLayout>
    </RouteGuard>
  );
}
