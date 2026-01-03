'use client';

import { useState, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useQuery as useAuthQuery } from '@tanstack/react-query';
import { authApi } from '@/lib/api/auth';
import { agencyApi } from '@/lib/api/agency';
import { vehicleApi } from '@/lib/api/vehicle';
import { bookingApi } from '@/lib/api/booking';
import { MainLayout } from '@/components/layout/main-layout';
import { RouteGuard } from '@/components/auth/route-guard';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { StatCard } from '@/components/ui/stat-card';
import { Input } from '@/components/ui/input';
import { LoadingState } from '@/components/ui/loading-state';
import { ModuleNotIncluded } from '@/components/ui/module-not-included';
import { useModuleAccess } from '@/hooks/use-module-access';
import { TrendingUp, Building2, Car, Users, Calendar, DollarSign, BarChart3 } from 'lucide-react';
import Cookies from 'js-cookie';

export default function CompanyAnalyticsPage() {
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');

  const { data: user } = useAuthQuery({
    queryKey: ['me'],
    queryFn: () => authApi.getMe(),
    enabled: !!Cookies.get('accessToken'),
  });

  // Vérifier l'accès au module ANALYTICS
  const { isModuleActive, isLoading: isLoadingModule } = useModuleAccess('ANALYTICS', undefined);

  const { data: agencies, isLoading: agenciesLoading } = useQuery({
    queryKey: ['agencies'],
    queryFn: () => agencyApi.getAll(),
    enabled: !!user?.companyId,
  });

  const { data: vehicles, isLoading: vehiclesLoading } = useQuery({
    queryKey: ['vehicles'],
    queryFn: () => vehicleApi.getAll(),
    enabled: !!user?.companyId,
  });

  const { data: bookings, isLoading: bookingsLoading } = useQuery({
    queryKey: ['bookings', startDate, endDate],
    queryFn: () => bookingApi.getAll(),
    enabled: !!user?.companyId,
  });

  // Filtrer les données par companyId
  const companyAgencies = useMemo(() => {
    if (!agencies || !user?.companyId) return [];
    return agencies.filter((agency) => agency.companyId === user.companyId);
  }, [agencies, user?.companyId]);

  const companyVehicles = useMemo(() => {
    if (!vehicles || !companyAgencies.length) return [];
    const agencyIds = companyAgencies.map((a) => a.id);
    return vehicles.filter((v) => agencyIds.includes(v.agencyId));
  }, [vehicles, companyAgencies]);

  const companyBookings = useMemo(() => {
    if (!bookings || !companyAgencies.length) return [];
    const agencyIds = companyAgencies.map((a) => a.id);
    let filtered = bookings.filter((b) => agencyIds.includes(b.agencyId));

    // Filtrer par période si spécifiée
    if (startDate || endDate) {
      filtered = filtered.filter((b) => {
        const bookingDate = new Date(b.startDate);
        if (startDate && bookingDate < new Date(startDate)) return false;
        if (endDate && bookingDate > new Date(endDate)) return false;
        return true;
      });
    }

    return filtered;
  }, [bookings, companyAgencies, startDate, endDate]);

  const completedBookings = useMemo(() => {
    return companyBookings.filter((b) => b.status === 'RETURNED');
  }, [companyBookings]);

  const activeBookings = useMemo(() => {
    return companyBookings.filter((b) => b.status === 'IN_PROGRESS');
  }, [companyBookings]);

  const totalRevenue = useMemo(() => {
    return completedBookings.reduce((sum, b) => sum + (b.totalPrice || 0), 0);
  }, [completedBookings]);

  const revenuePerVehicle = useMemo(() => {
    return companyVehicles.length > 0 ? totalRevenue / companyVehicles.length : 0;
  }, [totalRevenue, companyVehicles.length]);

  const occupancyRate = useMemo(() => {
    if (companyVehicles.length === 0) return 0;
    // Calcul simplifié: nombre de véhicules loués / total véhicules
    const rentedVehicles = new Set(activeBookings.map((b) => b.vehicleId)).size;
    return (rentedVehicles / companyVehicles.length) * 100;
  }, [activeBookings, companyVehicles.length]);

  const averageBookingDuration = useMemo(() => {
    if (completedBookings.length === 0) return 0;
    const totalDays = completedBookings.reduce((sum, b) => {
      const start = new Date(b.startDate);
      const end = new Date(b.endDate);
      const days = Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24));
      return sum + days;
    }, 0);
    return totalDays / completedBookings.length;
  }, [completedBookings]);

  const isLoading = isLoadingModule || agenciesLoading || vehiclesLoading || bookingsLoading;

  // Afficher le message si le module n'est pas activé
  if (!isLoadingModule && !isModuleActive) {
    return (
      <RouteGuard allowedRoles={['COMPANY_ADMIN', 'SUPER_ADMIN']}>
        <MainLayout>
          <ModuleNotIncluded 
            moduleName="ANALYTICS"
            onUpgrade={() => window.location.href = '/company'}
          />
        </MainLayout>
      </RouteGuard>
    );
  }

  const stats = [
    {
      label: 'Agences',
      value: companyAgencies.length || 0,
      icon: Building2,
      color: 'text-blue-400',
    },
    {
      label: 'Véhicules',
      value: companyVehicles.length || 0,
      icon: Car,
      color: 'text-purple-400',
    },
    {
      label: 'Locations',
      value: companyBookings.length || 0,
      icon: Calendar,
      color: 'text-pink-400',
      subValue: `${completedBookings.length} terminées`,
    },
    {
      label: 'Revenus totaux',
      value: `${totalRevenue.toLocaleString('fr-FR')} €`,
      icon: DollarSign,
      color: 'text-green-400',
      subValue: `${revenuePerVehicle.toLocaleString('fr-FR', { maximumFractionDigits: 0 })} €/véhicule`,
    },
    {
      label: 'Taux d\'occupation',
      value: `${occupancyRate.toFixed(1)}%`,
      icon: TrendingUp,
      color: 'text-yellow-400',
      subValue: `${activeBookings.length} location(s) active(s)`,
    },
    {
      label: 'Durée moyenne',
      value: `${averageBookingDuration.toFixed(1)} jours`,
      icon: BarChart3,
      color: 'text-indigo-400',
      subValue: 'Par location',
    },
  ];

  return (
    <RouteGuard allowedRoles={['COMPANY_ADMIN', 'SUPER_ADMIN']}>
      <MainLayout>
        <div className="max-w-7xl mx-auto">
          <div className="flex justify-between items-center mb-8">
            <div>
              <h1 className="text-3xl font-bold text-text mb-2">Analytics Entreprise</h1>
              <p className="text-text-muted">Statistiques et KPIs de votre entreprise</p>
            </div>
            <div className="flex gap-4">
              <Input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="max-w-xs"
                placeholder="Date de début"
              />
              <Input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="max-w-xs"
                placeholder="Date de fin"
              />
            </div>
          </div>

          {isLoading ? (
            <LoadingState message="Chargement des analytics..." />
          ) : (
            <>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
                {stats.map((stat) => {
                  const Icon = stat.icon;
                  return (
                    <Card key={stat.label}>
                      <CardHeader>
                        <div className="flex items-center justify-between mb-4">
                          <Icon className={`${stat.color} w-8 h-8`} />
                        </div>
                        <CardTitle className="text-3xl font-bold text-text mb-1">
                          {stat.value}
                        </CardTitle>
                        <p className="text-text-muted text-sm">{stat.label}</p>
                      </CardHeader>
                      {stat.subValue && (
                        <CardContent>
                          <p className="text-sm text-text-muted">{stat.subValue}</p>
                        </CardContent>
                      )}
                    </Card>
                  );
                })}
              </div>

              {/* Top Agences */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <Card>
                  <CardHeader>
                    <CardTitle>Top 10 Agences par locations</CardTitle>
                  </CardHeader>
                  <CardContent>
                    {companyAgencies.length > 0 ? (
                      <div className="space-y-3">
                        {companyAgencies
                          .map((agency) => {
                            const agencyBookings = companyBookings.filter(
                              (b) => b.agencyId === agency.id,
                            );
                            return {
                              agency,
                              count: agencyBookings.length,
                            };
                          })
                          .sort((a, b) => b.count - a.count)
                          .slice(0, 10)
                          .map(({ agency, count }) => (
                            <div
                              key={agency.id}
                              className="flex items-center justify-between p-4 bg-background rounded-lg"
                            >
                              <div>
                                <p className="font-medium text-text">{agency.name}</p>
                                <p className="text-sm text-text-muted">
                                  {count} location(s) • {agency._count?.vehicles || 0} véhicule(s)
                                </p>
                              </div>
                              <Building2 className="w-5 h-5 text-primary" />
                            </div>
                          ))}
                      </div>
                    ) : (
                      <p className="text-text-muted text-sm">Aucune agence</p>
                    )}
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle>Répartition des locations</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      <div>
                        <div className="flex justify-between mb-2">
                          <span className="text-text">Locations terminées</span>
                          <span className="font-medium text-text">
                            {completedBookings.length} ({companyBookings.length > 0 ? ((completedBookings.length / companyBookings.length) * 100).toFixed(1) : 0}%)
                          </span>
                        </div>
                        <div className="w-full bg-background rounded-full h-2">
                          <div
                            className="bg-green-500 h-2 rounded-full"
                            style={{
                              width: `${companyBookings.length > 0 ? (completedBookings.length / companyBookings.length) * 100 : 0}%`,
                            }}
                          />
                        </div>
                      </div>
                      <div>
                        <div className="flex justify-between mb-2">
                          <span className="text-text">Locations actives</span>
                          <span className="font-medium text-text">
                            {activeBookings.length} ({companyBookings.length > 0 ? ((activeBookings.length / companyBookings.length) * 100).toFixed(1) : 0}%)
                          </span>
                        </div>
                        <div className="w-full bg-background rounded-full h-2">
                          <div
                            className="bg-blue-500 h-2 rounded-full"
                            style={{
                              width: `${companyBookings.length > 0 ? (activeBookings.length / companyBookings.length) * 100 : 0}%`,
                            }}
                          />
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </>
          )}
        </div>
      </MainLayout>
    </RouteGuard>
  );
}

