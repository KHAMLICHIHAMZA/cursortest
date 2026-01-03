import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '../lib/axios';
import { Plus, Edit, Trash2 } from 'lucide-react';
import { getStoredUser } from '../lib/auth';
import ImageUpload from '../components/ImageUpload';
import { getImageUrl } from '../lib/utils/image-url';

export default function Maintenance() {
  const [showModal, setShowModal] = useState(false);
  const [editingMaintenance, setEditingMaintenance] = useState<any>(null);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [uploadedImageUrl, setUploadedImageUrl] = useState<string | null>(null);
  const queryClient = useQueryClient();
  const user = getStoredUser();

  const { data: maintenance, isLoading } = useQuery({
    queryKey: ['maintenance'],
    queryFn: async () => {
      const res = await api.get('/maintenance');
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

  const createMutation = useMutation({
    mutationFn: (data: any) => api.post('/maintenance', data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['maintenance', 'vehicles', 'planning'] });
      setShowModal(false);
      setImageFile(null);
      setImagePreview(null);
      setUploadedImageUrl(null);
    },
    onError: (error: any) => {
      const errorMessage = error.response?.data?.message || error.message || 'Erreur lors de la création de la maintenance';
      alert(errorMessage);
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: any }) =>
      api.put(`/maintenance/${id}`, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['maintenance', 'vehicles', 'planning'] });
      setShowModal(false);
      setEditingMaintenance(null);
      setImageFile(null);
      setImagePreview(null);
      setUploadedImageUrl(null);
    },
    onError: (error: any) => {
      const errorMessage = error.response?.data?.message || error.message || 'Erreur lors de la modification de la maintenance';
      alert(errorMessage);
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => api.delete(`/maintenance/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['maintenance', 'vehicles'] });
    },
  });

  const uploadDocumentMutation = useMutation({
    mutationFn: async (file: File) => {
      const formData = new FormData();
      formData.append('document', file);
      const res = await api.post('/maintenance/upload-document', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });
      return res.data;
    },
  });

  const handleImageChange = async (file: File | null, previewUrl?: string) => {
    setImageFile(file);
    setImagePreview(previewUrl || null);

    if (file) {
      try {
        const result = await uploadDocumentMutation.mutateAsync(file);
        setUploadedImageUrl(result.documentUrl);
      } catch (error: any) {
        alert(`Erreur upload: ${error.response?.data?.message || error.message || 'Erreur lors de l\'upload du document'}`);
        setImageFile(null);
        setImagePreview(null);
        setUploadedImageUrl(null);
      }
    } else {
      setUploadedImageUrl(null);
    }
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    
    const formData = new FormData(e.currentTarget);
    const vehicleId = formData.get('vehicleId') as string;
    const plannedAtInput = formData.get('plannedAt') as string;
    const status = formData.get('status') as string;

    // Convertir datetime-local en ISO string pour le backend
    const plannedAt = plannedAtInput ? new Date(plannedAtInput).toISOString() : null;

    // Validation : vérifier qu'il n'y a pas de location en cours si la maintenance est IN_PROGRESS ou PLANNED
    if (status === 'IN_PROGRESS' || status === 'PLANNED') {
      try {
        const maintenanceStart = plannedAt ? new Date(plannedAt) : new Date();
        const maintenanceEnd = new Date(maintenanceStart);
        maintenanceEnd.setHours(maintenanceEnd.getHours() + 4); // +4h pour maintenance
        
        const availabilityRes = await api.post('/planning/check-availability', {
          vehicleId,
          startDate: maintenanceStart.toISOString(),
          endDate: maintenanceEnd.toISOString(),
        });

        if (!availabilityRes.data.available) {
          const conflicts = availabilityRes.data.conflicts || [];
          const bookingConflict = conflicts.find((c: any) => c.type === 'booking');
          if (bookingConflict) {
            setError('Le véhicule a une location en cours ou prévue à cette période. Impossible de planifier une maintenance.');
            return;
          }
          setError('Le véhicule n\'est pas disponible à cette période.');
          return;
        }
      } catch (error: any) {
        // Si l'endpoint retourne une erreur, on affiche un message mais on continue
        const errorMessage = error.response?.data?.message || 'Erreur lors de la vérification de disponibilité';
        console.warn('Erreur lors de la vérification de disponibilité:', errorMessage);
        // On continue quand même, le backend vérifiera aussi
      }
    }

    const data: any = {
      agencyId: formData.get('agencyId'),
      vehicleId,
      description: formData.get('description'),
      plannedAt: plannedAt,
      cost: formData.get('cost') || null,
      status,
    };

    // Ajouter l'URL du document si il a été uploadé
    if (uploadedImageUrl) {
      data.documentUrl = uploadedImageUrl;
    } else if (editingMaintenance?.documentUrl) {
      // Conserver le document existant si aucun nouveau n'a été uploadé
      data.documentUrl = editingMaintenance.documentUrl;
    }

    if (editingMaintenance) {
      updateMutation.mutate({ id: editingMaintenance.id, data });
    } else {
      createMutation.mutate(data);
    }
  };

  if (isLoading) return <div className="text-center py-8">Chargement...</div>;

  return (
    <div>
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold">Maintenance</h1>
        {user?.role !== 'AGENT' && (
          <button
            onClick={() => {
              setEditingMaintenance(null);
              setImageFile(null);
              setImagePreview(null);
              setUploadedImageUrl(null);
              setShowModal(true);
            }}
            className="bg-[#3E7BFA] text-white px-4 py-2 rounded-lg flex items-center gap-2 hover:bg-[#2E6BEA] transition-colors"
          >
            <Plus size={20} />
            Nouvelle maintenance
          </button>
        )}
      </div>

      <div className="bg-[#2C2F36] rounded-lg border border-gray-700 overflow-hidden">
        <table className="w-full">
          <thead className="bg-[#1D1F23]">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase">
                Véhicule
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase">
                Description
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase">
                Date prévue
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase">
                Coût
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase">
                Statut
              </th>
              {user?.role !== 'AGENT' && (
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-400 uppercase">
                  Actions
                </th>
              )}
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-700">
            {maintenance?.map((m: any) => (
              <tr key={m.id} className="hover:bg-[#1D1F23]">
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="text-sm font-medium text-white">
                    {m.vehicle?.brand} {m.vehicle?.model} ({m.vehicle?.registrationNumber})
                  </div>
                </td>
                <td className="px-6 py-4 text-sm text-gray-400">
                  {m.description}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-400">
                  {m.plannedAt
                    ? new Date(m.plannedAt).toLocaleString('fr-FR', {
                        day: '2-digit',
                        month: '2-digit',
                        year: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit'
                      })
                    : '-'}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-400">
                  {m.cost ? `${m.cost}€` : '-'}
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <span
                    className={`px-2 py-1 text-xs font-medium rounded-full ${
                      m.status === 'COMPLETED'
                        ? 'bg-green-500/20 text-green-400'
                        : m.status === 'IN_PROGRESS'
                        ? 'bg-red-500/20 text-red-400'
                        : 'bg-yellow-500/20 text-yellow-400'
                    }`}
                  >
                    {m.status}
                  </span>
                </td>
                {user?.role !== 'AGENT' && (
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                    <div className="flex justify-end gap-2">
                      <button
                        onClick={() => {
                          setEditingMaintenance(m);
                          setImagePreview(m.documentUrl ? getImageUrl(m.documentUrl) || null : null);
                          setUploadedImageUrl(m.documentUrl || null);
                          setShowModal(true);
                        }}
                        className="text-[#3E7BFA] hover:text-[#2E6BEA]"
                      >
                        <Edit size={18} />
                      </button>
                      <button
                        onClick={() => {
                          if (confirm('Supprimer cette maintenance ?')) {
                            deleteMutation.mutate(m.id);
                          }
                        }}
                        className="text-red-400 hover:text-red-300"
                      >
                        <Trash2 size={18} />
                      </button>
                    </div>
                  </td>
                )}
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
                {editingMaintenance ? 'Modifier' : 'Nouvelle'} maintenance
              </h2>
            </div>
            <form onSubmit={handleSubmit} className="flex flex-col flex-1 min-h-0">
              <div className="flex-1 overflow-y-auto p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Véhicule *
                </label>
                <select
                  name="vehicleId"
                  defaultValue={editingMaintenance?.vehicleId}
                  required
                  className="w-full px-4 py-2 bg-[#1D1F23] border border-gray-600 rounded-lg text-white"
                >
                  <option value="">Sélectionner...</option>
                  {vehicles?.map((vehicle: any) => (
                    <option key={vehicle.id} value={vehicle.id}>
                      {vehicle.brand} {vehicle.model} ({vehicle.registrationNumber})
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Description *
                </label>
                <textarea
                  name="description"
                  defaultValue={editingMaintenance?.description}
                  required
                  rows={3}
                  className="w-full px-4 py-2 bg-[#1D1F23] border border-gray-600 rounded-lg text-white"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Date et heure prévue
                </label>
                <input
                  type="datetime-local"
                  name="plannedAt"
                  defaultValue={
                    editingMaintenance?.plannedAt
                      ? new Date(editingMaintenance.plannedAt)
                          .toISOString()
                          .slice(0, 16)
                      : ''
                  }
                  className="w-full px-4 py-2 bg-[#1D1F23] border border-gray-600 rounded-lg text-white"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Coût (€)
                </label>
                <input
                  type="number"
                  step="0.01"
                  name="cost"
                  defaultValue={editingMaintenance?.cost}
                  className="w-full px-4 py-2 bg-[#1D1F23] border border-gray-600 rounded-lg text-white"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Statut
                </label>
                <select
                  name="status"
                  defaultValue={editingMaintenance?.status || 'PLANNED'}
                  className="w-full px-4 py-2 bg-[#1D1F23] border border-gray-600 rounded-lg text-white"
                >
                  <option value="PLANNED">Planifiée</option>
                  <option value="IN_PROGRESS">En cours</option>
                  <option value="COMPLETED">Terminée</option>
                  <option value="CANCELLED">Annulée</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Facture / Devis
                </label>
                <ImageUpload
                  value={imagePreview || (editingMaintenance?.documentUrl ? getImageUrl(editingMaintenance.documentUrl) || undefined : undefined)}
                  onChange={handleImageChange}
                  disabled={uploadDocumentMutation.isPending}
                  label="Pièce jointe (facture ou devis)"
                />
                {uploadDocumentMutation.isPending && (
                  <p className="text-sm text-gray-400 mt-2">Upload du document en cours...</p>
                )}
              </div>
              <input type="hidden" name="agencyId" value={editingMaintenance?.agencyId || vehicles?.[0]?.agencyId} />
              </div>
              <div className="p-6 pt-4 border-t border-gray-700 bg-[#2C2F36] flex gap-3">
                <button
                  type="button"
                  onClick={() => {
                    setShowModal(false);
                    setEditingMaintenance(null);
                    setImageFile(null);
                    setImagePreview(null);
                    setUploadedImageUrl(null);
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
                    : editingMaintenance
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






