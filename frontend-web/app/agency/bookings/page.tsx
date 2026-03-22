'use client';

import { useQuery } from '@tanstack/react-query';
import { bookingApi } from '@/lib/api/booking';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { PageHeader } from '@/components/ui/page-header';
import { PageFilters } from '@/components/ui/page-filters';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { LoadingState } from '@/components/ui/loading-state';
import { EmptyState } from '@/components/ui/empty-state';
import { Calendar, Plus } from 'lucide-react';
import { useState } from 'react';
import Link from 'next/link';
import { MainLayout } from '@/components/layout/main-layout';
import { RouteGuard } from '@/components/auth/route-guard';
import { AgencyFilter } from '@/components/ui/agency-filter';
import { useModuleAccess } from '@/hooks/use-module-access';
import { ModuleNotIncluded } from '@/components/ui/module-not-included';
import Cookies from 'js-cookie';

export default function BookingsPage() {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedAgencyId, setSelectedAgencyId] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const pageSize = 20;

  // Vérifier l'accès au module BOOKINGS
  const userStr = typeof window !== 'undefined' ? Cookies.get('user') : null;
  const user = userStr ? JSON.parse(userStr) : null;
  const agencyId = selectedAgencyId || user?.agencyId || user?.userAgencies?.[0]?.agencyId;
  const { isModuleActive, isLoading: isLoadingModule } = useModuleAccess('BOOKINGS', agencyId);

  const { data: bookingsPage, isLoading, isError, error, refetch } = useQuery({
    queryKey: ['bookings-light', selectedAgencyId, page],
    queryFn: () =>
      bookingApi.getLight({
        agencyId: selectedAgencyId || undefined,
        page,
        pageSize,
      }),
    enabled: isModuleActive, // Ne charger que si le module est activé
  });
  const bookings = bookingsPage?.items || [];

  const { data: bookingsSummary } = useQuery({
    queryKey: ['bookings-summary', selectedAgencyId],
    queryFn: () => bookingApi.getSummary({ agencyId: selectedAgencyId || undefined }),
    enabled: isModuleActive,
  });

  const filteredBookings = bookings?.filter((booking) => {
    const q = searchTerm.toLowerCase();
    const bookingNumber = String(booking.bookingNumber || booking.id.slice(-6)).toLowerCase();
    return (
      bookingNumber.includes(q) ||
      booking.vehicle?.brand?.toLowerCase().includes(q) ||
      booking.vehicle?.model?.toLowerCase().includes(q) ||
      booking.client?.name?.toLowerCase().includes(q)
    );
  });

  const totalBookings = bookingsSummary?.total || 0;
  const inProgressBookings = bookingsSummary?.active || 0;
  const lateBookings = bookingsSummary?.late || 0;

  const getStatusBadge = (status: string) => {
    const statusMap: Record<string, { status: any; label: string }> = {
      CONFIRMED: { status: 'confirmed', label: 'Confirmée' },
      IN_PROGRESS: { status: 'active', label: 'En cours' },
      RETURNED: { status: 'completed', label: 'Terminée' },
      CANCELLED: { status: 'cancelled', label: 'Annulée' },
      LATE: { status: 'late', label: 'En retard' },
      PENDING: { status: 'pending', label: 'En attente' },
      DRAFT: { status: 'draft', label: 'Brouillon' },
      NO_SHOW: { status: 'error', label: 'Absence' },
    };
    return statusMap[status] || { status: 'completed', label: status };
  };

  // Afficher le message si le module n'est pas activé
  if (!isLoadingModule && !isModuleActive) {
    return (
      <RouteGuard allowedRoles={['SUPER_ADMIN', 'COMPANY_ADMIN', 'AGENCY_MANAGER', 'AGENT']}>
        <MainLayout>
          <ModuleNotIncluded 
            moduleName="BOOKINGS"
            onUpgrade={() => window.location.href = '/company'}
          />
        </MainLayout>
      </RouteGuard>
    );
  }

  // Gérer les erreurs 403
  if (error && (error as any)?.status === 403) {
    const isModuleError = (error as any)?.isModuleError;
    if (isModuleError) {
      return (
        <RouteGuard allowedRoles={['SUPER_ADMIN', 'COMPANY_ADMIN', 'AGENCY_MANAGER', 'AGENT']}>
          <MainLayout>
            <ModuleNotIncluded 
              moduleName="BOOKINGS"
              onUpgrade={() => window.location.href = '/company'}
            />
          </MainLayout>
        </RouteGuard>
      );
    }
  }

  // Gérer les autres erreurs
  if (isError) {
    return (
      <RouteGuard allowedRoles={['SUPER_ADMIN', 'COMPANY_ADMIN', 'AGENCY_MANAGER', 'AGENT']}>
        <MainLayout>
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <p className="text-text-muted mb-4">Erreur lors du chargement des réservations</p>
            <Button variant="primary" onClick={() => refetch()}>
              Réessayer
            </Button>
          </div>
        </MainLayout>
      </RouteGuard>
    );
  }

  return (
    <RouteGuard allowedRoles={['SUPER_ADMIN', 'COMPANY_ADMIN', 'AGENCY_MANAGER', 'AGENT']}>
      <MainLayout>
        <div className="max-w-7xl mx-auto pt-2">
          <PageHeader
            title="Locations"
            description="Gérer les réservations et locations"
            actionHref={isModuleActive ? '/agency/bookings/new' : undefined}
            actionLabel={isModuleActive ? 'Nouvelle réservation' : undefined}
            actionIcon={<Plus className="w-4 h-4 mr-2" />}
          />

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
            <Card className="p-4 border-l-4 border-l-primary/40">
              <p className="text-xs uppercase tracking-wide text-text-muted">Réservations</p>
              <p className="mt-1 text-3xl font-bold text-text">{totalBookings}</p>
            </Card>
            <Card className="p-4 border-l-4 border-l-blue-500/40">
              <p className="text-xs uppercase tracking-wide text-text-muted">En cours</p>
              <p className="mt-1 text-3xl font-bold text-text">{inProgressBookings}</p>
            </Card>
            <Card className="p-4 border-l-4 border-l-orange-500/45">
              <p className="text-xs uppercase tracking-wide text-text-muted">En retard</p>
              <p className="mt-1 text-3xl font-bold text-text">{lateBookings}</p>
            </Card>
          </div>

          <PageFilters
            searchValue={searchTerm}
            onSearchChange={setSearchTerm}
            searchPlaceholder="Rechercher une réservation, client, véhicule..."
            rightSlot={(
              <AgencyFilter
                selectedAgencyId={selectedAgencyId}
                onAgencyChange={(agency) => {
                  setSelectedAgencyId(agency);
                  setPage(1);
                }}
              />
            )}
            showReset={!!searchTerm}
            onReset={() => setSearchTerm('')}
          />

          {isLoadingModule || isLoading ? (
            <LoadingState message="Chargement des réservations..." />
          ) : filteredBookings && filteredBookings.length > 0 ? (
            <div className="space-y-4">
              <Card variant="elevated" padding="none" className="overflow-hidden">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>N° Réservation</TableHead>
                      <TableHead>Véhicule</TableHead>
                      <TableHead>Client</TableHead>
                      <TableHead>Dates</TableHead>
                      <TableHead>Montant</TableHead>
                      <TableHead>Statut</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredBookings.map((booking) => {
                      const statusInfo = getStatusBadge(booking.status);
                      return (
                        <TableRow key={booking.id}>
                          <TableCell>
                            <p className="font-medium text-text">
                              #{String(booking.bookingNumber || booking.id.slice(-6)).toUpperCase()}
                            </p>
                          </TableCell>
                          <TableCell>
                            <div>
                              <p className="font-medium text-text">
                                {booking.vehicle?.brand} {booking.vehicle?.model}
                              </p>
                              <p className="text-xs text-text-muted">
                                {booking.vehicle?.registrationNumber}
                              </p>
                            </div>
                          </TableCell>
                          <TableCell>
                            <p className="text-text">
                              {booking.client?.name || '—'}
                            </p>
                          </TableCell>
                          <TableCell>
                            <div className="text-sm">
                              <p className="text-text">
                                {new Date(booking.startDate).toLocaleDateString('fr-FR')}
                              </p>
                              <p className={`${new Date(booking.endDate) < new Date() && (booking.status === 'IN_PROGRESS' || booking.status === 'LATE') ? 'text-orange-500 font-medium' : 'text-text-muted'}`}>
                                → {new Date(booking.endDate).toLocaleDateString('fr-FR')}
                                {new Date(booking.endDate) < new Date() && booking.status === 'IN_PROGRESS' && ' ⚠️'}
                              </p>
                            </div>
                          </TableCell>
                          <TableCell className="font-medium">
                            {booking.totalAmount || booking.totalPrice ? `${booking.totalAmount || booking.totalPrice} MAD` : '-'}
                          </TableCell>
                          <TableCell>
                            <Badge status={statusInfo.status}>
                              {statusInfo.label}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            {isModuleActive && (
                              <div className="flex items-center justify-end gap-2">
                                <Link href={`/agency/bookings/${booking.id}`}>
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    aria-label="Modifier la réservation"
                                    title="Modifier la réservation"
                                  >
                                    Modifier
                                  </Button>
                                </Link>
                              </div>
                            )}
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </Card>

              <div className="flex items-center justify-between">
                <p className="text-sm text-text-muted">
                  Page {bookingsPage?.page || 1} / {bookingsPage?.totalPages || 1} • {bookingsPage?.total || 0} réservation(s)
                </p>
                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={page <= 1}
                    onClick={() => setPage((p) => Math.max(1, p - 1))}
                  >
                    Précédent
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={page >= (bookingsPage?.totalPages || 1)}
                    onClick={() => setPage((p) => p + 1)}
                  >
                    Suivant
                  </Button>
                </div>
              </div>
            </div>
          ) : (
            <EmptyState
              icon={Calendar}
              title="Aucune réservation trouvée"
              description={searchTerm ? "Aucune réservation ne correspond à votre recherche" : "Commencez par créer votre première réservation"}
              action={
                !searchTerm && isModuleActive && (
                  <Link href="/agency/bookings/new">
                    <Button variant="primary">
                      <Plus className="w-4 h-4 mr-2" />
                      Créer une réservation
                    </Button>
                  </Link>
                )
              }
            />
          )}
        </div>
      </MainLayout>
    </RouteGuard>
  );
}

