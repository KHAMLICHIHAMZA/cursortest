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
import AsyncStorage from '@react-native-async-storage/async-storage';
import DateTimePicker from '@react-native-community/datetimepicker';
import { Picker } from '@react-native-picker/picker';
import { Input } from '../components/Input';
import { Button } from '../components/Button';
import { PhotoPicker } from '../components/PhotoPicker';
import { SignaturePad } from '../components/SignaturePad';
import { DamageForm } from '../components/DamageForm';
import { bookingService } from '../services/booking.service';
import {
  CheckOutInput,
  FuelLevel,
  Damage,
} from '../types';
import { z } from 'zod';

// Clé pour sauvegarder les données du formulaire
const getStorageKey = (bookingId: string) => `checkout_draft_${bookingId}`;

// Schéma conditionnel : signature requise sur mobile, optionnelle sur web
const checkOutSchemaBase = z.object({
  bookingId: z.string().min(1, { message: 'bookingIdRequired' }),
  odometerEnd: z.number().min(0),
  fuelLevelEnd: z.enum(['EMPTY', 'QUARTER', 'HALF', 'THREE_QUARTERS', 'FULL']),
  photosAfter: z.array(z.string()).min(4),
  notesEnd: z.string().max(500).optional(),
  newDamages: z.array(z.any()).optional(),
  extraFees: z.number().optional(),
  cashCollected: z.boolean().optional(),
  cashAmount: z.number().optional(),
  cashReceipt: z.string().optional(),
  returnSignature: Platform.OS === 'web' ? z.string().optional() : z.string().min(1),
});

const checkOutSchema = checkOutSchemaBase.refine((data) => {
  // odometerEnd must be >= odometerStart (checked in service)
  return true;
}, {
  message: 'odometerEndMin',
  path: ['odometerEnd'],
}).refine((data) => {
  // Si cashCollected est true, cashAmount doit être présent et > 0
  if (data.cashCollected && (!data.cashAmount || data.cashAmount <= 0)) {
    return false;
  }
  return true;
}, {
  message: 'cashAmountRequired',
  path: ['cashAmount'],
});

export const CheckOutScreen: React.FC = () => {
  const { t } = useTranslation();
  const route = useRoute();
  const navigation = useNavigation();
  const queryClient = useQueryClient();
  // @ts-ignore
  const { bookingId } = route.params;

  const [odometerEnd, setOdometerEnd] = useState('');
  const [fuelLevelEnd, setFuelLevelEnd] = useState<FuelLevel>('FULL');
  const [photosAfter, setPhotosAfter] = useState<string[]>([]);
  const [notesEnd, setNotesEnd] = useState('');
  const [newDamages, setNewDamages] = useState<Damage[]>([]);
  const [extraFees, setExtraFees] = useState('');
  const [paymentMethod, setPaymentMethod] = useState<'NONE' | 'CASH' | 'CARD'>('NONE');
  const [cashAmount, setCashAmount] = useState('');
  const [cashReceipt, setCashReceipt] = useState('');
  const [returnSignature, setReturnSignature] = useState('');
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isDataLoaded, setIsDataLoaded] = useState(false);

  // Fetch booking to get odometerStart and check for extension
  const { data: booking } = useQuery({
    queryKey: ['booking', bookingId],
    queryFn: () => bookingService.getBooking(bookingId),
  });

  // Sauvegarder les données du formulaire
  const saveFormData = useCallback(async () => {
    if (!bookingId) return;
    
    try {
      const storageKey = getStorageKey(bookingId);
      const dataToSave = {
        odometerEnd,
        fuelLevelEnd,
        photosAfter,
        notesEnd,
        newDamages,
        extraFees,
        paymentMethod,
        cashAmount,
        cashReceipt,
        returnSignature,
      };
      await AsyncStorage.setItem(storageKey, JSON.stringify(dataToSave));
    } catch (error) {
      console.error('Error saving form data:', error);
    }
  }, [bookingId, odometerEnd, fuelLevelEnd, photosAfter, notesEnd, newDamages, extraFees, paymentMethod, cashAmount, cashReceipt, returnSignature]);

  // Charger les données sauvegardées
  const loadFormData = useCallback(async () => {
    if (!bookingId) return;
    
    try {
      const storageKey = getStorageKey(bookingId);
      const savedData = await AsyncStorage.getItem(storageKey);
      
      if (savedData) {
        const parsed = JSON.parse(savedData);
        
        if (parsed.odometerEnd) setOdometerEnd(parsed.odometerEnd);
        if (parsed.fuelLevelEnd) setFuelLevelEnd(parsed.fuelLevelEnd);
        if (parsed.photosAfter) setPhotosAfter(parsed.photosAfter);
        if (parsed.notesEnd !== undefined) setNotesEnd(parsed.notesEnd);
        if (parsed.newDamages) setNewDamages(parsed.newDamages);
        if (parsed.extraFees !== undefined) setExtraFees(parsed.extraFees);
        if (parsed.paymentMethod) setPaymentMethod(parsed.paymentMethod);
        if (parsed.cashAmount) setCashAmount(parsed.cashAmount);
        if (parsed.cashReceipt) setCashReceipt(parsed.cashReceipt);
        if (parsed.returnSignature) setReturnSignature(parsed.returnSignature);
      }
      
      setIsDataLoaded(true);
    } catch (error) {
      console.error('Error loading form data:', error);
      setIsDataLoaded(true);
    }
  }, [bookingId]);

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
    }, [bookingId, loadFormData, saveFormData])
  );

  // Sauvegarder automatiquement quand les données changent (seulement si les données sont chargées)
  useEffect(() => {
    if (!isDataLoaded) return;
    
    const timer = setTimeout(() => {
      saveFormData();
    }, 500); // Debounce de 500ms
    return () => clearTimeout(timer);
  }, [
    isDataLoaded,
    odometerEnd,
    fuelLevelEnd,
    photosAfter,
    notesEnd,
    newDamages,
    extraFees,
    paymentMethod,
    cashAmount,
    cashReceipt,
    returnSignature,
    saveFormData,
  ]);

  // Calculate amount to pay if booking was extended
  const calculateExtensionAmount = (): number => {
    if (!booking) return 0;
    
    // Check if booking was extended
    if (booking.extensionDays && booking.extensionDays > 0 && booking.vehicle?.dailyRate) {
      return booking.extensionDays * booking.vehicle.dailyRate;
    }
    
    // Alternative: check if originalEndDate exists and is different from endDate
    if (booking.originalEndDate) {
      const originalEnd = new Date(booking.originalEndDate);
      const currentEnd = new Date(booking.endDate);
      const daysDiff = Math.ceil((currentEnd.getTime() - originalEnd.getTime()) / (1000 * 60 * 60 * 24));
      
      if (daysDiff > 0 && booking.vehicle?.dailyRate) {
        return daysDiff * booking.vehicle.dailyRate;
      }
    }
    
    return 0;
  };

  const extensionAmount = calculateExtensionAmount();
  const hasExtension = extensionAmount > 0;

  // Add extension amount to extra fees
  const handleAddExtensionAmount = () => {
    const currentFees = extraFees ? parseFloat(extraFees) : 0;
    const newFees = (currentFees + extensionAmount).toFixed(2);
    setExtraFees(newFees);
  };

  const checkOutMutation = useMutation({
    mutationFn: async (data: CheckOutInput) => {
      return await bookingService.checkOut(data);
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
      Alert.alert(t('common.success'), t('checkOut.submitSuccess'));
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
        let errorMessage = t('checkOut.submitError');
        
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
            errorMessage = t('checkOut.validationErrors') + '\n\n• ' + validationErrors;
          }
          
          // Erreur de statut HTTP avec message
          if (error.response.status === 400) {
            errorMessage = backendError.message || t('checkOut.validationError');
          } else if (error.response.status === 401) {
            errorMessage = t('common.unauthorized') || 'Non autorisé';
          } else if (error.response.status === 403) {
            errorMessage = t('common.forbidden') || 'Accès interdit';
          } else if (error.response.status === 404) {
            errorMessage = t('checkOut.bookingNotFound') || 'Réservation introuvable';
          } else if (error.response.status === 422) {
            errorMessage = backendError.message || t('checkOut.validationError');
          } else if (error.response.status >= 500) {
            errorMessage = t('checkOut.serverError') || 'Erreur serveur. Veuillez réessayer plus tard.';
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
        t('checkOut.bookingIdMissing') || 'Aucune réservation sélectionnée. Veuillez retourner à la liste des réservations.'
      );
      await saveFormData();
      return;
    }

    // Nettoyer le bookingId (enlever les espaces)
    const cleanBookingId = bookingId.trim();

    try {
      const odometerEndNum = parseFloat(odometerEnd);
      const odometerStart = booking?.odometerStart || 0;

      if (odometerEndNum < odometerStart) {
        setErrors({ odometerEnd: t('checkOut.odometerEndMin') });
        await saveFormData();
        return;
      }

      // Validation manuelle pour les champs obligatoires
      if (!odometerEnd || isNaN(odometerEndNum)) {
        setErrors({ odometerEnd: t('checkOut.odometerEndRequired') });
        await saveFormData();
        return;
      }

      if (photosAfter.length < 4) {
        setErrors({ photosAfter: t('checkOut.photosAfterMin') });
        await saveFormData();
        return;
      }

      // Signature requise uniquement sur mobile (pas sur web)
      if (Platform.OS !== 'web' && !returnSignature) {
        setErrors({ returnSignature: t('checkOut.returnSignatureRequired') });
        await saveFormData();
        return;
      }

      // Validation du mode de paiement
      if (paymentMethod === 'NONE') {
        setErrors({ paymentMethod: t('checkOut.paymentMethodRequired') || 'Veuillez sélectionner un mode de paiement' });
        await saveFormData();
        return;
      }

      if (paymentMethod === 'CASH' && (!cashAmount || parseFloat(cashAmount) <= 0)) {
        setErrors({ cashAmount: t('checkOut.cashAmountRequired') });
        await saveFormData();
        return;
      }

      // Préparer les données pour la validation
      const dataToValidate: any = {
        bookingId: cleanBookingId,
        odometerEnd: odometerEndNum,
        fuelLevelEnd,
        photosAfter,
        notesEnd: notesEnd || undefined,
        newDamages: newDamages.length > 0 ? newDamages : undefined,
        extraFees: extraFees ? parseFloat(extraFees) : undefined,
        returnSignature: Platform.OS === 'web' ? (returnSignature || undefined) : returnSignature,
      };

      // Ajouter cashCollected seulement si paymentMethod est CASH
      if (paymentMethod === 'CASH') {
        dataToValidate.cashCollected = true;
        dataToValidate.cashAmount = cashAmount ? parseFloat(cashAmount) : undefined;
        dataToValidate.cashReceipt = cashReceipt || undefined;
      }

      const data = checkOutSchema.parse(dataToValidate);

      // Sauvegarder une dernière fois avant la soumission
      await saveFormData();

      checkOutMutation.mutate(data);
    } catch (error: any) {
      if (error.errors) {
        const zodErrors: Record<string, string> = {};
        error.errors.forEach((err: any) => {
          // Gérer les messages d'erreur avec fallback
          const errorKey = `checkOut.${err.message}`;
          const translatedError = t(errorKey);
          // Si la traduction n'existe pas, utiliser un message générique
          zodErrors[err.path[0]] = translatedError !== errorKey 
            ? translatedError 
            : t('common.fieldRequired') || `${t(`checkOut.${err.path[0]}`) || err.path[0]} est obligatoire`;
        });
        setErrors(zodErrors);
      }
    }
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      {/* Section 1: État du véhicule au retour */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>{t('checkOut.vehicleAfter')}</Text>
        {t('checkOut.vehicleAfterDescription') && (
          <Text style={styles.sectionDescription}>{t('checkOut.vehicleAfterDescription')}</Text>
        )}

        {/* Toujours afficher le kilométrage de départ */}
        <View style={styles.odometerStartContainer}>
          <Text style={styles.odometerStartLabel}>
            {t('checkOut.odometerStart')}
          </Text>
          <Text style={styles.odometerStartValue}>
            {booking?.odometerStart !== undefined ? `${booking.odometerStart} km` : t('checkOut.odometerStartNotSet')}
          </Text>
        </View>

        <Input
          label={t('checkOut.odometerEnd')}
          value={odometerEnd}
          onChangeText={setOdometerEnd}
          keyboardType="numeric"
          error={errors.odometerEnd}
          required
          placeholder="Ex: 50000"
        />
        {booking?.odometerStart !== undefined && (
          <Text style={styles.hint}>
            {t('checkOut.odometerHint', { start: booking.odometerStart })}
          </Text>
        )}

        <View style={styles.pickerContainer}>
          <Text style={styles.label}>
            {t('checkOut.fuelLevelEnd')} <Text style={styles.required}>*</Text>
          </Text>
          <Picker selectedValue={fuelLevelEnd} onValueChange={setFuelLevelEnd}>
            {(['EMPTY', 'QUARTER', 'HALF', 'THREE_QUARTERS', 'FULL'] as FuelLevel[]).map((level) => (
              <Picker.Item key={level} label={t(`fuel.${level}`)} value={level} />
            ))}
          </Picker>
          {errors.fuelLevelEnd && <Text style={styles.error}>{errors.fuelLevelEnd}</Text>}
        </View>

        {t('checkOut.photosAfterDescription') && (
          <Text style={styles.fieldDescription}>{t('checkOut.photosAfterDescription')}</Text>
        )}
        <PhotoPicker
          photos={photosAfter}
          onPhotosChange={setPhotosAfter}
          minPhotos={4}
          label={t('checkOut.photosAfter')}
          required
        />
        {errors.photosAfter && <Text style={styles.error}>{errors.photosAfter}</Text>}
      </View>

      {/* Section 2: Notes de retour */}
      <View style={styles.section}>
        {t('checkOut.notesEndDescription') && (
          <Text style={styles.fieldDescription}>{t('checkOut.notesEndDescription')}</Text>
        )}
        <Input
          label={t('checkOut.notesEnd')}
          value={notesEnd}
          onChangeText={setNotesEnd}
          multiline
          numberOfLines={4}
          maxLength={500}
          error={errors.notesEnd}
          placeholder="Observations sur l'état du véhicule..."
        />
      </View>

      {/* Section 3: Nouveaux dommages */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>{t('checkOut.newDamages')}</Text>
        {t('checkOut.newDamagesDescription') && (
          <Text style={styles.sectionDescription}>{t('checkOut.newDamagesDescription')}</Text>
        )}
        <DamageForm
          damages={newDamages}
          onDamagesChange={setNewDamages}
          label=""
        />
      </View>

      {/* Section 4: Frais et encaissement */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>{t('checkOut.fees')}</Text>
        {t('checkOut.feesDescription') && (
          <Text style={styles.sectionDescription}>{t('checkOut.feesDescription')}</Text>
        )}

        {/* Montant à régler pour prolongation */}
        {hasExtension && (
          <View style={styles.extensionAmountContainer}>
            <View style={styles.extensionAmountInfo}>
              <Text style={styles.extensionAmountLabel}>
                {t('checkOut.extensionAmount')}
              </Text>
              <Text style={styles.extensionAmountValue}>
                {extensionAmount.toFixed(2)} MAD
              </Text>
            </View>
            {booking?.extensionDays && (
              <Text style={styles.extensionAmountDetails}>
                {t('checkOut.extensionDetails', {
                  days: booking.extensionDays,
                  dailyRate: booking.vehicle?.dailyRate?.toFixed(2) || '0.00',
                })}
              </Text>
            )}
            <TouchableOpacity
              style={styles.addExtensionButton}
              onPress={handleAddExtensionAmount}
            >
              <Text style={styles.addExtensionButtonText}>
                {t('checkOut.addExtensionAmount')}
              </Text>
            </TouchableOpacity>
          </View>
        )}

        {t('checkOut.extraFeesDescription') && (
          <Text style={styles.fieldDescription}>{t('checkOut.extraFeesDescription')}</Text>
        )}
        <Input
          label={t('checkOut.extraFees')}
          value={extraFees}
          onChangeText={setExtraFees}
          keyboardType="numeric"
          error={errors.extraFees}
          placeholder="0.00"
        />

        <View style={styles.paymentMethodContainer}>
          <Text style={styles.paymentMethodLabel}>
            {t('checkOut.paymentMethod')} <Text style={styles.required}>*</Text>
          </Text>
          <View style={styles.paymentMethodOptions}>
            <TouchableOpacity
              style={[
                styles.paymentMethodOption,
                paymentMethod === 'CASH' && styles.paymentMethodOptionSelected,
              ]}
              onPress={() => setPaymentMethod('CASH')}
            >
              <Text style={[
                styles.paymentMethodOptionText,
                paymentMethod === 'CASH' && styles.paymentMethodOptionTextSelected,
              ]}>
                💵 {t('checkOut.paymentCash')}
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[
                styles.paymentMethodOption,
                paymentMethod === 'CARD' && styles.paymentMethodOptionSelected,
              ]}
              onPress={() => setPaymentMethod('CARD')}
            >
              <Text style={[
                styles.paymentMethodOptionText,
                paymentMethod === 'CARD' && styles.paymentMethodOptionTextSelected,
              ]}>
                💳 {t('checkOut.paymentCard')}
              </Text>
            </TouchableOpacity>
          </View>
          {errors.paymentMethod && <Text style={styles.error}>{errors.paymentMethod}</Text>}
        </View>

        {paymentMethod === 'CASH' && (
          <>
            <Input
              label={t('checkOut.cashAmount')}
              value={cashAmount}
              onChangeText={setCashAmount}
              keyboardType="numeric"
              error={errors.cashAmount}
              required
              placeholder="0.00"
            />

            {t('checkOut.cashReceiptDescription') && (
              <Text style={styles.fieldDescription}>{t('checkOut.cashReceiptDescription')}</Text>
            )}
            <PhotoPicker
              photos={cashReceipt ? [cashReceipt] : []}
              onPhotosChange={(photos) => setCashReceipt(photos[0] || '')}
              minPhotos={0}
              maxPhotos={1}
              label={t('checkOut.cashReceipt')}
            />
          </>
        )}

        {paymentMethod === 'CARD' && (
          <View style={styles.cardPaymentInfo}>
            <Text style={styles.cardPaymentInfoText}>
              {t('checkOut.cardPaymentInfo')}
            </Text>
          </View>
        )}
      </View>

      {/* Section 5: Signature de restitution */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>{t('checkOut.returnSignature')}</Text>
        {t('checkOut.returnSignatureDescription') && (
          <Text style={styles.sectionDescription}>{t('checkOut.returnSignatureDescription')}</Text>
        )}
        <SignaturePad
          onSignatureChange={setReturnSignature}
          label=""
          required
          error={errors.returnSignature}
        />
      </View>

      <Button
        title={t('checkOut.submit')}
        onPress={handleSubmit}
        loading={checkOutMutation.isPending}
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
  section: {
    backgroundColor: '#FFF',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#E0E0E0',
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 8,
    color: '#000',
  },
  sectionDescription: {
    fontSize: 13,
    color: '#666',
    marginBottom: 16,
    lineHeight: 18,
  },
  fieldDescription: {
    fontSize: 12,
    color: '#888',
    marginBottom: 8,
    fontStyle: 'italic',
  },
  pickerContainer: {
    marginBottom: 16,
    backgroundColor: '#FFF',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#DDD',
    overflow: 'hidden',
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 8,
    paddingHorizontal: 12,
    paddingTop: 12,
    color: '#000',
  },
  required: {
    color: '#FF3B30',
  },
  hint: {
    fontSize: 12,
    color: '#666',
    marginTop: -8,
    marginBottom: 16,
    fontStyle: 'italic',
  },
  checkboxContainer: {
    marginBottom: 16,
  },
  checkbox: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 14,
    backgroundColor: '#FFF',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#DDD',
  },
  checkboxChecked: {
    borderColor: '#007AFF',
    backgroundColor: '#F0F8FF',
  },
  checkboxText: {
    fontSize: 16,
    color: '#000',
  },
  error: {
    color: '#FF3B30',
    fontSize: 12,
    marginTop: 4,
    marginLeft: 4,
  },
  submitButton: {
    marginTop: 8,
    marginBottom: 32,
  },
  extensionAmountContainer: {
    backgroundColor: '#FFF3CD',
    borderRadius: 8,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#FFC107',
  },
  extensionAmountInfo: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  extensionAmountLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#000',
  },
  extensionAmountValue: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#FF6B00',
  },
  extensionAmountDetails: {
    fontSize: 13,
    color: '#666',
    marginBottom: 12,
    fontStyle: 'italic',
  },
  addExtensionButton: {
    backgroundColor: '#FF6B00',
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 8,
    alignItems: 'center',
  },
  addExtensionButtonText: {
    color: '#FFF',
    fontSize: 14,
    fontWeight: '600',
  },
  odometerStartContainer: {
    backgroundColor: '#F0F8FF',
    borderRadius: 8,
    padding: 12,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#007AFF',
  },
  odometerStartLabel: {
    fontSize: 12,
    color: '#666',
    marginBottom: 4,
  },
  odometerStartValue: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#007AFF',
  },
  paymentMethodContainer: {
    marginBottom: 16,
  },
  paymentMethodLabel: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 12,
    color: '#000',
  },
  paymentMethodOptions: {
    flexDirection: 'row',
    gap: 12,
  },
  paymentMethodOption: {
    flex: 1,
    padding: 14,
    borderRadius: 8,
    borderWidth: 2,
    borderColor: '#DDD',
    backgroundColor: '#FFF',
    alignItems: 'center',
  },
  paymentMethodOptionSelected: {
    borderColor: '#007AFF',
    backgroundColor: '#F0F8FF',
  },
  paymentMethodOptionText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#666',
  },
  paymentMethodOptionTextSelected: {
    color: '#007AFF',
  },
  cardPaymentInfo: {
    backgroundColor: '#E8F5E9',
    borderRadius: 8,
    padding: 12,
    marginTop: 8,
    borderWidth: 1,
    borderColor: '#4CAF50',
  },
  cardPaymentInfoText: {
    fontSize: 13,
    color: '#2E7D32',
    fontStyle: 'italic',
  },
});

