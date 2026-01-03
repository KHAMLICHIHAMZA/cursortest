import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '../lib/axios';
import { Plus, Edit, Trash2, User } from 'lucide-react';
import { getStoredUser } from '../lib/auth';
import { getImageUrl } from '../lib/utils/image-url';
import ImageUpload from '../components/ImageUpload';
import CountryAutocomplete from '../components/CountryAutocomplete';

export default function Clients() {
  const [showModal, setShowModal] = useState(false);
  const [editingClient, setEditingClient] = useState<any>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [uploadedImageUrl, setUploadedImageUrl] = useState<string | null>(null);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  
  // États pour les données du formulaire
  const [isMoroccan, setIsMoroccan] = useState(true);
  const [countryOfOrigin, setCountryOfOrigin] = useState('');
  const [licenseNumber, setLicenseNumber] = useState('');
  const [licenseExpiryDate, setLicenseExpiryDate] = useState('');
  const [licenseType, setLicenseType] = useState('');
  const [isForeignLicense, setIsForeignLicense] = useState(false);
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [dateOfBirth, setDateOfBirth] = useState('');
  const [address, setAddress] = useState('');
  
  const queryClient = useQueryClient();
  const user = getStoredUser();

  const { data: clients, isLoading } = useQuery({
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
    mutationFn: (data: any) => {
      console.log('Données envoyées:', data);
      return api.post('/clients', data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['clients'] });
      setShowModal(false);
      resetForm();
      setError('');
      setSuccess('Client créé avec succès');
      setTimeout(() => setSuccess(''), 3000);
    },
    onError: (error: any) => {
      console.error('Erreur complète:', error);
      console.error('Réponse erreur:', error.response?.data);
      const errorMessage = error.response?.data?.message || 
                          error.response?.data?.error || 
                          (Array.isArray(error.response?.data?.message) 
                            ? error.response.data.message.join(', ') 
                            : error.response?.data?.message) ||
                          error.message || 
                          'Erreur lors de la création du client';
      setError(errorMessage);
      setSuccess('');
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: any }) =>
      api.patch(`/clients/${id}`, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['clients'] });
      setShowModal(false);
      setEditingClient(null);
      resetForm();
      setError('');
      setSuccess('Client modifié avec succès');
      setTimeout(() => setSuccess(''), 3000);
    },
    onError: (error: any) => {
      const errorMessage = error.response?.data?.message || error.message || 'Erreur lors de la modification du client';
      setError(errorMessage);
      setSuccess('');
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => api.delete(`/clients/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['clients'] });
    },
  });

  const uploadImageMutation = useMutation({
    mutationFn: async (file: File) => {
      const formData = new FormData();
      formData.append('image', file);
      const res = await api.post('/clients/upload-license', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });
      return res.data;
    },
  });

  const analyzeLicenseMutation = useMutation({
    mutationFn: async (file: File) => {
      const formData = new FormData();
      formData.append('image', file);
      const res = await api.post('/clients/analyze-license', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });
      return res.data;
    },
  });

  const handleImageChange = async (file: File | null, previewUrl?: string) => {
    setImagePreview(previewUrl || null);
    setError('');

    if (file) {
      try {
        // D'abord uploader l'image
        const uploadResult = await uploadImageMutation.mutateAsync(file);
        setUploadedImageUrl(uploadResult.imageUrl);

        // Ensuite analyser le permis
        try {
          const analysisResult = await analyzeLicenseMutation.mutateAsync(file);
          
          // Remplir automatiquement les champs avec les données extraites
          if (analysisResult.extractedData) {
            if (analysisResult.extractedData.name) {
              const nameParts = analysisResult.extractedData.name.split(' ');
              if (nameParts.length > 0) {
                setFirstName(nameParts[0] || '');
                setLastName(nameParts.slice(1).join(' ') || '');
              }
            }
            if (analysisResult.extractedData.dateOfBirth) {
              setDateOfBirth(analysisResult.extractedData.dateOfBirth);
            }
            if (analysisResult.extractedData.address) {
              setAddress(analysisResult.extractedData.address);
            }
          }

          // Remplir les informations du permis
          if (analysisResult.licenseNumber) {
            setLicenseNumber(analysisResult.licenseNumber);
          }
          if (analysisResult.licenseExpiryDate) {
            setLicenseExpiryDate(analysisResult.licenseExpiryDate);
          }
          if (analysisResult.licenseType) {
            setLicenseType(analysisResult.licenseType);
          }
          
          // Définir si c'est un permis marocain ou étranger
          setIsMoroccan(analysisResult.isMoroccan ?? true);
          setIsForeignLicense(!analysisResult.isMoroccan);

          // Afficher un message selon la validité
          if (analysisResult.isValid) {
            setSuccess(`Permis détecté : ${analysisResult.isMoroccan ? 'Marocain' : 'Étranger'} - ${analysisResult.message} (Confiance: ${(analysisResult.confidence * 100).toFixed(0)}%)`);
            setTimeout(() => setSuccess(''), 5000);
          } else {
            setError(`Attention: ${analysisResult.message}. Vérifiez manuellement le permis.`);
          }
        } catch (analysisError: any) {
          console.error('Erreur lors de l\'analyse:', analysisError);
          // L'upload a réussi mais l'analyse a échoué, on continue quand même
          setError('Image uploadée avec succès, mais l\'analyse automatique a échoué. Veuillez remplir les informations manuellement.');
        }
      } catch (error: any) {
        const errorMessage = error.response?.data?.message || error.message || 'Erreur lors de l\'upload de l\'image';
        setError(`Erreur upload: ${errorMessage}`);
        setImagePreview(null);
        setUploadedImageUrl(null);
      }
    } else {
      setUploadedImageUrl(null);
    }
  };

  const resetForm = () => {
    setImagePreview(null);
    setUploadedImageUrl(null);
    setIsMoroccan(true);
    setCountryOfOrigin('');
    setLicenseNumber('');
    setLicenseExpiryDate('');
    setLicenseType('');
    setIsForeignLicense(false);
    setFirstName('');
    setLastName('');
    setDateOfBirth('');
    setAddress('');
  };

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    
    const formData = new FormData(e.currentTarget);
    
    // Validation côté client
    if (!firstName.trim() || !lastName.trim()) {
      setError('Le prénom et le nom sont obligatoires');
      return;
    }

    if (!licenseNumber.trim()) {
      setError('Le numéro de permis est obligatoire');
      return;
    }

    if (!licenseType.trim()) {
      setError('Le type de permis est obligatoire');
      return;
    }

    if (!isMoroccan && !countryOfOrigin.trim()) {
      setError('Le pays d\'origine est obligatoire pour les clients non marocains');
      return;
    }
    
    // Construire le note avec les informations du permis
    const noteParts = [];
    if (address) noteParts.push(`Adresse: ${address}`);
    if (licenseNumber) noteParts.push(`Permis: ${licenseNumber}`);
    if (licenseType) noteParts.push(`Type permis: ${licenseType}`);
    const note = noteParts.length > 0 ? noteParts.join(', ') : undefined;

    // Nettoyer les valeurs vides
    const cleanValue = (value: any) => {
      if (value === null || value === undefined || value === '') return undefined;
      return value;
    };

    const data: any = {
      agencyId: formData.get('agencyId') as string,
      firstName: (firstName || (formData.get('firstName') as string) || '').trim(),
      lastName: (lastName || (formData.get('lastName') as string) || '').trim(),
      email: cleanValue(formData.get('email')),
      phone: cleanValue(formData.get('phone')),
      address: cleanValue(address || formData.get('address')),
      isMoroccan: isMoroccan,
      countryOfOrigin: cleanValue(countryOfOrigin),
      licenseNumber: (licenseNumber || (formData.get('licenseNumber') as string) || '').trim(),
      licenseExpiryDate: cleanValue(licenseExpiryDate || formData.get('licenseExpiryDate')),
      isForeignLicense: isForeignLicense,
      dateOfBirth: cleanValue(dateOfBirth || formData.get('dateOfBirth')),
      note: cleanValue(note),
    };

    // Ajouter l'URL de l'image du permis si elle a été uploadée
    if (uploadedImageUrl) {
      data.licenseImageUrl = uploadedImageUrl;
    } else if (editingClient?.licenseImageUrl) {
      data.licenseImageUrl = editingClient.licenseImageUrl;
    }

    if (editingClient) {
      updateMutation.mutate({ id: editingClient.id, data });
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
        <h1 className="text-3xl font-bold">Clients</h1>
        <button
          onClick={() => {
            setEditingClient(null);
            resetForm();
            setError('');
            setSuccess('');
            setShowModal(true);
          }}
          className="bg-[#3E7BFA] text-white px-4 py-2 rounded-lg flex items-center gap-2 hover:bg-[#2E6BEA] transition-colors"
        >
          <Plus size={20} />
          Nouveau client
        </button>
      </div>

      {success && (
        <div className="mb-4 bg-green-500/20 border border-green-500 text-green-400 px-4 py-3 rounded">
          {success}
        </div>
      )}

      <div className="bg-[#2C2F36] rounded-lg border border-gray-700 overflow-x-auto">
        <table className="w-full min-w-[1400px]">
          <thead className="bg-[#1D1F23]">
            <tr>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase">
                Photo permis
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase">
                Agence
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase">
                Prénom
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase">
                Nom
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase">
                Email
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase">
                Téléphone
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase">
                Date naissance
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase">
                Adresse
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase">
                Nationalité
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase">
                N° Permis
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase">
                Type permis
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase">
                Exp. Permis
              </th>
              {user?.role !== 'AGENT' && (
                <th className="px-4 py-3 text-right text-xs font-medium text-gray-400 uppercase">
                  Actions
                </th>
              )}
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-700">
            {clients?.map((client: any) => {
              const nameParts = client.name ? client.name.split(' ') : [];
              const firstName = client.firstName || nameParts[0] || '';
              const lastName = client.lastName || nameParts.slice(1).join(' ') || '';
              const address = client.address || (client.note?.includes('Adresse:') 
                ? client.note.split('Adresse:')[1]?.split(',')[0]?.trim() 
                : undefined);
              // Extraire le type de permis depuis le champ note
              const licenseTypeMatch = client.note?.match(/Type permis:\s*([A-Z]+(?:\s+[A-Z]+)?)/i);
              const licenseType = licenseTypeMatch ? licenseTypeMatch[1].trim() : undefined;
              
              return (
                <tr key={client.id} className="hover:bg-[#1D1F23]">
                  <td className="px-4 py-4 whitespace-nowrap">
                    {client.licenseImageUrl ? (
                      <img
                        src={getImageUrl(client.licenseImageUrl) || ''}
                        alt={`Permis de ${client.name}`}
                        className="w-16 h-16 object-cover rounded-lg"
                      />
                    ) : (
                      <div className="w-16 h-16 bg-gray-700 rounded-lg flex items-center justify-center">
                        <User className="w-8 h-8 text-gray-500" />
                      </div>
                    )}
                  </td>
                  <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-400">
                    {client.agency?.name || '-'}
                  </td>
                  <td className="px-4 py-4 whitespace-nowrap">
                    <div className="text-sm font-medium text-white">
                      {firstName || '-'}
                    </div>
                  </td>
                  <td className="px-4 py-4 whitespace-nowrap">
                    <div className="text-sm font-medium text-white">
                      {lastName || '-'}
                    </div>
                  </td>
                  <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-400">
                    {client.email || '-'}
                  </td>
                  <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-400">
                    {client.phone || '-'}
                  </td>
                  <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-400">
                    {client.dateOfBirth ? new Date(client.dateOfBirth).toLocaleDateString('fr-FR') : '-'}
                  </td>
                  <td className="px-4 py-4 text-sm text-gray-400 max-w-xs truncate" title={address}>
                    {address || '-'}
                  </td>
                  <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-400">
                    {client.isMoroccan ? 'Marocain' : (client.countryOfOrigin || '-')}
                  </td>
                  <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-400">
                    {client.licenseNumber || '-'}
                  </td>
                  <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-400">
                    {licenseType || '-'}
                  </td>
                  <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-400">
                    {client.licenseExpiryDate ? new Date(client.licenseExpiryDate).toLocaleDateString('fr-FR') : '-'}
                  </td>
                  {user?.role !== 'AGENT' && (
                    <td className="px-4 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <div className="flex justify-end gap-2">
                        <button
                          onClick={() => {
                            setEditingClient(client);
                            setImagePreview(client.licenseImageUrl ? getImageUrl(client.licenseImageUrl) || null : null);
                            setUploadedImageUrl(client.licenseImageUrl || null);
                            setIsMoroccan(client.isMoroccan ?? true);
                            setCountryOfOrigin(client.countryOfOrigin || '');
                            setLicenseNumber(client.licenseNumber || '');
                            setLicenseExpiryDate(client.licenseExpiryDate ? new Date(client.licenseExpiryDate).toISOString().split('T')[0] : '');
                            setIsForeignLicense(client.isForeignLicense ?? false);
                            setFirstName(firstName);
                            setLastName(lastName);
                            setDateOfBirth(client.dateOfBirth ? new Date(client.dateOfBirth).toISOString().split('T')[0] : '');
                            setAddress(address || '');
                            setLicenseType(licenseType || '');
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
                            if (confirm('Supprimer ce client ?')) {
                              deleteMutation.mutate(client.id);
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
              );
            })}
          </tbody>
        </table>
      </div>

      {showModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-[#2C2F36] rounded-lg w-full max-w-2xl max-h-[90vh] flex flex-col border border-gray-700 shadow-xl">
            <div className="p-6 pb-4 border-b border-gray-700">
              <h2 className="text-xl font-bold">
                {editingClient ? 'Modifier' : 'Nouveau'} client
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
                value={imagePreview || (editingClient?.licenseImageUrl ? getImageUrl(editingClient.licenseImageUrl) || undefined : undefined)}
                onChange={handleImageChange}
                disabled={uploadImageMutation.isPending || analyzeLicenseMutation.isPending}
                label="Photo du permis de conduite"
              />
              {(uploadImageMutation.isPending || analyzeLicenseMutation.isPending) && (
                <p className="text-sm text-gray-400">
                  {uploadImageMutation.isPending ? 'Upload de l\'image en cours...' : 'Analyse du permis en cours...'}
                </p>
              )}

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Agence *
                </label>
                <select
                  name="agencyId"
                  defaultValue={editingClient?.agencyId}
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

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Prénom *
                  </label>
                  <input
                    type="text"
                    name="firstName"
                    value={firstName}
                    onChange={(e) => setFirstName(e.target.value)}
                    required
                    className="w-full px-4 py-2 bg-[#1D1F23] border border-gray-600 rounded-lg text-white"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Nom *
                  </label>
                  <input
                    type="text"
                    name="lastName"
                    value={lastName}
                    onChange={(e) => setLastName(e.target.value)}
                    required
                    className="w-full px-4 py-2 bg-[#1D1F23] border border-gray-600 rounded-lg text-white"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Email
                  </label>
                  <input
                    type="email"
                    name="email"
                    defaultValue={editingClient?.email}
                    className="w-full px-4 py-2 bg-[#1D1F23] border border-gray-600 rounded-lg text-white"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Téléphone
                  </label>
                  <input
                    type="text"
                    name="phone"
                    defaultValue={editingClient?.phone}
                    className="w-full px-4 py-2 bg-[#1D1F23] border border-gray-600 rounded-lg text-white"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Date de naissance
                </label>
                <input
                  type="date"
                  name="dateOfBirth"
                  value={dateOfBirth}
                  onChange={(e) => setDateOfBirth(e.target.value)}
                  className="w-full px-4 py-2 bg-[#1D1F23] border border-gray-600 rounded-lg text-white"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Adresse
                </label>
                <textarea
                  name="address"
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  rows={2}
                  className="w-full px-4 py-2 bg-[#1D1F23] border border-gray-600 rounded-lg text-white"
                />
              </div>

              <div className="border-t border-gray-600 pt-4">
                <h3 className="text-lg font-semibold mb-4">Nationalité</h3>
                <div className="space-y-4">
                  <div>
                    <label className="flex items-center gap-2 mb-2">
                      <input
                        type="checkbox"
                        checked={isMoroccan}
                        onChange={(e) => {
                          setIsMoroccan(e.target.checked);
                          if (e.target.checked) {
                            setCountryOfOrigin('');
                          }
                        }}
                        className="w-4 h-4"
                      />
                      <span className="text-sm font-medium text-gray-300">Client marocain</span>
                    </label>
                  </div>
                  {!isMoroccan && (
                    <div>
                      <label className="block text-sm font-medium text-gray-300 mb-2">
                        Pays d'origine *
                      </label>
                      <CountryAutocomplete
                        value={countryOfOrigin}
                        onChange={setCountryOfOrigin}
                        placeholder="Sélectionner le pays d'origine"
                      />
                    </div>
                  )}
                </div>
              </div>

              <div className="border-t border-gray-600 pt-4">
                <h3 className="text-lg font-semibold mb-4">Informations du permis</h3>
                <div className="space-y-4">
                  <div>
                    <label className="flex items-center gap-2 mb-2">
                      <input
                        type="checkbox"
                        checked={isForeignLicense}
                        onChange={(e) => setIsForeignLicense(e.target.checked)}
                        className="w-4 h-4"
                      />
                      <span className="text-sm font-medium text-gray-300">Permis étranger</span>
                    </label>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-300 mb-2">
                        Numéro de permis *
                      </label>
                      <input
                        type="text"
                        name="licenseNumber"
                        value={licenseNumber}
                        onChange={(e) => setLicenseNumber(e.target.value)}
                        required
                        className="w-full px-4 py-2 bg-[#1D1F23] border border-gray-600 rounded-lg text-white"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-300 mb-2">
                        Type de permis *
                      </label>
                      <select
                        name="licenseType"
                        value={licenseType}
                        onChange={(e) => setLicenseType(e.target.value)}
                        required
                        className="w-full px-4 py-2 bg-[#1D1F23] border border-gray-600 rounded-lg text-white"
                      >
                        <option value="">Sélectionner...</option>
                        <option value="A">A - Moto</option>
                        <option value="B">B - Voiture</option>
                        <option value="C">C - Camion</option>
                        <option value="D">D - Bus</option>
                        <option value="BE">BE - Voiture + remorque</option>
                        <option value="CE">CE - Camion + remorque</option>
                        <option value="DE">DE - Bus + remorque</option>
                      </select>
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">
                      Date d'expiration
                    </label>
                    <input
                      type="date"
                      name="licenseExpiryDate"
                      value={licenseExpiryDate}
                      onChange={(e) => setLicenseExpiryDate(e.target.value)}
                      className="w-full px-4 py-2 bg-[#1D1F23] border border-gray-600 rounded-lg text-white"
                    />
                    {licenseExpiryDate && (() => {
                      const expiryDate = new Date(licenseExpiryDate);
                      const today = new Date();
                      today.setHours(0, 0, 0, 0);
                      expiryDate.setHours(0, 0, 0, 0);
                      return expiryDate < today;
                    })() && (
                      <div className="mt-2 bg-yellow-500/20 border border-yellow-500 text-yellow-400 px-3 py-2 rounded text-sm flex items-center gap-2">
                        <span>⚠️</span>
                        <span>Attention : La date de validité du permis est dépassée</span>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              </div>
              <div className="p-6 pt-4 border-t border-gray-700 bg-[#2C2F36] flex gap-3">
                <button
                  type="button"
                  onClick={() => {
                    setShowModal(false);
                    setEditingClient(null);
                    resetForm();
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
                    : editingClient
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
