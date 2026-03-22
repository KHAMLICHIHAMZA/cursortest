'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { companyApi, Company } from '@/lib/api/company';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { PageHeader } from '@/components/ui/page-header';
import { PageFilters } from '@/components/ui/page-filters';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { LoadingState } from '@/components/ui/loading-state';
import { EmptyState } from '@/components/ui/empty-state';
import { ConfirmDialog } from '@/components/ui/confirm-dialog';
import { Building2, Plus, Edit, Trash2, Power } from 'lucide-react';
import { useDeferredValue, useEffect, useState } from 'react';
import Link from 'next/link';
import { MainLayout } from '@/components/layout/main-layout';
import { RouteGuard } from '@/components/auth/route-guard';

export default function CompaniesPage() {
  const queryClient = useQueryClient();
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 25;
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [companyToDelete, setCompanyToDelete] = useState<Company | null>(null);
  const deferredSearchTerm = useDeferredValue(searchTerm);

  const { data: companiesPage, isLoading } = useQuery({
    queryKey: ['companies', 'light', currentPage, pageSize, deferredSearchTerm],
    queryFn: () => companyApi.getLight(currentPage, pageSize, deferredSearchTerm),
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

  const companies = companiesPage?.items || [];
  const totalCompanies = companiesPage?.total || 0;
  const activeCount = companiesPage?.activeTotal || 0;
  const inactiveCount = companiesPage?.inactiveTotal || 0;
  const totalPages = companiesPage?.totalPages || 1;

  useEffect(() => {
    if (currentPage > totalPages) {
      setCurrentPage(totalPages);
    }
  }, [currentPage, totalPages]);

  useEffect(() => {
    setCurrentPage(1);
  }, [deferredSearchTerm]);

  return (
    <RouteGuard allowedRoles={['SUPER_ADMIN']}>
      <MainLayout>
        <div className="max-w-7xl mx-auto pt-2">
          <PageHeader
            title="Entreprises"
            description="Gérer toutes les entreprises de la plateforme"
            actionHref="/admin/companies/new"
            actionLabel="Nouvelle entreprise"
            actionIcon={<Plus className="w-4 h-4 mr-2" />}
          />

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
            <Card className="p-4 border-l-4 border-l-primary/40">
              <p className="text-xs uppercase tracking-wide text-text-muted">Total</p>
              <p className="mt-1 text-3xl font-bold text-text">{totalCompanies}</p>
            </Card>
            <Card className="p-4 border-l-4 border-l-green-500/40">
              <p className="text-xs uppercase tracking-wide text-text-muted">Actives</p>
              <p className="mt-1 text-3xl font-bold text-text">{activeCount}</p>
            </Card>
            <Card className="p-4 border-l-4 border-l-slate-400/60">
              <p className="text-xs uppercase tracking-wide text-text-muted">Inactives</p>
              <p className="mt-1 text-3xl font-bold text-text">{inactiveCount}</p>
            </Card>
          </div>

          <PageFilters
            searchValue={searchTerm}
            onSearchChange={setSearchTerm}
            searchPlaceholder="Rechercher par nom ou téléphone..."
            showReset={!!searchTerm}
            onReset={() => setSearchTerm('')}
          />

          <div className="mb-4 flex items-center justify-between text-sm text-text-muted">
            <span>
              {totalCompanies === 0
                ? 'Aucune entreprise'
                : `${(currentPage - 1) * pageSize + 1}-${Math.min(currentPage * pageSize, totalCompanies)} sur ${totalCompanies}`}
            </span>
            {totalCompanies > pageSize && (
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  disabled={currentPage === 1}
                  onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                >
                  Précédent
                </Button>
                <span className="text-xs text-text-muted">
                  Page {currentPage}/{totalPages}
                </span>
                <Button
                  variant="outline"
                  size="sm"
                  disabled={currentPage >= totalPages}
                  onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                >
                  Suivant
                </Button>
              </div>
            )}
          </div>

          {isLoading ? (
            <LoadingState message="Chargement des entreprises..." />
          ) : companies.length > 0 ? (
            <Card variant="elevated" padding="none" className="overflow-hidden">
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
                            className="h-9 w-9 p-0"
                            aria-label={company.isActive ? "Désactiver l'entreprise" : "Activer l'entreprise"}
                            title={company.isActive ? "Désactiver l'entreprise" : "Activer l'entreprise"}
                            onClick={() =>
                              toggleActiveMutation.mutate({ id: company.id, isActive: company.isActive })
                            }
                          >
                            <Power className="w-4 h-4" />
                          </Button>
                          <Link href={`/admin/companies/${company.id}`}>
                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-9 w-9 p-0"
                              aria-label="Modifier l'entreprise"
                              title="Modifier l'entreprise"
                            >
                              <Edit className="w-4 h-4" />
                            </Button>
                          </Link>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-9 w-9 p-0"
                            aria-label="Supprimer l'entreprise"
                            title="Supprimer l'entreprise"
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
              title="Aucune entreprise trouvée"
              description={
                searchTerm
                  ? 'Aucune entreprise ne correspond à votre recherche'
                  : 'Commencez par créer votre première entreprise'
              }
              action={
                !searchTerm && (
                  <Link href="/admin/companies/new">
                    <Button variant="primary">
                      <Plus className="w-4 h-4 mr-2" />
                      Créer une entreprise
                    </Button>
                  </Link>
                )
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

