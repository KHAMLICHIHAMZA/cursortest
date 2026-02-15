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

export default function NewVehiclePage() {
  const router = useRouter();
  const [selectedVehicle, setSelectedVehicle] = useState<VehicleSuggestion | null>(null);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [uploadedImageUrl, setUploadedImageUrl] = useState<string | null>(null);

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
    mutationFn: (data: CreateVehicleFormData) => vehicleApi.create(data),
    onSuccess: () => {
      toast.success('Véhicule créé avec succès');
      setTimeout(() => {
        router.push('/agency/vehicles');
      }, 1000);
    },
    onError: (error: any) => {
      if (error.response) {
        const message = error.response.data?.message || 
                       error.response.data?.error ||
                       `Erreur serveur (${error.response.status})`;
        toast.error(message);
      } else if (error.request) {
        toast.error('Aucune réponse du serveur. Vérifiez votre connexion.');
      } else {
        toast.error(error.message || 'Erreur inconnue lors de la création');
      }
    },
  });

  const handleVehicleSelect = (vehicle: VehicleSuggestion) => {
    setSelectedVehicle(vehicle);
    setValue('brand', vehicle.brand, { shouldValidate: true });
    setValue('model', vehicle.model, { shouldValidate: true });
    if (vehicle.years && vehicle.years.length >= 2) {
      const avgYear = Math.round((vehicle.years[0] + vehicle.years[1]) / 2);
      setValue('year', avgYear);
    }
    if (vehicle.horsepower && vehicle.horsepower.length >= 2) {
      const avgHorsepower = Math.round((vehicle.horsepower[0] + vehicle.horsepower[1]) / 2);
      setValue('horsepower', avgHorsepower);
    }
    if (vehicle.fuel && vehicle.fuel.length === 1) {
      setValue('fuel', vehicle.fuel[0]);
    }
    if (vehicle.gearbox && vehicle.gearbox.length === 1) {
      setValue('gearbox', vehicle.gearbox[0]);
    }
    trigger(['brand', 'model']);
  };

  const handleImageChange = async (file: File | null, previewUrl?: string) => {
    setImageFile(file);
    setImagePreview(previewUrl || null);

    if (file) {
      try {
        const result = await uploadImageMutation.mutateAsync(file);
        setUploadedImageUrl(result.imageUrl);
        setValue('imageUrl', result.imageUrl, { shouldValidate: true });
        toast.success('Image uploadée avec succès');
      } catch (error: any) {
        const errorMessage = error.response?.data?.message || 
                           error.message || 
                           'Erreur lors de l\'upload de l\'image';
        toast.error(errorMessage);
        setImageFile(null);
        setImagePreview(null);
        setUploadedImageUrl(null);
        setValue('imageUrl', undefined);
      }
    } else {
      setUploadedImageUrl(null);
      setValue('imageUrl', undefined);
    }
  };

  const onSubmit = async (data: CreateVehicleFormData) => {
    if (uploadImageMutation.isPending) {
      toast.error('Veuillez attendre la fin de l\'upload de l\'image');
      return;
    }

    if (imageFile && !uploadedImageUrl && !uploadImageMutation.isError && !uploadImageMutation.isSuccess) {
      toast.error('Veuillez attendre la fin de l\'upload de l\'image');
      return;
    }

    if (imageFile && uploadImageMutation.isError) {
      const shouldContinue = window.confirm(
        'L\'upload de l\'image a échoué.\n\nVoulez-vous continuer sans image ?'
      );
      if (!shouldContinue) return;
    }
    
    const submitData = {
      ...data,
      imageUrl: uploadedImageUrl || undefined,
    };
    
    if (submitData.imageUrl === '') {
      submitData.imageUrl = undefined;
    }

    createMutation.mutate(submitData);
  };

  return (
    <RouteGuard allowedRoles={['SUPER_ADMIN', 'COMPANY_ADMIN', 'AGENCY_MANAGER']}>
      <MainLayout>
        <FormCard
          title="Nouveau véhicule"
          description="Ajoutez un nouveau véhicule à votre flotte"
          backHref="/agency/vehicles"
          onSubmit={handleSubmit(onSubmit)}
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
          
          {errors.brand && <p className="text-red-500 text-sm mt-1">{errors.brand.message}</p>}
          {errors.model && <p className="text-red-500 text-sm mt-1">{errors.model.message}</p>}

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
      </MainLayout>
    </RouteGuard>
  );
}
