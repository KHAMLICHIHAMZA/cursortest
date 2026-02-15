import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  Linking,
  Platform,
} from 'react-native';
import { useTranslation } from 'react-i18next';
import { useQuery } from '@tanstack/react-query';
import { useRoute, useNavigation } from '@react-navigation/native';
import { bookingService } from '../services/booking.service';
import { Booking, BookingStatus } from '../types';
import { useAuth } from '../contexts/AuthContext';
import { Button } from '../components/Button';

export const BookingDetailsScreen: React.FC = () => {
  const { t } = useTranslation();
  const route = useRoute();
  const navigation = useNavigation();
  const { user } = useAuth();
  // @ts-ignore
  const { bookingId } = route.params;

  const { data: booking, isLoading } = useQuery<Booking & { client?: any; vehicle?: any }>({
    queryKey: ['booking', bookingId],
    queryFn: () => bookingService.getBooking(bookingId),
  });

  const canCheckIn = booking?.status === 'CONFIRMED';
  const canCheckOut = booking?.status === 'ACTIVE';

  const handleCheckIn = () => {
    // @ts-ignore
    navigation.navigate('CheckIn', { bookingId });
  };

  const handleCheckOut = () => {
    // @ts-ignore
    navigation.navigate('CheckOut', { bookingId });
  };

  const handleCall = (phone: string) => {
    const phoneNumber = phone.startsWith('+') ? phone : `+${phone}`;
    Linking.openURL(`tel:${phoneNumber}`);
  };

  const handleWhatsApp = (phone: string) => {
    const phoneNumber = phone.replace(/\D/g, ''); // Remove non-digits
    const url = `https://wa.me/${phoneNumber}`;
    Linking.openURL(url);
  };

  if (isLoading || !booking) {
    return (
      <View style={styles.container}>
        <Text>{t('common.loading')}</Text>
      </View>
    );
  }

  // V2: BookingNumber (backend source of truth). Fallback to last 6 chars of ID.
  const bookingNumber = booking.bookingNumber || booking.id.slice(-6).toUpperCase();

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <View style={styles.header}>
        <View>
          <Text style={styles.bookingNumberLabel}>{t('booking.number') || 'Réservation'}</Text>
          <Text style={styles.bookingId}>#{bookingNumber}</Text>
        </View>
        <View
          style={[
            styles.statusBadge,
            { backgroundColor: getStatusColor(booking.status) },
          ]}
        >
          <Text style={styles.statusText}>
            {t(`booking.status.${booking.status}`) || booking.status}
          </Text>
        </View>
      </View>

      {/* Client Information */}
      {booking.client && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>{t('booking.client') || 'Client'}</Text>
          <InfoRow
            label={t('booking.clientName') || 'Nom'}
            value={booking.client.name || '-'}
          />
          {booking.client.phone && (
            <View style={styles.contactRow}>
              <Text style={styles.infoLabel}>{t('booking.phone') || 'Téléphone'}:</Text>
              <View style={styles.contactButtons}>
                <TouchableOpacity
                  style={styles.contactButton}
                  onPress={() => handleCall(booking.client.phone)}
                >
                  <Text style={styles.contactButtonText}>📞 {booking.client.phone}</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.contactButton, styles.whatsappButton]}
                  onPress={() => handleWhatsApp(booking.client.phone)}
                >
                  <Text style={styles.contactButtonText}>💬 WhatsApp</Text>
                </TouchableOpacity>
              </View>
            </View>
          )}
          {booking.client.email && (
            <InfoRow
              label={t('booking.email') || 'Email'}
              value={booking.client.email}
            />
          )}
          {booking.client.idCardNumber && (
            <InfoRow
              label={t('booking.idCardNumber') || 'N° Pièce d\'identité'}
              value={booking.client.idCardNumber}
            />
          )}
          {booking.client.licenseNumber && (
            <InfoRow
              label={t('booking.licenseNumber') || 'N° Permis'}
              value={booking.client.licenseNumber}
            />
          )}
        </View>
      )}

      {/* Vehicle Information */}
      {booking.vehicle && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>{t('booking.vehicle') || 'Véhicule'}</Text>
          <InfoRow
            label={t('booking.vehicleBrand') || 'Marque'}
            value={booking.vehicle.brand || '-'}
          />
          <InfoRow
            label={t('booking.vehicleModel') || 'Modèle'}
            value={booking.vehicle.model || '-'}
          />
          <InfoRow
            label={t('booking.registrationNumber') || 'Immatriculation'}
            value={booking.vehicle.registrationNumber || '-'}
          />
        </View>
      )}

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>{t('booking.details') || 'Détails'}</Text>
        <InfoRow
          label={t('booking.form.startDate') || 'Date de début'}
          value={new Date(booking.startDate).toLocaleString('fr-FR')}
        />
        <InfoRow
          label={t('booking.form.endDate') || 'Date de fin'}
          value={new Date(booking.endDate).toLocaleString('fr-FR')}
        />
        <InfoRow
          label={t('booking.price') || 'Prix'}
          value={`${booking.price ? booking.price.toFixed(2) : '0.00'} MAD`}
        />
      </View>

      {booking.odometerStart !== undefined && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>{t('checkIn.vehicleBefore')}</Text>
          <InfoRow
            label={t('checkIn.odometerStart')}
            value={booking.odometerStart.toString()}
          />
          {booking.fuelLevelStart && (
            <InfoRow
              label={t('checkIn.fuelLevelStart')}
              value={t(`fuel.${booking.fuelLevelStart}`)}
            />
          )}
        </View>
      )}

      {booking.odometerEnd !== undefined && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>{t('checkOut.vehicleAfter')}</Text>
          <InfoRow
            label={t('checkOut.odometerEnd')}
            value={booking.odometerEnd.toString()}
          />
          {booking.fuelLevelEnd && (
            <InfoRow
              label={t('checkOut.fuelLevelEnd')}
              value={t(`fuel.${booking.fuelLevelEnd}`)}
            />
          )}
        </View>
      )}

      {canCheckIn && (
        <Button
          title={t('booking.checkIn')}
          onPress={handleCheckIn}
          style={styles.actionButton}
        />
      )}

      {canCheckOut && (
        <Button
          title={t('booking.checkOut')}
          onPress={handleCheckOut}
          style={styles.actionButton}
        />
      )}
    </ScrollView>
  );
};

const InfoRow: React.FC<{ label: string; value: string }> = ({ label, value }) => (
  <View style={styles.infoRow}>
    <Text style={styles.infoLabel}>{label}:</Text>
    <Text style={styles.infoValue}>{value}</Text>
  </View>
);

const getStatusColor = (status: BookingStatus): string => {
  switch (status) {
    case 'PENDING':
      return '#FFA500';
    case 'CONFIRMED':
      return '#007AFF';
    case 'ACTIVE':
      return '#34C759';
    case 'COMPLETED':
      return '#8E8E93';
    case 'CANCELLED':
      return '#FF3B30';
    default:
      return '#8E8E93';
  }
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F5F5',
  },
  content: {
    padding: 16,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 24,
  },
  bookingNumberLabel: {
    fontSize: 12,
    color: '#666',
    marginBottom: 4,
  },
  bookingId: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#000',
  },
  statusBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
  },
  statusText: {
    color: '#FFF',
    fontSize: 14,
    fontWeight: '600',
  },
  section: {
    backgroundColor: '#FFF',
    borderRadius: 8,
    padding: 16,
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 12,
    color: '#000',
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  infoLabel: {
    fontSize: 14,
    color: '#666',
  },
  infoValue: {
    fontSize: 14,
    fontWeight: '600',
    color: '#000',
  },
  actionButton: {
    marginTop: 8,
  },
  contactRow: {
    marginBottom: 8,
  },
  contactButtons: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 4,
  },
  contactButton: {
    backgroundColor: '#007AFF',
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 6,
    flex: 1,
    alignItems: 'center',
  },
  whatsappButton: {
    backgroundColor: '#25D366',
  },
  contactButtonText: {
    color: '#FFF',
    fontSize: 14,
    fontWeight: '600',
  },
});
