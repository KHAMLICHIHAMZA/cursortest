import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '../lib/axios';
import { Plus, Edit, Key, AlertTriangle, X } from 'lucide-react';

interface AgencyPermission {
  agencyId: string;
  permission: 'READ' | 'WRITE' | 'FULL';
}

export default function Users() {
  const [showModal, setShowModal] = useState(false);
  const [editingUser, setEditingUser] = useState<any>(null);
  const [selectedAgencies, setSelectedAgencies] = useState<AgencyPermission[]>([]);
  const queryClient = useQueryClient();

  const { data: users, isLoading } = useQuery({
    queryKey: ['users'],
    queryFn: async () => {
      const res = await api.get('/users');
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

  const { data: agencies } = useQuery({
    queryKey: ['agencies'],
    queryFn: async () => {
      const res = await api.get('/agencies');
      return res.data;
    },
  });

  // Initialiser les agences sélectionnées avec leurs permissions
  useEffect(() => {
    if (editingUser && editingUser.userAgencies) {
      const agencyPermissions: AgencyPermission[] = editingUser.userAgencies.map((ua: any) => ({
        agencyId: ua.agencyId,
        permission: ua.permission || 'FULL',
      }));
      setSelectedAgencies(agencyPermissions);
    } else {
      setSelectedAgencies([]);
    }
  }, [editingUser]);

  const createMutation = useMutation({
    mutationFn: (data: any) => api.post('/users', data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['users'] });
      setShowModal(false);
      setEditingUser(null);
      setSelectedAgencies([]);
    },
    onError: (error: any) => {
      console.error('Error creating user:', error);
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: any }) =>
      api.patch(`/users/${id}`, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['users'] });
      setShowModal(false);
      setEditingUser(null);
      setSelectedAgencies([]);
    },
    onError: (error: any) => {
      console.error('Error updating user:', error);
    },
  });

  const resetPasswordMutation = useMutation({
    mutationFn: (id: string) => api.post(`/users/${id}/reset-password`),
    onSuccess: () => {
      alert('Email de réinitialisation envoyé');
    },
  });

  // Obtenir la permission par défaut selon le rôle
  const getDefaultPermission = (role: string): 'READ' | 'WRITE' | 'FULL' => {
    switch (role) {
      case 'COMPANY_ADMIN':
        return 'FULL';
      case 'AGENCY_MANAGER':
        return 'FULL';
      case 'AGENT':
        return 'WRITE';
      default:
        return 'FULL';
    }
  };

  // Filtrer les agences par entreprise
  const getFilteredAgencies = () => {
    if (!agencies) return [];
    if (!editingUser?.companyId) return agencies;
    return agencies.filter((agency: any) => agency.companyId === editingUser.companyId);
  };

  // Ajouter une agence à la sélection
  const handleAddAgency = (agencyId: string) => {
    const form = document.querySelector('form') as HTMLFormElement;
    const role = form?.querySelector<HTMLSelectElement>('select[name="role"]')?.value || 'AGENT';
    const defaultPermission = getDefaultPermission(role);
    
    if (!selectedAgencies.find(a => a.agencyId === agencyId)) {
      setSelectedAgencies([...selectedAgencies, { agencyId, permission: defaultPermission }]);
    }
  };

  // Retirer une agence de la sélection
  const handleRemoveAgency = (agencyId: string) => {
    setSelectedAgencies(selectedAgencies.filter(a => a.agencyId !== agencyId));
  };

  // Mettre à jour la permission d'une agence
  const handleUpdatePermission = (agencyId: string, permission: 'READ' | 'WRITE' | 'FULL') => {
    setSelectedAgencies(
      selectedAgencies.map(a =>
        a.agencyId === agencyId ? { ...a, permission } : a
      )
    );
  };

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    
    const data: any = {
      email: formData.get('email'),
      name: formData.get('name'),
      role: formData.get('role'),
      companyId: formData.get('companyId') || null,
      isActive: formData.get('isActive') === 'true',
      agencyIds: selectedAgencies.map(a => a.agencyId),
      agencyPermissions: selectedAgencies.map(a => ({
        agencyId: a.agencyId,
        permission: a.permission,
      })),
    };

    if (editingUser) {
      updateMutation.mutate({ id: editingUser.id, data });
    } else {
      createMutation.mutate(data);
    }
  };

  // Vérifier si une agence est suspendue
  const isAgencySuspended = (agencyId: string) => {
    const agency = agencies?.find((a: any) => a.id === agencyId);
    return agency?.status === 'SUSPENDED';
  };

  const isUserInactive = editingUser && !editingUser.isActive;
  const userCompany = editingUser?.companyId 
    ? companies?.find((c: any) => c.id === editingUser.companyId)
    : null;
  const isUserCompanySuspended = userCompany && (userCompany.status === 'SUSPENDED' || userCompany.status === 'EXPIRED');
  const filteredAgencies = getFilteredAgencies();
  const availableAgencies = filteredAgencies.filter(
    (agency: any) => !selectedAgencies.find(a => a.agencyId === agency.id)
  );

  if (isLoading) return <div className="text-center py-8">Chargement...</div>;

  return (
    <div>
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold">Utilisateurs</h1>
        <button
          onClick={() => {
            setEditingUser(null);
            setShowModal(true);
          }}
          className="bg-[#3E7BFA] text-white px-4 py-2 rounded-lg flex items-center gap-2 hover:bg-[#2E6BEA] transition-colors"
        >
          <Plus size={20} />
          Nouvel utilisateur
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
                Email
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase">
                Rôle
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase">
                Entreprise
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase">
                Agences
              </th>
              <th className="px-6 py-3 text-right text-xs font-medium text-gray-400 uppercase">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-700">
            {users?.map((user: any) => (
              <tr key={user.id} className="hover:bg-[#1D1F23]">
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="text-sm font-medium text-white">
                    {user.name}
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-400">
                  {user.email}
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <span className="px-2 py-1 text-xs font-medium rounded-full bg-blue-500/20 text-blue-400">
                    {user.role}
                  </span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-400">
                  {user.company?.name || '-'}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-400">
                  {user.userAgencies?.length || 0} agence(s)
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                  <div className="flex justify-end gap-2">
                    <button
                      onClick={() => {
                        setEditingUser(user);
                        setShowModal(true);
                      }}
                      className="text-[#3E7BFA] hover:text-[#2E6BEA]"
                    >
                      <Edit size={18} />
                    </button>
                    <button
                      onClick={() => resetPasswordMutation.mutate(user.id)}
                      className="text-yellow-400 hover:text-yellow-300"
                      title="Réinitialiser le mot de passe"
                    >
                      <Key size={18} />
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
                {editingUser ? 'Modifier' : 'Nouvel'} utilisateur
              </h2>
            </div>
            <div className="overflow-y-auto flex-1 p-6">
              {isUserCompanySuspended && (
                <div className="mb-4 bg-red-500/20 border border-red-500 text-red-400 px-4 py-3 rounded-lg text-sm flex items-start gap-2">
                  <AlertTriangle size={18} className="mt-0.5 flex-shrink-0" />
                  <div>
                    <p className="font-semibold mb-1">L'entreprise est suspendue — aucune modification n'est autorisée</p>
                    <p className="text-xs text-red-300">
                      L'entreprise de cet utilisateur est suspendue ou expirée. Aucune modification n'est possible jusqu'à la restauration de l'entreprise.
                    </p>
                  </div>
                </div>
              )}
              {isUserInactive && !isUserCompanySuspended && (
                <div className="mb-4 bg-red-500/20 border border-red-500 text-red-400 px-4 py-3 rounded-lg text-sm flex items-start gap-2">
                  <AlertTriangle size={18} className="mt-0.5 flex-shrink-0" />
                  <div>
                    <p className="font-semibold mb-1">Cet utilisateur est inactif — la connexion est bloquée</p>
                    <p className="text-xs text-red-300">
                      Cet utilisateur ne pourra pas se connecter à l'application tant qu'il reste inactif. Aucune action n'est possible avec ce compte.
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
                        defaultValue={editingUser?.name}
                        required
                        disabled={isUserCompanySuspended}
                        className="w-full px-4 py-2 bg-[#1D1F23] border border-gray-600 rounded-lg text-white disabled:opacity-50 disabled:cursor-not-allowed"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-300 mb-2">
                        Email *
                      </label>
                      <input
                        type="email"
                        name="email"
                        defaultValue={editingUser?.email}
                        required
                        disabled={!!editingUser}
                        className="w-full px-4 py-2 bg-[#1D1F23] border border-gray-600 rounded-lg text-white disabled:opacity-50"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-300 mb-2">
                        Rôle *
                      </label>
                      <select
                        name="role"
                        defaultValue={editingUser?.role}
                        required
                        disabled={isUserCompanySuspended}
                        onChange={(e) => {
                          // Mettre à jour les permissions par défaut quand le rôle change
                          const newPermission = getDefaultPermission(e.target.value);
                          setSelectedAgencies(
                            selectedAgencies.map(a => ({ ...a, permission: newPermission }))
                          );
                        }}
                        className="w-full px-4 py-2 bg-[#1D1F23] border border-gray-600 rounded-lg text-white disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        <option value="COMPANY_ADMIN">COMPANY_ADMIN</option>
                        <option value="AGENCY_MANAGER">AGENCY_MANAGER</option>
                        <option value="AGENT">AGENT</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-300 mb-2">
                        Entreprise
                      </label>
                      <select
                        name="companyId"
                        defaultValue={editingUser?.companyId || ''}
                        disabled={isUserCompanySuspended || !!editingUser}
                        onChange={() => {
                          // Réinitialiser les agences quand l'entreprise change
                          setSelectedAgencies([]);
                        }}
                        className="w-full px-4 py-2 bg-[#1D1F23] border border-gray-600 rounded-lg text-white disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        <option value="">Aucune</option>
                        {companies?.map((company: any) => (
                          <option key={company.id} value={company.id}>
                            {company.name}
                          </option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className="flex items-center gap-2">
                        <input
                          type="checkbox"
                          name="isActive"
                          defaultChecked={editingUser?.isActive !== false}
                          value="true"
                          disabled={isUserCompanySuspended}
                          className="rounded disabled:opacity-50 disabled:cursor-not-allowed"
                        />
                        <span className="text-sm text-gray-300">Actif</span>
                      </label>
                      <p className="text-xs text-gray-500 mt-1">Un utilisateur inactif ne pourra pas se connecter. La connexion est complètement bloquée.</p>
                    </div>
                  </div>
                </div>

                {/* SECTION 2 — Agences & permissions */}
                <div className="border-b border-gray-700 pb-4">
                  <h3 className="text-lg font-semibold mb-4 text-gray-300">Agences & permissions</h3>
                  
                  {/* Sélection d'agences */}
                  {availableAgencies.length > 0 && (
                    <div className="mb-4">
                      <label className="block text-sm font-medium text-gray-300 mb-2">
                        Ajouter une agence
                      </label>
                      <select
                        onChange={(e) => {
                          if (e.target.value) {
                            handleAddAgency(e.target.value);
                            e.target.value = '';
                          }
                        }}
                        disabled={isUserCompanySuspended}
                        className="w-full px-4 py-2 bg-[#1D1F23] border border-gray-600 rounded-lg text-white disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        <option value="">Sélectionner une agence...</option>
                        {availableAgencies.map((agency: any) => (
                          <option key={agency.id} value={agency.id}>
                            {agency.name} ({agency.company?.name})
                          </option>
                        ))}
                      </select>
                    </div>
                  )}

                  {/* Tableau des agences sélectionnées */}
                  {selectedAgencies.length > 0 ? (
                    <div className="space-y-2">
                      <div className="text-sm font-medium text-gray-300 mb-2">
                        Agences assignées ({selectedAgencies.length})
                      </div>
                      <div className="bg-[#1D1F23] rounded-lg border border-gray-600 overflow-hidden">
                        <table className="w-full">
                          <thead className="bg-[#2C2F36]">
                            <tr>
                              <th className="px-4 py-2 text-left text-xs font-medium text-gray-400 uppercase">
                                Agence
                              </th>
                              <th className="px-4 py-2 text-left text-xs font-medium text-gray-400 uppercase">
                                Permission
                              </th>
                              <th className="px-4 py-2 text-right text-xs font-medium text-gray-400 uppercase">
                                Action
                              </th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-gray-700">
                            {selectedAgencies.map(({ agencyId, permission }) => {
                              const agency = agencies?.find((a: any) => a.id === agencyId);
                              const suspended = isAgencySuspended(agencyId);
                              const form = document.querySelector('form') as HTMLFormElement;
                              const role = form?.querySelector<HTMLSelectElement>('select[name="role"]')?.value || 'AGENT';
                              
                              return (
                                <tr key={agencyId} className={suspended ? 'opacity-50' : ''}>
                                  <td className="px-4 py-3">
                                    <div className="text-sm text-white">
                                      {agency?.name || 'Agence inconnue'}
                                      {suspended && (
                                        <span className="ml-2 text-xs text-yellow-400">(Suspendue)</span>
                                      )}
                                    </div>
                                    <div className="text-xs text-gray-400">
                                      {agency?.company?.name}
                                    </div>
                                  </td>
                                  <td className="px-4 py-3">
                                    <select
                                      value={permission}
                                      onChange={(e) =>
                                        handleUpdatePermission(
                                          agencyId,
                                          e.target.value as 'READ' | 'WRITE' | 'FULL'
                                        )
                                      }
                                      disabled={suspended || isUserCompanySuspended}
                                      className="px-3 py-1 bg-[#2C2F36] border border-gray-600 rounded text-sm text-white disabled:opacity-50 disabled:cursor-not-allowed"
                                    >
                                      <option value="READ">READ</option>
                                      <option value="WRITE">WRITE</option>
                                      <option value="FULL">FULL</option>
                                    </select>
                                    {suspended && (
                                      <p className="text-xs text-yellow-400 mt-1">READ uniquement autorisé</p>
                                    )}
                                  </td>
                                  <td className="px-4 py-3 text-right">
                                    <button
                                      type="button"
                                      onClick={() => handleRemoveAgency(agencyId)}
                                      disabled={isUserCompanySuspended}
                                      className="text-red-400 hover:text-red-300 disabled:opacity-50 disabled:cursor-not-allowed"
                                    >
                                      <X size={18} />
                                    </button>
                                  </td>
                                </tr>
                              );
                            })}
                          </tbody>
                        </table>
                      </div>
                      <div className="mt-3 space-y-1">
                        <p className="text-xs text-gray-500">
                          <strong>Permissions par défaut :</strong> COMPANY_ADMIN → FULL, AGENCY_MANAGER → FULL, AGENT → WRITE
                        </p>
                        <p className="text-xs text-yellow-400">
                          ⚠️ Si une agence est suspendue, seule la permission READ est autorisée.
                        </p>
                      </div>
                    </div>
                  ) : (
                    <p className="text-sm text-gray-400">Aucune agence assignée</p>
                  )}
                </div>

                {(createMutation.isError || updateMutation.isError) && (
                  <div className="bg-red-500/20 border border-red-500 text-red-400 px-4 py-3 rounded-lg text-sm">
                    {createMutation.error?.response?.data?.message ||
                      updateMutation.error?.response?.data?.message ||
                      'Une erreur est survenue'}
                  </div>
                )}
                {(createMutation.isSuccess || updateMutation.isSuccess) && (
                  <div className="bg-green-500/20 border border-green-500 text-green-400 px-4 py-3 rounded-lg text-sm">
                    {editingUser ? 'Utilisateur modifié avec succès' : 'Utilisateur créé avec succès'}
                  </div>
                )}
                <div className="flex gap-3 pt-4">
                  <button
                    type="button"
                    onClick={() => {
                      setShowModal(false);
                      setEditingUser(null);
                      setSelectedAgencies([]);
                    }}
                    className="flex-1 px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700"
                  >
                    Annuler
                  </button>
                  <button
                    type="submit"
                    disabled={createMutation.isPending || updateMutation.isPending || isUserCompanySuspended}
                    className="flex-1 px-4 py-2 bg-[#3E7BFA] text-white rounded-lg hover:bg-[#2E6BEA] disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {createMutation.isPending || updateMutation.isPending
                      ? 'En cours...'
                      : editingUser
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
