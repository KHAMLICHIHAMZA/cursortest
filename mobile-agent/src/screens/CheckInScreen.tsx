import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Alert,
  Platform,
  TouchableOpacity,
} from 'react-native';
import { useTranslation } from 'react-i18next';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useRoute, useNavigation, useFocusEffect } from '@react-navigation/native';
import DateTimePicker from '@react-native-community/datetimepicker';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Input } from '../components/Input';
import { Button } from '../components/Button';
import { Dropdown } from '../components/Dropdown';
import { PhotoPicker } from '../components/PhotoPicker';
import { SignaturePad } from '../components/SignaturePad';
import { DamageForm } from '../components/DamageForm';
import { bookingService } from '../services/booking.service';
import { CheckInInput, FuelLevel, Damage, ExtractionStatus, DepositStatusCheckIn } from '../types';
import { z } from 'zod';
import * as FileSystem from 'expo-file-system';

// Schéma conditionnel : signature requise sur mobile, optionnelle sur web
const checkInSchemaBase = z.object({
  bookingId: z.string().min(1, { message: 'bookingIdRequired' }),
  odometerStart: z.number({
    required_error: 'odometerStartRequired',
    invalid_type_error: 'odometerStartInvalid',
  }).min(0, { message: 'odometerStartMin' }),
  fuelLevelStart: z.enum(['EMPTY', 'QUARTER', 'HALF', 'THREE_QUARTERS', 'FULL'], {
    required_error: 'fuelLevelStartRequired',
    invalid_type_error: 'fuelLevelStartInvalid',
  }),
  photosBefore: z.array(z.string(), {
    required_error: 'photosBeforeRequired',
  }).min(4, { message: 'photosBeforeMin' }),
  notesStart: z.string().max(500, { message: 'notesStartMax' }).optional(),
  driverLicensePhoto: z.string({
    required_error: 'driverLicensePhotoRequired',
  }).min(1, { message: 'driverLicensePhotoRequired' }),
  driverLicenseExpiry: z.string({
    required_error: 'driverLicenseExpiryRequired',
  }).refine((date) => {
    const expiryDate = new Date(date);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    return expiryDate > today;
  }, {
    message: 'driverLicenseExpired',
  }),
  identityDocument: z.string().optional(),
  extractionStatus: z.enum(['OK', 'TO_VERIFY']).optional(),
  depositStatusCheckIn: z.enum(['PENDING', 'COLLECTED']).optional(),
  signature: Platform.OS === 'web' 
    ? z.string().optional() 
    : z.string({
        required_error: 'signatureRequired',
      }).min(1, { message: 'signatureRequired' }),
});

const checkInSchema = checkInSchemaBase;

// Clé pour sauvegarder les données du formulaire
const getStorageKey = (bookingId: string) => `checkin_draft_${bookingId}`;

export const CheckInScreen: React.FC = () => {
  const { t } = useTranslation();
  const route = useRoute();
  const navigation = useNavigation();
  const queryClient = useQueryClient();
  // @ts-ignore
  const { bookingId } = route.params || {};

  // Vérifier que bookingId est valide
  useEffect(() => {
    if (!bookingId) {
      Alert.alert(
        t('common.error'),
        t('checkIn.bookingIdMissing') || 'Aucune réservation sélectionnée. Veuillez retourner à la liste des réservations.'
      );
      // @ts-ignore
      navigation.goBack();
    }
  }, [bookingId]);

  const [odometerStart, setOdometerStart] = useState('');
  const [fuelLevelStart, setFuelLevelStart] = useState<FuelLevel>('FULL');
  const [photosBefore, setPhotosBefore] = useState<string[]>([]);
  const [notesStart, setNotesStart] = useState('');
  const [existingDamages, setExistingDamages] = useState<Damage[]>([]);
  const [driverLicensePhoto, setDriverLicensePhoto] = useState('');
  const [driverLicenseExpiry, setDriverLicenseExpiry] = useState(new Date());
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [identityDocument, setIdentityDocument] = useState('');
  const [extractionStatus, setExtractionStatus] = useState<ExtractionStatus>('OK');
  // Statut de la caution au check-in (PENDING ou COLLECTED uniquement)
  const [depositStatusCheckIn, setDepositStatusCheckIn] = useState<DepositStatusCheckIn>('PENDING');
  const [signature, setSignature] = useState('');
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isDataLoaded, setIsDataLoaded] = useState(false);

  // Récupérer les données du booking pour pré-remplir
  const { data: booking } = useQuery({
    queryKey: ['booking', bookingId],
    queryFn: () => bookingService.getBooking(bookingId!),
    enabled: !!bookingId,
  });

  // Fonction pour sauvegarder les données du formulaire
  const saveFormData = async () => {
    if (!bookingId) return;
    
    try {
      const formData = {
        odometerStart,
        fuelLevelStart,
        photosBefore,
        notesStart,
        existingDamages,
        driverLicensePhoto,
        driverLicenseExpiry: driverLicenseExpiry.toISOString(),
        identityDocument,
        extractionStatus,
        depositStatusCheckIn,
        signature,
      };
      await AsyncStorage.setItem(getStorageKey(bookingId), JSON.stringify(formData));
    } catch (error) {
      console.error('Error saving form data:', error);
    }
  };

  // Fonction pour charger les données sauvegardées ou pré-remplir depuis le booking
  const loadFormData = useCallback(async () => {
    if (!bookingId) return;
    
    try {
      // D'abord, essayer de charger les données sauvegardées
      const savedData = await AsyncStorage.getItem(getStorageKey(bookingId));
      if (savedData) {
        const data = JSON.parse(savedData);
        setOdometerStart(data.odometerStart || '');
        setFuelLevelStart(data.fuelLevelStart || 'FULL');
        setPhotosBefore(data.photosBefore || []);
        setNotesStart(data.notesStart || '');
        setExistingDamages(data.existingDamages || []);
        setDriverLicensePhoto(data.driverLicensePhoto || '');
        if (data.driverLicenseExpiry) {
          setDriverLicenseExpiry(new Date(data.driverLicenseExpiry));
        }
        setIdentityDocument(data.identityDocument || '');
        setExtractionStatus(data.extractionStatus || 'OK');
        setDepositStatusCheckIn(data.depositStatusCheckIn || 'PENDING');
        setSignature(data.signature || '');
        setIsDataLoaded(true);
        return;
      }

      // Si pas de données sauvegardées, pré-remplir depuis le booking
      if (booking?.client) {
        const client = booking.client;
        
        // Pré-remplir la photo du permis si disponible dans le client
        if (client.licenseImageUrl) {
          setDriverLicensePhoto(client.licenseImageUrl);
        }
        
        // Pré-remplir la date d'expiration du permis si disponible
        if (client.licenseExpiryDate) {
          try {
            const expiryDate = new Date(client.licenseExpiryDate);
            if (!isNaN(expiryDate.getTime())) {
              setDriverLicenseExpiry(expiryDate);
            }
          } catch (e) {
            console.error('Error parsing license expiry date:', e);
          }
        }

        // Pré-remplir la pièce d'identité si disponible dans les documents du client
        if (client.documents && Array.isArray(client.documents) && client.documents.length > 0) {
          // Chercher un document de type ID_CARD ou OTHER (pour passeport)
          const idDocument = client.documents.find(
            (doc: any) => doc.type === 'ID_CARD' || (doc.type === 'OTHER' && doc.title?.toLowerCase().includes('identité'))
          );
          if (idDocument && idDocument.url) {
            setIdentityDocument(idDocument.url);
          }
        }
      }
      
      setIsDataLoaded(true);
    } catch (error) {
      console.error('Error loading form data:', error);
      setIsDataLoaded(true);
    }
  }, [bookingId, booking]);

  // Charger les données quand l'écran devient actif (à chaque fois qu'on revient)
  useFocusEffect(
    useCallback(() => {
      if (bookingId) {
        // Toujours recharger les données quand on revient sur l'écran
        setIsDataLoaded(false);
        loadFormData();
      }
      return () => {
        // Sauvegarder quand on quitte l'écran
        if (bookingId) {
          saveFormData();
        }
      };
    }, [bookingId, loadFormData])
  );

  // Recharger les données quand le booking change (pour pré-remplir depuis le booking)
  useEffect(() => {
    if (booking && bookingId && !isDataLoaded) {
      loadFormData();
    }
  }, [booking, bookingId, isDataLoaded, loadFormData]);

  // Sauvegarder automatiquement quand les données changent (seulement si les données sont chargées)
  useEffect(() => {
    if (!isDataLoaded) return;
    
    const timer = setTimeout(() => {
      saveFormData();
    }, 500); // Debounce de 500ms
    return () => clearTimeout(timer);
  }, [
    isDataLoaded,
    odometerStart,
    fuelLevelStart,
    photosBefore,
    notesStart,
    existingDamages,
    driverLicensePhoto,
    driverLicenseExpiry,
    identityDocument,
    extractionStatus,
    depositStatusCheckIn,
    signature,
  ]);

  const checkInMutation = useMutation({
    mutationFn: async (data: CheckInInput) => {
      return await bookingService.checkIn(data);
    },
    onSuccess: async () => {
      // Supprimer les données sauvegardées après succès
      if (bookingId) {
        try {
          await AsyncStorage.removeItem(getStorageKey(bookingId));
        } catch (error) {
          console.error('Error removing saved form data:', error);
        }
      }
      // Invalider et refetch les queries pour mettre à jour la liste
      await queryClient.invalidateQueries({ queryKey: ['bookings'] });
      await queryClient.invalidateQueries({ queryKey: ['booking', bookingId] });
      // Forcer le refetch immédiat
      await queryClient.refetchQueries({ queryKey: ['bookings'] });
      Alert.alert(t('common.success'), t('checkIn.submitSuccess'));
      // @ts-ignore
      navigation.goBack();
    },
    onError: async (error: any) => {
      // Toujours sauvegarder les données en cas d'erreur pour que l'utilisateur puisse réessayer
      if (bookingId) {
        await saveFormData();
      }

      if (error.message === 'OFFLINE_QUEUED') {
        Alert.alert(t('common.success'), t('offline.syncPending'));
        // @ts-ignore
        navigation.goBack();
      } else {
        // Gestion détaillée des erreurs du backend
        let errorMessage = t('checkIn.submitError');
        
        if (error.response?.data) {
          const backendError = error.response.data;
          
          // Erreur de validation du backend
          if (backendError.message) {
            errorMessage = backendError.message;
          }
          
          // Erreurs de validation multiples
          if (backendError.errors && Array.isArray(backendError.errors)) {
            const validationErrors = backendError.errors
              .map((err: any) => {
                const field = err.field || err.path || '';
                const msg = err.message || err.msg || '';
                return field ? `${field}: ${msg}` : msg;
              })
              .join('\n• ');
            errorMessage = t('checkIn.validationErrors') + '\n\n• ' + validationErrors;
          }
          
          // Erreur de statut HTTP avec message
          if (error.response.status === 400) {
            errorMessage = backendError.message || t('checkIn.validationError');
          } else if (error.response.status === 401) {
            errorMessage = t('common.unauthorized') || 'Non autorisé';
          } else if (error.response.status === 403) {
            errorMessage = t('common.forbidden') || 'Accès interdit';
          } else if (error.response.status === 404) {
            errorMessage = t('checkIn.bookingNotFound') || 'Réservation introuvable';
          } else if (error.response.status === 422) {
            errorMessage = backendError.message || t('checkIn.validationError');
          } else if (error.response.status >= 500) {
            errorMessage = t('checkIn.serverError') || 'Erreur serveur. Veuillez réessayer plus tard.';
          }
        } else if (error.message) {
          errorMessage = error.message;
        }
        
        Alert.alert(t('common.error'), errorMessage);
        // Ne pas faire navigation.goBack() en cas d'erreur pour que l'utilisateur puisse corriger
      }
    },
  });

  const handleSubmit = async () => {
    setErrors({});

    // Sauvegarder les données avant la soumission (au cas où l'utilisateur sort avant la réponse)
    await saveFormData();

    // Validation de bookingId
    if (!bookingId) {
      Alert.alert(
        t('common.error'),
        t('checkIn.bookingIdMissing') || 'Aucune réservation sélectionnée. Veuillez retourner à la liste des réservations.'
      );
      return;
    }

    // Validation manuelle pour messages d'erreur explicites
    const validationErrors: Record<string, string> = {};

    // Validation du kilométrage
    if (!odometerStart || odometerStart.trim() === '') {
      validationErrors.odometerStart = t('checkIn.odometerStartRequired');
    } else {
      const odometerValue = parseFloat(odometerStart);
      if (isNaN(odometerValue)) {
        validationErrors.odometerStart = t('checkIn.odometerStartInvalid');
      } else if (odometerValue < 0) {
        validationErrors.odometerStart = t('checkIn.odometerStartMin');
      }
    }

    // Validation des photos
    if (photosBefore.length < 4) {
      validationErrors.photosBefore = t('checkIn.photosBeforeMin');
    }

    // Validation de la photo du permis
    if (!driverLicensePhoto || driverLicensePhoto.trim() === '') {
      validationErrors.driverLicensePhoto = t('checkIn.driverLicensePhotoRequired');
    }

    // Validation de la date d'expiration du permis
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    if (driverLicenseExpiry <= today) {
      validationErrors.driverLicenseExpiry = t('checkIn.driverLicenseExpired');
    }

    // Validation de la caution : si une caution est requise, elle doit être COLLECTED
    if (booking?.depositRequired === true) {
      if (depositStatusCheckIn !== 'COLLECTED') {
        validationErrors.depositStatusCheckIn = t('checkIn.depositMustBeCollected');
      }
    }

    // Validation de la signature (mobile uniquement)
    if (Platform.OS !== 'web' && (!signature || signature.trim() === '')) {
      validationErrors.signature = t('checkIn.signatureRequired');
    }
    
    // Pour web, si pas de signature, utiliser une chaîne vide
    if (Platform.OS === 'web' && !signature) {
      // Pas d'erreur, mais on s'assure que c'est une string vide
    }

    // Validation des notes
    if (notesStart && notesStart.length > 500) {
      validationErrors.notesStart = t('checkIn.notesStartMax');
    }

    // Si erreurs de validation manuelle, les afficher et arrêter
    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors);
      // Afficher une alerte avec le résumé des erreurs
      const errorMessages = Object.values(validationErrors).join('\n• ');
      Alert.alert(
        t('common.error'),
        t('checkIn.validationErrors') + '\n\n• ' + errorMessages
      );
      return;
    }

    try {
      // Convert local file URIs to base64 or upload
      const photosBeforeData = await Promise.all(
        photosBefore.map(async (uri) => {
          // In production, upload to server and get URL
          // For now, keep local URI for offline queue
          return uri;
        })
      );

      // Vérifier à nouveau que bookingId est valide avant l'envoi
      if (!bookingId || typeof bookingId !== 'string' || bookingId.trim() === '') {
        Alert.alert(
          t('common.error'),
          t('checkIn.bookingIdMissing') || 'Aucune réservation sélectionnée. Veuillez retourner à la liste des réservations.'
        );
        // Sauvegarder quand même les données
        await saveFormData();
        return;
      }

      // Nettoyer le bookingId (enlever les espaces)
      const cleanBookingId = bookingId.trim();

      const parsedData = checkInSchema.parse({
        bookingId: cleanBookingId,
        odometerStart: parseFloat(odometerStart),
        fuelLevelStart,
        photosBefore: photosBeforeData,
        notesStart: notesStart || undefined,
        existingDamages: existingDamages.length > 0 ? existingDamages : undefined,
        driverLicensePhoto,
        driverLicenseExpiry: driverLicenseExpiry.toISOString().split('T')[0],
        identityDocument: identityDocument || undefined,
        extractionStatus: extractionStatus || undefined,
        depositStatusCheckIn: booking?.depositRequired ? depositStatusCheckIn : undefined,
        signature: signature || '', // Toujours une string, même si vide pour web
      });

      // S'assurer que signature est toujours une string pour le type CheckInInput
      const data: CheckInInput = {
        ...parsedData,
        bookingId: cleanBookingId, // Utiliser le bookingId nettoyé
        signature: parsedData.signature || '',
      };

      // Sauvegarder une dernière fois avant la soumission
      await saveFormData();

      checkInMutation.mutate(data);
    } catch (error: any) {
      if (error.errors) {
        const zodErrors: Record<string, string> = {};
        error.errors.forEach((err: any) => {
          const fieldName = err.path[0] || 'unknown';
          const errorKey = err.message || 'unknownError';
          // Essayer de traduire le message d'erreur
          const translatedMessage = t(`checkIn.${errorKey}`, { defaultValue: t('checkIn.unknownError') });
          zodErrors[fieldName] = translatedMessage;
        });
        setErrors(zodErrors);
        
        // Afficher une alerte avec le résumé des erreurs
        const errorMessages = Object.values(zodErrors).join('\n• ');
        Alert.alert(
          t('common.error'),
          t('checkIn.validationErrors') + '\n\n• ' + errorMessages
        );
      } else {
        // Erreur inattendue
        Alert.alert(
          t('common.error'),
          error.message || t('checkIn.submitError')
        );
      }
    }
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      {/* Header: Booking number (V2) */}
      {booking && (
        <View style={styles.headerCard}>
          <Text style={styles.headerLabel}>{t('booking.number') || 'Réservation'}</Text>
          <Text style={styles.headerValue}>
            #{(booking as any).bookingNumber || String(booking.id || bookingId).slice(-6).toUpperCase()}
          </Text>
          {booking.client?.name && (
            <Text style={styles.headerSubValue}>{booking.client.name}</Text>
          )}
        </View>
      )}

      <Text style={styles.sectionTitle}>{t('checkIn.vehicleBefore')}</Text>

      <Input
        label={t('checkIn.odometerStart')}
        value={odometerStart}
        onChangeText={setOdometerStart}
        keyboardType="numeric"
        error={errors.odometerStart}
        required
      />

      <Dropdown
        label={t('checkIn.fuelLevelStart')}
        value={fuelLevelStart}
        options={(['EMPTY', 'QUARTER', 'HALF', 'THREE_QUARTERS', 'FULL'] as FuelLevel[]).map((level) => ({
          label: t(`fuel.${level}`),
          value: level,
        }))}
        onValueChange={(value) => setFuelLevelStart(value as FuelLevel)}
        error={errors.fuelLevelStart}
        required
      />

      <PhotoPicker
        photos={photosBefore}
        onPhotosChange={setPhotosBefore}
        minPhotos={4}
        label={t('checkIn.photosBefore')}
        required
      />
      {errors.photosBefore && <Text style={styles.error}>{errors.photosBefore}</Text>}

      <Input
        label={t('checkIn.notesStart')}
        value={notesStart}
        onChangeText={setNotesStart}
        multiline
        numberOfLines={4}
        maxLength={500}
        error={errors.notesStart}
      />

      <Text style={styles.sectionTitle}>{t('checkIn.existingDamages')}</Text>
      <DamageForm
        damages={existingDamages}
        onDamagesChange={setExistingDamages}
        label={t('checkIn.existingDamages')}
      />

      <Text style={styles.sectionTitle}>{t('checkIn.clientDocuments')}</Text>

      <PhotoPicker
        photos={driverLicensePhoto ? [driverLicensePhoto] : []}
        onPhotosChange={(photos) => setDriverLicensePhoto(photos[0] || '')}
        minPhotos={1}
        maxPhotos={1}
        label={t('checkIn.driverLicensePhoto')}
        required
      />
      {errors.driverLicensePhoto && <Text style={styles.error}>{errors.driverLicensePhoto}</Text>}

      <TouchableOpacity
        style={styles.dateButton}
        onPress={() => setShowDatePicker(true)}
      >
        <Text style={styles.dateLabel}>
          {t('checkIn.driverLicenseExpiry')} <Text style={styles.required}>*</Text>
        </Text>
        <Text style={styles.dateValue}>
          {driverLicenseExpiry.toLocaleDateString()}
        </Text>
      </TouchableOpacity>
      {errors.driverLicenseExpiry && (
        <Text style={styles.error}>{errors.driverLicenseExpiry}</Text>
      )}

      {showDatePicker && (
        <DateTimePicker
          value={driverLicenseExpiry}
          mode="date"
          display={Platform.OS === 'ios' ? 'spinner' : 'default'}
          onChange={(event, date) => {
            if (date) {
              setDriverLicenseExpiry(date);
            }
            // Fermer le picker après sélection (Android ferme automatiquement, iOS on ferme manuellement)
            if (Platform.OS === 'android' || event.type === 'set') {
              setShowDatePicker(false);
            }
          }}
          minimumDate={new Date()}
        />
      )}

      <PhotoPicker
        photos={identityDocument ? [identityDocument] : []}
        onPhotosChange={(photos) => setIdentityDocument(photos[0] || '')}
        minPhotos={0}
        maxPhotos={1}
        label={t('checkIn.identityDocument')}
      />
      {booking?.client && (booking.client.idCardNumber || booking.client.passportNumber) && !identityDocument && (
        <Text style={styles.infoText}>
          {t('checkIn.clientHasIdDocument') || `Client a une pièce d'identité enregistrée (${booking.client.idCardNumber || booking.client.passportNumber})`}
        </Text>
      )}

      <Dropdown
        label={t('checkIn.extractionStatus')}
        value={extractionStatus}
        options={(['OK', 'TO_VERIFY'] as ExtractionStatus[]).map((status) => ({
          label: t(`extraction.${status}`),
          value: status,
        }))}
        onValueChange={(value) => setExtractionStatus(value as ExtractionStatus)}
      />

      {/* Section Caution - Affichage en lecture seule depuis le booking */}
      {booking?.depositRequired && (
        <>
          <Text style={styles.sectionTitle}>{t('checkIn.deposit')}</Text>
          
          {/* Informations de caution en lecture seule */}
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>{t('checkIn.depositAmount')}:</Text>
            <Text style={styles.infoValue}>{booking.depositAmount} MAD</Text>
          </View>
          
          {booking.depositDecisionSource && (
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>{t('checkIn.depositDecisionSource')}:</Text>
              <Text style={styles.infoValue}>
                {booking.depositDecisionSource === 'COMPANY' 
                  ? t('checkIn.depositDecisionSourceCompany') 
                  : t('checkIn.depositDecisionSourceAgency')}
              </Text>
            </View>
          )}

          {/* Statut de collecte au check-in (modifiable) */}
          <Dropdown
            label={t('checkIn.depositStatusCheckIn')}
            value={depositStatusCheckIn}
            options={([
              { label: t('deposit.statuses.PENDING'), value: 'PENDING' },
              { label: t('deposit.statuses.COLLECTED'), value: 'COLLECTED' },
            ] as { label: string; value: DepositStatusCheckIn }[])}
            onValueChange={(value) => setDepositStatusCheckIn(value as DepositStatusCheckIn)}
            required
            error={errors.depositStatusCheckIn}
          />
          
          {booking.depositRequired && depositStatusCheckIn !== 'COLLECTED' && (
            <Text style={styles.warningText}>
              {t('checkIn.depositMustBeCollectedWarning')}
            </Text>
          )}
        </>
      )}

      <Text style={styles.sectionTitle}>{t('checkIn.signature')}</Text>
      <SignaturePad
        onSignatureChange={setSignature}
        label={t('checkIn.signature')}
        required
        error={errors.signature}
      />

      <Button
        title={t('checkIn.submit')}
        onPress={handleSubmit}
        loading={checkInMutation.isPending}
        style={styles.submitButton}
      />
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F5F5',
  },
  content: {
    padding: 16,
  },
  headerCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 14,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    marginBottom: 12,
  },
  headerLabel: {
    fontSize: 12,
    color: '#6B7280',
    fontWeight: '700',
    marginBottom: 6,
  },
  headerValue: {
    fontSize: 20,
    color: '#111827',
    fontWeight: '800',
  },
  headerSubValue: {
    marginTop: 6,
    fontSize: 14,
    color: '#111827',
    fontWeight: '600',
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginTop: 24,
    marginBottom: 16,
    color: '#000',
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 8,
    color: '#000',
  },
  required: {
    color: '#FF3B30',
  },
  dateButton: {
    backgroundColor: '#FFF',
    borderWidth: 1,
    borderColor: '#DDD',
    borderRadius: 8,
    padding: 12,
    marginBottom: 16,
  },
  dateLabel: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 4,
    color: '#000',
  },
  dateValue: {
    fontSize: 16,
    color: '#000',
  },
  checkboxContainer: {
    marginBottom: 16,
  },
  checkbox: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    backgroundColor: '#FFF',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#DDD',
  },
  checkboxText: {
    fontSize: 16,
    color: '#000',
  },
  error: {
    color: '#FF3B30',
    fontSize: 12,
    marginTop: 4,
  },
  infoText: {
    color: '#007AFF',
    fontSize: 12,
    marginTop: 4,
    fontStyle: 'italic',
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    backgroundColor: '#FFF',
    borderRadius: 8,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#DDD',
  },
  infoLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#666',
  },
  infoValue: {
    fontSize: 14,
    fontWeight: '600',
    color: '#000',
  },
  warningText: {
    color: '#FF9500',
    fontSize: 12,
    marginTop: 8,
    marginBottom: 16,
    fontStyle: 'italic',
  },
  submitButton: {
    marginTop: 24,
    marginBottom: 32,
  },
});

