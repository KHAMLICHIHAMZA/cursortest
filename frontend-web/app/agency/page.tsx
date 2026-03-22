'use client';

import { useQuery } from '@tanstack/react-query';
import { vehicleApi, Vehicle } from '@/lib/api/vehicle';
import { clientApi, Client } from '@/lib/api/client-api';
import { bookingApi } from '@/lib/api/booking';
import { apiClient } from '@/lib/api/client';
import { Car, Users, Calendar, Plus, TrendingUp, Percent, DollarSign, ArrowRight } from 'lucide-react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { StatCard } from '@/components/ui/stat-card';
import { LoadingState } from '@/components/ui/loading-state';
import { EmptyState } from '@/components/ui/empty-state';
import { DashboardSkeleton, StatCardSkeleton, VehicleCardSkeleton } from '@/components/ui/skeleton';
import { MainLayout } from '@/components/layout/main-layout';
import { RouteGuard } from '@/components/auth/route-guard';
import { getImageUrl } from '@/lib/utils/image-url';

interface KpiResult {
  revenue: number;
  charges: number;
  margin: number;
  marginRate: number;
  occupancyRate: number;
  totalBookings: number;
}

export default function AgencyDashboard() {
  // Get current month date range for KPI
  const now = new Date();
  const startDate = new Date(now.getFullYear(), now.getMonth(), 1).toISOString().split('T')[0];
  const endDate = now.toISOString().split('T')[0];

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

  const { data: kpi, isLoading: kpiLoading } = useQuery<KpiResult>({
    queryKey: ['dashboard-kpi', startDate, endDate],
    queryFn: async () => {
      const res = await apiClient.get('/charges/kpi', { params: { startDate, endDate } });
      return res.data;
    },
  });

  const availableVehicles = vehicles?.filter((v) => v.status === 'AVAILABLE').length || 0;
  const rentedVehicles = vehicles?.filter((v) => v.status === 'RENTED').length || 0;
  const activeBookings = bookings?.filter((b) => b.status === 'IN_PROGRESS').length || 0;
  const isInitialLoading = vehiclesLoading && clientsLoading && bookingsLoading && kpiLoading;

  if (isInitialLoading) {
    return (
      <RouteGuard allowedRoles={['SUPER_ADMIN', 'COMPANY_ADMIN', 'AGENCY_MANAGER', 'AGENT']}>
        <MainLayout>
          <DashboardSkeleton />
        </MainLayout>
      </RouteGuard>
    );
  }

  return (
    <RouteGuard allowedRoles={['SUPER_ADMIN', 'COMPANY_ADMIN', 'AGENCY_MANAGER', 'AGENT']}>
      <MainLayout>
        {/* Page header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-2xl font-semibold tracking-tight text-foreground">Tableau de bord</h1>
            <p className="mt-1 text-sm text-foreground-muted">Vue d&apos;ensemble de votre agence</p>
          </div>
          <Link href="/agency/kpi">
            <Button variant="outline" size="sm">
              <TrendingUp className="h-3.5 w-3.5" />
              Voir les KPI
            </Button>
          </Link>
        </div>

        {/* KPI Summary Row */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          <div className="rounded-lg border border-border bg-surface-1 p-4">
            <div className="flex items-center gap-3">
              <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-emerald-500/10">
                <DollarSign className="h-4 w-4 text-emerald-500" />
              </div>
              <div>
                <p className="text-[11px] uppercase tracking-wider text-foreground-subtle">CA du mois</p>
                <p className="text-lg font-semibold text-foreground">
                  {kpiLoading ? '...' : `${(kpi?.revenue || 0).toLocaleString('fr-FR')} MAD`}
                </p>
              </div>
            </div>
          </div>
          <div className="rounded-lg border border-border bg-surface-1 p-4">
            <div className="flex items-center gap-3">
              <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-blue-500/10">
                <Percent className="h-4 w-4 text-blue-500" />
              </div>
              <div>
                <p className="text-[11px] uppercase tracking-wider text-foreground-subtle">Occupation</p>
                <p className="text-lg font-semibold text-foreground">
                  {kpiLoading ? '...' : `${kpi?.occupancyRate || 0}%`}
                </p>
              </div>
            </div>
          </div>
          <div className="rounded-lg border border-border bg-surface-1 p-4">
            <div className="flex items-center gap-3">
              <div className={`flex h-9 w-9 items-center justify-center rounded-lg ${(kpi?.margin || 0) >= 0 ? 'bg-emerald-500/10' : 'bg-red-500/10'}`}>
                <TrendingUp className={`h-4 w-4 ${(kpi?.margin || 0) >= 0 ? 'text-emerald-500' : 'text-red-500'}`} />
              </div>
              <div>
                <p className="text-[11px] uppercase tracking-wider text-foreground-subtle">Marge ({kpi?.marginRate || 0}%)</p>
                <p className="text-lg font-semibold text-foreground">
                  {kpiLoading ? '...' : `${(kpi?.margin || 0).toLocaleString('fr-FR')} MAD`}
                </p>
              </div>
            </div>
          </div>
          <div className="rounded-lg border border-border bg-surface-1 p-4">
            <div className="flex items-center gap-3">
              <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary/10">
                <Calendar className="h-4 w-4 text-primary" />
              </div>
              <div>
                <p className="text-[11px] uppercase tracking-wider text-foreground-subtle">Reservations</p>
                <p className="text-lg font-semibold text-foreground">
                  {kpiLoading ? '...' : kpi?.totalBookings || 0}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Fleet Stats Row */}
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
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {Array.from({ length: 6 }).map((_, i) => (
                  <VehicleCardSkeleton key={i} />
                ))}
              </div>
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
