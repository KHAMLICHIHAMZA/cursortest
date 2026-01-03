'use client';

import { useEffect, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { vehicleApi, Vehicle } from '@/lib/api/vehicle';
import { updateVehicleSchema, UpdateVehicleFormData } from '@/lib/validations/vehicle';
import { agencyApi } from '@/lib/api/agency';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select } from '@/components/ui/select';
import { ImageUpload } from '@/components/ui/image-upload';
import { ColorAutocomplete } from '@/components/ui/color-autocomplete';
import { FormCard } from '@/components/ui/form-card';
import { LoadingState } from '@/components/ui/loading-state';
import { ErrorState } from '@/components/ui/error-state';
import { MainLayout } from '@/components/layout/main-layout';
import { RouteGuard } from '@/components/auth/route-guard';
import { toast } from '@/components/ui/toast';
import { getImageUrl } from '@/lib/utils/image-url';

export default function EditVehiclePage() {
  const router = useRouter();
  const params = useParams();
  const queryClient = useQueryClient();
  const vehicleId = params.id as string;

  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [uploadedImageUrl, setUploadedImageUrl] = useState<string | null>(null);

  const { data: vehicle, isLoading } = useQuery({
    queryKey: ['vehicle', vehicleId],
    queryFn: () => vehicleApi.getById(vehicleId),
    enabled: !!vehicleId,
  });

  const { data: agencies } = useQuery({
    queryKey: ['agencies'],
    queryFn: () => agencyApi.getAll(),
  });

  const {
    register,
    handleSubmit,
    reset,
    setValue,
    watch,
    formState: { errors, isSubmitting },
  } = useForm<UpdateVehicleFormData>({
    resolver: zodResolver(updateVehicleSchema),
    defaultValues: {
      brand: '',
      model: '',
      registrationNumber: '',
      year: undefined,
      color: '',
      dailyRate: undefined,
      status: 'AVAILABLE',
      imageUrl: undefined,
      horsepower: undefined,
      fuel: '',
      gearbox: '',
    },
  });


  useEffect(() => {
    if (vehicle) {
      reset({
        brand: vehicle.brand || '',
        model: vehicle.model || '',
        registrationNumber: vehicle.registrationNumber || '',
        year: vehicle.year,
        color: vehicle.color || '',
        dailyRate: vehicle.dailyRate,
        status: vehicle.status || 'AVAILABLE',
        imageUrl: vehicle.imageUrl,
        horsepower: vehicle.horsepower,
        fuel: vehicle.fuel || '',
        gearbox: vehicle.gearbox || '',
      });
      
      // Initialiser l'image existante
      if (vehicle.imageUrl) {
        const fullImageUrl = getImageUrl(vehicle.imageUrl);
        if (fullImageUrl) {
          setImagePreview(fullImageUrl);
        }
        setUploadedImageUrl(vehicle.imageUrl);
      }
    }
  }, [vehicle, reset]);

  const uploadImageMutation = useMutation({
    mutationFn: (file: File) => vehicleApi.uploadImage(file),
  });

  const updateMutation = useMutation({
    mutationFn: (data: UpdateVehicleFormData) => {
      console.log('=== UPDATE MUTATION CALLED ===');
      console.log('Vehicle ID:', vehicleId);
      console.log('Data to send:', JSON.stringify(data, null, 2));
      return vehicleApi.update(vehicleId, data);
    },
    onSuccess: (response) => {
      console.log('=== UPDATE MUTATION SUCCESS ===');
      console.log('Response:', response);
      toast.success('Véhicule mis à jour avec succès');
      queryClient.invalidateQueries({ queryKey: ['vehicle', vehicleId] });
      queryClient.invalidateQueries({ queryKey: ['vehicles'] });
      router.push('/agency/vehicles');
    },
    onError: (error: any) => {
      console.error('=== UPDATE MUTATION ERROR ===');
      console.error('Error object:', error);
      console.error('Error message:', error.message);
      console.error('Error response:', error.response);
      
      if (error.response) {
        console.error('Response status:', error.response.status);
        console.error('Response data:', error.response.data);
        
        const message = error.response.data?.message || 
                       error.response.data?.error ||
                       `Erreur serveur: ${error.response.status} ${error.response.statusText}`;
        toast.error(`Erreur mise à jour: ${message}`);
      } else if (error.request) {
        console.error('No response received');
        toast.error('Aucune réponse du serveur. Vérifiez votre connexion.');
      } else {
        console.error('Request setup error:', error.message);
        toast.error(`Erreur: ${error.message}`);
      }
    },
  });

  const handleImageChange = async (file: File | null, previewUrl?: string) => {
    console.log('=== HANDLE IMAGE CHANGE (EDIT) ===');
    console.log('File:', file ? { name: file.name, type: file.type, size: file.size } : null);
    console.log('Preview URL:', previewUrl ? 'present' : 'none');
    
    setImageFile(file);
    setImagePreview(previewUrl || null);

    if (file) {
      try {
        console.log('Starting image upload mutation...');
        const result = await uploadImageMutation.mutateAsync(file);
        
        console.log('=== IMAGE UPLOAD SUCCESS (EDIT) ===');
        console.log('Result:', result);
        setUploadedImageUrl(result.imageUrl);
        setValue('imageUrl', result.imageUrl, { shouldValidate: true });
        toast.success('Image uploadée avec succès');
      } catch (error: any) {
        console.error('=== IMAGE UPLOAD ERROR (EDIT) ===');
        console.error('Error:', error);
        console.error('Error message:', error.message);
        
        if (error.response) {
          console.error('Response status:', error.response.status);
          console.error('Response data:', error.response.data);
        }
        
        const errorMessage = error.message || 
                           error.response?.data?.message || 
                           error.response?.data?.error ||
                           'Erreur lors de l\'upload de l\'image';
        
        toast.error(`Erreur upload: ${errorMessage}`);
        
        // Réinitialiser l'état en cas d'erreur
        setImageFile(null);
        setImagePreview(null);
        setUploadedImageUrl(null);
        setValue('imageUrl', undefined);
      }
    } else {
      console.log('No file, resetting image state');
      setUploadedImageUrl(null);
      setValue('imageUrl', undefined);
    }
  };

  const onSubmit = async (data: UpdateVehicleFormData) => {
    console.log('=== FORM SUBMISSION START (EDIT) ===');
    console.log('Form data:', JSON.stringify(data, null, 2));
    console.log('Uploaded image URL:', uploadedImageUrl);
    console.log('Current vehicle image URL:', vehicle?.imageUrl);
    console.log('Image upload state:', {
      isPending: uploadImageMutation.isPending,
      isError: uploadImageMutation.isError,
      isSuccess: uploadImageMutation.isSuccess,
      error: uploadImageMutation.error,
    });
    console.log('Image file:', imageFile ? { name: imageFile.name, size: imageFile.size } : null);
    
    // Vérifier si un upload est en cours
    if (uploadImageMutation.isPending) {
      console.warn('Upload still pending, blocking submission');
      toast.error('Veuillez attendre la fin de l\'upload de l\'image');
      return;
    }

    // Si une image a été sélectionnée mais l'upload n'est pas terminé
    if (imageFile && !uploadedImageUrl && !uploadImageMutation.isError && !uploadImageMutation.isSuccess) {
      console.warn('Image selected but upload not completed');
      toast.error('Veuillez attendre la fin de l\'upload de l\'image');
      return;
    }

    // Si l'upload a échoué, informer l'utilisateur mais permettre la soumission
    if (imageFile && uploadImageMutation.isError) {
      console.warn('Image upload failed, asking user to continue');
      const errorMessage = uploadImageMutation.error?.message || 'Erreur inconnue';
      const shouldContinue = window.confirm(
        `L'upload de l'image a échoué: ${errorMessage}\n\nVoulez-vous continuer sans modifier l'image ?`
      );
      if (!shouldContinue) {
        console.log('User chose not to continue without image');
        return;
      }
      console.log('User chose to continue without image');
    }
    
    try {
      // S'assurer que l'imageUrl est inclus si uploadée, sinon garder l'existante
      const submitData = {
        ...data,
        imageUrl: uploadedImageUrl !== null ? uploadedImageUrl : (vehicle?.imageUrl || undefined),
      };
      
      // Nettoyer les valeurs vides
      if (submitData.imageUrl === '') {
        submitData.imageUrl = undefined;
      }
      
      console.log('=== SUBMITTING DATA (EDIT) ===');
      console.log('Submit data:', JSON.stringify(submitData, null, 2));
      console.log('Vehicle ID:', vehicleId);
      
      updateMutation.mutate(submitData);
    } catch (error: any) {
      console.error('=== SUBMISSION ERROR (EDIT) ===');
      console.error('Error:', error);
      console.error('Error message:', error.message);
      console.error('Error stack:', error.stack);
      toast.error(`Erreur lors de la mise à jour: ${error.message || 'Erreur inconnue'}`);
    }
  };

  if (isLoading) {
    return (
      <RouteGuard allowedRoles={['SUPER_ADMIN', 'COMPANY_ADMIN', 'AGENCY_MANAGER']}>
        <MainLayout>
          <LoadingState message="Chargement du véhicule..." />
        </MainLayout>
      </RouteGuard>
    );
  }

  if (!vehicle) {
    return (
      <RouteGuard allowedRoles={['SUPER_ADMIN', 'COMPANY_ADMIN', 'AGENCY_MANAGER']}>
        <MainLayout>
          <ErrorState
            title="Véhicule non trouvé"
            message="Le véhicule demandé n'existe pas ou a été supprimé."
            onRetry={() => router.push('/agency/vehicles')}
          />
        </MainLayout>
      </RouteGuard>
    );
  }

  return (
    <RouteGuard allowedRoles={['SUPER_ADMIN', 'COMPANY_ADMIN', 'AGENCY_MANAGER']}>
      <MainLayout>
        <FormCard
          title="Modifier le véhicule"
          description="Mettez à jour les informations du véhicule"
          backHref="/agency/vehicles"
          onSubmit={handleSubmit(onSubmit)}
          isLoading={isSubmitting || updateMutation.isPending || uploadImageMutation.isPending}
          submitLabel="Enregistrer"
        >
            <div>
              <label htmlFor="agencyId" className="block text-sm font-medium text-text mb-2">
                Agence
              </label>
              <Select
                id="agencyId"
                value={vehicle.agencyId}
                disabled
              >
                {agencies?.map((agency) => (
                  <option key={agency.id} value={agency.id}>
                    {agency.name}
                  </option>
                ))}
              </Select>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label htmlFor="brand" className="block text-sm font-medium text-text mb-2">
                  Marque *
                </label>
                <Input
                  id="brand"
                  {...register('brand')}
                  placeholder="Ex: Peugeot"
                />
                {errors.brand && <p className="text-red-500 text-sm mt-1">{errors.brand.message}</p>}
              </div>

              <div>
                <label htmlFor="model" className="block text-sm font-medium text-text mb-2">
                  Modèle *
                </label>
                <Input
                  id="model"
                  {...register('model')}
                  placeholder="Ex: 208"
                />
                {errors.model && <p className="text-red-500 text-sm mt-1">{errors.model.message}</p>}
              </div>
            </div>

            <div>
              <label htmlFor="registrationNumber" className="block text-sm font-medium text-text mb-2">
                Numéro d'immatriculation *
              </label>
              <Input
                id="registrationNumber"
                {...register('registrationNumber')}
                placeholder="Ex: 12345-A-67"
              />
              {errors.registrationNumber && <p className="text-red-500 text-sm mt-1">{errors.registrationNumber.message}</p>}
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label htmlFor="year" className="block text-sm font-medium text-text mb-2">
                  Année
                </label>
                <Input
                  id="year"
                  type="number"
                  {...register('year', { valueAsNumber: true })}
                  placeholder="2020"
                />
                {errors.year && <p className="text-red-500 text-sm mt-1">{errors.year.message}</p>}
              </div>

              <div>
                <label htmlFor="color" className="block text-sm font-medium text-text mb-2">
                  Couleur
                </label>
                <ColorAutocomplete
                  id="color"
                  value={watch('color') || ''}
                  onChange={(value) => {
                    setValue('color', value, { shouldValidate: true });
                  }}
                  placeholder="Rechercher une couleur (ex: Blanc, Noir...)"
                />
                {errors.color && <p className="text-red-500 text-sm mt-1">{errors.color.message}</p>}
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label htmlFor="horsepower" className="block text-sm font-medium text-text mb-2">
                  Puissance (CV)
                </label>
                <Input
                  id="horsepower"
                  type="number"
                  {...register('horsepower', { valueAsNumber: true })}
                  placeholder="100"
                />
                {errors.horsepower && <p className="text-red-500 text-sm mt-1">{errors.horsepower.message}</p>}
              </div>

              <div>
                <label htmlFor="dailyRate" className="block text-sm font-medium text-text mb-2">
                  Tarif journalier (MAD)
                </label>
                <Input
                  id="dailyRate"
                  type="number"
                  step="0.01"
                  {...register('dailyRate', { valueAsNumber: true })}
                  placeholder="500"
                />
                {errors.dailyRate && <p className="text-red-500 text-sm mt-1">{errors.dailyRate.message}</p>}
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label htmlFor="fuel" className="block text-sm font-medium text-text mb-2">
                  Carburant
                </label>
                <Select
                  id="fuel"
                  {...register('fuel')}
                >
                  <option value="">Sélectionner</option>
                  <option value="Essence">Essence</option>
                  <option value="Diesel">Diesel</option>
                  <option value="Hybride">Hybride</option>
                  <option value="Électrique">Électrique</option>
                </Select>
                {errors.fuel && <p className="text-red-500 text-sm mt-1">{errors.fuel.message}</p>}
              </div>

              <div>
                <label htmlFor="gearbox" className="block text-sm font-medium text-text mb-2">
                  Boîte de vitesses
                </label>
                <Select
                  id="gearbox"
                  {...register('gearbox')}
                >
                  <option value="">Sélectionner</option>
                  <option value="Manuelle">Manuelle</option>
                  <option value="Automatique">Automatique</option>
                </Select>
                {errors.gearbox && <p className="text-red-500 text-sm mt-1">{errors.gearbox.message}</p>}
              </div>
            </div>

            {/* Upload d'image */}
            <ImageUpload
              value={imagePreview || (uploadedImageUrl ? getImageUrl(uploadedImageUrl) : getImageUrl(vehicle?.imageUrl) || undefined)}
              onChange={handleImageChange}
              disabled={uploadImageMutation.isPending}
            />
            {uploadImageMutation.isPending && (
              <p className="text-sm text-text-muted">Upload de l'image en cours...</p>
            )}
            {uploadImageMutation.isError && (
              <p className="text-sm text-red-500">Erreur lors de l'upload. Veuillez réessayer.</p>
            )}

            <div>
              <label htmlFor="status" className="block text-sm font-medium text-text mb-2">
                Statut
              </label>
              <Select
                id="status"
                {...register('status')}
              >
                <option value="AVAILABLE">Disponible</option>
                <option value="RENTED">Loué</option>
                <option value="MAINTENANCE">En maintenance</option>
                <option value="UNAVAILABLE">Indisponible</option>
              </Select>
              {errors.status && <p className="text-red-500 text-sm mt-1">{errors.status.message}</p>}
            </div>
        </FormCard>
      </MainLayout>
    </RouteGuard>
  );
}
