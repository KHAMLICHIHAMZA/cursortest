import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '../lib/axios';
import { Plus, Edit, Trash2, Power, Heart, AlertTriangle } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const MODULE_LABELS: Record<string, string> = {
  VEHICLES: 'Véhicules',
  BOOKINGS: 'Réservations',
  INVOICES: 'Facturation',
  MAINTENANCE: 'Maintenance',
  FINES: 'Amendes',
  ANALYTICS: 'Analytics',
};

export default function Companies() {
  const [showModal, setShowModal] = useState(false);
  const [editingCompany, setEditingCompany] = useState<any>(null);
  const [selectedModules, setSelectedModules] = useState<string[]>([]);
  const queryClient = useQueryClient();
  const navigate = useNavigate();

  const { data: companies, isLoading } = useQuery({
    queryKey: ['companies'],
    queryFn: async () => {
      const res = await api.get('/companies');
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

  const { data: subscriptions } = useQuery({
    queryKey: ['subscriptions'],
    queryFn: async () => {
      const res = await api.get('/subscriptions');
      return res.data;
    },
  });

  // Récupérer les modules de l'entreprise en édition
  const { data: companyModules } = useQuery({
    queryKey: ['companyModules', editingCompany?.id],
    queryFn: async () => {
      if (!editingCompany?.id) return [];
      const res = await api.get(`/modules/company/${editingCompany.id}`);
      return res.data;
    },
    enabled: !!editingCompany?.id,
  });

  // Initialiser les modules sélectionnés quand on ouvre le modal en édition
  useEffect(() => {
    if (editingCompany && companyModules) {
      const activeModules = companyModules
        .filter((m: any) => m.isActive)
        .map((m: any) => m.moduleCode);
      setSelectedModules(activeModules);
    } else {
      setSelectedModules([]);
    }
  }, [editingCompany, companyModules]);

  const createMutation = useMutation({
    mutationFn: (data: any) => api.post('/companies', data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['companies'] });
      setShowModal(false);
      setEditingCompany(null);
      setSelectedModules([]);
    },
    onError: (error: any) => {
      console.error('Error creating company:', error);
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: any }) =>
      api.patch(`/companies/${id}`, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['companies'] });
      queryClient.invalidateQueries({ queryKey: ['subscriptions'] });
      queryClient.invalidateQueries({ queryKey: ['companyModules'] });
      setShowModal(false);
      setEditingCompany(null);
      setSelectedModules([]);
    },
    onError: (error: any) => {
      console.error('Error updating company:', error);
    },
  });

  const toggleActiveMutation = useMutation({
    mutationFn: ({ id, isActive }: { id: string; isActive: boolean }) =>
      api.put(`/companies/${id}`, { isActive: !isActive }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['companies'] });
    },
  });

  // Mutation pour activer/désactiver les modules
  const toggleModuleMutation = useMutation({
    mutationFn: async ({ companyId, moduleCode, activate }: { companyId: string; moduleCode: string; activate: boolean }) => {
      if (activate) {
        await api.post(`/modules/company/${companyId}/${moduleCode}/activate`);
      } else {
        await api.delete(`/modules/company/${companyId}/${moduleCode}`);
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['companyModules', editingCompany?.id] });
    },
  });

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const data: any = {
      name: formData.get('name'),
      phone: formData.get('phone'),
      address: formData.get('address'),
      adminEmail: formData.get('adminEmail'),
      adminName: formData.get('adminName'),
    };
    
    // Ajouter les champs SaaS
    const currency = formData.get('currency');
    if (currency) {
      data.currency = currency;
    }
    
    // Ajouter les champs SaaS supplémentaires si en édition
    if (editingCompany) {
      data.status = formData.get('status');
      const suspendedAt = formData.get('suspendedAt');
      if (suspendedAt) {
        data.suspendedAt = suspendedAt;
      }
      const suspendedReason = formData.get('suspendedReason');
      if (suspendedReason) {
        data.suspendedReason = suspendedReason;
      }
    }

    if (editingCompany) {
      updateMutation.mutate({ id: editingCompany.id, data });
    } else {
      createMutation.mutate(data);
    }
  };

  // Gérer les changements de modules
  const handleModuleToggle = (moduleCode: string) => {
    if (!editingCompany?.id) return;
    
    const isCurrentlyActive = selectedModules.includes(moduleCode);
    const moduleLabel = MODULE_LABELS[moduleCode] || moduleCode;
    
    if (!isCurrentlyActive) {
      // Activation : confirmation
      if (!confirm(`Activer le module "${moduleLabel}" pour cette entreprise ?\n\nToutes les agences hériteront automatiquement de ce module.`)) {
        return;
      }
    } else {
      // Désactivation : confirmation avec impact
      if (!confirm(`Désactiver le module "${moduleLabel}" pour cette entreprise ?\n\n⚠️ Cette action désactivera ce module pour toutes les agences de l'entreprise.`)) {
        return;
      }
    }
    
    const newModules = isCurrentlyActive
      ? selectedModules.filter(m => m !== moduleCode)
      : [...selectedModules, moduleCode];
    
    setSelectedModules(newModules);
    
    toggleModuleMutation.mutate({
      companyId: editingCompany.id,
      moduleCode,
      activate: !isCurrentlyActive,
    });
  };

  // Calculer la date de fin d'abonnement
  const calculateEndDate = (startDate: string, billingPeriod: string) => {
    if (!startDate) return '';
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
    
    return end.toISOString().split('T')[0];
  };

  // Récupérer l'abonnement actif de l'entreprise
  const getActiveSubscription = (companyId: string) => {
    return subscriptions?.find((s: any) => s.companyId === companyId && s.status === 'ACTIVE');
  };

  const isCompanySuspended = editingCompany?.status === 'SUSPENDED' || editingCompany?.status === 'EXPIRED';
  const activeSubscription = editingCompany ? getActiveSubscription(editingCompany.id) : null;

  if (isLoading) return <div className="text-center py-8">Chargement...</div>;

  return (
    <div>
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold">Entreprises</h1>
        <button
          onClick={() => {
            setEditingCompany(null);
            setShowModal(true);
          }}
          className="bg-[#3E7BFA] text-white px-4 py-2 rounded-lg flex items-center gap-2 hover:bg-[#2E6BEA] transition-colors"
        >
          <Plus size={20} />
          Nouvelle entreprise
        </button>
      </div>

      <div className="bg-[#2C2F36] rounded-lg border border-gray-700 overflow-hidden">
        <table className="w-full">
          <thead className="bg-[#1D1F23]">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase">
                Nom
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase">
                Téléphone
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase">
                Agences
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
            {companies?.map((company: any) => (
              <tr key={company.id} className="hover:bg-[#1D1F23]">
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="text-sm font-medium text-white">
                    {company.name}
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-400">
                  {company.phone || '-'}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-400">
                  {company._count?.agencies || 0}
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="flex flex-col gap-1">
                    <span
                      className={`px-2 py-1 text-xs font-medium rounded-full ${
                        company.status === 'ACTIVE'
                          ? 'bg-green-500/20 text-green-400'
                          : company.status === 'SUSPENDED'
                          ? 'bg-yellow-500/20 text-yellow-400'
                          : company.status === 'EXPIRED'
                          ? 'bg-orange-500/20 text-orange-400'
                          : 'bg-red-500/20 text-red-400'
                      }`}
                    >
                      {company.status === 'ACTIVE' && 'Actif'}
                      {company.status === 'SUSPENDED' && 'Suspendu'}
                      {company.status === 'EXPIRED' && 'Expiré'}
                      {company.status === 'DELETED' && 'Supprimé'}
                      {!company.status && 'Actif'}
                    </span>
                    {company.isActive !== undefined && (
                      <span className="text-xs text-gray-500">
                        (Legacy: {company.isActive ? 'Active' : 'Inactive'})
                      </span>
                    )}
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                  <div className="flex justify-end gap-2">
                    <button
                      onClick={() => {
                        setEditingCompany(company);
                        setShowModal(true);
                      }}
                      className="text-[#3E7BFA] hover:text-[#2E6BEA]"
                    >
                      <Edit size={18} />
                    </button>
                    <button
                      onClick={() => navigate(`/company-health/${company.id}`)}
                      className="text-pink-400 hover:text-pink-300"
                      title="Santé du compte"
                    >
                      <Heart size={18} />
                    </button>
                    <button
                      onClick={() =>
                        toggleActiveMutation.mutate({
                          id: company.id,
                          isActive: company.isActive,
                        })
                      }
                      className="text-yellow-400 hover:text-yellow-300"
                      title="Activer/Désactiver"
                    >
                      <Power size={18} />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {showModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-[#2C2F36] rounded-lg w-full max-w-3xl max-h-[90vh] flex flex-col">
            <div className="p-6 border-b border-gray-700">
              <h2 className="text-xl font-bold">
                {editingCompany ? 'Modifier' : 'Nouvelle'} entreprise
              </h2>
            </div>
            <div className="overflow-y-auto flex-1 p-6">
              {isCompanySuspended && (
                <div className="mb-4 bg-red-500/20 border border-red-500 text-red-400 px-4 py-3 rounded-lg text-sm flex items-start gap-2">
                  <AlertTriangle size={18} className="mt-0.5 flex-shrink-0" />
                  <div>
                    <p className="font-semibold mb-1">Cette entreprise est suspendue — aucune modification n'est autorisée</p>
                    <p className="text-xs text-red-300">
                      {editingCompany?.status === 'SUSPENDED' 
                        ? 'Toutes les agences et utilisateurs de cette entreprise sont bloqués. Aucune opération n\'est possible jusqu\'à la restauration.'
                        : 'L\'abonnement de cette entreprise a expiré. Toutes les agences et utilisateurs sont bloqués. Aucune opération n\'est possible jusqu\'au renouvellement de l\'abonnement.'}
                    </p>
                  </div>
                </div>
              )}
              
              <form onSubmit={handleSubmit} className="space-y-6">
                {/* SECTION 1 — Informations générales */}
                <div className="border-b border-gray-700 pb-4">
                  <h3 className="text-lg font-semibold mb-4 text-gray-300">Informations générales</h3>
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-300 mb-2">
                        Nom *
                      </label>
                      <input
                        type="text"
                        name="name"
                        defaultValue={editingCompany?.name}
                        required
                        disabled={isCompanySuspended}
                        className="w-full px-4 py-2 bg-[#1D1F23] border border-gray-600 rounded-lg text-white disabled:opacity-50 disabled:cursor-not-allowed"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-300 mb-2">
                        Téléphone
                      </label>
                      <input
                        type="text"
                        name="phone"
                        defaultValue={editingCompany?.phone}
                        disabled={isCompanySuspended}
                        className="w-full px-4 py-2 bg-[#1D1F23] border border-gray-600 rounded-lg text-white disabled:opacity-50 disabled:cursor-not-allowed"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-300 mb-2">
                        Adresse
                      </label>
                      <input
                        type="text"
                        name="address"
                        defaultValue={editingCompany?.address}
                        disabled={isCompanySuspended}
                        className="w-full px-4 py-2 bg-[#1D1F23] border border-gray-600 rounded-lg text-white disabled:opacity-50 disabled:cursor-not-allowed"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-300 mb-2">
                        Devise
                      </label>
                      <select
                        name="currency"
                        defaultValue={editingCompany?.currency || 'MAD'}
                        disabled={isCompanySuspended}
                        className="w-full px-4 py-2 bg-[#1D1F23] border border-gray-600 rounded-lg text-white disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        <option value="MAD">MAD (Dirham marocain)</option>
                        <option value="EUR">EUR (Euro)</option>
                        <option value="USD">USD (Dollar américain)</option>
                      </select>
                      <p className="text-xs text-gray-500 mt-1">Devise utilisée pour la facturation</p>
                    </div>
                    {!editingCompany && (
                      <>
                        <div>
                          <label className="block text-sm font-medium text-gray-300 mb-2">
                            Email admin
                          </label>
                          <input
                            type="email"
                            name="adminEmail"
                            className="w-full px-4 py-2 bg-[#1D1F23] border border-gray-600 rounded-lg text-white"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-300 mb-2">
                            Nom admin
                          </label>
                          <input
                            type="text"
                            name="adminName"
                            className="w-full px-4 py-2 bg-[#1D1F23] border border-gray-600 rounded-lg text-white"
                          />
                        </div>
                      </>
                    )}
                  </div>
                </div>

                {/* SECTION 2 — Configuration SaaS */}
                {editingCompany && (
                  <div className="border-b border-gray-700 pb-4">
                    <h3 className="text-lg font-semibold mb-4 text-gray-300">Configuration SaaS</h3>
                    <div className="space-y-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-300 mb-2">
                          Statut entreprise *
                        </label>
                        <select
                          name="status"
                          defaultValue={editingCompany?.status || 'ACTIVE'}
                          disabled={isCompanySuspended}
                          onChange={(e) => {
                            if (e.target.value === 'SUSPENDED' || e.target.value === 'EXPIRED') {
                              const confirmMessage = e.target.value === 'SUSPENDED'
                                ? 'Cette action suspendra immédiatement toutes les agences de l\'entreprise. Tous les utilisateurs seront bloqués. Continuer ?'
                                : 'Cette action marquera l\'entreprise comme expirée. Toutes les agences et utilisateurs seront bloqués. Continuer ?';
                              if (!confirm(confirmMessage)) {
                                e.target.value = editingCompany?.status || 'ACTIVE';
                              }
                            }
                          }}
                          className="w-full px-4 py-2 bg-[#1D1F23] border border-gray-600 rounded-lg text-white disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          <option value="ACTIVE">Actif</option>
                          <option value="SUSPENDED">Suspendu</option>
                          <option value="EXPIRED">Expiré</option>
                        </select>
                        <p className="text-xs text-gray-500 mt-1">Statut de l'entreprise dans le cycle de vie SaaS</p>
                      </div>
                      
                      {activeSubscription && (
                        <>
                          <div>
                            <label className="block text-sm font-medium text-gray-300 mb-2">
                              Plan SaaS
                            </label>
                            <select
                              name="planId"
                              defaultValue={activeSubscription.planId}
                              disabled
                              className="w-full px-4 py-2 bg-[#1D1F23] border border-gray-600 rounded-lg text-white opacity-50 cursor-not-allowed"
                            >
                              {plans?.map((plan: any) => (
                                <option key={plan.id} value={plan.id}>
                                  {plan.name}
                                </option>
                              ))}
                            </select>
                            <p className="text-xs text-gray-500 mt-1">Plan actuellement actif pour cette entreprise</p>
                          </div>
                          <div>
                            <label className="block text-sm font-medium text-gray-300 mb-2">
                              Périodicité
                            </label>
                            <select
                              name="billingPeriod"
                              defaultValue={activeSubscription.billingPeriod}
                              disabled
                              className="w-full px-4 py-2 bg-[#1D1F23] border border-gray-600 rounded-lg text-white opacity-50 cursor-not-allowed"
                            >
                              <option value="MONTHLY">Mensuel</option>
                              <option value="QUARTERLY">Trimestriel</option>
                              <option value="YEARLY">Annuel</option>
                            </select>
                            <p className="text-xs text-gray-500 mt-1">Fréquence de facturation</p>
                          </div>
                          <div>
                            <label className="block text-sm font-medium text-gray-300 mb-2">
                              Date de début d'abonnement
                            </label>
                            <input
                              type="date"
                              name="startDate"
                              defaultValue={activeSubscription.startDate ? new Date(activeSubscription.startDate).toISOString().split('T')[0] : ''}
                              disabled
                              className="w-full px-4 py-2 bg-[#1D1F23] border border-gray-600 rounded-lg text-white opacity-50 cursor-not-allowed"
                            />
                            <p className="text-xs text-gray-500 mt-1">Date de début de l'abonnement actif</p>
                          </div>
                          <div>
                            <label className="block text-sm font-medium text-gray-300 mb-2">
                              Date de fin d'abonnement
                            </label>
                            <input
                              type="date"
                              name="endDate"
                              defaultValue={activeSubscription.endDate ? new Date(activeSubscription.endDate).toISOString().split('T')[0] : ''}
                              disabled
                              className="w-full px-4 py-2 bg-[#1D1F23] border border-gray-600 rounded-lg text-white opacity-50 cursor-not-allowed"
                            />
                            <p className="text-xs text-gray-500 mt-1">Date de fin calculée automatiquement (modifiable via l'abonnement)</p>
                          </div>
                        </>
                      )}
                      
                      <div>
                        <label className="block text-sm font-medium text-gray-300 mb-2">
                          Fuseau horaire
                        </label>
                        <select
                          name="timezone"
                          defaultValue={editingCompany?.timezone || 'Africa/Casablanca'}
                          disabled={isCompanySuspended}
                          className="w-full px-4 py-2 bg-[#1D1F23] border border-gray-600 rounded-lg text-white disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          <option value="Africa/Casablanca">Africa/Casablanca (GMT+1)</option>
                          <option value="Europe/Paris">Europe/Paris (GMT+1)</option>
                          <option value="America/New_York">America/New_York (GMT-5)</option>
                          <option value="America/Los_Angeles">America/Los_Angeles (GMT-8)</option>
                          <option value="Asia/Dubai">Asia/Dubai (GMT+4)</option>
                          <option value="UTC">UTC (GMT+0)</option>
                        </select>
                        <p className="text-xs text-gray-500 mt-1">Fuseau horaire par défaut pour cette entreprise</p>
                      </div>
                      
                      <div>
                        <label className="block text-sm font-medium text-gray-300 mb-2">
                          Date de suspension
                        </label>
                        <input
                          type="datetime-local"
                          name="suspendedAt"
                          defaultValue={editingCompany?.suspendedAt ? new Date(editingCompany.suspendedAt).toISOString().slice(0, 16) : ''}
                          disabled={isCompanySuspended}
                          className="w-full px-4 py-2 bg-[#1D1F23] border border-gray-600 rounded-lg text-white disabled:opacity-50 disabled:cursor-not-allowed"
                        />
                        <p className="text-xs text-gray-500 mt-1">Date pivot pour J+90 (restauration) et J+100 (suppression définitive)</p>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-300 mb-2">
                          Raison de suspension
                        </label>
                        <textarea
                          name="suspendedReason"
                          defaultValue={editingCompany?.suspendedReason || ''}
                          rows={3}
                          disabled={isCompanySuspended}
                          className="w-full px-4 py-2 bg-[#1D1F23] border border-gray-600 rounded-lg text-white disabled:opacity-50 disabled:cursor-not-allowed"
                          placeholder="Raison de la suspension..."
                        />
                      </div>
                    </div>
                  </div>
                )}

                {/* SECTION 3 — Modules activés */}
                {editingCompany && (
                  <div className="border-b border-gray-700 pb-4">
                    <h3 className="text-lg font-semibold mb-4 text-gray-300">Modules activés (niveau entreprise)</h3>
                    <p className="text-sm text-gray-400 mb-4">
                      Les agences héritent automatiquement des modules activés au niveau entreprise. Une désactivation au niveau entreprise impacte toutes les agences.
                    </p>
                    <div className="grid grid-cols-2 gap-3">
                      {Object.entries(MODULE_LABELS).map(([code, label]) => {
                        const isActive = selectedModules.includes(code);
                        const isDisabled = isCompanySuspended;
                        
                        return (
                          <label
                            key={code}
                            className={`flex items-center gap-3 p-3 rounded-lg border transition-all ${
                              isActive
                                ? 'bg-blue-500/20 border-blue-500'
                                : 'bg-[#1D1F23] border-gray-600'
                            } ${isDisabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer hover:border-gray-500'}`}
                          >
                            <input
                              type="checkbox"
                              checked={isActive}
                              onChange={() => !isDisabled && handleModuleToggle(code)}
                              disabled={isDisabled}
                              className="w-4 h-4 rounded disabled:cursor-not-allowed"
                            />
                            <span className={`text-sm ${isActive ? 'text-white' : 'text-gray-400'}`}>{label}</span>
                          </label>
                        );
                      })}
                    </div>
                    {selectedModules.length === 0 && !isCompanySuspended && (
                      <p className="text-xs text-yellow-400 mt-2">
                        ⚠️ Aucun module activé. Les agences n'auront accès à aucune fonctionnalité.
                      </p>
                    )}
                  </div>
                )}

                {(createMutation.isError || updateMutation.isError) && (
                  <div className="bg-red-500/20 border border-red-500 text-red-400 px-4 py-3 rounded-lg text-sm">
                    {createMutation.error?.response?.data?.message ||
                      updateMutation.error?.response?.data?.message ||
                      'Une erreur est survenue'}
                  </div>
                )}
                {(createMutation.isSuccess || updateMutation.isSuccess) && (
                  <div className="bg-green-500/20 border border-green-500 text-green-400 px-4 py-3 rounded-lg text-sm">
                    {editingCompany ? 'Entreprise modifiée avec succès' : 'Entreprise créée avec succès'}
                  </div>
                )}
                <div className="flex gap-3 pt-4">
                  <button
                    type="button"
                    onClick={() => {
                      setShowModal(false);
                      setEditingCompany(null);
                      setSelectedModules([]);
                    }}
                    className="flex-1 px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700"
                  >
                    Annuler
                  </button>
                  <button
                    type="submit"
                    disabled={createMutation.isPending || updateMutation.isPending || isCompanySuspended}
                    className="flex-1 px-4 py-2 bg-[#3E7BFA] text-white rounded-lg hover:bg-[#2E6BEA] disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {createMutation.isPending || updateMutation.isPending
                      ? 'En cours...'
                      : editingCompany
                      ? 'Modifier'
                      : 'Créer'}
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
