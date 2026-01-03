import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '../lib/axios';
import { Plus, Edit, Trash2, Power, RefreshCw, AlertCircle, CheckCircle, Info } from 'lucide-react';

export default function Subscriptions() {
  const [showModal, setShowModal] = useState(false);
  const [editingSubscription, setEditingSubscription] = useState<any>(null);
  const queryClient = useQueryClient();

  const { data: subscriptions, isLoading } = useQuery({
    queryKey: ['subscriptions'],
    queryFn: async () => {
      const res = await api.get('/subscriptions');
      return res.data;
    },
  });

  const { data: plans } = useQuery({
    queryKey: ['plans'],
    queryFn: async () => {
      const res = await api.get('/plans');
      return res.data;
    },
  });

  const { data: companies } = useQuery({
    queryKey: ['companies'],
    queryFn: async () => {
      const res = await api.get('/companies');
      return res.data;
    },
  });

  const createMutation = useMutation({
    mutationFn: (data: any) => api.post('/subscriptions', data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['subscriptions'] });
      setShowModal(false);
      setEditingSubscription(null);
    },
  });

  const suspendMutation = useMutation({
    mutationFn: ({ id, reason }: { id: string; reason: string }) =>
      api.post(`/subscriptions/${id}/suspend`, { reason }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['subscriptions'] });
      queryClient.invalidateQueries({ queryKey: ['companies'] });
    },
  });

  const restoreMutation = useMutation({
    mutationFn: (id: string) => api.post(`/subscriptions/${id}/restore`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['subscriptions'] });
      queryClient.invalidateQueries({ queryKey: ['companies'] });
    },
  });

  const renewMutation = useMutation({
    mutationFn: (id: string) => api.post(`/subscriptions/${id}/renew`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['subscriptions'] });
    },
  });

  const cancelMutation = useMutation({
    mutationFn: (id: string) => api.delete(`/subscriptions/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['subscriptions'] });
    },
  });

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'ACTIVE':
        return 'bg-green-500/20 text-green-400';
      case 'SUSPENDED':
        return 'bg-yellow-500/20 text-yellow-400';
      case 'EXPIRED':
        return 'bg-red-500/20 text-red-400';
      case 'CANCELLED':
        return 'bg-gray-500/20 text-gray-400';
      default:
        return 'bg-gray-500/20 text-gray-400';
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'ACTIVE':
        return 'Actif';
      case 'SUSPENDED':
        return 'Suspendu';
      case 'EXPIRED':
        return 'Expiré';
      case 'CANCELLED':
        return 'Annulé';
      default:
        return status;
    }
  };

  if (isLoading) return <div className="text-center py-8">Chargement...</div>;

  return (
    <div>
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold">Abonnements</h1>
        <button
          onClick={() => {
            setEditingSubscription(null);
            setShowModal(true);
          }}
          className="bg-[#3E7BFA] text-white px-4 py-2 rounded-lg flex items-center gap-2 hover:bg-[#2E6BEA] transition-colors"
        >
          <Plus size={20} />
          Nouvel abonnement
        </button>
      </div>

      <div className="bg-[#2C2F36] rounded-lg border border-gray-700 overflow-hidden">
        <table className="w-full">
          <thead className="bg-[#1D1F23]">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase">
                Entreprise
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase">
                Plan
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase">
                Périodicité
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase">
                Montant
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase">
                Date fin
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase">
                Statut
              </th>
              <th className="px-6 py-3 text-right text-xs font-medium text-gray-400 uppercase">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-700">
            {subscriptions?.map((subscription: any) => (
              <tr key={subscription.id} className="hover:bg-[#1D1F23]">
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="text-sm font-medium text-white">
                    {subscription.company?.name || '-'}
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-400">
                  {subscription.plan?.name || '-'}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-400">
                  {subscription.billingPeriod === 'MONTHLY' && 'Mensuel'}
                  {subscription.billingPeriod === 'QUARTERLY' && 'Trimestriel'}
                  {subscription.billingPeriod === 'YEARLY' && 'Annuel'}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-400">
                  {subscription.amount?.toFixed(2)} MAD
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-400">
                  {new Date(subscription.endDate).toLocaleDateString('fr-FR')}
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <span className={`px-2 py-1 text-xs font-medium rounded-full ${getStatusColor(subscription.status)}`}>
                    {getStatusLabel(subscription.status)}
                  </span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                  <div className="flex justify-end gap-2">
                    {subscription.status === 'ACTIVE' && (
                      <button
                        onClick={() => {
                          const reason = prompt('Raison de la suspension:');
                          if (reason) {
                            if (confirm(`Suspendre cet abonnement ?\n\n⚠️ Cette action suspendra immédiatement l'entreprise associée. Toutes les agences et utilisateurs seront bloqués.`)) {
                              suspendMutation.mutate({ id: subscription.id, reason });
                            }
                          }
                        }}
                        className="text-yellow-400 hover:text-yellow-300"
                        title="Suspendre l'abonnement"
                      >
                        <AlertCircle size={18} />
                      </button>
                    )}
                    {subscription.status === 'SUSPENDED' && (
                      <button
                        onClick={() => {
                          if (confirm(`Restaurer cet abonnement ?\n\nCette action restaurera l'entreprise associée. Toutes les agences et utilisateurs seront à nouveau accessibles.`)) {
                            restoreMutation.mutate(subscription.id);
                          }
                        }}
                        className="text-green-400 hover:text-green-300"
                        title="Restaurer l'abonnement"
                      >
                        <CheckCircle size={18} />
                      </button>
                    )}
                    {subscription.status === 'ACTIVE' && (
                      <button
                        onClick={() => {
                          if (confirm(`Renouveler cet abonnement ?\n\nCette action prolongera l'abonnement selon la périodicité configurée.`)) {
                            renewMutation.mutate(subscription.id);
                          }
                        }}
                        className="text-blue-400 hover:text-blue-300"
                        title="Renouveler l'abonnement"
                      >
                        <RefreshCw size={18} />
                      </button>
                    )}
                    {subscription.status !== 'CANCELLED' && (
                      <button
                        onClick={() => {
                          if (confirm(`Annuler cet abonnement ?\n\n⚠️ Cette action annulera définitivement l'abonnement. L'entreprise associée sera impactée. Cette action est irréversible.`)) {
                            cancelMutation.mutate(subscription.id);
                          }
                        }}
                        className="text-red-400 hover:text-red-300"
                        title="Annuler l'abonnement"
                      >
                        <Trash2 size={18} />
                      </button>
                    )}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {showModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-[#2C2F36] rounded-lg w-full max-w-md max-h-[90vh] flex flex-col">
            <div className="p-6 border-b border-gray-700">
              <h2 className="text-xl font-bold">Nouvel abonnement</h2>
            </div>
            <div className="overflow-y-auto flex-1 p-6">
              <form
                onSubmit={(e) => {
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
                }}
                className="space-y-4"
              >
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Entreprise *
                  </label>
                  <select
                    name="companyId"
                    required
                    className="w-full px-4 py-2 bg-[#1D1F23] border border-gray-600 rounded-lg text-white"
                  >
                    <option value="">Sélectionner une entreprise</option>
                    {companies?.map((company: any) => (
                      <option key={company.id} value={company.id}>
                        {company.name}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Plan *
                  </label>
                  <select
                    name="planId"
                    required
                    className="w-full px-4 py-2 bg-[#1D1F23] border border-gray-600 rounded-lg text-white"
                  >
                    <option value="">Sélectionner un plan</option>
                    {plans?.map((plan: any) => (
                      <option key={plan.id} value={plan.id}>
                        {plan.name} - {plan.price} MAD/mois
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Périodicité *
                  </label>
                  <select
                    name="billingPeriod"
                    required
                    onChange={(e) => {
                      // Recalculer la date de fin si la date de début existe
                      const startDate = (document.getElementById('startDate') as HTMLInputElement)?.value;
                      if (startDate) {
                        const start = new Date(startDate);
                        const end = new Date(start);
                        
                        switch (e.target.value) {
                          case 'MONTHLY':
                            end.setMonth(end.getMonth() + 1);
                            break;
                          case 'QUARTERLY':
                            end.setMonth(end.getMonth() + 3);
                            break;
                          case 'YEARLY':
                            end.setFullYear(end.getFullYear() + 1);
                            break;
                        }
                        
                        const endDateInput = document.getElementById('endDate') as HTMLInputElement;
                        if (endDateInput) {
                          endDateInput.value = end.toISOString().split('T')[0];
                        }
                      }
                    }}
                    className="w-full px-4 py-2 bg-[#1D1F23] border border-gray-600 rounded-lg text-white"
                  >
                    <option value="MONTHLY">Mensuel</option>
                    <option value="QUARTERLY">Trimestriel</option>
                    <option value="YEARLY">Annuel</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Date de début *
                  </label>
                  <input
                    type="date"
                    name="startDate"
                    id="startDate"
                    required
                    defaultValue={new Date().toISOString().split('T')[0]}
                    onChange={(e) => {
                      // Calculer automatiquement la date de fin
                      const startDate = e.target.value;
                      const billingPeriod = (document.querySelector('select[name="billingPeriod"]') as HTMLSelectElement)?.value;
                      if (startDate && billingPeriod) {
                        const start = new Date(startDate);
                        const end = new Date(start);
                        
                        switch (billingPeriod) {
                          case 'MONTHLY':
                            end.setMonth(end.getMonth() + 1);
                            break;
                          case 'QUARTERLY':
                            end.setMonth(end.getMonth() + 3);
                            break;
                          case 'YEARLY':
                            end.setFullYear(end.getFullYear() + 1);
                            break;
                        }
                        
                        const endDateInput = document.getElementById('endDate') as HTMLInputElement;
                        if (endDateInput) {
                          endDateInput.value = end.toISOString().split('T')[0];
                        }
                      }
                    }}
                    className="w-full px-4 py-2 bg-[#1D1F23] border border-gray-600 rounded-lg text-white"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Date de fin (calculée automatiquement)
                  </label>
                  <input
                    type="date"
                    name="endDate"
                    id="endDate"
                    readOnly
                    className="w-full px-4 py-2 bg-[#1D1F23] border border-gray-600 rounded-lg text-white opacity-50 cursor-not-allowed"
                  />
                  <p className="text-xs text-gray-500 mt-1">Calculée automatiquement selon la périodicité</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Montant (optionnel, utilise le prix du plan par défaut)
                  </label>
                  <input
                    type="number"
                    name="amount"
                    step="0.01"
                    min="0"
                    className="w-full px-4 py-2 bg-[#1D1F23] border border-gray-600 rounded-lg text-white"
                  />
                </div>
                <div className="bg-blue-500/20 border border-blue-500 text-blue-400 px-4 py-3 rounded-lg text-sm flex items-start gap-2">
                  <Info size={18} className="mt-0.5 flex-shrink-0" />
                  <div>
                    <p className="font-semibold mb-1">Impact de l'expiration de l'abonnement</p>
                    <p className="text-xs text-blue-300">
                      À l'expiration de la date de fin, l'entreprise passe automatiquement en statut "Expiré". Toutes les agences et utilisateurs seront bloqués jusqu'au renouvellement de l'abonnement.
                    </p>
                  </div>
                </div>
                {createMutation.isError && (
                  <div className="bg-red-500/20 border border-red-500 text-red-400 px-4 py-3 rounded-lg text-sm">
                    {createMutation.error?.response?.data?.message || 'Une erreur est survenue'}
                  </div>
                )}
                {createMutation.isSuccess && (
                  <div className="bg-green-500/20 border border-green-500 text-green-400 px-4 py-3 rounded-lg text-sm">
                    Abonnement créé avec succès
                  </div>
                )}
                <div className="flex gap-3 pt-4">
                  <button
                    type="button"
                    onClick={() => {
                      setShowModal(false);
                      setEditingSubscription(null);
                    }}
                    className="flex-1 px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700"
                  >
                    Annuler
                  </button>
                  <button
                    type="submit"
                    disabled={createMutation.isPending}
                    className="flex-1 px-4 py-2 bg-[#3E7BFA] text-white rounded-lg hover:bg-[#2E6BEA] disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {createMutation.isPending ? 'En cours...' : 'Créer'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

