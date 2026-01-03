import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '../lib/axios';
import { Plus, Edit, Trash2 } from 'lucide-react';
import { getStoredUser } from '../lib/auth';

export default function Bookings() {
  const [showModal, setShowModal] = useState(false);
  const [editingBooking, setEditingBooking] = useState<any>(null);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const queryClient = useQueryClient();
  const user = getStoredUser();

  const { data: bookings, isLoading } = useQuery({
    queryKey: ['bookings'],
    queryFn: async () => {
      const res = await api.get('/bookings');
      return res.data;
    },
  });

  const { data: vehicles } = useQuery({
    queryKey: ['vehicles'],
    queryFn: async () => {
      const res = await api.get('/vehicles');
      return res.data;
    },
  });

  const { data: clients } = useQuery({
    queryKey: ['clients'],
    queryFn: async () => {
      const res = await api.get('/clients');
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

  const createMutation = useMutation({
    mutationFn: (data: any) => api.post('/bookings', data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['bookings'] });
      queryClient.invalidateQueries({ queryKey: ['vehicles'] });
      queryClient.invalidateQueries({ queryKey: ['planning'] });
      setShowModal(false);
      setError('');
      setSuccess('Location créée avec succès');
      setTimeout(() => setSuccess(''), 3000);
    },
    onError: (error: any) => {
      let errorMessage = error.response?.data?.message || error.message || 'Erreur lors de la création de la location';
      
      // Si c'est un conflit avec une maintenance, afficher un message plus clair
      if (error.response?.data?.conflicts) {
        const maintenanceConflicts = error.response.data.conflicts.filter((c: any) => c.type === 'MAINTENANCE');
        if (maintenanceConflicts.length > 0) {
          errorMessage = 'Le véhicule est en maintenance pendant cette période. Impossible de créer une location.';
        }
      }
      
      setError(errorMessage);
      setSuccess('');
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: any }) =>
      api.put(`/bookings/${id}`, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['bookings'] });
      queryClient.invalidateQueries({ queryKey: ['vehicles'] });
      queryClient.invalidateQueries({ queryKey: ['planning'] });
      setShowModal(false);
      setEditingBooking(null);
      setError('');
      setSuccess('Location modifiée avec succès');
      setTimeout(() => setSuccess(''), 3000);
    },
    onError: (error: any) => {
      let errorMessage = error.response?.data?.message || error.message || 'Erreur lors de la modification de la location';
      
      // Si c'est un conflit avec une maintenance, afficher un message plus clair
      if (error.response?.data?.conflicts) {
        const maintenanceConflicts = error.response.data.conflicts.filter((c: any) => c.type === 'MAINTENANCE');
        if (maintenanceConflicts.length > 0) {
          errorMessage = 'Le véhicule est en maintenance pendant cette période. Impossible de modifier la location.';
        }
      }
      
      setError(errorMessage);
      setSuccess('');
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => api.delete(`/bookings/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['bookings'] });
      queryClient.invalidateQueries({ queryKey: ['vehicles'] });
    },
  });

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    
    const formData = new FormData(e.currentTarget);
    const vehicleId = formData.get('vehicleId') as string;
    const vehicle = vehicles?.find((v: any) => v.id === vehicleId);
    const startDateInput = formData.get('startDate') as string;
    const endDateInput = formData.get('endDate') as string;
    
    // Validation côté client
    if (!vehicleId) {
      setError('Veuillez sélectionner un véhicule');
      return;
    }
    
    if (!startDateInput || !endDateInput) {
      setError('Veuillez remplir les dates et heures de début et de fin');
      return;
    }
    
    // Convertir datetime-local en ISO string pour le backend
    const startDate = new Date(startDateInput).toISOString();
    const endDate = new Date(endDateInput).toISOString();
    
    const start = new Date(startDate);
    const end = new Date(endDate);
    const now = new Date();
    
    if (start < now && !editingBooking) {
      setError('La date et heure de début ne peuvent pas être dans le passé');
      return;
    }
    
    if (end <= start) {
      setError('La date et heure de fin doivent être postérieures à la date et heure de début');
      return;
    }
    
    if (!vehicle) {
      setError('Véhicule introuvable');
      return;
    }
    
    // Calculer le prix en fonction de la durée réelle (en heures, arrondi à la journée)
    const hours = Math.ceil(
      (end.getTime() - start.getTime()) /
        (1000 * 60 * 60)
    );
    const days = Math.ceil(hours / 24);
    
    if (hours <= 0) {
      setError('La durée de location doit être d\'au moins 1 heure');
      return;
    }

    // Vérifier qu'il n'y a pas de maintenance en cours ou prévue
    try {
      const availabilityRes = await api.post('/planning/check-availability', {
        vehicleId,
        startDate: start.toISOString(),
        endDate: end.toISOString(),
      });

      if (!availabilityRes.data.available) {
        const conflicts = availabilityRes.data.conflicts || [];
        const maintenanceConflict = conflicts.find((c: any) => c.type === 'maintenance');
        if (maintenanceConflict) {
          setError('Le véhicule a une maintenance en cours ou prévue à cette période. Impossible de créer une location.');
          return;
        }
        setError('Le véhicule n\'est pas disponible à cette période.');
        return;
      }
    } catch (error: any) {
      // Si l'endpoint n'existe pas, on continue quand même (le backend vérifiera)
      console.warn('Erreur lors de la vérification de disponibilité:', error);
    }

    const data = {
      agencyId: formData.get('agencyId'),
      vehicleId,
      clientId: formData.get('clientId'),
      startDate,
      endDate,
      totalPrice: days * (vehicle?.dailyRate || 0),
      status: formData.get('status'),
    };

    if (editingBooking) {
      updateMutation.mutate({ id: editingBooking.id, data });
    } else {
      createMutation.mutate(data);
    }
  };

  const availableAgencies = agencies?.filter((agency: any) =>
    user?.agencyIds?.includes(agency.id)
  );

  if (isLoading) return <div className="text-center py-8">Chargement...</div>;

  return (
    <div>
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold">Locations</h1>
        <button
          onClick={() => {
            setEditingBooking(null);
            setError('');
            setSuccess('');
            setShowModal(true);
          }}
          className="bg-[#3E7BFA] text-white px-4 py-2 rounded-lg flex items-center gap-2 hover:bg-[#2E6BEA] transition-colors"
        >
          <Plus size={20} />
          Nouvelle location
        </button>
      </div>

      {success && (
        <div className="mb-4 bg-green-500/20 border border-green-500 text-green-400 px-4 py-3 rounded">
          {success}
        </div>
      )}

      <div className="bg-[#2C2F36] rounded-lg border border-gray-700 overflow-hidden">
        <table className="w-full">
          <thead className="bg-[#1D1F23]">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase">
                Client
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase">
                Véhicule
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase">
                Dates
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase">
                Prix total
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
            {bookings?.map((booking: any) => (
              <tr key={booking.id} className="hover:bg-[#1D1F23]">
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="text-sm font-medium text-white">
                    {booking.client?.name}
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-400">
                  {booking.vehicle?.brand} {booking.vehicle?.model}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-400">
                  <div>{new Date(booking.startDate).toLocaleString('fr-FR', { 
                    day: '2-digit', 
                    month: '2-digit', 
                    year: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit'
                  })}</div>
                  <div className="text-xs text-gray-500">→ {new Date(booking.endDate).toLocaleString('fr-FR', { 
                    day: '2-digit', 
                    month: '2-digit', 
                    year: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit'
                  })}</div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-400">
                  {booking.totalPrice}€
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <span
                    className={`px-2 py-1 text-xs font-medium rounded-full ${
                      booking.status === 'ACTIVE'
                        ? 'bg-green-500/20 text-green-400'
                        : booking.status === 'CONFIRMED'
                        ? 'bg-blue-500/20 text-blue-400'
                        : booking.status === 'COMPLETED'
                        ? 'bg-gray-500/20 text-gray-400'
                        : 'bg-yellow-500/20 text-yellow-400'
                    }`}
                  >
                    {booking.status}
                  </span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                  <div className="flex justify-end gap-2">
                    <button
                      onClick={() => {
                        setEditingBooking(booking);
                        setError('');
                        setSuccess('');
                        setShowModal(true);
                      }}
                      className="text-[#3E7BFA] hover:text-[#2E6BEA]"
                    >
                      <Edit size={18} />
                    </button>
                    {user?.role !== 'AGENT' && (
                      <button
                        onClick={() => {
                          if (confirm('Supprimer cette location ?')) {
                            deleteMutation.mutate(booking.id);
                          }
                        }}
                        className="text-red-400 hover:text-red-300"
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
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-[#2C2F36] rounded-lg w-full max-w-md max-h-[90vh] flex flex-col border border-gray-700 shadow-xl">
            <div className="p-6 pb-4 border-b border-gray-700">
              <h2 className="text-xl font-bold">
                {editingBooking ? 'Modifier' : 'Nouvelle'} location
              </h2>
            </div>
            <form onSubmit={handleSubmit} className="flex flex-col flex-1 min-h-0">
              <div className="flex-1 overflow-y-auto p-6 space-y-4">
              {error && (
                <div className="bg-red-500/20 border border-red-500 text-red-400 px-4 py-3 rounded">
                  {error}
                </div>
              )}
              {success && (
                <div className="bg-green-500/20 border border-green-500 text-green-400 px-4 py-3 rounded">
                  {success}
                </div>
              )}
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Agence *
                </label>
                <select
                  name="agencyId"
                  defaultValue={editingBooking?.agencyId}
                  required
                  className="w-full px-4 py-2 bg-[#1D1F23] border border-gray-600 rounded-lg text-white"
                >
                  <option value="">Sélectionner...</option>
                  {availableAgencies?.map((agency: any) => (
                    <option key={agency.id} value={agency.id}>
                      {agency.name}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Client *
                </label>
                <select
                  name="clientId"
                  defaultValue={editingBooking?.clientId}
                  required
                  className="w-full px-4 py-2 bg-[#1D1F23] border border-gray-600 rounded-lg text-white"
                >
                  <option value="">Sélectionner...</option>
                  {clients?.map((client: any) => (
                    <option key={client.id} value={client.id}>
                      {client.name}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Véhicule *
                </label>
                <select
                  name="vehicleId"
                  defaultValue={editingBooking?.vehicleId}
                  required
                  className="w-full px-4 py-2 bg-[#1D1F23] border border-gray-600 rounded-lg text-white"
                >
                  <option value="">Sélectionner...</option>
                  {vehicles
                    ?.filter((v: any) => v.status === 'AVAILABLE' || v.id === editingBooking?.vehicleId)
                    .map((vehicle: any) => (
                      <option key={vehicle.id} value={vehicle.id}>
                        {vehicle.brand} {vehicle.model} ({vehicle.registrationNumber}) - {vehicle.dailyRate}€/jour
                      </option>
                    ))}
                </select>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Date et heure de début *
                  </label>
                  <input
                    type="datetime-local"
                    name="startDate"
                    defaultValue={
                      editingBooking
                        ? new Date(editingBooking.startDate).toISOString().slice(0, 16)
                        : ''
                    }
                    required
                    className="w-full px-4 py-2 bg-[#1D1F23] border border-gray-600 rounded-lg text-white"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Date et heure de fin *
                  </label>
                  <input
                    type="datetime-local"
                    name="endDate"
                    defaultValue={
                      editingBooking
                        ? new Date(editingBooking.endDate).toISOString().slice(0, 16)
                        : ''
                    }
                    required
                    className="w-full px-4 py-2 bg-[#1D1F23] border border-gray-600 rounded-lg text-white"
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Statut
                </label>
                <select
                  name="status"
                  defaultValue={editingBooking?.status || 'PENDING'}
                  className="w-full px-4 py-2 bg-[#1D1F23] border border-gray-600 rounded-lg text-white"
                >
                  <option value="PENDING">En attente</option>
                  <option value="CONFIRMED">Confirmée</option>
                  <option value="ACTIVE">Active</option>
                  <option value="COMPLETED">Terminée</option>
                  <option value="CANCELLED">Annulée</option>
                </select>
              </div>
              </div>
              <div className="p-6 pt-4 border-t border-gray-700 bg-[#2C2F36] flex gap-3">
                <button
                  type="button"
                  onClick={() => {
                    setShowModal(false);
                    setEditingBooking(null);
                    setError('');
                    setSuccess('');
                  }}
                  className="flex-1 px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors"
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  disabled={createMutation.isPending || updateMutation.isPending}
                  className="flex-1 px-4 py-2 bg-[#3E7BFA] text-white rounded-lg hover:bg-[#2E6BEA] disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  {createMutation.isPending || updateMutation.isPending
                    ? 'En cours...'
                    : editingBooking
                    ? 'Modifier'
                    : 'Créer'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}






