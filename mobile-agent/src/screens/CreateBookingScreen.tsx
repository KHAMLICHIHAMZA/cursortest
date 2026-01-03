import React, { useState } from 'react';
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
import { useNavigation } from '@react-navigation/native';
import { Picker } from '@react-native-picker/picker';
import DateTimePicker from '@react-native-community/datetimepicker';
import { Input } from '../components/Input';
import { Button } from '../components/Button';
import { bookingService } from '../services/booking.service';
import { CreateBookingInput } from '../types';
import { useAuth } from '../contexts/AuthContext';
import api from '../services/api';
import { z } from 'zod';

const createBookingSchema = z.object({
  agencyId: z.string().uuid(),
  clientId: z.string().uuid(),
  vehicleId: z.string().uuid(),
  startDate: z.string().datetime(),
  endDate: z.string().datetime(),
}).refine((data) => new Date(data.endDate) > new Date(data.startDate), {
  message: 'endDateAfterStart',
  path: ['endDate'],
}).refine((data) => new Date(data.startDate) >= new Date(), {
  message: 'startDateFuture',
  path: ['startDate'],
});

export const CreateBookingScreen: React.FC = () => {
  const { t } = useTranslation();
  const navigation = useNavigation();
  const { agencies, user } = useAuth();
  const queryClient = useQueryClient();

  const [agencyId, setAgencyId] = useState(agencies[0]?.id || '');
  const [clientId, setClientId] = useState('');
  const [vehicleId, setVehicleId] = useState('');
  const [startDate, setStartDate] = useState(new Date());
  const [endDate, setEndDate] = useState(new Date(Date.now() + 24 * 60 * 60 * 1000));
  const [showStartPicker, setShowStartPicker] = useState(false);
  const [showEndPicker, setShowEndPicker] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  // Check if user can create bookings (only AGENCY_MANAGER)
  if (user?.role !== 'AGENCY_MANAGER') {
    return (
      <View style={styles.container}>
        <Text style={styles.errorText}>
          {t('errors.forbidden')} - {t('booking.create')}
        </Text>
      </View>
    );
  }

  // Fetch clients and vehicles
  const { data: clients } = useQuery({
    queryKey: ['clients', agencyId],
    queryFn: async () => {
      const res = await api.get(`/clients?agencyId=${agencyId}`);
      return res.data;
    },
    enabled: !!agencyId,
  });

  const { data: vehicles } = useQuery({
    queryKey: ['vehicles', agencyId],
    queryFn: async () => {
      const res = await api.get(`/vehicles?agencyId=${agencyId}`);
      return res.data;
    },
    enabled: !!agencyId,
  });

  // Check client license expiry
  const selectedClient = clients?.find((c: any) => c.id === clientId);
  const isLicenseExpired =
    selectedClient?.licenseExpiryDate &&
    new Date(selectedClient.licenseExpiryDate) < new Date();

  const createMutation = useMutation({
    mutationFn: async (data: CreateBookingInput) => {
      return await bookingService.createBooking(data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['bookings'] });
      Alert.alert(t('common.success'), t('booking.form.createSuccess'));
      // @ts-ignore
      navigation.goBack();
    },
    onError: (error: any) => {
      if (error.message === 'OFFLINE_QUEUED') {
        Alert.alert(
          t('common.success'),
          t('offline.syncPending')
        );
        // @ts-ignore
        navigation.goBack();
      } else {
        const message =
          error.response?.data?.message ||
          error.message ||
          t('booking.form.createError');
        Alert.alert(t('common.error'), message);
      }
    },
  });

  const handleSubmit = () => {
    setErrors({});

    try {
      const data = createBookingSchema.parse({
        agencyId,
        clientId,
        vehicleId,
        startDate: startDate.toISOString(),
        endDate: endDate.toISOString(),
      });

      if (isLicenseExpired) {
        Alert.alert(t('common.error'), t('booking.form.licenseExpired'));
        return;
      }

      createMutation.mutate(data);
    } catch (error: any) {
      if (error.errors) {
        const zodErrors: Record<string, string> = {};
        error.errors.forEach((err: any) => {
          zodErrors[err.path[0]] = t(`booking.form.${err.message}`);
        });
        setErrors(zodErrors);
      }
    }
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <Input
        label={t('booking.form.agency')}
        value={agencyId}
        required
        editable={false}
      />

      <View style={styles.pickerContainer}>
        <Text style={styles.label}>
          {t('booking.form.client')} <Text style={styles.required}>*</Text>
        </Text>
        <Picker
          selectedValue={clientId}
          onValueChange={setClientId}
          style={styles.picker}
        >
          <Picker.Item label={t('common.optional')} value="" />
          {clients?.map((client: any) => (
            <Picker.Item
              key={client.id}
              label={`${client.firstName} ${client.lastName}`}
              value={client.id}
            />
          ))}
        </Picker>
        {errors.clientId && (
          <Text style={styles.error}>{errors.clientId}</Text>
        )}
        {isLicenseExpired && (
          <Text style={styles.error}>{t('booking.form.licenseExpired')}</Text>
        )}
      </View>

      <View style={styles.pickerContainer}>
        <Text style={styles.label}>
          {t('booking.form.vehicle')} <Text style={styles.required}>*</Text>
        </Text>
        <Picker
          selectedValue={vehicleId}
          onValueChange={setVehicleId}
          style={styles.picker}
        >
          <Picker.Item label={t('common.optional')} value="" />
          {vehicles?.map((vehicle: any) => (
            <Picker.Item
              key={vehicle.id}
              label={`${vehicle.brand} ${vehicle.model} - ${vehicle.plateNumber}`}
              value={vehicle.id}
            />
          ))}
        </Picker>
        {errors.vehicleId && (
          <Text style={styles.error}>{errors.vehicleId}</Text>
        )}
      </View>

      <TouchableOpacity
        style={styles.dateButton}
        onPress={() => setShowStartPicker(true)}
      >
        <Text style={styles.dateLabel}>
          {t('booking.form.startDate')} <Text style={styles.required}>*</Text>
        </Text>
        <Text style={styles.dateValue}>
          {startDate.toLocaleDateString()}
        </Text>
      </TouchableOpacity>
      {errors.startDate && (
        <Text style={styles.error}>{errors.startDate}</Text>
      )}

      {showStartPicker && (
        <DateTimePicker
          value={startDate}
          mode="date"
          display={Platform.OS === 'ios' ? 'spinner' : 'default'}
          onChange={(event, date) => {
            setShowStartPicker(Platform.OS === 'ios');
            if (date) setStartDate(date);
          }}
          minimumDate={new Date()}
        />
      )}

      <TouchableOpacity
        style={styles.dateButton}
        onPress={() => setShowEndPicker(true)}
      >
        <Text style={styles.dateLabel}>
          {t('booking.form.endDate')} <Text style={styles.required}>*</Text>
        </Text>
        <Text style={styles.dateValue}>
          {endDate.toLocaleDateString()}
        </Text>
      </TouchableOpacity>
      {errors.endDate && (
        <Text style={styles.error}>{errors.endDate}</Text>
      )}

      {showEndPicker && (
        <DateTimePicker
          value={endDate}
          mode="date"
          display={Platform.OS === 'ios' ? 'spinner' : 'default'}
          onChange={(event, date) => {
            setShowEndPicker(Platform.OS === 'ios');
            if (date) setEndDate(date);
          }}
          minimumDate={startDate}
        />
      )}

      <Button
        title={t('booking.create')}
        onPress={handleSubmit}
        loading={createMutation.isPending}
        disabled={isLicenseExpired}
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
  pickerContainer: {
    marginBottom: 16,
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
  picker: {
    backgroundColor: '#FFF',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#DDD',
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
  error: {
    color: '#FF3B30',
    fontSize: 12,
    marginTop: 4,
  },
  errorText: {
    color: '#FF3B30',
    fontSize: 16,
    textAlign: 'center',
    marginTop: 20,
  },
  submitButton: {
    marginTop: 8,
  },
});

