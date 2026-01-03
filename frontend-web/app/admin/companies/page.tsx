'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { companyApi, Company } from '@/lib/api/company';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { LoadingState } from '@/components/ui/loading-state';
import { EmptyState } from '@/components/ui/empty-state';
import { ConfirmDialog } from '@/components/ui/confirm-dialog';
import { Building2, Plus, Edit, Trash2, Power } from 'lucide-react';
import { useState } from 'react';
import Link from 'next/link';
import { MainLayout } from '@/components/layout/main-layout';
import { RouteGuard } from '@/components/auth/route-guard';

export default function CompaniesPage() {
  const queryClient = useQueryClient();
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [companyToDelete, setCompanyToDelete] = useState<Company | null>(null);

  const { data: companies, isLoading } = useQuery({
    queryKey: ['companies'],
    queryFn: () => companyApi.getAll(),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => companyApi.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['companies'] });
      setDeleteDialogOpen(false);
      setCompanyToDelete(null);
    },
  });

  const toggleActiveMutation = useMutation({
    mutationFn: ({ id, isActive }: { id: string; isActive: boolean }) =>
      companyApi.update(id, { isActive: !isActive }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['companies'] });
    },
  });

  return (
    <RouteGuard allowedRoles={['SUPER_ADMIN']}>
      <MainLayout>
        <div className="max-w-7xl mx-auto">
          <div className="flex items-center justify-between mb-8">
            <div>
              <h1 className="text-3xl font-bold text-text mb-2">Entreprises</h1>
              <p className="text-text-muted">Gérer toutes les entreprises de la plateforme</p>
            </div>
            <Link href="/admin/companies/new">
              <Button variant="primary">
                <Plus className="w-4 h-4 mr-2" />
                Nouvelle entreprise
              </Button>
            </Link>
          </div>

          {isLoading ? (
            <LoadingState message="Chargement des entreprises..." />
          ) : companies && companies.length > 0 ? (
            <Card padding="none">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Nom</TableHead>
                    <TableHead>Téléphone</TableHead>
                    <TableHead>Agences</TableHead>
                    <TableHead>Utilisateurs</TableHead>
                    <TableHead>Statut</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {companies.map((company) => (
                    <TableRow key={company.id}>
                      <TableCell>
                        <div className="flex items-center gap-3">
                          <Building2 className="w-5 h-5 text-primary" />
                          <span className="font-medium text-text">{company.name}</span>
                        </div>
                      </TableCell>
                      <TableCell className="text-text-muted">{company.phone || '-'}</TableCell>
                      <TableCell>{company._count?.agencies || 0}</TableCell>
                      <TableCell>{company._count?.users || 0}</TableCell>
                      <TableCell>
                        <Badge status={company.isActive ? 'active' : 'inactive'}>
                          {company.isActive ? 'Active' : 'Inactive'}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center justify-end gap-2">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() =>
                              toggleActiveMutation.mutate({ id: company.id, isActive: company.isActive })
                            }
                          >
                            <Power className="w-4 h-4" />
                          </Button>
                          <Link href={`/admin/companies/${company.id}`}>
                            <Button variant="ghost" size="sm">
                              <Edit className="w-4 h-4" />
                            </Button>
                          </Link>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => {
                              setCompanyToDelete(company);
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

          <ConfirmDialog
            isOpen={deleteDialogOpen}
            title="Supprimer l'entreprise"
            message={`Êtes-vous sûr de vouloir supprimer l'entreprise "${companyToDelete?.name}" ? Cette action est irréversible.`}
            confirmText="Supprimer"
            cancelText="Annuler"
            variant="danger"
            onConfirm={() => {
              if (companyToDelete) {
                deleteMutation.mutate(companyToDelete.id);
              }
            }}
            onCancel={() => {
              setDeleteDialogOpen(false);
              setCompanyToDelete(null);
            }}
          />
        </div>
      </MainLayout>
    </RouteGuard>
  );
}

