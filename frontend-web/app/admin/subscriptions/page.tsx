'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '@/lib/api/client';
import { Plus, Trash2, RefreshCw, AlertCircle, CheckCircle, Info, ArrowLeft } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select } from '@/components/ui/select';
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { MainLayout } from '@/components/layout/main-layout';
import { RouteGuard } from '@/components/auth/route-guard';

interface Subscription {
  id: string;
  status: 'ACTIVE' | 'SUSPENDED' | 'EXPIRED' | 'CANCELLED';
  billingPeriod: 'MONTHLY' | 'QUARTERLY' | 'YEARLY';
  amount: number;
  startDate: string;
  endDate: string;
  company?: { id: string; name: string };
  plan?: { id: string; name: string; price: number };
}

interface Plan {
  id: string;
  name: string;
  price: number;
}

interface Company {
  id: string;
  name: string;
}

export default function SubscriptionsPage() {
  const [showModal, setShowModal] = useState(false);
  const queryClient = useQueryClient();
  const router = useRouter();

  const { data: subscriptions = [], isLoading } = useQuery<Subscription[]>({
    queryKey: ['subscriptions'],
    queryFn: async () => {
      const res = await apiClient.get('/subscriptions');
      return res.data;
    },
  });

  const { data: plans = [] } = useQuery<Plan[]>({
    queryKey: ['plans'],
    queryFn: async () => {
      const res = await apiClient.get('/plans');
      return res.data;
    },
  });

  const { data: companies = [] } = useQuery<Company[]>({
    queryKey: ['companies'],
    queryFn: async () => {
      const res = await apiClient.get('/companies');
      return res.data;
    },
  });

  const createMutation = useMutation({
    mutationFn: (data: Record<string, unknown>) => apiClient.post('/subscriptions', data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['subscriptions'] });
      setShowModal(false);
    },
  });

  const suspendMutation = useMutation({
    mutationFn: ({ id, reason }: { id: string; reason: string }) =>
      apiClient.post(`/subscriptions/${id}/suspend`, { reason }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['subscriptions'] });
      queryClient.invalidateQueries({ queryKey: ['companies'] });
    },
  });

  const restoreMutation = useMutation({
    mutationFn: (id: string) => apiClient.post(`/subscriptions/${id}/restore`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['subscriptions'] });
      queryClient.invalidateQueries({ queryKey: ['companies'] });
    },
  });

  const renewMutation = useMutation({
    mutationFn: (id: string) => apiClient.post(`/subscriptions/${id}/renew`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['subscriptions'] });
    },
  });

  const cancelMutation = useMutation({
    mutationFn: (id: string) => apiClient.delete(`/subscriptions/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['subscriptions'] });
    },
  });

  const getStatusKey = (status: string): 'success' | 'pending' | 'error' | 'cancelled' => {
    switch (status) {
      case 'ACTIVE': return 'success';
      case 'SUSPENDED': return 'pending';
      case 'EXPIRED': return 'error';
      case 'CANCELLED': return 'cancelled';
      default: return 'cancelled';
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'ACTIVE': return 'Actif';
      case 'SUSPENDED': return 'Suspendu';
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

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const data = {
      companyId: formData.get('companyId'),
      planId: formData.get('planId'),
      billingPeriod: formData.get('billingPeriod'),
      startDate: formData.get('startDate'),
      amount: formData.get('amount') ? parseFloat(formData.get('amount') as string) : undefined,
    };
    createMutation.mutate(data);
  };

  if (isLoading) {
    return (
      <RouteGuard allowedRoles={['SUPER_ADMIN']}>
        <MainLayout>
          <div className="text-center py-8">Chargement...</div>
        </MainLayout>
      </RouteGuard>
    );
  }

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
          <h1 className="text-2xl font-bold">Abonnements</h1>
        </div>
        <Button onClick={() => setShowModal(true)}>
          <Plus className="w-4 h-4 mr-2" />
          Nouvel abonnement
        </Button>
        <Dialog open={showModal} onOpenChange={setShowModal}>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>Nouvel abonnement</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-2">Entreprise *</label>
                <select
                  name="companyId"
                  required
                  className="w-full px-3 py-2 border rounded-lg bg-background"
                >
                  <option value="">Sélectionner une entreprise</option>
                  {companies.map((company) => (
                    <option key={company.id} value={company.id}>
                      {company.name}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">Plan *</label>
                <select
                  name="planId"
                  required
                  className="w-full px-3 py-2 border rounded-lg bg-background"
                >
                  <option value="">Sélectionner un plan</option>
                  {plans.map((plan) => (
                    <option key={plan.id} value={plan.id}>
                      {plan.name} - {plan.price} MAD/mois
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">Périodicité *</label>
                <select
                  name="billingPeriod"
                  required
                  className="w-full px-3 py-2 border rounded-lg bg-background"
                >
                  <option value="MONTHLY">Mensuel</option>
                  <option value="QUARTERLY">Trimestriel</option>
                  <option value="YEARLY">Annuel</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">Date de début *</label>
                <Input
                  type="date"
                  name="startDate"
                  required
                  defaultValue={new Date().toISOString().split('T')[0]}
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">
                  Montant (optionnel, utilise le prix du plan par défaut)
                </label>
                <Input type="number" name="amount" step="0.01" min="0" />
              </div>
              <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 p-3 rounded-lg text-sm flex gap-2">
                <Info className="w-5 h-5 text-blue-500 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="font-semibold text-blue-700 dark:text-blue-300 mb-1">
                    Impact de l&apos;expiration
                  </p>
                  <p className="text-blue-600 dark:text-blue-400 text-xs">
                    À l&apos;expiration, l&apos;entreprise passe en statut &quot;Expiré&quot;. Tous les
                    utilisateurs seront bloqués jusqu&apos;au renouvellement.
                  </p>
                </div>
              </div>
              {createMutation.isError && (
                <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-600 dark:text-red-400 px-4 py-3 rounded-lg text-sm">
                  {(createMutation.error as Error)?.message || 'Une erreur est survenue'}
                </div>
              )}
              <div className="flex gap-3 pt-4">
                <Button
                  type="button"
                  variant="outline"
                  className="flex-1"
                  onClick={() => setShowModal(false)}
                >
                  Annuler
                </Button>
                <Button type="submit" className="flex-1" disabled={createMutation.isPending}>
                  {createMutation.isPending ? 'En cours...' : 'Créer'}
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <div className="border rounded-lg">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Entreprise</TableHead>
              <TableHead>Plan</TableHead>
              <TableHead>Périodicité</TableHead>
              <TableHead>Montant</TableHead>
              <TableHead>Date fin</TableHead>
              <TableHead>Statut</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {subscriptions.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                  Aucun abonnement trouvé
                </TableCell>
              </TableRow>
            ) : (
              subscriptions.map((subscription) => (
                <TableRow key={subscription.id}>
                  <TableCell className="font-medium">
                    {subscription.company?.name || '-'}
                  </TableCell>
                  <TableCell>{subscription.plan?.name || '-'}</TableCell>
                  <TableCell>{getBillingPeriodLabel(subscription.billingPeriod)}</TableCell>
                  <TableCell>{subscription.amount?.toFixed(2)} MAD</TableCell>
                  <TableCell>
                    {new Date(subscription.endDate).toLocaleDateString('fr-FR')}
                  </TableCell>
                  <TableCell>
                    <Badge status={getStatusKey(subscription.status)}>
                      {getStatusLabel(subscription.status)}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-2">
                      {subscription.status === 'ACTIVE' && (
                        <>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => {
                              const reason = prompt('Raison de la suspension:');
                              if (reason) {
                                if (confirm('Suspendre cet abonnement ?\n\n⚠️ L\'entreprise sera immédiatement bloquée.')) {
                                  suspendMutation.mutate({ id: subscription.id, reason });
                                }
                              }
                            }}
                            title="Suspendre"
                          >
                            <AlertCircle className="w-4 h-4 text-yellow-500" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => {
                              if (confirm('Renouveler cet abonnement ?')) {
                                renewMutation.mutate(subscription.id);
                              }
                            }}
                            title="Renouveler"
                          >
                            <RefreshCw className="w-4 h-4 text-blue-500" />
                          </Button>
                        </>
                      )}
                      {subscription.status === 'SUSPENDED' && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => {
                            if (confirm('Restaurer cet abonnement ?')) {
                              restoreMutation.mutate(subscription.id);
                            }
                          }}
                          title="Restaurer"
                        >
                          <CheckCircle className="w-4 h-4 text-green-500" />
                        </Button>
                      )}
                      {subscription.status !== 'CANCELLED' && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => {
                            if (confirm('Annuler définitivement cet abonnement ?\n\n⚠️ Cette action est irréversible.')) {
                              cancelMutation.mutate(subscription.id);
                            }
                          }}
                          title="Annuler"
                        >
                          <Trash2 className="w-4 h-4 text-red-500" />
                        </Button>
                      )}
                    </div>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
    </div>
      </MainLayout>
    </RouteGuard>
  );
}
