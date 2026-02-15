'use client';

import { useState, useEffect, useMemo, useCallback } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { clientApi, Client } from '@/lib/api/client-api';
import { updateClientSchema, UpdateClientFormData } from '@/lib/validations/client';
import { agencyApi } from '@/lib/api/agency';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select } from '@/components/ui/select';
import { ImageUpload } from '@/components/ui/image-upload';
import { FormCard } from '@/components/ui/form-card';
import { LoadingState } from '@/components/ui/loading-state';
import { ErrorState } from '@/components/ui/error-state';
import { MainLayout } from '@/components/layout/main-layout';
import { RouteGuard } from '@/components/auth/route-guard';
import { toast } from '@/components/ui/toast';
import { getImageUrl } from '@/lib/utils/image-url';
import { AlertCircle, Info, CheckCircle2 } from 'lucide-react';
import { COUNTRIES } from '@/lib/utils/countries';
import { Card } from '@/components/ui/card';

export default function EditClientPage() {
  const router = useRouter();
  const params = useParams();
  const queryClient = useQueryClient();
  const clientId = params.id as string;

  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [uploadedImageUrl, setUploadedImageUrl] = useState<string | null>(null);

  // Charger toutes les données nécessaires en une seule fois
  const { data: client, isLoading: isLoadingClient } = useQuery({
    queryKey: ['client', clientId],
    queryFn: () => clientApi.getById(clientId),
    enabled: !!clientId,
    staleTime: 2 * 60 * 1000, // Cache 2 minutes
  });

  const { data: agencies, isLoading: isLoadingAgencies } = useQuery({
    queryKey: ['agencies'],
    queryFn: () => agencyApi.getAll(),
    staleTime: 5 * 60 * 1000, // Cache 5 minutes
  });

  const {
    register,
    handleSubmit,
    reset,
    setValue,
    watch,
    trigger,
    formState: { errors, isSubmitting, isValid },
  } = useForm<UpdateClientFormData>({
    resolver: zodResolver(updateClientSchema),
    mode: 'onChange', // Validation en temps réel
    defaultValues: {
      firstName: '',
      lastName: '',
      email: '',
      phone: '',
      dateOfBirth: '',
      address: '',
      licenseNumber: '',
      isMoroccan: true,
      countryOfOrigin: '',
      licenseExpiryDate: '',
      isForeignLicense: false,
      idCardType: '',
      idCardNumber: '',
      idCardExpiryDate: '',
      passportNumber: '',
      passportExpiryDate: '',
    },
  });

  // Observer les valeurs pour les règles de gestion dynamiques
  const isMoroccan = watch('isMoroccan');
  const countryOfOrigin = watch('countryOfOrigin');
  const idCardNumber = watch('idCardNumber');
  const passportNumber = watch('passportNumber');
  const licenseNumber = watch('licenseNumber');
  const licenseExpiryDate = watch('licenseExpiryDate');
  const idCardExpiryDate = watch('idCardExpiryDate');
  const passportExpiryDate = watch('passportExpiryDate');

  // Déterminer si la section pièce d'identité/passeport doit être affichée
  const showIdentitySection = useMemo(() => {
    return !isMoroccan || (isMoroccan && countryOfOrigin);
  }, [isMoroccan, countryOfOrigin]);

  // Déterminer si la pièce d'identité ou le passeport est requis
  const isIdentityRequired = useMemo(() => {
    return !isMoroccan || (isMoroccan && countryOfOrigin);
  }, [isMoroccan, countryOfOrigin]);

  // Valider dynamiquement les champs conditionnels
  const validateConditionalFields = useCallback(async () => {
    if (showIdentitySection) {
      await trigger(['idCardNumber', 'passportNumber', 'idCardExpiryDate', 'passportExpiryDate']);
    }
    if (!isMoroccan) {
      await trigger('countryOfOrigin');
    }
  }, [showIdentitySection, trigger, isMoroccan]);

  // Charger les données du client une fois disponibles
  useEffect(() => {
    if (client) {
      const nameParts = (client.name || '').split(' ');
      const firstName = nameParts[0] || '';
      const lastName = nameParts.slice(1).join(' ') || '';
      reset({
        firstName: firstName,
        lastName: lastName,
        email: client.email || '',
        phone: client.phone || '',
        dateOfBirth: client.dateOfBirth || '',
        address: client.address || '',
        licenseNumber: client.licenseNumber || '',
        isMoroccan: client.isMoroccan ?? true,
        countryOfOrigin: client.countryOfOrigin || '',
        licenseExpiryDate: client.licenseExpiryDate || '',
        isForeignLicense: client.isForeignLicense ?? false,
        idCardType: (client as any).idCardType || '',
        idCardNumber: client.idCardNumber || '',
        idCardExpiryDate: client.idCardExpiryDate || '',
        passportNumber: client.passportNumber || '',
        passportExpiryDate: client.passportExpiryDate || '',
      });
      
      // Initialiser l'image existante
      if (client.licenseImageUrl) {
        const fullImageUrl = getImageUrl(client.licenseImageUrl);
        if (fullImageUrl) {
          setImagePreview(fullImageUrl);
        }
        setUploadedImageUrl(client.licenseImageUrl);
      }
    }
  }, [client, reset]);

  // Observer les changements pour valider automatiquement
  useEffect(() => {
    const subscription = watch((value: UpdateClientFormData, { name }: { name?: keyof UpdateClientFormData }) => {
      if (name === 'isMoroccan' || name === 'countryOfOrigin') {
        validateConditionalFields();
      }
      if (name === 'idCardNumber' || name === 'passportNumber') {
        validateConditionalFields();
      }
    });
    return () => subscription.unsubscribe();
  }, [watch, validateConditionalFields]);

  const uploadImageMutation = useMutation({
    mutationFn: (file: File) => clientApi.uploadLicenseImage(file),
  });

  const updateMutation = useMutation({
    mutationFn: (data: UpdateClientFormData) => clientApi.update(clientId, data),
    onSuccess: () => {
      toast.success('Client mis à jour avec succès');
      queryClient.invalidateQueries({ queryKey: ['client', clientId] });
      queryClient.invalidateQueries({ queryKey: ['clients'] });
      router.push('/agency/clients');
    },
    onError: (error: any) => {
      const message = error.response?.data?.message || 'Erreur lors de la mise à jour';
      toast.error(message);
    },
  });

  const handleImageChange = async (file: File | null, previewUrl?: string) => {
    setImageFile(file);
    setImagePreview(previewUrl || null);

    if (file) {
      try {
        const result = await uploadImageMutation.mutateAsync(file);
        setUploadedImageUrl(result.imageUrl);
        setValue('licenseImageUrl', result.imageUrl, { shouldValidate: true });
        toast.success('Image du permis uploadée avec succès');
      } catch (error: any) {
        const errorMessage = error.message || 
                           error.response?.data?.message || 
                           'Erreur lors de l\'upload de l\'image';
        toast.error(`Erreur upload: ${errorMessage}`);
        setImageFile(null);
        setImagePreview(null);
        setUploadedImageUrl(null);
        setValue('licenseImageUrl', undefined);
      }
    } else {
      setUploadedImageUrl(null);
      setValue('licenseImageUrl', undefined);
    }
  };

  const onSubmit = async (data: UpdateClientFormData) => {
    // Vérifier si un upload est en cours
    if (uploadImageMutation.isPending) {
      toast.error('Veuillez attendre la fin de l\'upload de l\'image');
      return;
    }

    // Si une image a été sélectionnée mais l'upload n'est pas terminé
    if (imageFile && !uploadedImageUrl && !uploadImageMutation.isError && !uploadImageMutation.isSuccess) {
      toast.error('Veuillez attendre la fin de l\'upload de l\'image');
      return;
    }

    // Si l'upload a échoué, informer l'utilisateur mais permettre la soumission
    if (imageFile && uploadImageMutation.isError) {
      const errorMessage = uploadImageMutation.error?.message || 'Erreur inconnue';
      const shouldContinue = window.confirm(
        `L'upload de l'image du permis a échoué: ${errorMessage}\n\nVoulez-vous continuer sans modifier l'image ?`
      );
      if (!shouldContinue) {
        return;
      }
    }

    // Nettoyer les données avant soumission (convertir chaînes vides en undefined)
    const submitData: UpdateClientFormData = {
      ...data,
      licenseImageUrl: uploadedImageUrl !== null ? uploadedImageUrl : (client?.licenseImageUrl || undefined),
      dateOfBirth: data.dateOfBirth || undefined,
      address: data.address || undefined,
      licenseNumber: data.licenseNumber || undefined,
      licenseExpiryDate: data.licenseExpiryDate || undefined,
      countryOfOrigin: data.countryOfOrigin || undefined,
      idCardType: data.idCardType || undefined,
      idCardNumber: data.idCardNumber || undefined,
      idCardExpiryDate: data.idCardExpiryDate || undefined,
      passportNumber: data.passportNumber || undefined,
      passportExpiryDate: data.passportExpiryDate || undefined,
    };

    updateMutation.mutate(submitData);
  };

  // Calculer le statut de validation pour afficher des indicateurs visuels
  const validationStatus = useMemo(() => {
    const requiredFields = ['firstName', 'lastName', 'email', 'phone'];
    const requiredValid = requiredFields.every(field => !errors[field as keyof typeof errors]);
    const idCardType = watch('idCardType');
    const conditionalValid = !showIdentitySection || (idCardType && idCardNumber);
    const countryValid = isMoroccan || countryOfOrigin;
    
    return {
      required: requiredValid,
      conditional: conditionalValid,
      country: countryValid,
      overall: requiredValid && conditionalValid && countryValid && isValid,
    };
  }, [errors, showIdentitySection, idCardNumber, passportNumber, isMoroccan, countryOfOrigin, isValid]);

  if (isLoadingClient || isLoadingAgencies) {
    return (
      <RouteGuard allowedRoles={['SUPER_ADMIN', 'COMPANY_ADMIN', 'AGENCY_MANAGER', 'AGENT']}>
        <MainLayout>
          <LoadingState message="Chargement du client..." />
        </MainLayout>
      </RouteGuard>
    );
  }

  if (!client) {
    return (
      <RouteGuard allowedRoles={['SUPER_ADMIN', 'COMPANY_ADMIN', 'AGENCY_MANAGER', 'AGENT']}>
        <MainLayout>
          <ErrorState
            title="Client non trouvé"
            message="Le client demandé n'existe pas ou a été supprimé."
            onRetry={() => router.push('/agency/clients')}
          />
        </MainLayout>
      </RouteGuard>
    );
  }

  return (
    <RouteGuard allowedRoles={['SUPER_ADMIN', 'COMPANY_ADMIN', 'AGENCY_MANAGER', 'AGENT']}>
      <MainLayout>
        <FormCard
          title="Modifier le client"
          description="Mettez à jour les informations du client"
          backHref="/agency/clients"
          onSubmit={handleSubmit(onSubmit)}
          isLoading={isSubmitting || updateMutation.isPending || uploadImageMutation.isPending}
          submitLabel="Enregistrer"
        >
          {/* Indicateur de validation globale */}
          {validationStatus.overall && (
            <Card className="p-3 mb-6 bg-green-500/10 border-green-500/20">
              <div className="flex items-center gap-2 text-green-500">
                <CheckCircle2 className="w-4 h-4" />
                <span className="text-sm font-medium">Formulaire valide et prêt à être soumis</span>
              </div>
            </Card>
          )}

          {/* Informations de base */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-text border-b border-border pb-2">
              Informations de base
            </h3>

            <div>
              <label htmlFor="agencyId" className="block text-sm font-medium text-text mb-2">
                Agence
              </label>
              <Select
                id="agencyId"
                value={client.agencyId}
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
                <label htmlFor="firstName" className="block text-sm font-medium text-text mb-2">
                  Prénom
                </label>
                <Input
                  id="firstName"
                  {...register('firstName')}
                  placeholder="Ex: Mohamed"
                />
                {errors.firstName && (
                  <p className="text-red-500 text-sm mt-1 flex items-center gap-1">
                    <AlertCircle className="w-4 h-4" />
                    {errors.firstName.message}
                  </p>
                )}
              </div>

              <div>
                <label htmlFor="lastName" className="block text-sm font-medium text-text mb-2">
                  Nom
                </label>
                <Input
                  id="lastName"
                  {...register('lastName')}
                  placeholder="Ex: Alami"
                />
                {errors.lastName && (
                  <p className="text-red-500 text-sm mt-1 flex items-center gap-1">
                    <AlertCircle className="w-4 h-4" />
                    {errors.lastName.message}
                  </p>
                )}
              </div>
            </div>

            <div>
              <label htmlFor="email" className="block text-sm font-medium text-text mb-2">
                Email
              </label>
              <Input
                id="email"
                type="email"
                {...register('email')}
                placeholder="exemple@email.com"
              />
              {errors.email && (
                <p className="text-red-500 text-sm mt-1 flex items-center gap-1">
                  <AlertCircle className="w-4 h-4" />
                  {errors.email.message}
                </p>
              )}
            </div>

            <div>
              <label htmlFor="phone" className="block text-sm font-medium text-text mb-2">
                Téléphone
              </label>
              <Input
                id="phone"
                type="tel"
                {...register('phone')}
                placeholder="+212 6XX XXX XXX"
              />
              {errors.phone && (
                <p className="text-red-500 text-sm mt-1 flex items-center gap-1">
                  <AlertCircle className="w-4 h-4" />
                  {errors.phone.message}
                </p>
              )}
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label htmlFor="dateOfBirth" className="block text-sm font-medium text-text mb-2">
                  Date de naissance
                </label>
                <Input
                  id="dateOfBirth"
                  type="date"
                  {...register('dateOfBirth')}
                  max={new Date().toISOString().split('T')[0]}
                />
                {errors.dateOfBirth && (
                  <p className="text-red-500 text-sm mt-1 flex items-center gap-1">
                    <AlertCircle className="w-4 h-4" />
                    {errors.dateOfBirth.message}
                  </p>
                )}
              </div>

              <div>
                <label htmlFor="address" className="block text-sm font-medium text-text mb-2">
                  Adresse
                </label>
                <Input
                  id="address"
                  {...register('address')}
                  placeholder="Adresse complète"
                />
                {errors.address && (
                  <p className="text-red-500 text-sm mt-1 flex items-center gap-1">
                    <AlertCircle className="w-4 h-4" />
                    {errors.address.message}
                  </p>
                )}
              </div>
            </div>
          </div>

          {/* Informations de nationalité */}
          <div className="border-t border-border pt-6 mt-6 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold text-text">
                Informations de nationalité
              </h3>
              {!validationStatus.country && (
                <span className="text-xs text-orange-500 flex items-center gap-1">
                  <Info className="w-3 h-3" />
                  Action requise
                </span>
              )}
            </div>
            
            <div className="flex items-center gap-3 p-4 bg-background rounded-lg border border-border">
              <input
                type="checkbox"
                id="isMoroccan"
                {...register('isMoroccan')}
                className="w-5 h-5 cursor-pointer"
              />
              <label htmlFor="isMoroccan" className="text-sm font-medium text-text cursor-pointer flex-1">
                Client marocain
              </label>
            </div>

            <div>
              <label htmlFor="countryOfOrigin" className="block text-sm font-medium text-text mb-2">
                Pays d'origine {!isMoroccan && <span className="text-red-500">*</span>}
                {isMoroccan && countryOfOrigin && (
                  <span className="text-xs text-text-muted ml-2">(si résidant à l'étranger)</span>
                )}
              </label>
              <select
                id="countryOfOrigin"
                {...register('countryOfOrigin')}
                className="w-full px-3 py-2 border border-border rounded-lg bg-card text-text"
                disabled={isMoroccan && !countryOfOrigin}
                onBlur={() => trigger('countryOfOrigin')}
              >
                <option value="">-- Sélectionner un pays --</option>
                {COUNTRIES.map((c) => (
                  <option key={c} value={c}>{c}</option>
                ))}
              </select>
              {errors.countryOfOrigin && (
                <p className="text-red-500 text-sm mt-1 flex items-center gap-1">
                  <AlertCircle className="w-4 h-4" />
                  {errors.countryOfOrigin.message}
                </p>
              )}
              {!isMoroccan && !countryOfOrigin && (
                <p className="text-orange-500 text-sm mt-1 flex items-center gap-1">
                  <Info className="w-4 h-4" />
                  Le pays d'origine est obligatoire pour les clients non-marocains
                </p>
              )}
            </div>
          </div>

          {/* Informations du permis de conduite */}
          <div className="border-t border-border pt-6 mt-6 space-y-4">
            <h3 className="text-lg font-semibold text-text">
              Informations du permis de conduite
            </h3>
            
            <div>
              <label htmlFor="licenseNumber" className="block text-sm font-medium text-text mb-2">
                Numéro de permis
              </label>
              <Input
                id="licenseNumber"
                {...register('licenseNumber')}
                placeholder="Ex: AB123456"
              />
              {errors.licenseNumber && (
                <p className="text-red-500 text-sm mt-1 flex items-center gap-1">
                  <AlertCircle className="w-4 h-4" />
                  {errors.licenseNumber.message}
                </p>
              )}
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label htmlFor="licenseExpiryDate" className="block text-sm font-medium text-text mb-2">
                  Date de validité du permis
                  {licenseNumber && (
                    <span className="text-xs text-text-muted ml-2">(recommandé)</span>
                  )}
                </label>
                <Input
                  id="licenseExpiryDate"
                  type="date"
                  {...register('licenseExpiryDate')}
                  min={new Date().toISOString().split('T')[0]}
                />
                {errors.licenseExpiryDate && (
                  <p className="text-red-500 text-sm mt-1 flex items-center gap-1">
                    <AlertCircle className="w-4 h-4" />
                    {errors.licenseExpiryDate.message}
                  </p>
                )}
                {licenseExpiryDate && new Date(licenseExpiryDate) < new Date() && (
                  <p className="text-orange-500 text-sm mt-1 flex items-center gap-1">
                    <AlertCircle className="w-4 h-4" />
                    Attention: Le permis est expiré
                  </p>
                )}
              </div>

              <div className="flex items-center">
                <div className="flex items-center gap-3 p-4 bg-background rounded-lg border border-border w-full">
                  <input
                    type="checkbox"
                    id="isForeignLicense"
                    {...register('isForeignLicense')}
                    className="w-5 h-5 cursor-pointer"
                  />
                  <label htmlFor="isForeignLicense" className="text-sm font-medium text-text cursor-pointer flex-1">
                    Permis étranger
                  </label>
                </div>
              </div>
            </div>

            {/* Upload d'image du permis */}
            <div>
              <label className="block text-sm font-medium text-text mb-2">
                Photo du permis de conduite
              </label>
              <ImageUpload
                value={imagePreview || (uploadedImageUrl ? getImageUrl(uploadedImageUrl) : getImageUrl(client?.licenseImageUrl) || undefined)}
                onChange={handleImageChange}
                disabled={uploadImageMutation.isPending}
              />
              {uploadImageMutation.isPending && (
                <p className="text-sm text-text-muted mt-2 flex items-center gap-1">
                  <Info className="w-4 h-4" />
                  Upload de l'image en cours...
                </p>
              )}
              {uploadImageMutation.isError && (
                <p className="text-sm text-red-500 mt-2 flex items-center gap-1">
                  <AlertCircle className="w-4 h-4" />
                  Erreur lors de l'upload. Veuillez réessayer.
                </p>
              )}
            </div>
          </div>

          {/* Document d'identité */}
          {showIdentitySection && (
            <div className="border-t border-border pt-6 mt-6 space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold text-text">
                  Document d&apos;identité
                </h3>
                {isIdentityRequired && !validationStatus.conditional && (
                  <span className="text-xs text-orange-500 flex items-center gap-1">
                    <Info className="w-3 h-3" />
                    Document requis
                  </span>
                )}
              </div>

              <Card className="p-4 bg-blue-500/10 border-blue-500/20">
                <div className="flex items-start gap-2 text-blue-500">
                  <Info className="w-4 h-4 mt-0.5 flex-shrink-0" />
                  <p className="text-sm">
                    {!isMoroccan 
                      ? 'Pour les clients non-marocains, un document d\'identité est obligatoire.'
                      : 'Pour les marocains résidant à l\'étranger, un document d\'identité est recommandé.'}
                  </p>
                </div>
              </Card>

              <div>
                <label htmlFor="idCardType" className="block text-sm font-medium text-text mb-2">
                  Type de document {isIdentityRequired && <span className="text-red-500">*</span>}
                </label>
                <select
                  id="idCardType"
                  {...register('idCardType')}
                  className="w-full px-3 py-2 border border-border rounded-lg bg-card text-text"
                >
                  <option value="">-- Sélectionner le type --</option>
                  <option value="CIN">CIN (Carte d&apos;identité nationale)</option>
                  <option value="PASSEPORT">Passeport</option>
                  <option value="CARTE_SEJOUR">Carte de séjour</option>
                  <option value="TITRE_SEJOUR">Titre de séjour</option>
                  <option value="PERMIS_RESIDENCE">Permis de résidence</option>
                  <option value="AUTRE">Autre</option>
                </select>
              </div>

              {watch('idCardType') && (
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label htmlFor="idCardNumber" className="block text-sm font-medium text-text mb-2">
                      Numéro du document <span className="text-red-500">*</span>
                    </label>
                    <Input
                      id="idCardNumber"
                      {...register('idCardNumber')}
                      placeholder={watch('idCardType') === 'PASSEPORT' ? 'Ex: 12AB34567' : 'Ex: AB123456'}
                      onBlur={() => trigger(['idCardNumber', 'idCardExpiryDate'])}
                    />
                    {errors.idCardNumber && (
                      <p className="text-red-500 text-sm mt-1 flex items-center gap-1">
                        <AlertCircle className="w-4 h-4" />
                        {errors.idCardNumber.message}
                      </p>
                    )}
                  </div>

                  <div>
                    <label htmlFor="idCardExpiryDate" className="block text-sm font-medium text-text mb-2">
                      Date d&apos;expiration
                      {idCardNumber && <span className="text-red-500 ml-1">*</span>}
                    </label>
                    <Input
                      id="idCardExpiryDate"
                      type="date"
                      {...register('idCardExpiryDate')}
                      min={new Date().toISOString().split('T')[0]}
                    />
                    {errors.idCardExpiryDate && (
                      <p className="text-red-500 text-sm mt-1 flex items-center gap-1">
                        <AlertCircle className="w-4 h-4" />
                        {errors.idCardExpiryDate.message}
                      </p>
                    )}
                    {idCardExpiryDate && new Date(idCardExpiryDate) < new Date() && (
                      <p className="text-orange-500 text-sm mt-1 flex items-center gap-1">
                        <AlertCircle className="w-4 h-4" />
                        Attention : le document est expiré
                      </p>
                    )}
                  </div>
                </div>
              )}
            </div>
          )}
        </FormCard>
      </MainLayout>
    </RouteGuard>
  );
}
