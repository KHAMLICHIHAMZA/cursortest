import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '../lib/axios';
import { Plus, Edit, Trash2, AlertTriangle, CheckCircle, XCircle } from 'lucide-react';

const MODULE_LABELS: Record<string, string> = {
  VEHICLES: 'Véhicules',
  BOOKINGS: 'Réservations',
  INVOICES: 'Facturation',
  MAINTENANCE: 'Maintenance',
  FINES: 'Amendes',
  ANALYTICS: 'Analytics',
};

export default function Agencies() {
  const [showModal, setShowModal] = useState(false);
  const [editingAgency, setEditingAgency] = useState<any>(null);
  const queryClient = useQueryClient();

  const { data: agencies, isLoading } = useQuery({
    queryKey: ['agencies'],
    queryFn: async () => {
      const res = await api.get('/agencies');
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

  // Récupérer les modules de l'entreprise (hérités)
  const { data: companyModules } = useQuery({
    queryKey: ['companyModules', editingAgency?.companyId],
    queryFn: async () => {
      if (!editingAgency?.companyId) return [];
      const res = await api.get(`/modules/company/${editingAgency.companyId}`);
      return res.data;
    },
    enabled: !!editingAgency?.companyId,
  });

  // Récupérer les modules de l'agence
  const { data: agencyModules } = useQuery({
    queryKey: ['agencyModules', editingAgency?.id],
    queryFn: async () => {
      if (!editingAgency?.id) return [];
      const res = await api.get(`/modules/agency/${editingAgency.id}`);
      return res.data;
    },
    enabled: !!editingAgency?.id,
  });

  const createMutation = useMutation({
    mutationFn: (data: any) => api.post('/agencies', data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['agencies'] });
      setShowModal(false);
      setEditingAgency(null);
    },
    onError: (error: any) => {
      console.error('Error creating agency:', error);
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: any }) =>
      api.patch(`/agencies/${id}`, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['agencies'] });
      queryClient.invalidateQueries({ queryKey: ['agencyModules'] });
      setShowModal(false);
      setEditingAgency(null);
    },
    onError: (error: any) => {
      console.error('Error updating agency:', error);
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => api.delete(`/agencies/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['agencies'] });
    },
  });

  // Mutation pour activer/désactiver les modules d'agence
  const toggleAgencyModuleMutation = useMutation({
    mutationFn: async ({ agencyId, moduleCode, activate }: { agencyId: string; moduleCode: string; activate: boolean }) => {
      if (activate) {
        await api.post(`/modules/agency/${agencyId}/${moduleCode}/activate`);
      } else {
        await api.delete(`/modules/agency/${agencyId}/${moduleCode}`);
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['agencyModules', editingAgency?.id] });
    },
  });

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const data: any = {
      name: formData.get('name'),
      phone: formData.get('phone'),
      address: formData.get('address'),
      companyId: formData.get('companyId'),
    };

    // Ajouter les champs SaaS de base (création et édition)
    const timezone = formData.get('timezone');
    if (timezone) {
      data.timezone = timezone;
    }
    const capacity = formData.get('capacity');
    if (capacity) {
      data.capacity = parseInt(capacity as string);
    }

    // Ajouter les champs SaaS supplémentaires si en édition
    if (editingAgency) {
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

    if (editingAgency) {
      updateMutation.mutate({ id: editingAgency.id, data });
    } else {
      createMutation.mutate(data);
    }
  };

  // Vérifier si un module est hérité et actif
  const isModuleInherited = (moduleCode: string) => {
    return companyModules?.some((m: any) => m.moduleCode === moduleCode && m.isActive);
  };

  // Vérifier si un module est désactivé au niveau agence
  const isModuleDisabledAtAgency = (moduleCode: string) => {
    const agencyModule = agencyModules?.find((m: any) => m.moduleCode === moduleCode);
    return agencyModule && !agencyModule.isActive;
  };

  // Vérifier si un module est actif pour l'agence (hérité ET non désactivé)
  const isModuleActiveForAgency = (moduleCode: string) => {
    if (!isModuleInherited(moduleCode)) return false;
    return !isModuleDisabledAtAgency(moduleCode);
  };

  const handleModuleToggle = (moduleCode: string) => {
    if (!editingAgency?.id) return;
    
    const isCurrentlyActive = isModuleActiveForAgency(moduleCode);
    const isInherited = isModuleInherited(moduleCode);
    const moduleLabel = MODULE_LABELS[moduleCode] || moduleCode;
    
    // On ne peut que désactiver un module hérité
    if (!isInherited) {
      alert(`Impossible d'activer le module "${moduleLabel}".\n\n⚠️ Ce module n'est pas inclus dans l'abonnement de l'entreprise.\n\nPour activer ce module, contactez le Super Admin pour l'ajouter au plan de l'entreprise.`);
      return;
    }
    
    // Confirmation pour désactivation
    if (isCurrentlyActive) {
      if (!confirm(`Désactiver le module "${moduleLabel}" pour cette agence ?\n\n⚠️ Cette action désactivera ce module uniquement pour cette agence. Les autres agences ne seront pas impactées.`)) {
        return;
      }
    }
    
    // Si actif, on désactive (création d'un AgencyModule avec isActive=false)
    // Si désactivé, on réactive (suppression de l'AgencyModule)
    toggleAgencyModuleMutation.mutate({
      agencyId: editingAgency.id,
      moduleCode,
      activate: isCurrentlyActive ? false : true,
    });
  };

  const isAgencySuspended = editingAgency?.status === 'SUSPENDED';
  const isCompanySuspended = editingAgency?.company?.status === 'SUSPENDED' || editingAgency?.company?.status === 'EXPIRED';

  if (isLoading) return <div className="text-center py-8">Chargement...</div>;

  return (
    <div>
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold">Agences</h1>
        <button
          onClick={() => {
            setEditingAgency(null);
            setShowModal(true);
          }}
          className="bg-[#3E7BFA] text-white px-4 py-2 rounded-lg flex items-center gap-2 hover:bg-[#2E6BEA] transition-colors"
        >
          <Plus size={20} />
          Nouvelle agence
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
                Entreprise
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase">
                Téléphone
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase">
                Véhicules
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
            {agencies?.map((agency: any) => (
              <tr key={agency.id} className="hover:bg-[#1D1F23]">
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="text-sm font-medium text-white">
                    {agency.name}
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-400">
                  {agency.company?.name}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-400">
                  {agency.phone || '-'}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-400">
                  {agency._count?.vehicles || 0}
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <span
                    className={`px-2 py-1 text-xs font-medium rounded-full ${
                      agency.status === 'ACTIVE'
                        ? 'bg-green-500/20 text-green-400'
                        : agency.status === 'SUSPENDED'
                        ? 'bg-yellow-500/20 text-yellow-400'
                        : 'bg-red-500/20 text-red-400'
                    }`}
                  >
                    {agency.status === 'ACTIVE' && 'Actif'}
                    {agency.status === 'SUSPENDED' && 'Suspendu'}
                    {agency.status === 'DELETED' && 'Supprimé'}
                    {!agency.status && 'Actif'}
                  </span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                  <div className="flex justify-end gap-2">
                    <button
                      onClick={() => {
                        setEditingAgency(agency);
                        setShowModal(true);
                      }}
                      className="text-[#3E7BFA] hover:text-[#2E6BEA]"
                    >
                      <Edit size={18} />
                    </button>
                    <button
                      onClick={() => {
                        if (confirm(`Supprimer cette agence ?\n\n⚠️ Cette action est irréversible. Tous les véhicules, réservations et données associées seront également supprimés.`)) {
                          deleteMutation.mutate(agency.id);
                        }
                      }}
                      className="text-red-400 hover:text-red-300"
                      title="Supprimer l'agence"
                    >
                      <Trash2 size={18} />
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
                {editingAgency ? 'Modifier' : 'Nouvelle'} agence
              </h2>
            </div>
            <div className="overflow-y-auto flex-1 p-6">
              {isCompanySuspended && (
                <div className="mb-4 bg-red-500/20 border border-red-500 text-red-400 px-4 py-3 rounded-lg text-sm flex items-start gap-2">
                  <AlertTriangle size={18} className="mt-0.5 flex-shrink-0" />
                  <div>
                    <p className="font-semibold mb-1">L'entreprise est suspendue — aucune modification n'est autorisée</p>
                    <p className="text-xs text-red-300">
                      Toutes les agences de cette entreprise sont bloquées. Aucune opération n'est possible jusqu'à la restauration de l'entreprise.
                    </p>
                  </div>
                </div>
              )}
              {isAgencySuspended && !isCompanySuspended && (
                <div className="mb-4 bg-yellow-500/20 border border-yellow-500 text-yellow-400 px-4 py-3 rounded-lg text-sm flex items-start gap-2">
                  <AlertTriangle size={18} className="mt-0.5 flex-shrink-0" />
                  <div>
                    <p className="font-semibold mb-1">Cette agence est suspendue — aucune opération n'est autorisée</p>
                    <p className="text-xs text-yellow-300">
                      Aucune opération n'est possible sur cette agence jusqu'à sa restauration.
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
                        Entreprise *
                      </label>
                      <select
                        name="companyId"
                        defaultValue={editingAgency?.companyId}
                        required
                        disabled={isAgencySuspended || isCompanySuspended || !!editingAgency}
                        className="w-full px-4 py-2 bg-[#1D1F23] border border-gray-600 rounded-lg text-white disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        <option value="">Sélectionner...</option>
                        {companies?.map((company: any) => (
                          <option key={company.id} value={company.id}>
                            {company.name}
                          </option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-300 mb-2">
                        Nom *
                      </label>
                      <input
                        type="text"
                        name="name"
                        defaultValue={editingAgency?.name}
                        required
                        disabled={isAgencySuspended || isCompanySuspended}
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
                        defaultValue={editingAgency?.phone}
                        disabled={isAgencySuspended || isCompanySuspended}
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
                        defaultValue={editingAgency?.address}
                        disabled={isAgencySuspended || isCompanySuspended}
                        className="w-full px-4 py-2 bg-[#1D1F23] border border-gray-600 rounded-lg text-white disabled:opacity-50 disabled:cursor-not-allowed"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-300 mb-2">
                        Fuseau horaire
                      </label>
                      <select
                        name="timezone"
                        defaultValue={editingAgency?.timezone || 'Africa/Casablanca'}
                        disabled={isAgencySuspended || isCompanySuspended}
                        className="w-full px-4 py-2 bg-[#1D1F23] border border-gray-600 rounded-lg text-white disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        <option value="Africa/Casablanca">Africa/Casablanca (GMT+1)</option>
                        <option value="Europe/Paris">Europe/Paris (GMT+1)</option>
                        <option value="America/New_York">America/New_York (GMT-5)</option>
                        <option value="America/Los_Angeles">America/Los_Angeles (GMT-8)</option>
                        <option value="Asia/Dubai">Asia/Dubai (GMT+4)</option>
                        <option value="UTC">UTC (GMT+0)</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-300 mb-2">
                        Capacité (nombre de véhicules max)
                      </label>
                      <input
                        type="number"
                        name="capacity"
                        defaultValue={editingAgency?.capacity || ''}
                        min="0"
                        disabled={isAgencySuspended || isCompanySuspended}
                        className="w-full px-4 py-2 bg-[#1D1F23] border border-gray-600 rounded-lg text-white disabled:opacity-50 disabled:cursor-not-allowed"
                        placeholder="Optionnel"
                      />
                    </div>
                  </div>
                </div>

                {/* SECTION 2 — Statut de l'agence */}
                {editingAgency && (
                  <div className="border-b border-gray-700 pb-4">
                    <h3 className="text-lg font-semibold mb-4 text-gray-300">Statut de l'agence</h3>
                    <div className="space-y-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-300 mb-2">
                          Statut agence *
                        </label>
                        <select
                          name="status"
                          defaultValue={editingAgency?.status || 'ACTIVE'}
                          disabled={isAgencySuspended || isCompanySuspended}
                          onChange={(e) => {
                            if (e.target.value === 'SUSPENDED') {
                              if (!confirm('Cette action suspendra immédiatement cette agence. Tous les utilisateurs de cette agence seront bloqués. Aucune opération ne sera possible. Continuer ?')) {
                                e.target.value = editingAgency?.status || 'ACTIVE';
                              }
                            }
                          }}
                          className="w-full px-4 py-2 bg-[#1D1F23] border border-gray-600 rounded-lg text-white disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          <option value="ACTIVE">Actif</option>
                          <option value="SUSPENDED">Suspendu</option>
                        </select>
                        <p className="text-xs text-gray-500 mt-1">Statut de l'agence dans le cycle de vie SaaS</p>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-300 mb-2">
                          Date de suspension
                        </label>
                        <input
                          type="datetime-local"
                          name="suspendedAt"
                          defaultValue={editingAgency?.suspendedAt ? new Date(editingAgency.suspendedAt).toISOString().slice(0, 16) : ''}
                          disabled={isAgencySuspended || isCompanySuspended}
                          className="w-full px-4 py-2 bg-[#1D1F23] border border-gray-600 rounded-lg text-white disabled:opacity-50 disabled:cursor-not-allowed"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-300 mb-2">
                          Raison de suspension
                        </label>
                        <textarea
                          name="suspendedReason"
                          defaultValue={editingAgency?.suspendedReason || ''}
                          rows={3}
                          disabled={isAgencySuspended || isCompanySuspended}
                          className="w-full px-4 py-2 bg-[#1D1F23] border border-gray-600 rounded-lg text-white disabled:opacity-50 disabled:cursor-not-allowed"
                          placeholder="Raison de la suspension..."
                        />
                      </div>
                    </div>
                  </div>
                )}

                {/* SECTION 3 — Modules de l'agence */}
                {editingAgency && companyModules && (
                  <div className="border-b border-gray-700 pb-4">
                    <h3 className="text-lg font-semibold mb-4 text-gray-300">Modules de l'agence</h3>
                    <p className="text-sm text-gray-400 mb-4">
                      Une agence peut désactiver un module hérité mais ne peut pas en activer un nouveau. Les modules non inclus dans l'abonnement de l'entreprise ne peuvent pas être activés au niveau agence.
                    </p>
                    <div className="space-y-3">
                      {Object.entries(MODULE_LABELS).map(([code, label]) => {
                        const isInherited = isModuleInherited(code);
                        const isActive = isModuleActiveForAgency(code);
                        const isDisabled = isAgencySuspended || isCompanySuspended || !isInherited;
                        
                        return (
                          <div
                            key={code}
                            className={`flex items-center justify-between p-3 rounded-lg border ${
                              isInherited
                                ? 'bg-[#1D1F23] border-gray-600'
                                : 'bg-gray-800/50 border-gray-700 opacity-50'
                            }`}
                          >
                            <div className="flex items-center gap-3">
                              {isInherited ? (
                                <span className="px-2 py-1 text-xs font-medium rounded-full bg-blue-500/20 text-blue-400">
                                  Hérité
                                </span>
                              ) : (
                                <span className="px-2 py-1 text-xs font-medium rounded-full bg-gray-500/20 text-gray-400">
                                  Non inclus
                                </span>
                              )}
                              <span className="text-sm text-white">{label}</span>
                            </div>
                            <div className="flex items-center gap-3">
                              {isActive ? (
                                <CheckCircle className="w-5 h-5 text-green-400" />
                              ) : isInherited ? (
                                <XCircle className="w-5 h-5 text-red-400" />
                              ) : (
                                <XCircle className="w-5 h-5 text-gray-500" />
                              )}
                              <label className="relative inline-flex items-center cursor-pointer">
                                <input
                                  type="checkbox"
                                  checked={isActive}
                                  onChange={() => handleModuleToggle(code)}
                                  disabled={isDisabled}
                                  className="sr-only peer"
                                />
                                <div className="w-11 h-6 bg-gray-600 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-800 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed"></div>
                              </label>
                            </div>
                          </div>
                        );
                      })}
                    </div>
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
                    {editingAgency ? 'Agence modifiée avec succès' : 'Agence créée avec succès'}
                  </div>
                )}
                <div className="flex gap-3 pt-4">
                  <button
                    type="button"
                    onClick={() => {
                      setShowModal(false);
                      setEditingAgency(null);
                    }}
                    className="flex-1 px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700"
                  >
                    Annuler
                  </button>
                  <button
                    type="submit"
                    disabled={createMutation.isPending || updateMutation.isPending || isAgencySuspended || isCompanySuspended}
                    className="flex-1 px-4 py-2 bg-[#3E7BFA] text-white rounded-lg hover:bg-[#2E6BEA] disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {createMutation.isPending || updateMutation.isPending
                      ? 'En cours...'
                      : editingAgency
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
