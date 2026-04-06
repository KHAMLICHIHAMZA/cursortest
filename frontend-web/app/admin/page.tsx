'use client';

import { useQuery } from '@tanstack/react-query';
import { authApi } from '@/lib/api/auth';
import { companyApi } from '@/lib/api/company';
import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { StatCard } from '@/components/ui/stat-card';
import { Building2, Users, MapPin, Plus } from 'lucide-react';
import Link from 'next/link';
import { MainLayout } from '@/components/layout/main-layout';
import { RouteGuard } from '@/components/auth/route-guard';
import { LoadingState } from '@/components/ui/loading-state';
import { EmptyState } from '@/components/ui/empty-state';

function effectiveRoleBadgeLabel(role?: string) {
  switch (role) {
    case 'SUPER_ADMIN':
      return 'Super Admin';
    case 'COMPANY_ADMIN':
      return 'Admin société';
    case 'AGENCY_MANAGER':
      return 'Responsable agence';
    case 'AGENT':
      return 'Agent';
    default:
      return 'Plateforme';
  }
}

export default function AdminDashboard() {
  const { data: me } = useQuery({
    queryKey: ['me'],
    queryFn: () => authApi.getMe(),
  });

  const { data: adminStats, isLoading: statsLoading } = useQuery({
    queryKey: ['admin-dashboard-stats'],
    queryFn: () => companyApi.getAdminStats(),
  });

  const { data: recentCompanies, isLoading: companiesLoading } = useQuery({
    queryKey: ['companies', 'recent', 5],
    queryFn: () => companyApi.getRecent(5),
  });

  return (
    <RouteGuard allowedRoles={['SUPER_ADMIN']}>
      <MainLayout>
        <div className="max-w-7xl mx-auto">
          <div className="mb-8 flex flex-col gap-2">
            <Badge status="info" className="w-fit">
              {effectiveRoleBadgeLabel(me?.role)}
            </Badge>
            <h1 className="text-3xl font-bold text-text">Tableau de bord Admin</h1>
            <p className="text-text-muted">Gestion complète de la plateforme MalocAuto</p>
          </div>

          {/* Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-6 mb-8">
            <StatCard
              title="Entreprises"
              value={adminStats?.companies || 0}
              icon={Building2}
              isLoading={statsLoading}
            />
            <StatCard
              title="Agences"
              value={adminStats?.agencies || 0}
              icon={MapPin}
              isLoading={statsLoading}
            />
            <StatCard
              title="Utilisateurs"
              value={adminStats?.users || 0}
              icon={Users}
              isLoading={statsLoading}
            />
          </div>

          {/* Quick Actions */}
          <div className="mb-3">
            <h2 className="text-lg font-semibold text-text">Actions rapides</h2>
            <p className="text-sm text-text-muted">Accès direct aux pages de gestion principales.</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-6 mb-8">
            <Link href="/admin/companies">
              <Card className="hover:border-primary/60 hover:shadow-md transition-all cursor-pointer h-full">
                <div className="flex items-center gap-4 min-h-[72px]">
                  <Building2 className="w-8 h-8 text-primary" />
                  <div>
                    <h3 className="font-semibold text-text mb-1">Gérer les entreprises</h3>
                    <p className="text-sm text-text-muted">Créer, modifier, désactiver</p>
                  </div>
                </div>
              </Card>
            </Link>

            <Link href="/admin/agencies">
              <Card className="hover:border-primary/60 hover:shadow-md transition-all cursor-pointer h-full">
                <div className="flex items-center gap-4 min-h-[72px]">
                  <MapPin className="w-8 h-8 text-primary" />
                  <div>
                    <h3 className="font-semibold text-text mb-1">Gérer les agences</h3>
                    <p className="text-sm text-text-muted">Créer, modifier, supprimer</p>
                  </div>
                </div>
              </Card>
            </Link>

            <Link href="/admin/users">
              <Card className="hover:border-primary/60 hover:shadow-md transition-all cursor-pointer h-full">
                <div className="flex items-center gap-4 min-h-[72px]">
                  <Users className="w-8 h-8 text-primary" />
                  <div>
                    <h3 className="font-semibold text-text mb-1">Gérer les utilisateurs</h3>
                    <p className="text-sm text-text-muted">Créer, modifier, réinitialiser</p>
                  </div>
                </div>
              </Card>
            </Link>
          </div>

          {/* Recent Companies */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>Entreprises récentes</CardTitle>
                <Link href="/admin/companies">
                  <Button variant="primary" size="sm">
                    <Plus className="w-4 h-4 mr-2" />
                    Nouvelle entreprise
                  </Button>
                </Link>
              </div>
            </CardHeader>
            <CardContent>
              {companiesLoading ? (
                <LoadingState message="Chargement des entreprises..." />
              ) : recentCompanies && recentCompanies.length > 0 ? (
                <div className="space-y-4">
                  {recentCompanies.map((company) => (
                    <Card key={company.id} variant="outlined" padding="sm" className="hover:border-primary/50 transition-colors">
                      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                        <div>
                          <h3 className="font-medium text-text">{company.name}</h3>
                          <p className="text-sm text-text-muted">
                            {company._count?.agencies || 0} agences • {company._count?.users || 0} utilisateurs
                          </p>
                        </div>
                        <div className="flex items-center gap-2 self-start sm:self-auto">
                          <Badge status={company.isActive ? 'active' : 'inactive'}>
                            {company.isActive ? 'Actif' : 'Inactif'}
                          </Badge>
                          <Link href={`/admin/companies/${company.id}`}>
                            <Button variant="ghost" size="sm">
                              Voir
                            </Button>
                          </Link>
                        </div>
                      </div>
                    </Card>
                  ))}
                </div>
              ) : (
                <EmptyState
                  icon={Building2}
                  title="Aucune entreprise"
                  description="Commencez par créer votre première entreprise"
                  action={
                    <Link href="/admin/companies/new">
                      <Button variant="primary">
                        <Plus className="w-4 h-4 mr-2" />
                        Créer une entreprise
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

