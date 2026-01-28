'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useMutation, useQuery } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { vehicleApi } from '@/lib/api/vehicle';
import { createVehicleSchema, CreateVehicleFormData } from '@/lib/validations/vehicle';
import { agencyApi } from '@/lib/api/agency';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select } from '@/components/ui/select';
import { VehicleAutocomplete, VehicleSuggestion } from '@/components/ui/vehicle-autocomplete';
import { ImageUpload } from '@/components/ui/image-upload';
import { ColorAutocomplete } from '@/components/ui/color-autocomplete';
import { FormCard } from '@/components/ui/form-card';
import { MainLayout } from '@/components/layout/main-layout';
import { RouteGuard } from '@/components/auth/route-guard';
import { toast } from '@/components/ui/toast';
import Cookies from 'js-cookie';
import { getImageUrl } from '@/lib/utils/image-url';
import { DebugPanel } from '@/components/ui/debug-panel';

export default function NewVehiclePage() {
  const router = useRouter();
  const [selectedVehicle, setSelectedVehicle] = useState<VehicleSuggestion | null>(null);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [uploadedImageUrl, setUploadedImageUrl] = useState<string | null>(null);
  const [showDebugPanel, setShowDebugPanel] = useState(false);
  const [debugData, setDebugData] = useState<any>(null);

  // Vérifier le token au chargement
  useEffect(() => {
    const token = Cookies.get('accessToken');
    if (!token) {
      console.error('No access token found in cookies');
      toast.error('Session expirée. Veuillez vous reconnecter.');
      router.push('/login');
    } else {
      console.log('Access token found:', token.substring(0, 20) + '...');
    }
  }, [router]);

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    trigger,
    formState: { errors, isSubmitting },
  } = useForm<CreateVehicleFormData>({
    resolver: zodResolver(createVehicleSchema),
    defaultValues: {
      brand: '',
      model: '',
      registrationNumber: '',
      agencyId: '',
      year: undefined,
      color: '',
      dailyRate: undefined,
      status: 'AVAILABLE',
      horsepower: undefined,
    },
  });

  const { data: agencies, error: agenciesError } = useQuery({
    queryKey: ['agencies'],
    queryFn: () => agencyApi.getAll(),
    retry: 1,
  });

  useEffect(() => {
    if (!agenciesError) return;
    const error: any = agenciesError;
    console.error('Error fetching agencies:', error);
    if (error?.response?.status === 401) {
      toast.error('Session expirée. Veuillez vous reconnecter.');
    } else {
      toast.error('Erreur lors du chargement des agences');
    }
  }, [agenciesError]);

  const uploadImageMutation = useMutation({
    mutationFn: (file: File) => vehicleApi.uploadImage(file),
  });

  const createMutation = useMutation({
    mutationFn: (data: CreateVehicleFormData) => {
      console.log('=== CREATE MUTATION CALLED ===');
      console.log('Data to send:', JSON.stringify(data, null, 2));
      
      // Mettre à jour le panneau de débogage
      setDebugData((prev: any) => ({
        ...(prev || {}),
        mutationCalled: true,
        dataSent: data,
        mutationTimestamp: new Date().toISOString(),
      }));
      
      return vehicleApi.create(data);
    },
    onSuccess: (response) => {
      console.log('=== CREATE MUTATION SUCCESS ===');
      console.log('Response:', response);
      
      // Mettre à jour le panneau de débogage
      setDebugData((prev: any) => ({
        ...(prev || {}),
        success: true,
        response,
        successTimestamp: new Date().toISOString(),
      }));
      
      toast.success('Véhicule créé avec succès');
      setTimeout(() => {
        router.push('/agency/vehicles');
      }, 1000);
    },
    onError: (error: any) => {
      console.error('=== CREATE MUTATION ERROR ===');
      console.error('Error object:', error);
      console.error('Error message:', error.message);
      console.error('Error response:', error.response);
      
      // Mettre à jour le panneau de débogage
      setDebugData((prev: any) => ({
        ...(prev || {}),
        error: true,
        errorDetails: {
          message: error.message,
          response: error.response?.data,
          status: error.response?.status,
          statusText: error.response?.statusText,
        },
        errorTimestamp: new Date().toISOString(),
      }));
      
      if (error.response) {
        console.error('Response status:', error.response.status);
        console.error('Response data:', error.response.data);
        console.error('Response headers:', error.response.headers);
        
        const message = error.response.data?.message || 
                       error.response.data?.error ||
                       `Erreur serveur: ${error.response.status} ${error.response.statusText}`;
        toast.error(`Erreur création: ${message}`);
      } else if (error.request) {
        console.error('No response received');
        toast.error('Aucune réponse du serveur. Vérifiez votre connexion.');
      } else {
        console.error('Request setup error:', error.message);
        toast.error(`Erreur: ${error.message}`);
      }
    },
  });

  const handleVehicleSelect = (vehicle: VehicleSuggestion) => {
    setSelectedVehicle(vehicle);
    setValue('brand', vehicle.brand, { shouldValidate: true });
    setValue('model', vehicle.model, { shouldValidate: true });
    // Pré-remplir l'année avec la moyenne des années disponibles
    if (vehicle.years && vehicle.years.length >= 2) {
      const avgYear = Math.round((vehicle.years[0] + vehicle.years[1]) / 2);
      setValue('year', avgYear);
    }
    // Pré-remplir la puissance avec la moyenne
    if (vehicle.horsepower && vehicle.horsepower.length >= 2) {
      const avgHorsepower = Math.round((vehicle.horsepower[0] + vehicle.horsepower[1]) / 2);
      setValue('horsepower', avgHorsepower);
    }
    // Pré-remplir le carburant si un seul type
    if (vehicle.fuel && vehicle.fuel.length === 1) {
      setValue('fuel', vehicle.fuel[0]);
    }
    // Pré-remplir la boîte si un seul type
    if (vehicle.gearbox && vehicle.gearbox.length === 1) {
      setValue('gearbox', vehicle.gearbox[0]);
    }
    // Déclencher la validation
    trigger(['brand', 'model']);
  };

  const handleImageChange = async (file: File | null, previewUrl?: string) => {
    console.log('=== HANDLE IMAGE CHANGE ===');
    console.log('File:', file ? { name: file.name, type: file.type, size: file.size } : null);
    console.log('Preview URL:', previewUrl ? 'present' : 'none');
    
    setImageFile(file);
    setImagePreview(previewUrl || null);

    if (file) {
      try {
        console.log('Starting image upload mutation...');
        console.log('Upload mutation state:', {
          isPending: uploadImageMutation.isPending,
          isError: uploadImageMutation.isError,
          isSuccess: uploadImageMutation.isSuccess,
        });
        
        const result = await uploadImageMutation.mutateAsync(file);
        
        console.log('=== IMAGE UPLOAD SUCCESS IN HANDLER ===');
        console.log('Result:', result);
        console.log('Image URL:', result.imageUrl);
        
        setUploadedImageUrl(result.imageUrl);
        setValue('imageUrl', result.imageUrl, { shouldValidate: true });
        
        console.log('Form imageUrl updated:', result.imageUrl);
        toast.success('Image uploadée avec succès');
      } catch (error: any) {
        console.error('=== IMAGE UPLOAD ERROR IN HANDLER ===');
        console.error('Error object:', error);
        console.error('Error message:', error.message);
        console.error('Error stack:', error.stack);
        
        if (error.response) {
          console.error('Response status:', error.response.status);
          console.error('Response data:', error.response.data);
        }
        
        const errorMessage = error.message || 
                           error.response?.data?.message || 
                           error.response?.data?.error ||
                           'Erreur lors de l\'upload de l\'image';
        
        console.error('Displaying error to user:', errorMessage);
        toast.error(`Erreur upload: ${errorMessage}`);
        
        // Réinitialiser l'état en cas d'erreur
        setImageFile(null);
        setImagePreview(null);
        setUploadedImageUrl(null);
        setValue('imageUrl', undefined);
        
        // Réinitialiser l'input file
        const fileInput = document.querySelector('input[type="file"]') as HTMLInputElement;
        if (fileInput) {
          fileInput.value = '';
        }
      }
    } else {
      console.log('No file, resetting image state');
      setUploadedImageUrl(null);
      setValue('imageUrl', undefined);
    }
  };

  const onSubmit = async (data: CreateVehicleFormData) => {
    console.log('=== FORM SUBMISSION START ===');
    console.log('Form data:', JSON.stringify(data, null, 2));
    console.log('Uploaded image URL:', uploadedImageUrl);
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

    // Si une image a été sélectionnée mais l'upload n'est pas terminé (ni réussi ni échoué)
    if (imageFile && !uploadedImageUrl && !uploadImageMutation.isError && !uploadImageMutation.isSuccess) {
      console.warn('Image selected but upload not completed');
      toast.error('Veuillez attendre la fin de l\'upload de l\'image');
      return;
    }

    // Si l'upload a échoué, informer l'utilisateur mais permettre la soumission sans image
    if (imageFile && uploadImageMutation.isError) {
      console.warn('Image upload failed, asking user to continue');
      const errorMessage = uploadImageMutation.error?.message || 'Erreur inconnue';
      const shouldContinue = window.confirm(
        `L'upload de l'image a échoué: ${errorMessage}\n\nVoulez-vous continuer sans image ?`
      );
      if (!shouldContinue) {
        console.log('User chose not to continue without image');
        return;
      }
      console.log('User chose to continue without image');
    }
    
    try {
      // S'assurer que l'imageUrl est inclus si uploadée, sinon undefined
      const submitData = {
        ...data,
        imageUrl: uploadedImageUrl || undefined,
      };
      
      // Nettoyer les valeurs vides
      if (submitData.imageUrl === '') {
        submitData.imageUrl = undefined;
      }
      
      console.log('=== SUBMITTING DATA ===');
      console.log('Submit data:', JSON.stringify(submitData, null, 2));
      
      // Validation supplémentaire
      const missingFields = [];
      if (!submitData.brand) missingFields.push('marque');
      if (!submitData.model) missingFields.push('modèle');
      if (!submitData.registrationNumber) missingFields.push('numéro d\'immatriculation');
      if (!submitData.agencyId) missingFields.push('agence');
      
      if (missingFields.length > 0) {
        const errorMsg = `Champs obligatoires manquants: ${missingFields.join(', ')}`;
        console.error('Validation error:', errorMsg);
        toast.error(errorMsg);
        return;
      }
      
      console.log('All validations passed, calling createMutation...');
      
      // Préparer les données de débogage
      const debugInfo = {
        timestamp: new Date().toISOString(),
        formData: data,
        submitData,
        imageState: {
          imageFile: imageFile ? { name: imageFile.name, size: imageFile.size, type: imageFile.type } : null,
          imagePreview: imagePreview ? 'present' : null,
          uploadedImageUrl,
          uploadMutationState: {
            isPending: uploadImageMutation.isPending,
            isError: uploadImageMutation.isError,
            isSuccess: uploadImageMutation.isSuccess,
            error: uploadImageMutation.error,
          },
        },
        formState: {
          errors,
          isSubmitting,
        },
      };
      
      setDebugData(debugInfo);
      console.log('Debug info prepared:', debugInfo);
      
      // Afficher le panneau de débogage si une image est présente
      if (uploadedImageUrl || imageFile) {
        setShowDebugPanel(true);
      }
      
      createMutation.mutate(submitData);
    } catch (error: any) {
      console.error('=== SUBMISSION ERROR ===');
      console.error('Error:', error);
      console.error('Error message:', error.message);
      console.error('Error stack:', error.stack);
      toast.error(`Erreur lors de la création: ${error.message || 'Erreur inconnue'}`);
    }
  };

  const handleFormSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    console.log('Form submit event triggered');
    handleSubmit(onSubmit)(e);
  };

  return (
    <RouteGuard allowedRoles={['SUPER_ADMIN', 'COMPANY_ADMIN', 'AGENCY_MANAGER']}>
      <MainLayout>
        <FormCard
          title="Nouveau véhicule"
          description="Ajoutez un nouveau véhicule à votre flotte"
          backHref="/agency/vehicles"
          onSubmit={handleFormSubmit}
          isLoading={isSubmitting || createMutation.isPending || uploadImageMutation.isPending}
          submitLabel="Créer le véhicule"
        >
          <div>
            <label htmlFor="agencyId" className="block text-sm font-medium text-text mb-2">
              Agence *
            </label>
            <Select
              id="agencyId"
              {...register('agencyId')}
              disabled={!agencies || agencies.length === 0}
            >
              <option value="">
                {agenciesError ? 'Erreur de chargement' : agencies?.length === 0 ? 'Aucune agence disponible' : 'Sélectionner une agence'}
              </option>
              {agencies?.map((agency) => (
                <option key={agency.id} value={agency.id}>
                  {agency.name}
                </option>
              ))}
            </Select>
            {errors.agencyId && <p className="text-red-500 text-sm mt-1">{errors.agencyId.message}</p>}
            {agenciesError && (
              <p className="text-red-500 text-sm mt-1">
                Impossible de charger les agences. Veuillez rafraîchir la page.
              </p>
            )}
          </div>

          {/* Autocomplétion Marque/Modèle */}
          <VehicleAutocomplete
            onSelect={handleVehicleSelect}
            selectedVehicle={selectedVehicle}
          />
          
          {/* Affichage des erreurs pour brand et model */}
          {errors.brand && <p className="text-red-500 text-sm mt-1">{errors.brand.message}</p>}
          {errors.model && <p className="text-red-500 text-sm mt-1">{errors.model.message}</p>}

          {/* Champs pré-remplis mais modifiables */}
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

          {/* Upload d'image */}
          <ImageUpload
            value={imagePreview || (uploadedImageUrl ? getImageUrl(uploadedImageUrl) : undefined)}
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
        
        {/* Boutons de test et débogage */}
        <div className="fixed bottom-4 right-4 z-40 flex flex-col gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              const currentData = watch();
              const debugInfo = {
                timestamp: new Date().toISOString(),
                formData: currentData,
                imageState: {
                  imageFile: imageFile ? { name: imageFile.name, size: imageFile.size, type: imageFile.type } : null,
                  uploadedImageUrl,
                  uploadMutationState: {
                    isPending: uploadImageMutation.isPending,
                    isError: uploadImageMutation.isError,
                    isSuccess: uploadImageMutation.isSuccess,
                  },
                },
                formErrors: errors,
                canSubmit: !isSubmitting && !uploadImageMutation.isPending,
                validationChecks: {
                  hasBrand: !!currentData.brand,
                  hasModel: !!currentData.model,
                  hasRegistration: !!currentData.registrationNumber,
                  hasAgency: !!currentData.agencyId,
                  imageUploaded: !!uploadedImageUrl,
                  imageUploadSuccess: uploadImageMutation.isSuccess,
                },
              };
              setDebugData(debugInfo);
              setShowDebugPanel(true);
            }}
            className="bg-primary/10 hover:bg-primary/20"
          >
            🐛 Debug
          </Button>
          
          <Button
            variant="outline"
            size="sm"
            onClick={async () => {
              console.log('=== TEST MANUAL SUBMIT ===');
              const currentData = watch();
              console.log('Current form data:', currentData);
              console.log('Uploaded image URL:', uploadedImageUrl);
              console.log('Upload mutation state:', {
                isPending: uploadImageMutation.isPending,
                isError: uploadImageMutation.isError,
                isSuccess: uploadImageMutation.isSuccess,
              });
              
              // Forcer la soumission manuellement
              const submitData = {
                ...currentData,
                imageUrl: uploadedImageUrl || undefined,
              };
              
              console.log('Manual submit data:', submitData);
              
              // Appeler directement la mutation
              try {
                createMutation.mutate(submitData);
              } catch (error) {
                console.error('Manual submit error:', error);
                toast.error('Erreur lors de la soumission manuelle');
              }
            }}
            className="bg-green-500/10 hover:bg-green-500/20 text-green-600"
            disabled={isSubmitting || createMutation.isPending}
          >
            ⚡ Test Submit
          </Button>
        </div>
        
        {/* Panneau de débogage */}
        {showDebugPanel && debugData && (
          <DebugPanel
            data={debugData}
            title="Debug - Création Véhicule"
            onClose={() => setShowDebugPanel(false)}
          />
        )}
      </MainLayout>
    </RouteGuard>
  );
}
