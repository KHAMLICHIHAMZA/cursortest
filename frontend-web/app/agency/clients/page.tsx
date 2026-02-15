'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { clientApi, Client } from '@/lib/api/client-api';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { LoadingState } from '@/components/ui/loading-state';
import { EmptyState } from '@/components/ui/empty-state';
import { ConfirmDialog } from '@/components/ui/confirm-dialog';
import { UserCircle, Plus, Edit, Trash2, Globe, FileText, Calendar } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { useState, useMemo } from 'react';
import Link from 'next/link';
import { MainLayout } from '@/components/layout/main-layout';
import { RouteGuard } from '@/components/auth/route-guard';
import { useDebounce } from '@/lib/hooks/use-debounce';
import { useSearch } from '@/contexts/search-context';

export default function ClientsPage() {
  const queryClient = useQueryClient();
  const { searchTerm } = useSearch();
  const debouncedSearchTerm = useDebounce(searchTerm, 300);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [clientToDelete, setClientToDelete] = useState<Client | null>(null);

  const { data: clients, isLoading } = useQuery({
    queryKey: ['clients'],
    queryFn: () => clientApi.getAll(),
    staleTime: 5 * 60 * 1000, // Cache 5 minutes
    refetchOnWindowFocus: false,
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => clientApi.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['clients'] });
      setDeleteDialogOpen(false);
      setClientToDelete(null);
    },
  });

  const filteredClients = useMemo(() => {
    if (!clients) return [];
    if (!debouncedSearchTerm) return clients;

    const searchLower = debouncedSearchTerm.toLowerCase();
    return clients.filter(
      (client) =>
        client.name?.toLowerCase().includes(searchLower) ||
        client.email?.toLowerCase().includes(searchLower) ||
        client.phone?.toLowerCase().includes(searchLower) ||
        client.licenseNumber?.toLowerCase().includes(searchLower) ||
        client.countryOfOrigin?.toLowerCase().includes(searchLower) ||
        client.idCardNumber?.toLowerCase().includes(searchLower) ||
        client.passportNumber?.toLowerCase().includes(searchLower) ||
        (client.isMoroccan ? 'marocain' : 'étranger').includes(searchLower),
    );
  }, [clients, debouncedSearchTerm]);

  return (
    <RouteGuard allowedRoles={['SUPER_ADMIN', 'COMPANY_ADMIN', 'AGENCY_MANAGER', 'AGENT']}>
      <MainLayout>
        <div className="max-w-7xl mx-auto">
          <div className="flex items-center justify-between mb-8">
            <div>
              <h1 className="text-3xl font-bold text-text mb-2">Clients</h1>
              <p className="text-text-muted">Gérer les clients de l'agence</p>
            </div>
            <Link href="/agency/clients/new">
              <Button variant="primary">
                <Plus className="w-4 h-4 mr-2" />
                Nouveau client
              </Button>
            </Link>
          </div>


          {isLoading ? (
            <LoadingState message="Chargement des clients..." />
          ) : filteredClients && filteredClients.length > 0 ? (
            <Card padding="none">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Client</TableHead>
                    <TableHead>Nationalité</TableHead>
                    <TableHead>Permis</TableHead>
                    <TableHead>Email</TableHead>
                    <TableHead>Téléphone</TableHead>
                    <TableHead>Locations</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredClients.map((client) => (
                    <TableRow key={client.id}>
                      <TableCell>
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                            <UserCircle className="w-5 h-5 text-primary" />
                          </div>
                          <div>
                            <p className="font-medium text-text">
                              {client.name}
                            </p>
                            {client.address && (
                              <p className="text-xs text-text-muted">
                                {client.address}
                              </p>
                            )}
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex flex-col gap-1">
                          <Badge variant={client.isMoroccan ? 'default' : 'outline'} status={client.isMoroccan ? 'active' : 'pending'}>
                            {client.isMoroccan ? '🇲🇦 Marocain' : '🌍 Étranger'}
                          </Badge>
                          {client.countryOfOrigin && (
                            <span className="text-xs text-text-muted">
                              {client.countryOfOrigin}
                            </span>
                          )}
                          {(!client.isMoroccan || client.countryOfOrigin) && (
                            <div className="flex flex-col gap-0.5 mt-1">
                              {client.idCardNumber && (
                                <span className="text-xs text-text-muted flex items-center gap-1">
                                  <FileText className="w-3 h-3" />
                                  CI: {client.idCardNumber}
                                </span>
                              )}
                              {client.passportNumber && (
                                <span className="text-xs text-text-muted flex items-center gap-1">
                                  <FileText className="w-3 h-3" />
                                  Passeport: {client.passportNumber}
                                </span>
                              )}
                            </div>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex flex-col gap-1">
                          {client.licenseNumber ? (
                            <>
                              <span className="text-sm font-medium text-text">
                                {client.licenseNumber}
                              </span>
                              {client.licenseExpiryDate && (
                                <span className="text-xs text-text-muted flex items-center gap-1">
                                  <Calendar className="w-3 h-3" />
                                  Exp: {new Date(client.licenseExpiryDate).toLocaleDateString('fr-FR')}
                                </span>
                              )}
                              {client.isForeignLicense && (
                                <Badge variant="outline" className="w-fit text-xs">
                                  Permis étranger
                                </Badge>
                              )}
                            </>
                          ) : (
                            <span className="text-xs text-text-muted">-</span>
                          )}
                        </div>
                      </TableCell>
                      <TableCell className="text-text-muted">{client.email || '-'}</TableCell>
                      <TableCell className="text-text-muted">{client.phone || '-'}</TableCell>
                      <TableCell>{client._count?.bookings || 0}</TableCell>
                      <TableCell>
                        <div className="flex items-center justify-end gap-2">
                          <Link href={`/agency/clients/${client.id}`}>
                            <Button variant="ghost" size="sm">
                              <Edit className="w-4 h-4" />
                            </Button>
                          </Link>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => {
                              setClientToDelete(client);
                              setDeleteDialogOpen(true);
                            }}
                          >
                            <Trash2 className="w-4 h-4 text-red-500" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </Card>
          ) : (
            <EmptyState
              icon={UserCircle}
              title="Aucun client trouvé"
              description={searchTerm ? "Aucun client ne correspond à votre recherche" : "Commencez par ajouter votre premier client"}
              action={
                !searchTerm && (
                  <Link href="/agency/clients/new">
                    <Button variant="primary">
                      <Plus className="w-4 h-4 mr-2" />
                      Ajouter un client
                    </Button>
                  </Link>
                )
              }
            />
          )}

          <ConfirmDialog
            isOpen={deleteDialogOpen}
            title="Supprimer le client"
            message={`Êtes-vous sûr de vouloir supprimer le client "${clientToDelete?.firstName} ${clientToDelete?.lastName}" ? Cette action est irréversible.`}
            confirmText="Supprimer"
            cancelText="Annuler"
            variant="danger"
            onConfirm={() => {
              if (clientToDelete) {
                deleteMutation.mutate(clientToDelete.id);
              }
            }}
            onCancel={() => {
              setDeleteDialogOpen(false);
              setClientToDelete(null);
            }}
          />
        </div>
      </MainLayout>
    </RouteGuard>
  );
}

