'use client';

import { useQuery } from '@tanstack/react-query';
import { companyApi, Company } from '@/lib/api/company';
import { agencyApi, Agency } from '@/lib/api/agency';
import { userApi, User } from '@/lib/api/user';
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

export default function AdminDashboard() {
  const { data: companies, isLoading: companiesLoading } = useQuery({
    queryKey: ['companies'],
    queryFn: () => companyApi.getAll(),
  });

  const { data: agencies, isLoading: agenciesLoading } = useQuery({
    queryKey: ['agencies'],
    queryFn: () => agencyApi.getAll(),
  });

  const { data: users, isLoading: usersLoading } = useQuery({
    queryKey: ['users'],
    queryFn: () => userApi.getAll(),
  });

  return (
    <RouteGuard allowedRoles={['SUPER_ADMIN']}>
      <MainLayout>
        <div className="max-w-7xl mx-auto">
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-text mb-2">Tableau de bord Admin</h1>
            <p className="text-text-muted">Gestion complète de la plateforme MalocAuto</p>
          </div>

          {/* Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            <StatCard
              title="Entreprises"
              value={companies?.length || 0}
              icon={Building2}
              isLoading={companiesLoading}
            />
            <StatCard
              title="Agences"
              value={agencies?.length || 0}
              icon={MapPin}
              isLoading={agenciesLoading}
            />
            <StatCard
              title="Utilisateurs"
              value={users?.length || 0}
              icon={Users}
              isLoading={usersLoading}
            />
          </div>

          {/* Quick Actions */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            <Link href="/admin/companies">
              <Card className="hover:border-primary transition-colors cursor-pointer">
                <div className="flex items-center gap-4">
                  <Building2 className="w-8 h-8 text-primary" />
                  <div>
                    <h3 className="font-semibold text-text mb-1">Gérer les entreprises</h3>
                    <p className="text-sm text-text-muted">Créer, modifier, désactiver</p>
                  </div>
                </div>
              </Card>
            </Link>

            <Link href="/admin/agencies">
              <Card className="hover:border-primary transition-colors cursor-pointer">
                <div className="flex items-center gap-4">
                  <MapPin className="w-8 h-8 text-primary" />
                  <div>
                    <h3 className="font-semibold text-text mb-1">Gérer les agences</h3>
                    <p className="text-sm text-text-muted">Créer, modifier, supprimer</p>
                  </div>
                </div>
              </Card>
            </Link>

            <Link href="/admin/users">
              <Card className="hover:border-primary transition-colors cursor-pointer">
                <div className="flex items-center gap-4">
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
              ) : companies && companies.length > 0 ? (
                <div className="space-y-4">
                  {companies.slice(0, 5).map((company) => (
                    <Card key={company.id} variant="outlined" padding="sm">
                      <div className="flex items-center justify-between">
                        <div>
                          <h3 className="font-medium text-text">{company.name}</h3>
                          <p className="text-sm text-text-muted">
                            {company._count?.agencies || 0} agences • {company._count?.users || 0} utilisateurs
                          </p>
                        </div>
                        <div className="flex items-center gap-2">
                          <Badge status={company.isActive ? 'active' : 'inactive'}>
                            {company.isActive ? 'Active' : 'Inactive'}
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

