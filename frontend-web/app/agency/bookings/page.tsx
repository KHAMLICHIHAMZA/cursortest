'use client';

import { useQuery } from '@tanstack/react-query';
import { bookingApi } from '@/lib/api/booking';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { LoadingState } from '@/components/ui/loading-state';
import { EmptyState } from '@/components/ui/empty-state';
import { Calendar, Plus } from 'lucide-react';
import { useState } from 'react';
import Link from 'next/link';
import { MainLayout } from '@/components/layout/main-layout';
import { RouteGuard } from '@/components/auth/route-guard';
import { Input } from '@/components/ui/input';
import { AgencyFilter } from '@/components/ui/agency-filter';
import { useSearch } from '@/contexts/search-context';
import { useModuleAccess } from '@/hooks/use-module-access';
import { ModuleNotIncluded } from '@/components/ui/module-not-included';
import { toast } from '@/components/ui/toast';
import Cookies from 'js-cookie';

export default function BookingsPage() {
  const { searchTerm } = useSearch();
  const [selectedAgencyId, setSelectedAgencyId] = useState<string | null>(null);

  // Vérifier l'accès au module BOOKINGS
  const userStr = typeof window !== 'undefined' ? Cookies.get('user') : null;
  const user = userStr ? JSON.parse(userStr) : null;
  const agencyId = selectedAgencyId || user?.agencyId || user?.userAgencies?.[0]?.agencyId;
  const { isModuleActive, isLoading: isLoadingModule } = useModuleAccess('BOOKINGS', agencyId);

  const { data: bookings, isLoading, error } = useQuery({
    queryKey: ['bookings', selectedAgencyId],
    queryFn: () => bookingApi.getAll({ agencyId: selectedAgencyId || undefined }),
    enabled: isModuleActive, // Ne charger que si le module est activé
  });

  const filteredBookings = bookings?.filter(
    (booking) =>
      booking.vehicle?.brand?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      booking.vehicle?.model?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      booking.client?.firstName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      booking.client?.lastName?.toLowerCase().includes(searchTerm.toLowerCase()),
  );

  const getStatusBadge = (status: string) => {
    const statusMap: Record<string, { status: any; label: string }> = {
      CONFIRMED: { status: 'confirmed', label: 'Confirmée' },
      IN_PROGRESS: { status: 'active', label: 'ACTIVE' },
      RETURNED: { status: 'completed', label: 'TERMINÉE' },
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

  return (
    <RouteGuard allowedRoles={['SUPER_ADMIN', 'COMPANY_ADMIN', 'AGENCY_MANAGER', 'AGENT']}>
      <MainLayout>
        <div className="max-w-7xl mx-auto">
          <div className="flex items-center justify-between mb-8">
            <div>
              <h1 className="text-3xl font-bold text-text mb-2">Locations</h1>
              <p className="text-text-muted">Gérer les réservations et locations</p>
            </div>
            {isModuleActive && (
              <Link href="/agency/bookings/new">
                <Button variant="primary">
                  <Plus className="w-4 h-4 mr-2" />
                  Nouvelle réservation
                </Button>
              </Link>
            )}
          </div>

          <div className="mb-6 flex items-center gap-4">
            <AgencyFilter
              selectedAgencyId={selectedAgencyId}
              onAgencyChange={setSelectedAgencyId}
            />
          </div>

          {isLoadingModule || isLoading ? (
            <LoadingState message="Chargement des réservations..." />
          ) : filteredBookings && filteredBookings.length > 0 ? (
            <Card padding="none">
              <Table>
                <TableHeader>
                  <TableRow>
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
                            {booking.client?.firstName} {booking.client?.lastName}
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
                                <Button variant="ghost" size="sm">
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

