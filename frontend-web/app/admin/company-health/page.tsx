'use client';

import { Suspense, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useRouter, useSearchParams } from 'next/navigation';
import { apiClient } from '@/lib/api/client';
import { AlertCircle, Clock, ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '@/components/ui/table';
import { Card } from '@/components/ui/card';
import { MainLayout } from '@/components/layout/main-layout';
import { RouteGuard } from '@/components/auth/route-guard';

interface Company {
  id: string;
  name: string;
  status: 'ACTIVE' | 'SUSPENDED' | 'DELETED';
  currency?: string;
  suspendedAt?: string;
  suspendedReason?: string;
}

interface Subscription {
  id: string;
  status: string;
  billingPeriod: string;
  amount: number;
  endDate: string;
  plan?: { name: string };
  companyId: string;
}

interface Invoice {
  id: string;
  invoiceNumber: string;
  amount: number;
  dueDate: string;
  status: 'PENDING' | 'PAID' | 'FAILED';
}

export default function CompanyHealthPage() {
  return (
    <Suspense fallback={<div className="text-center py-8">Chargement...</div>}>
      <CompanyHealthContent />
    </Suspense>
  );
}

function CompanyHealthContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const initialCompanyId = searchParams.get('companyId') || '';
  const [selectedCompanyId, setSelectedCompanyId] = useState(initialCompanyId);

  const { data: companies = [] } = useQuery<Company[]>({
    queryKey: ['companies'],
    queryFn: async () => {
      const res = await apiClient.get('/companies');
      return res.data;
    },
  });

  const isValidCompanyId = companies.some((c) => c.id === selectedCompanyId);

  const { data: company, isLoading: companyLoading } = useQuery<Company | null>({
    queryKey: ['company', selectedCompanyId],
    queryFn: async () => {
      if (!selectedCompanyId) return null;
      try {
        const res = await apiClient.get(`/companies/${selectedCompanyId}`);
        return res.data;
      } catch (error: unknown) {
        if ((error as { response?: { status?: number } }).response?.status === 404) {
          return null;
        }
        throw error;
      }
    },
    enabled: !!selectedCompanyId && isValidCompanyId,
  });

  const { data: subscriptions = [] } = useQuery<Subscription[]>({
    queryKey: ['subscriptions'],
    queryFn: async () => {
      const res = await apiClient.get('/subscriptions');
      return res.data;
    },
    enabled: !!selectedCompanyId && isValidCompanyId,
  });

  const subscription = subscriptions.find((s) => s.companyId === selectedCompanyId);

  const { data: invoices = [] } = useQuery<Invoice[]>({
    queryKey: ['invoices', selectedCompanyId],
    queryFn: async () => {
      if (!selectedCompanyId) return [];
      const res = await apiClient.get(`/billing/company/${selectedCompanyId}/invoices`);
      return res.data;
    },
    enabled: !!selectedCompanyId && isValidCompanyId,
  });

  const getStatusKey = (status: string): 'success' | 'pending' | 'error' | 'cancelled' => {
    switch (status) {
      case 'ACTIVE': return 'success';
      case 'SUSPENDED': return 'pending';
      case 'DELETED': return 'error';
      default: return 'cancelled';
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'ACTIVE': return 'Actif';
      case 'SUSPENDED': return 'Suspendu';
      case 'DELETED': return 'Supprimé';
      case 'EXPIRED': return 'Expiré';
      case 'CANCELLED': return 'Annulé';
      default: return status;
    }
  };

  const getBillingPeriodLabel = (period: string) => {
    switch (period) {
      case 'MONTHLY': return 'Mensuel';
      case 'QUARTERLY': return 'Trimestriel';
      case 'YEARLY': return 'Annuel';
      default: return period;
    }
  };

  const calculateDaysUntilExpiration = (endDate: string) => {
    const end = new Date(endDate);
    const now = new Date();
    return Math.ceil((end.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
  };

  const calculateDaysSinceSuspension = (suspendedAt: string) => {
    if (!suspendedAt) return null;
    const suspended = new Date(suspendedAt);
    const now = new Date();
    return Math.ceil((now.getTime() - suspended.getTime()) / (1000 * 60 * 60 * 24));
  };

  // Sélection d'entreprise
  if (!selectedCompanyId) {
    return (
      <RouteGuard allowedRoles={['SUPER_ADMIN']}>
        <MainLayout>
      <div className="space-y-6">
        <div className="flex items-center gap-4">
          <Button variant="outline" onClick={() => router.back()}>
            <ArrowLeft className="w-4 h-4 mr-2" />
            Retour
          </Button>
          <h1 className="text-2xl font-bold">Santé du compte</h1>
        </div>
        <Card className="p-6">
          <label className="block text-sm font-medium mb-2">Sélectionner une entreprise</label>
          <select
            value={selectedCompanyId}
            onChange={(e) => setSelectedCompanyId(e.target.value)}
            className="w-full px-3 py-2 border rounded-lg bg-background"
          >
            <option value="">-- Sélectionner --</option>
            {companies.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>
        </Card>
      </div>
        </MainLayout>
      </RouteGuard>
    );
  }

  if (companyLoading) {
    return (
      <RouteGuard allowedRoles={['SUPER_ADMIN']}>
        <MainLayout>
          <div className="text-center py-8">Chargement...</div>
        </MainLayout>
      </RouteGuard>
    );
  }

  const daysUntilExpiration = subscription?.endDate
    ? calculateDaysUntilExpiration(subscription.endDate)
    : null;
  const daysSinceSuspension = company?.suspendedAt
    ? calculateDaysSinceSuspension(company.suspendedAt)
    : null;
  const canRestore = daysSinceSuspension !== null && daysSinceSuspension <= 90;
  const willBeDeleted = daysSinceSuspension !== null && daysSinceSuspension >= 100;

  return (
    <RouteGuard allowedRoles={['SUPER_ADMIN']}>
      <MainLayout>
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="outline" onClick={() => router.back()}>
            <ArrowLeft className="w-4 h-4 mr-2" />
            Retour
          </Button>
          <div>
            <h1 className="text-2xl font-bold">Santé du compte</h1>
            <p className="text-muted-foreground">{company?.name}</p>
          </div>
        </div>
        <select
          value={selectedCompanyId}
          onChange={(e) => setSelectedCompanyId(e.target.value)}
          className="px-3 py-2 border rounded-lg bg-background"
        >
          {companies.map((c) => (
            <option key={c.id} value={c.id}>
              {c.name}
            </option>
          ))}
        </select>
      </div>

      {/* Alertes */}
      <div className="space-y-4">
        {company?.status === 'SUSPENDED' && (
          <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-4 flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-yellow-500 mt-0.5" />
            <div className="flex-1">
              <h3 className="font-semibold text-yellow-700 dark:text-yellow-300 mb-1">
                Compte suspendu
              </h3>
              <p className="text-sm text-yellow-600 dark:text-yellow-400">
                {company.suspendedReason || 'Aucune raison spécifiée'}
              </p>
              {daysSinceSuspension !== null && (
                <p className="text-sm text-yellow-600 dark:text-yellow-400 mt-1">
                  Suspendu depuis {daysSinceSuspension} jour{daysSinceSuspension > 1 ? 's' : ''}
                  {canRestore && ` • Restauration possible jusqu'à J+90 (${90 - daysSinceSuspension} jours restants)`}
                  {willBeDeleted && ' • ⚠️ Suppression définitive imminente (J+100)'}
                </p>
              )}
            </div>
          </div>
        )}

        {subscription && daysUntilExpiration !== null && daysUntilExpiration < 30 && (
          <div className="bg-orange-50 dark:bg-orange-900/20 border border-orange-200 dark:border-orange-800 rounded-lg p-4 flex items-start gap-3">
            <Clock className="w-5 h-5 text-orange-500 mt-0.5" />
            <div className="flex-1">
              <h3 className="font-semibold text-orange-700 dark:text-orange-300 mb-1">
                Abonnement expire bientôt
              </h3>
              <p className="text-sm text-orange-600 dark:text-orange-400">
                L&apos;abonnement expire dans {daysUntilExpiration} jour{daysUntilExpiration > 1 ? 's' : ''}
              </p>
            </div>
          </div>
        )}

        {invoices.some((inv) => inv.status === 'PENDING' && new Date(inv.dueDate) < new Date()) && (
          <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4 flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-red-500 mt-0.5" />
            <div className="flex-1">
              <h3 className="font-semibold text-red-700 dark:text-red-300 mb-1">
                Factures en retard
              </h3>
              <p className="text-sm text-red-600 dark:text-red-400">
                {invoices.filter((inv) => inv.status === 'PENDING' && new Date(inv.dueDate) < new Date()).length} facture(s) en retard de paiement
              </p>
            </div>
          </div>
        )}
      </div>

      {/* Statut du compte et Abonnement */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card className="p-6">
          <h2 className="text-lg font-semibold mb-4">Statut du compte</h2>
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-muted-foreground">Statut</span>
              <Badge status={getStatusKey(company?.status || '')}>
                {getStatusLabel(company?.status || '')}
              </Badge>
            </div>
            {company?.suspendedAt && (
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">Suspendu le</span>
                <span>{new Date(company.suspendedAt).toLocaleDateString('fr-FR')}</span>
              </div>
            )}
            {company?.currency && (
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">Devise</span>
                <span>{company.currency}</span>
              </div>
            )}
          </div>
        </Card>

        <Card className="p-6">
          <h2 className="text-lg font-semibold mb-4">Abonnement</h2>
          {subscription ? (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">Plan</span>
                <span>{subscription.plan?.name || '-'}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">Périodicité</span>
                <span>{getBillingPeriodLabel(subscription.billingPeriod)}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">Montant</span>
                <span>{subscription.amount?.toFixed(2)} MAD</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">Date d&apos;expiration</span>
                <span>{new Date(subscription.endDate).toLocaleDateString('fr-FR')}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">Statut</span>
                <Badge status={getStatusKey(subscription.status)}>
                  {getStatusLabel(subscription.status)}
                </Badge>
              </div>
            </div>
          ) : (
            <p className="text-muted-foreground">Aucun abonnement</p>
          )}
        </Card>
      </div>

      {/* Factures récentes */}
      <Card className="p-6">
        <h2 className="text-lg font-semibold mb-4">Factures récentes</h2>
        {invoices.length > 0 ? (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Numéro</TableHead>
                <TableHead>Montant</TableHead>
                <TableHead>Échéance</TableHead>
                <TableHead>Statut</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {invoices.slice(0, 10).map((invoice) => {
                const isOverdue = invoice.status === 'PENDING' && new Date(invoice.dueDate) < new Date();
                return (
                  <TableRow key={invoice.id}>
                    <TableCell>{invoice.invoiceNumber || '-'}</TableCell>
                    <TableCell>{invoice.amount?.toFixed(2)} MAD</TableCell>
                    <TableCell>{new Date(invoice.dueDate).toLocaleDateString('fr-FR')}</TableCell>
                    <TableCell>
                      <Badge
                        status={
                          invoice.status === 'PAID'
                            ? 'success'
                            : isOverdue
                            ? 'error'
                            : 'pending'
                        }
                      >
                        {invoice.status === 'PAID' && 'Payé'}
                        {invoice.status === 'PENDING' && (isOverdue ? 'En retard' : 'En attente')}
                        {invoice.status === 'FAILED' && 'Échoué'}
                      </Badge>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        ) : (
          <p className="text-muted-foreground">Aucune facture</p>
        )}
      </Card>
    </div>
      </MainLayout>
    </RouteGuard>
  );
}
