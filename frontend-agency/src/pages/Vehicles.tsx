import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '../lib/axios';
import { Plus, Edit, Trash2, Car } from 'lucide-react';
import { getStoredUser } from '../lib/auth';
import { getImageUrl } from '../lib/utils/image-url';
import ImageUpload from '../components/ImageUpload';
import ColorAutocomplete from '../components/ColorAutocomplete';

export default function Vehicles() {
  const [showModal, setShowModal] = useState(false);
  const [editingVehicle, setEditingVehicle] = useState<any>(null);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [uploadedImageUrl, setUploadedImageUrl] = useState<string | null>(null);
  const [color, setColor] = useState<string>(editingVehicle?.color || '');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const queryClient = useQueryClient();
  const user = getStoredUser();

  const { data: vehicles, isLoading } = useQuery({
    queryKey: ['vehicles'],
    queryFn: async () => {
      const res = await api.get('/vehicles');
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
    mutationFn: (data: any) => api.post('/vehicles', data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['vehicles'] });
      setShowModal(false);
      setError('');
      setSuccess('Véhicule créé avec succès');
      setTimeout(() => setSuccess(''), 3000);
    },
    onError: (error: any) => {
      const errorMessage = error.response?.data?.message || error.message || 'Erreur lors de la création du véhicule';
      setError(errorMessage);
      setSuccess('');
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: any }) =>
      api.put(`/vehicles/${id}`, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['vehicles'] });
      setShowModal(false);
      setEditingVehicle(null);
      setError('');
      setSuccess('Véhicule modifié avec succès');
      setTimeout(() => setSuccess(''), 3000);
    },
    onError: (error: any) => {
      const errorMessage = error.response?.data?.message || error.message || 'Erreur lors de la modification du véhicule';
      setError(errorMessage);
      setSuccess('');
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => api.delete(`/vehicles/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['vehicles'] });
    },
  });

  const uploadImageMutation = useMutation({
    mutationFn: async (file: File) => {
      const formData = new FormData();
      formData.append('image', file);
      const res = await api.post('/vehicles/upload-image', formData, {
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
        const result = await uploadImageMutation.mutateAsync(file);
        setUploadedImageUrl(result.imageUrl);
      } catch (error: any) {
        alert(`Erreur upload: ${error.response?.data?.message || error.message || 'Erreur lors de l\'upload de l\'image'}`);
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
    setError('');
    setSuccess('');
    
    const formData = new FormData(e.currentTarget);
    const registrationNumber = formData.get('registrationNumber') as string;
    const serviceDate = formData.get('serviceDate') as string;
    
    // Validation côté client
    if (!registrationNumber || !registrationNumber.trim()) {
      setError('L\'immatriculation est obligatoire');
      return;
    }

    // Extraire l'année de la date de mise en service
    let year: number | undefined;
    if (serviceDate) {
      year = new Date(serviceDate).getFullYear();
    } else if (formData.get('year')) {
      year = parseInt(formData.get('year') as string);
    }
    
    const data: any = {
      agencyId: formData.get('agencyId'),
      registrationNumber: registrationNumber.trim(),
      brand: formData.get('brand'),
      model: formData.get('model'),
      year: year || new Date().getFullYear(),
      color: color || undefined,
      mileage: formData.get('mileage'),
      fuel: formData.get('fuel') || undefined,
      gearbox: formData.get('gearbox') || undefined,
      dailyRate: formData.get('dailyRate'),
      depositAmount: formData.get('depositAmount'),
      status: formData.get('status'),
    };

    // Ajouter l'URL de l'image si elle a été uploadée
    if (uploadedImageUrl) {
      data.imageUrl = uploadedImageUrl;
    } else if (editingVehicle?.imageUrl) {
      // Conserver l'image existante si aucune nouvelle n'a été uploadée
      data.imageUrl = editingVehicle.imageUrl;
    }

    if (editingVehicle) {
      updateMutation.mutate({ id: editingVehicle.id, data });
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
        <h1 className="text-3xl font-bold">Véhicules</h1>
        {user?.role !== 'AGENT' && (
        <button
          onClick={() => {
            setEditingVehicle(null);
            setImageFile(null);
            setImagePreview(null);
            setUploadedImageUrl(null);
            setColor('');
            setShowModal(true);
          }}
          className="bg-[#3E7BFA] text-white px-4 py-2 rounded-lg flex items-center gap-2 hover:bg-[#2E6BEA] transition-colors"
        >
          <Plus size={20} />
          Nouveau véhicule
        </button>
        )}
      </div>

      <div className="bg-[#2C2F36] rounded-lg border border-gray-700 overflow-x-auto">
        <table className="w-full min-w-[1200px]">
          <thead className="bg-[#1D1F23]">
            <tr>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase">
                Photo
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase">
                Agence
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase">
                Immatriculation
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase">
                Marque / Modèle
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase">
                Année
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase">
                Couleur
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase">
                Kilométrage
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase">
                Carburant
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase">
                Boîte
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase">
                Prix/jour
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase">
                Caution
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase">
                Statut
              </th>
              {user?.role !== 'AGENT' && (
                <th className="px-4 py-3 text-right text-xs font-medium text-gray-400 uppercase">
                  Actions
                </th>
              )}
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-700">
            {vehicles?.map((vehicle: any) => (
              <tr key={vehicle.id} className="hover:bg-[#1D1F23]">
                <td className="px-4 py-4 whitespace-nowrap">
                  {vehicle.imageUrl ? (
                    <img
                      src={getImageUrl(vehicle.imageUrl) || ''}
                      alt={`${vehicle.brand} ${vehicle.model}`}
                      className="w-16 h-16 object-cover rounded-lg"
                    />
                  ) : (
                    <div className="w-16 h-16 bg-gray-700 rounded-lg flex items-center justify-center">
                      <Car className="w-8 h-8 text-gray-500" />
                    </div>
                  )}
                </td>
                <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-400">
                  {vehicle.agency?.name || '-'}
                </td>
                <td className="px-4 py-4 whitespace-nowrap">
                  <div className="text-sm font-medium text-white">
                    {vehicle.registrationNumber}
                  </div>
                </td>
                <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-400">
                  {vehicle.brand} {vehicle.model}
                </td>
                <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-400">
                  {vehicle.year || '-'}
                </td>
                <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-400">
                  {vehicle.color || '-'}
                </td>
                <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-400">
                  {vehicle.mileage ? `${vehicle.mileage.toLocaleString()} km` : '-'}
                </td>
                <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-400">
                  {vehicle.fuel || '-'}
                </td>
                <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-400">
                  {vehicle.gearbox || '-'}
                </td>
                <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-400">
                  {vehicle.dailyRate ? `${vehicle.dailyRate}€` : '-'}
                </td>
                <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-400">
                  {vehicle.depositAmount ? `${vehicle.depositAmount}€` : '-'}
                </td>
                <td className="px-4 py-4 whitespace-nowrap">
                  <span
                    className={`px-2 py-1 text-xs font-medium rounded-full ${
                      vehicle.status === 'AVAILABLE'
                        ? 'bg-green-500/20 text-green-400'
                        : vehicle.status === 'RENTED'
                        ? 'bg-blue-500/20 text-blue-400'
                        : vehicle.status === 'MAINTENANCE'
                        ? 'bg-red-500/20 text-red-400'
                        : 'bg-gray-500/20 text-gray-400'
                    }`}
                  >
                    {vehicle.status === 'AVAILABLE' ? 'Disponible' : 
                     vehicle.status === 'RENTED' ? 'En location' :
                     vehicle.status === 'MAINTENANCE' ? 'Maintenance' : 'Indisponible'}
                  </span>
                </td>
                {user?.role !== 'AGENT' && (
                  <td className="px-4 py-4 whitespace-nowrap text-right text-sm font-medium">
                    <div className="flex justify-end gap-2">
                      <button
                        onClick={() => {
                          setEditingVehicle(vehicle);
                          setImagePreview(vehicle.imageUrl ? getImageUrl(vehicle.imageUrl) || null : null);
                          setUploadedImageUrl(vehicle.imageUrl || null);
                          setColor(vehicle.color || '');
                          setError('');
                          setSuccess('');
                          setShowModal(true);
                        }}
                        className="text-[#3E7BFA] hover:text-[#2E6BEA]"
                      >
                        <Edit size={18} />
                      </button>
                      <button
                        onClick={() => {
                          if (confirm('Supprimer ce véhicule ?')) {
                            deleteMutation.mutate(vehicle.id);
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
          <div className="bg-[#2C2F36] rounded-lg w-full max-w-2xl max-h-[90vh] flex flex-col border border-gray-700 shadow-xl">
            <div className="p-6 pb-4 border-b border-gray-700">
              <h2 className="text-xl font-bold">
                {editingVehicle ? 'Modifier' : 'Nouveau'} véhicule
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
              <ImageUpload
                value={imagePreview || (editingVehicle?.imageUrl ? getImageUrl(editingVehicle.imageUrl) || undefined : undefined)}
                onChange={handleImageChange}
                disabled={uploadImageMutation.isPending}
                label="Photo du véhicule"
              />
              {uploadImageMutation.isPending && (
                <p className="text-sm text-gray-400">Upload de l'image en cours...</p>
              )}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Agence *
                  </label>
                  <select
                    name="agencyId"
                    defaultValue={editingVehicle?.agencyId}
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
                    Immatriculation *
                  </label>
                  <input
                    type="text"
                    name="registrationNumber"
                    defaultValue={editingVehicle?.registrationNumber}
                    required
                    className="w-full px-4 py-2 bg-[#1D1F23] border border-gray-600 rounded-lg text-white"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Marque *
                  </label>
                  <input
                    type="text"
                    name="brand"
                    defaultValue={editingVehicle?.brand}
                    required
                    className="w-full px-4 py-2 bg-[#1D1F23] border border-gray-600 rounded-lg text-white"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Modèle *
                  </label>
                  <input
                    type="text"
                    name="model"
                    defaultValue={editingVehicle?.model}
                    required
                    className="w-full px-4 py-2 bg-[#1D1F23] border border-gray-600 rounded-lg text-white"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Date de mise en service *
                  </label>
                  <input
                    type="date"
                    name="serviceDate"
                    defaultValue={editingVehicle?.year ? `${editingVehicle.year}-01-01` : ''}
                    required
                    className="w-full px-4 py-2 bg-[#1D1F23] border border-gray-600 rounded-lg text-white"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Couleur
                  </label>
                  <ColorAutocomplete
                    value={color}
                    onChange={(value) => setColor(value)}
                    placeholder="Rechercher une couleur (ex: Blanc, Noir...)"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Kilométrage
                  </label>
                  <input
                    type="number"
                    name="mileage"
                    defaultValue={editingVehicle?.mileage}
                    className="w-full px-4 py-2 bg-[#1D1F23] border border-gray-600 rounded-lg text-white"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Carburant
                  </label>
                  <select
                    name="fuel"
                    defaultValue={editingVehicle?.fuel || ''}
                    className="w-full px-4 py-2 bg-[#1D1F23] border border-gray-600 rounded-lg text-white"
                  >
                    <option value="">Sélectionner...</option>
                    <option value="Essence">Essence</option>
                    <option value="Diesel">Diesel</option>
                    <option value="Électrique">Électrique</option>
                    <option value="Hybride">Hybride</option>
                    <option value="Hybride rechargeable">Hybride rechargeable</option>
                    <option value="GPL">GPL</option>
                    <option value="GNV">GNV</option>
                    <option value="E85">E85 (Bioéthanol)</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Boîte de vitesse
                  </label>
                  <select
                    name="gearbox"
                    defaultValue={editingVehicle?.gearbox || ''}
                    className="w-full px-4 py-2 bg-[#1D1F23] border border-gray-600 rounded-lg text-white"
                  >
                    <option value="">Sélectionner...</option>
                    <option value="Manuelle">Manuelle</option>
                    <option value="Automatique">Automatique</option>
                    <option value="Séquentielle">Séquentielle</option>
                    <option value="CVT">CVT (Transmission à variation continue)</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Prix/jour (€) *
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    name="dailyRate"
                    defaultValue={editingVehicle?.dailyRate}
                    required
                    className="w-full px-4 py-2 bg-[#1D1F23] border border-gray-600 rounded-lg text-white"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Caution (€) *
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    name="depositAmount"
                    defaultValue={editingVehicle?.depositAmount}
                    required
                    className="w-full px-4 py-2 bg-[#1D1F23] border border-gray-600 rounded-lg text-white"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Statut
                  </label>
                  <select
                    name="status"
                    defaultValue={editingVehicle?.status || 'AVAILABLE'}
                    className="w-full px-4 py-2 bg-[#1D1F23] border border-gray-600 rounded-lg text-white"
                  >
                    <option value="AVAILABLE">Disponible</option>
                    <option value="RENTED">En location</option>
                    <option value="MAINTENANCE">En maintenance</option>
                    <option value="UNAVAILABLE">Indisponible</option>
                  </select>
                </div>
              </div>
              </div>
              <div className="p-6 pt-4 border-t border-gray-700 bg-[#2C2F36] flex gap-3">
                <button
                  type="button"
                  onClick={() => {
                    setShowModal(false);
                    setEditingVehicle(null);
                    setImageFile(null);
                    setImagePreview(null);
                    setUploadedImageUrl(null);
                    setColor('');
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
                    : editingVehicle
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






