/**
 * AppStack - Navigation principale de l'application Agent
 * 
 * IMPORTANT (Spécifications MALOC) :
 * - L'app Agent est un outil d'EXÉCUTION TERRAIN uniquement
 * - Pas d'accès aux charges, amendes, flotte globale
 * - Les tâches sont dérivées des bookings (non persistées)
 * - Création booking uniquement pour AGENCY_MANAGER
 * 
 * Conformité : SPECIFICATIONS_FONCTIONNELLES.md
 */

import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { useTranslation } from 'react-i18next';
import { BookingsScreen } from '../screens/BookingsScreen';
import { BookingDetailsScreen } from '../screens/BookingDetailsScreen';
import { CreateBookingScreen } from '../screens/CreateBookingScreen';
import { CheckInScreen } from '../screens/CheckInScreen';
import { CheckOutScreen } from '../screens/CheckOutScreen';
import { SettingsScreen } from '../screens/SettingsScreen';
import { useAuth } from '../contexts/AuthContext';

const Stack = createNativeStackNavigator();
const Tab = createBottomTabNavigator();

const BookingsStack: React.FC = () => {
  return (
    <Stack.Navigator>
      <Stack.Screen
        name="BookingsList"
        component={BookingsScreen}
        options={{ title: 'Mes missions' }}
      />
      <Stack.Screen
        name="BookingDetails"
        component={BookingDetailsScreen}
        options={{ title: 'Détails' }}
      />
      <Stack.Screen
        name="CreateBooking"
        component={CreateBookingScreen}
        options={{ title: 'Nouvelle réservation' }}
      />
      <Stack.Screen
        name="CheckIn"
        component={CheckInScreen}
        options={{ title: 'Check-in' }}
      />
      <Stack.Screen
        name="CheckOut"
        component={CheckOutScreen}
        options={{ title: 'Check-out' }}
      />
    </Stack.Navigator>
  );
};

export const AppStack: React.FC = () => {
  const { t } = useTranslation();
  const { user, modules } = useAuth();

  // Vérifier si le module BOOKINGS est actif
  const hasBookingsModule = modules.some(
    (m) => (m.id === 'BOOKINGS' || m.name === 'BOOKINGS') && m.isActive
  );

  return (
    <Tab.Navigator>
      {hasBookingsModule && (
        <Tab.Screen
          name="Bookings"
          component={BookingsStack}
          options={{ headerShown: false, title: t('mission.title') || t('booking.title') }}
        />
      )}
      <Tab.Screen
        name="Settings"
        component={SettingsScreen}
        options={{ title: t('settings.title') }}
      />
    </Tab.Navigator>
  );
};

