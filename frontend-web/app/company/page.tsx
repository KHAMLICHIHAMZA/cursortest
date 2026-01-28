'use client';

import { useEffect, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { useQuery } from '@tanstack/react-query';
import { authApi } from '@/lib/api/auth';
import { agencyApi } from '@/lib/api/agency';
import { userApi } from '@/lib/api/user';
import { vehicleApi } from '@/lib/api/vehicle';
import { bookingApi } from '@/lib/api/booking';
import { subscriptionApi } from '@/lib/api/subscription';
import { billingApi } from '@/lib/api/billing';
import { companyApi } from '@/lib/api/company';
import Cookies from 'js-cookie';
import { MainLayout } from '@/components/layout/main-layout';
import { RouteGuard } from '@/components/auth/route-guard';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { StatCard } from '@/components/ui/stat-card';
import { Building2, MapPin, Users, TrendingUp, Car, Calendar, BarChart3, AlertCircle, CreditCard } from 'lucide-react';
import Link from 'next/link';
import { Badge } from '@/components/ui/badge';

export default function CompanyDashboard() {
  const router = useRouter();
  const { data: user } = useQuery({
    queryKey: ['me'],
    queryFn: () => authApi.getMe(),
    enabled: !!Cookies.get('accessToken'),
  });

  // Récupérer les données de l'entreprise
  const { data: agencies, isLoading: agenciesLoading } = useQuery({
    queryKey: ['agencies'],
    queryFn: () => agencyApi.getAll(),
    enabled: !!user?.companyId,
  });

  const { data: users, isLoading: usersLoading } = useQuery({
    queryKey: ['users'],
    queryFn: () => userApi.getAll(),
    enabled: !!user?.companyId,
  });

  const { data: vehicles, isLoading: vehiclesLoading } = useQuery({
    queryKey: ['vehicles'],
    queryFn: () => vehicleApi.getAll(),
    enabled: !!user?.companyId,
  });

  const { data: bookings, isLoading: bookingsLoading } = useQuery({
    queryKey: ['bookings'],
    queryFn: () => bookingApi.getAll(),
    enabled: !!user?.companyId,
  });

  const { data: subscription } = useQuery({
    queryKey: ['subscription', user?.companyId],
    queryFn: () => subscriptionApi.getByCompany(user!.companyId!),
    enabled: !!user?.companyId,
  });

  const { data: companyInfo } = useQuery({
    queryKey: ['company', user?.companyId],
    queryFn: () => companyApi.getMyCompany(),
    enabled: !!user?.companyId,
  });

  const { data: invoices } = useQuery({
    queryKey: ['invoices', user?.companyId],
    queryFn: () => billingApi.getCompanyInvoices(user!.companyId!),
    enabled: !!user?.companyId,
  });

  // Filtrer les données par companyId
  const companyAgencies = useMemo(() => {
    if (!agencies || !user?.companyId) return [];
    return agencies.filter((agency) => agency.companyId === user.companyId);
  }, [agencies, user?.companyId]);

  const companyUsers = useMemo(() => {
    if (!users || !user?.companyId) return [];
    return users.filter((u) => u.companyId === user.companyId && u.isActive);
  }, [users, user?.companyId]);

  const companyVehicles = useMemo(() => {
    if (!vehicles || !companyAgencies.length) return [];
    const agencyIds = companyAgencies.map((a) => a.id);
    return vehicles.filter((v) => agencyIds.includes(v.agencyId));
  }, [vehicles, companyAgencies]);

  const activeBookings = useMemo(() => {
    if (!bookings || !companyAgencies.length) return [];
    const agencyIds = companyAgencies.map((a) => a.id);
    return bookings.filter(
      (b) => agencyIds.includes(b.agencyId) && b.status === 'IN_PROGRESS',
    );
  }, [bookings, companyAgencies]);

  const completedBookings = useMemo(() => {
    if (!bookings || !companyAgencies.length) return [];
    const agencyIds = companyAgencies.map((a) => a.id);
    return bookings.filter(
      (b) => agencyIds.includes(b.agencyId) && b.status === 'RETURNED',
    );
  }, [bookings, companyAgencies]);

  const totalRevenue = useMemo(() => {
    return completedBookings.reduce((sum, b) => sum + (b.totalPrice || 0), 0);
  }, [completedBookings]);

  // Calculer les jours restants avant expiration
  const daysUntilExpiration = subscription?.endDate
    ? Math.ceil((new Date(subscription.endDate).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24))
    : null;

  // Factures en retard
  const overdueInvoices = invoices?.filter(
    (inv) => inv.status === 'PENDING' && new Date(inv.dueDate) < new Date()
  ) || [];

  // Si l'utilisateur est SUPER_ADMIN, rediriger vers /admin
  useEffect(() => {
    if (user?.role === 'SUPER_ADMIN') {
      router.push('/admin');
    }
  }, [user, router]);

  return (
    <RouteGuard allowedRoles={['COMPANY_ADMIN', 'SUPER_ADMIN']}>
      <MainLayout>
        <div className="max-w-7xl mx-auto">
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-text mb-2">Tableau de bord Entreprise</h1>
            <p className="text-text-muted">Vue d'ensemble de votre entreprise</p>
          </div>

          {/* Informations société */}
          {companyInfo && (
            <div className="mb-6 grid grid-cols-1 md:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle>Ma société</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2 text-sm text-text-muted">
                    <div><span className="text-text">Raison sociale:</span> {companyInfo.raisonSociale}</div>
                    <div><span className="text-text">Identifiant légal:</span> {companyInfo.identifiantLegal || '-'}</div>
                    <div><span className="text-text">Forme juridique:</span> {companyInfo.formeJuridique}</div>
                    <div><span className="text-text">Statut:</span> {companyInfo.status || 'ACTIVE'}</div>
                    <div><span className="text-text">Max agences:</span> {companyInfo.maxAgencies ?? 'Illimité'}</div>
                  </div>
                </CardContent>
              </Card>
            </div>
          )}

          {/* Alertes SaaS */}
          {(daysUntilExpiration !== null && daysUntilExpiration < 30) || overdueInvoices.length > 0 ? (
            <div className="mb-6 space-y-3">
              {daysUntilExpiration !== null && daysUntilExpiration < 30 && (
                <div className="bg-orange-500/10 border border-orange-500/20 rounded-lg p-4 flex items-start gap-3">
                  <AlertCircle className="text-orange-400 mt-0.5" size={20} />
                  <div className="flex-1">
                    <h3 className="font-semibold text-orange-400 mb-1">Abonnement expire bientôt</h3>
                    <p className="text-sm text-text-muted">
                      Votre abonnement expire dans {daysUntilExpiration} jour{daysUntilExpiration > 1 ? 's' : ''}.
                      Veuillez renouveler votre abonnement pour continuer à utiliser le service.
                    </p>
                  </div>
                </div>
              )}
              {overdueInvoices.length > 0 && (
                <div className="bg-red-500/10 border border-red-500/20 rounded-lg p-4 flex items-start gap-3">
                  <CreditCard className="text-red-400 mt-0.5" size={20} />
                  <div className="flex-1">
                    <h3 className="font-semibold text-red-400 mb-1">Factures en retard</h3>
                    <p className="text-sm text-text-muted">
                      {overdueInvoices.length} facture(s) en retard de paiement. Veuillez régulariser votre situation.
                    </p>
                  </div>
                </div>
              )}
            </div>
          ) : subscription && (
            <div className="mb-6 bg-green-500/10 border border-green-500/20 rounded-lg p-4 flex items-start gap-3">
              <CreditCard className="text-green-400 mt-0.5" size={20} />
              <div className="flex-1">
                <h3 className="font-semibold text-green-400 mb-1">Abonnement actif</h3>
                <p className="text-sm text-text-muted">
                  Plan: {subscription.plan?.name || 'N/A'} • 
                  {daysUntilExpiration !== null && daysUntilExpiration > 0 && (
                    <> {daysUntilExpiration} jour{daysUntilExpiration > 1 ? 's' : ''} restant{daysUntilExpiration > 1 ? 's' : ''}</>
                  )}
                </p>
              </div>
            </div>
          )}

          {/* Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            <StatCard
              title="Agences"
              value={companyAgencies.length || 0}
              icon={MapPin}
              isLoading={agenciesLoading}
              onClick={() => router.push('/company/agencies')}
            />
            <StatCard
              title="Utilisateurs"
              value={companyUsers.length || 0}
              icon={Users}
              isLoading={usersLoading}
              onClick={() => router.push('/company/users')}
            />
            <StatCard
              title="Véhicules"
              value={companyVehicles.length || 0}
              icon={Car}
              isLoading={vehiclesLoading}
              onClick={() => router.push('/company/analytics')}
            />
            <StatCard
              title="Locations actives"
              value={activeBookings.length || 0}
              icon={TrendingUp}
              isLoading={bookingsLoading}
              onClick={() => router.push('/company/planning')}
            />
          </div>

          {/* Additional Stats */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Revenus totaux</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-3xl font-bold text-text">{totalRevenue.toLocaleString('fr-FR')} €</p>
                <p className="text-sm text-text-muted mt-1">
                  {completedBookings.length} location(s) terminée(s)
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Revenus par véhicule</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-3xl font-bold text-text">
                  {companyVehicles.length > 0
                    ? (totalRevenue / companyVehicles.length).toLocaleString('fr-FR', {
                        maximumFractionDigits: 0,
                      })
                    : 0}{' '}
                  €
                </p>
                <p className="text-sm text-text-muted mt-1">
                  Moyenne sur {companyVehicles.length} véhicule(s)
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Taux d'occupation</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-3xl font-bold text-text">
                  {companyVehicles.length > 0
                    ? ((activeBookings.length / companyVehicles.length) * 100).toFixed(1)
                    : 0}
                  %
                </p>
                <p className="text-sm text-text-muted mt-1">Véhicules actuellement loués</p>
              </CardContent>
            </Card>
          </div>

          {/* Quick Actions */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            <Link href="/company/agencies">
              <Card className="hover:border-primary transition-colors cursor-pointer h-full">
                <div className="flex items-center gap-4 p-6">
                  <MapPin className="w-8 h-8 text-primary" />
                  <div>
                    <h3 className="font-semibold text-text mb-1">Gérer les agences</h3>
                    <p className="text-sm text-text-muted">Voir et gérer toutes les agences</p>
                  </div>
                </div>
              </Card>
            </Link>

            <Link href="/company/users">
              <Card className="hover:border-primary transition-colors cursor-pointer h-full">
                <div className="flex items-center gap-4 p-6">
                  <Users className="w-8 h-8 text-primary" />
                  <div>
                    <h3 className="font-semibold text-text mb-1">Gérer les utilisateurs</h3>
                    <p className="text-sm text-text-muted">Voir et gérer tous les utilisateurs</p>
                  </div>
                </div>
              </Card>
            </Link>

            <Link href="/company/analytics">
              <Card className="hover:border-primary transition-colors cursor-pointer h-full">
                <div className="flex items-center gap-4 p-6">
                  <BarChart3 className="w-8 h-8 text-primary" />
                  <div>
                    <h3 className="font-semibold text-text mb-1">Analytics</h3>
                    <p className="text-sm text-text-muted">Statistiques et KPIs détaillés</p>
                  </div>
                </div>
              </Card>
            </Link>

            <Link href="/company/planning">
              <Card className="hover:border-primary transition-colors cursor-pointer h-full">
                <div className="flex items-center gap-4 p-6">
                  <Calendar className="w-8 h-8 text-primary" />
                  <div>
                    <h3 className="font-semibold text-text mb-1">Planning</h3>
                    <p className="text-sm text-text-muted">Vue d'ensemble du planning</p>
                  </div>
                </div>
              </Card>
            </Link>
          </div>

          {/* Recent Agencies */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Agences récentes</CardTitle>
              </CardHeader>
              <CardContent>
                {companyAgencies && companyAgencies.length > 0 ? (
                  <div className="space-y-3">
                    {companyAgencies.slice(0, 5).map((agency) => (
                      <div
                        key={agency.id}
                        className="flex items-center justify-between p-4 bg-background rounded-lg hover:bg-background/80 transition-colors cursor-pointer"
                        onClick={() => router.push(`/company/agencies/${agency.id}`)}
                      >
                        <div>
                          <p className="font-medium text-text">{agency.name}</p>
                          <p className="text-sm text-text-muted">
                            {agency._count?.vehicles || 0} véhicule(s) •{' '}
                            {agency._count?.bookings || 0} location(s)
                          </p>
                        </div>
                        <MapPin className="w-5 h-5 text-primary" />
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
                <CardTitle>Locations actives</CardTitle>
              </CardHeader>
              <CardContent>
                {activeBookings && activeBookings.length > 0 ? (
                  <div className="space-y-3">
                    {activeBookings.slice(0, 5).map((booking) => (
                      <div
                        key={booking.id}
                        className="flex items-center justify-between p-4 bg-background rounded-lg"
                      >
                        <div>
                          <p className="font-medium text-text">
                            {booking.vehicle?.brand} {booking.vehicle?.model}
                          </p>
                          <p className="text-sm text-text-muted">
                            {(booking.client
                              ? `${booking.client.firstName || ''} ${booking.client.lastName || ''}`.trim() || 'Client'
                              : 'Client')} • {booking.agency?.name || 'Agence'}
                          </p>
                        </div>
                        <Badge status="active">En cours</Badge>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-text-muted text-sm">Aucune location active</p>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </MainLayout>
    </RouteGuard>
  );
}
