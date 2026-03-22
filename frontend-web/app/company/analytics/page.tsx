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

  const { data: bookingsSummary, isLoading: bookingsLoading } = useQuery({
    queryKey: ['bookings-summary', startDate, endDate],
    queryFn: () =>
      bookingApi.getSummary({
        startDate: startDate || undefined,
        endDate: endDate || undefined,
      }),
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

  const completedBookings = bookingsSummary?.completed || 0;
  const activeBookings = bookingsSummary?.active || 0;
  const lateBookings = bookingsSummary?.late || 0;
  const companyBookings = bookingsSummary?.total || 0;
  const totalRevenue = bookingsSummary?.estimatedRevenue || 0;

  const revenuePerVehicle = useMemo(() => {
    return companyVehicles.length > 0 ? totalRevenue / companyVehicles.length : 0;
  }, [totalRevenue, companyVehicles.length]);

  const occupancyRate = useMemo(() => {
    if (companyVehicles.length === 0) return 0;
    return (activeBookings / companyVehicles.length) * 100;
  }, [activeBookings, companyVehicles.length]);

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
      value: companyBookings || 0,
      icon: Calendar,
      color: 'text-pink-400',
      subValue: `${completedBookings} terminées`,
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
      subValue: `${activeBookings} location(s) active(s)`,
    },
    {
      label: 'Locations en retard',
      value: `${lateBookings}`,
      icon: BarChart3,
      color: 'text-orange-400',
      subValue: 'Suivi opérationnel',
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
                    {(bookingsSummary?.topAgencies?.length || 0) > 0 ? (
                      <div className="space-y-3">
                        {bookingsSummary?.topAgencies?.map((agencyStat) => (
                            <div
                              key={agencyStat.agencyId}
                              className="flex items-center justify-between p-4 bg-background rounded-lg"
                            >
                              <div>
                                <p className="font-medium text-text">{agencyStat.agencyName}</p>
                                <p className="text-sm text-text-muted">
                                  {agencyStat.bookings} location(s)
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
                            {completedBookings} ({companyBookings > 0 ? ((completedBookings / companyBookings) * 100).toFixed(1) : 0}%)
                          </span>
                        </div>
                        <div className="w-full bg-background rounded-full h-2">
                          <div
                            className="bg-green-500 h-2 rounded-full"
                            style={{
                              width: `${companyBookings > 0 ? (completedBookings / companyBookings) * 100 : 0}%`,
                            }}
                          />
                        </div>
                      </div>
                      <div>
                        <div className="flex justify-between mb-2">
                          <span className="text-text">Locations actives</span>
                          <span className="font-medium text-text">
                            {activeBookings} ({companyBookings > 0 ? ((activeBookings / companyBookings) * 100).toFixed(1) : 0}%)
                          </span>
                        </div>
                        <div className="w-full bg-background rounded-full h-2">
                          <div
                            className="bg-blue-500 h-2 rounded-full"
                            style={{
                              width: `${companyBookings > 0 ? (activeBookings / companyBookings) * 100 : 0}%`,
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

