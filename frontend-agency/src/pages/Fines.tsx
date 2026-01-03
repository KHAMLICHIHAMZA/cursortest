import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '../lib/axios';
import { Plus, Edit, Trash2 } from 'lucide-react';
import { getStoredUser } from '../lib/auth';
import ImageUpload from '../components/ImageUpload';
import { getImageUrl } from '../lib/utils/image-url';

export default function Fines() {
  const [showModal, setShowModal] = useState(false);
  const [editingFine, setEditingFine] = useState<any>(null);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [uploadedImageUrl, setUploadedImageUrl] = useState<string | null>(null);
  const queryClient = useQueryClient();
  const user = getStoredUser();

  const { data: fines, isLoading } = useQuery({
    queryKey: ['fines'],
    queryFn: async () => {
      const res = await api.get('/fines');
      return res.data;
    },
  });

  const { data: bookings } = useQuery({
    queryKey: ['bookings'],
    queryFn: async () => {
      const res = await api.get('/bookings');
      return res.data;
    },
  });

  const createMutation = useMutation({
    mutationFn: (data: any) => api.post('/fines', data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['fines'] });
      setShowModal(false);
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: any }) =>
      api.put(`/fines/${id}`, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['fines'] });
      setShowModal(false);
      setEditingFine(null);
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => api.delete(`/fines/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['fines'] });
    },
  });

  const uploadAttachmentMutation = useMutation({
    mutationFn: async (file: File) => {
      const formData = new FormData();
      formData.append('attachment', file);
      const res = await api.post('/fines/upload-attachment', formData, {
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
        const result = await uploadAttachmentMutation.mutateAsync(file);
        setUploadedImageUrl(result.attachmentUrl);
      } catch (error: any) {
        alert(`Erreur upload: ${error.response?.data?.message || error.message || 'Erreur lors de l\'upload de la pièce jointe'}`);
        setImageFile(null);
        setImagePreview(null);
        setUploadedImageUrl(null);
      }
    } else {
      setUploadedImageUrl(null);
    }
  };

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const data: any = {
      agencyId: formData.get('agencyId'),
      bookingId: formData.get('bookingId'),
      amount: formData.get('amount'),
      description: formData.get('description'),
      number: formData.get('number') || undefined,
      location: formData.get('location') || undefined,
    };

    // Ajouter l'URL de la pièce jointe si elle a été uploadée
    if (uploadedImageUrl) {
      data.attachmentUrl = uploadedImageUrl;
    } else if (editingFine?.attachmentUrl) {
      // Conserver la pièce jointe existante si aucune nouvelle n'a été uploadée
      data.attachmentUrl = editingFine.attachmentUrl;
    }

    if (editingFine) {
      updateMutation.mutate({ id: editingFine.id, data });
    } else {
      createMutation.mutate(data);
    }
  };

  if (isLoading) return <div className="text-center py-8">Chargement...</div>;

  return (
    <div>
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold">Amendes</h1>
        <button
          onClick={() => {
            setEditingFine(null);
            setImageFile(null);
            setImagePreview(null);
            setUploadedImageUrl(null);
            setShowModal(true);
          }}
          className="bg-[#3E7BFA] text-white px-4 py-2 rounded-lg flex items-center gap-2 hover:bg-[#2E6BEA] transition-colors"
        >
          <Plus size={20} />
          Nouvelle amende
        </button>
      </div>

      <div className="bg-[#2C2F36] rounded-lg border border-gray-700 overflow-hidden">
        <table className="w-full">
          <thead className="bg-[#1D1F23]">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase">
                Location
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase">
                Description
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase">
                Montant
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase">
                Date
              </th>
              {user?.role !== 'AGENT' && (
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-400 uppercase">
                  Actions
                </th>
              )}
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-700">
            {fines?.map((fine: any) => (
              <tr key={fine.id} className="hover:bg-[#1D1F23]">
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="text-sm font-medium text-white">
                    {fine.booking?.client?.name} - {fine.booking?.vehicle?.brand}{' '}
                    {fine.booking?.vehicle?.model}
                  </div>
                </td>
                <td className="px-6 py-4 text-sm text-gray-400">
                  {fine.description}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-white">
                  {fine.amount}€
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-400">
                  {new Date(fine.createdAt).toLocaleDateString()}
                </td>
                {user?.role !== 'AGENT' && (
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                    <div className="flex justify-end gap-2">
                    <button
                      onClick={() => {
                        setEditingFine(fine);
                        setImagePreview(fine.attachmentUrl ? getImageUrl(fine.attachmentUrl) || null : null);
                        setUploadedImageUrl(fine.attachmentUrl || null);
                        setShowModal(true);
                      }}
                      className="text-[#3E7BFA] hover:text-[#2E6BEA]"
                    >
                      <Edit size={18} />
                    </button>
                      <button
                        onClick={() => {
                          if (confirm('Supprimer cette amende ?')) {
                            deleteMutation.mutate(fine.id);
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
                {editingFine ? 'Modifier' : 'Nouvelle'} amende
              </h2>
            </div>
            <form onSubmit={handleSubmit} className="flex flex-col flex-1 min-h-0">
              <div className="flex-1 overflow-y-auto p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Location *
                </label>
                <select
                  name="bookingId"
                  defaultValue={editingFine?.bookingId}
                  required
                  className="w-full px-4 py-2 bg-[#1D1F23] border border-gray-600 rounded-lg text-white"
                >
                  <option value="">Sélectionner...</option>
                  {bookings?.map((booking: any) => (
                    <option key={booking.id} value={booking.id}>
                      {booking.client?.name} - {booking.vehicle?.brand}{' '}
                      {booking.vehicle?.model}
                    </option>
                  ))}
                </select>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Numéro
                  </label>
                  <input
                    type="text"
                    name="number"
                    defaultValue={editingFine?.number}
                    className="w-full px-4 py-2 bg-[#1D1F23] border border-gray-600 rounded-lg text-white"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Lieu
                  </label>
                  <input
                    type="text"
                    name="location"
                    defaultValue={editingFine?.location}
                    className="w-full px-4 py-2 bg-[#1D1F23] border border-gray-600 rounded-lg text-white"
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Montant (€) *
                </label>
                <input
                  type="number"
                  step="0.01"
                  name="amount"
                  defaultValue={editingFine?.amount}
                  required
                  className="w-full px-4 py-2 bg-[#1D1F23] border border-gray-600 rounded-lg text-white"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Description *
                </label>
                <textarea
                  name="description"
                  defaultValue={editingFine?.description}
                  required
                  rows={3}
                  className="w-full px-4 py-2 bg-[#1D1F23] border border-gray-600 rounded-lg text-white"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Pièce jointe
                </label>
                <ImageUpload
                  value={imagePreview || (editingFine?.attachmentUrl ? getImageUrl(editingFine.attachmentUrl) || undefined : undefined)}
                  onChange={handleImageChange}
                  disabled={uploadAttachmentMutation.isPending}
                  label="Pièce jointe (image ou PDF)"
                />
                {uploadAttachmentMutation.isPending && (
                  <p className="text-sm text-gray-400 mt-2">Upload de la pièce jointe en cours...</p>
                )}
              </div>
              <input type="hidden" name="agencyId" value={editingFine?.agencyId || bookings?.[0]?.agencyId} />
              </div>
              <div className="p-6 pt-4 border-t border-gray-700 bg-[#2C2F36] flex gap-3">
                <button
                  type="button"
                  onClick={() => {
                    setShowModal(false);
                    setEditingFine(null);
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
                    : editingFine
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






