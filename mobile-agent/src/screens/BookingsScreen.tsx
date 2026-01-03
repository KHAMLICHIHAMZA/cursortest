/**
 * BookingsScreen - Écran "Mes missions"
 * 
 * IMPORTANT (Spécifications MALOC) :
 * - Cet écran affiche les MISSIONS dérivées des bookings (pas les bookings directement)
 * - Les missions sont calculées à la volée : CONFIRMED → CHECK_IN, ACTIVE → CHECK_OUT
 * - Aucune entité Task n'est persistée en base
 * - L'agent voit UNIQUEMENT ses missions avec infos minimales nécessaires à l'exécution
 * - Navigation directe vers CheckInScreen/CheckOutScreen depuis le bouton "DÉMARRER LA MISSION"
 * - Regroupement par sections : Aujourd'hui, À venir, En retard
 * 
 * Conformité : SPECIFICATIONS_FONCTIONNELLES.md
 */

import React, { useEffect, useMemo, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  RefreshControl,
  SectionList,
} from 'react-native';
import { useTranslation } from 'react-i18next';
import { useQuery } from '@tanstack/react-query';
import { useNavigation } from '@react-navigation/native';
import { bookingService } from '../services/booking.service';
import { Booking } from '../types';
import { useAuth } from '../contexts/AuthContext';
import { getAgentTasks, groupTasksBySections, TaskSection } from '../utils/tasks.utils';
import { AgentTask } from '../types';
import { offlineService } from '../services/offline.service';

export const BookingsScreen: React.FC = () => {
  const { t } = useTranslation();
  const navigation = useNavigation();
  const { agencies, user } = useAuth();
  const agencyId = agencies[0]?.id;
  const [pendingOfflineActions, setPendingOfflineActions] = useState<Set<string>>(new Set());

  // Debug: Log pour vérifier les agences
  useEffect(() => {
    if (agencies && agencies.length > 0) {
      console.log('📋 Agences disponibles:', agencies.map(a => ({ id: a.id, name: a.name })));
      console.log('📋 Agence utilisée pour filtrer:', agencyId);
    } else {
      console.warn('⚠️  Aucune agence trouvée pour l\'utilisateur');
    }
  }, [agencies, agencyId]);

  // Charger les actions offline en attente pour afficher les badges
  useEffect(() => {
    const loadPendingActions = async () => {
      try {
        const actions = await offlineService.getPendingActions();
        const bookingIds = new Set<string>();
        actions.forEach(action => {
          try {
            const payload = JSON.parse(action.payload);
            if (payload.bookingId) {
              bookingIds.add(payload.bookingId);
            }
          } catch (e) {
            // Ignore invalid payloads
          }
        });
        setPendingOfflineActions(bookingIds);
      } catch (error) {
        console.error('Error loading pending actions:', error);
      }
    };

    loadPendingActions();
    const interval = setInterval(loadPendingActions, 5000); // Refresh every 5 seconds

    return () => clearInterval(interval);
  }, []);

  const {
    data: bookings,
    isLoading,
    refetch,
    isRefetching,
  } = useQuery({
    queryKey: ['bookings', agencyId, user?.agencyIds],
    queryFn: async () => {
      // Vérifier que l'agence est bien dans les agences de l'utilisateur
      const isValidAgency = agencyId && user?.agencyIds?.includes(agencyId);
      
      if (!isValidAgency && user?.agencyIds && user.agencyIds.length > 0) {
        console.warn('⚠️  L\'agence sélectionnée n\'est pas dans les agences de l\'utilisateur');
        console.warn('   Agences de l\'utilisateur:', user.agencyIds);
        console.warn('   Agence sélectionnée:', agencyId);
        // Utiliser la première agence de l'utilisateur si l'agence sélectionnée n'est pas valide
        const firstAgencyId = user.agencyIds[0];
        const result = await bookingService.getBookings(firstAgencyId);
        console.log('📦 Réservations récupérées (avec première agence):', result.length);
        return result;
      }
      
      // Si agencyId est fourni et valide, l'utiliser, sinon laisser le backend filtrer par user.agencyIds
      const result = await bookingService.getBookings(isValidAgency ? agencyId : undefined);
      console.log('📦 Réservations récupérées:', result.length);
      return result;
    },
    enabled: !!(agencyId || (user?.agencyIds && user.agencyIds.length > 0)),
  });

  // Calcul des missions (tâches dérivées depuis les bookings)
  // Les missions sont calculées à la volée, jamais persistées
  // Inclure les bookings complétés pour consultation
  const missions = useMemo(() => {
    if (!bookings) return [];
    const tasks = getAgentTasks(bookings, true); // Inclure les complétés
    console.log('📅 Missions dérivées calculées:', tasks.length);
    tasks.forEach((task, index) => {
      console.log(`  ${index + 1}. ${task.type} - Booking ${task.bookingId.slice(0, 8)} - Date: ${new Date(task.date).toLocaleString()}`);
    });
    return tasks;
  }, [bookings]);

  // Séparer les bookings complétés pour le groupement
  const completedBookings = useMemo(() => {
    if (!bookings) return [];
    return bookings.filter(b => b.status === 'COMPLETED');
  }, [bookings]);

  // Regrouper les missions par sections (inclure les complétées)
  const sections = useMemo(() => {
    return groupTasksBySections(missions, true, completedBookings);
  }, [missions, completedBookings]);

  // Préparer les données pour SectionList
  const sectionData = useMemo(() => {
    return sections.map(section => ({
      title: t(`mission.${section.key}`) || section.title,
      data: section.tasks,
      key: section.key,
    }));
  }, [sections, t]);

  const handleStartMission = (mission: AgentTask) => {
    // Vérifier si la mission est complétée (booking COMPLETED)
    const isCompleted = mission.booking?.status === 'COMPLETED';
    
    if (isCompleted) {
      // Si complétée, rediriger vers les détails (consultation uniquement)
      handleViewDetails(mission);
      return;
    }

    if (mission.type === 'CHECK_IN') {
      // @ts-ignore
      navigation.navigate('CheckIn', { bookingId: mission.bookingId });
    } else {
      // @ts-ignore
      navigation.navigate('CheckOut', { bookingId: mission.bookingId });
    }
  };

  const handleViewDetails = (mission: AgentTask) => {
    // @ts-ignore
    navigation.navigate('BookingDetails', { bookingId: mission.bookingId });
  };

  const renderMissionCard = ({ item: mission }: { item: AgentTask }) => {
    const hasPendingAction = pendingOfflineActions.has(mission.bookingId);
    const isCheckIn = mission.type === 'CHECK_IN';
    const isCompleted = mission.booking?.status === 'COMPLETED';
    
    return (
      <View style={[styles.missionCard, isCompleted && styles.missionCardCompleted]}>
        {/* Header avec type de mission */}
        <View style={styles.missionHeader}>
          <View style={[styles.missionTypeBadge, isCheckIn ? styles.missionCheckIn : styles.missionCheckOut, isCompleted && styles.missionTypeBadgeCompleted]}>
            <Text style={styles.missionTypeText}>
              {isCheckIn ? t('mission.deliveryCheckIn') : t('mission.recoveryCheckOut')}
              {isCompleted && ' ✓'}
            </Text>
          </View>
          {hasPendingAction && (
            <View style={styles.offlineBadge}>
              <Text style={styles.offlineBadgeText}>{t('mission.syncPending')}</Text>
            </View>
          )}
          {isCompleted && (
            <View style={styles.completedBadge}>
              <Text style={styles.completedBadgeText}>{t('mission.completed') || 'Terminée'}</Text>
            </View>
          )}
        </View>

        {/* Informations client */}
        {mission.client?.name && (
          <View style={styles.missionInfoRow}>
            <Text style={styles.missionInfoLabel}>👤 Client:</Text>
            <Text style={styles.missionInfoValue}>{mission.client.name}</Text>
          </View>
        )}

        {/* Informations véhicule */}
        {mission.vehicle && (
          <View style={styles.missionInfoRow}>
            <Text style={styles.missionInfoLabel}>🚗 Véhicule:</Text>
            <Text style={styles.missionInfoValue}>
              {mission.vehicle.registrationNumber || ''}
              {mission.vehicle.brand && mission.vehicle.model
                ? ` - ${mission.vehicle.brand} ${mission.vehicle.model}`
                : ''}
            </Text>
          </View>
        )}

        {/* Lieu */}
        {mission.location && (
          <View style={styles.missionInfoRow}>
            <Text style={styles.missionInfoLabel}>📍 {t('mission.location')}:</Text>
            <Text style={styles.missionInfoValue}>{mission.location}</Text>
          </View>
        )}

        {/* Date et heure */}
        <View style={styles.missionInfoRow}>
          <Text style={styles.missionInfoLabel}>📅 {t('mission.dateTime')}:</Text>
          <Text style={styles.missionInfoValue}>
            {new Date(mission.date).toLocaleString('fr-FR', {
              day: '2-digit',
              month: '2-digit',
              year: 'numeric',
              hour: '2-digit',
              minute: '2-digit',
            })}
          </Text>
        </View>

        {/* Boutons d'action */}
        <View style={styles.missionActions}>
          {!isCompleted ? (
            <>
              <TouchableOpacity
                style={[styles.startButton, isCheckIn ? styles.startButtonCheckIn : styles.startButtonCheckOut]}
                onPress={() => handleStartMission(mission)}
              >
                <Text style={styles.startButtonText}>{t('mission.startMission')}</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.detailsButton}
                onPress={() => handleViewDetails(mission)}
              >
                <Text style={styles.detailsButtonText}>{t('booking.details')}</Text>
              </TouchableOpacity>
            </>
          ) : (
            <TouchableOpacity
              style={[styles.startButton, styles.startButtonCompleted]}
              onPress={() => handleViewDetails(mission)}
            >
              <Text style={styles.startButtonText}>{t('mission.viewDetails') || 'Voir les détails'}</Text>
            </TouchableOpacity>
          )}
        </View>
      </View>
    );
  };

  const renderSectionHeader = ({ section }: { section: { title: string; key: string } }) => {
    const isOverdue = section.key === 'overdue';
    return (
      <View style={[styles.sectionHeader, isOverdue && styles.sectionHeaderOverdue]}>
        <Text style={[styles.sectionHeaderText, isOverdue && styles.sectionHeaderTextOverdue]}>
          {section.title}
        </Text>
        <Text style={styles.sectionHeaderCount}>
          {section.data.length} {section.data.length > 1 ? 'missions' : 'mission'}
        </Text>
      </View>
    );
  };

  return (
    <View style={styles.container}>
      {/* 
        Création booking : Uniquement pour AGENCY_MANAGER (selon spécifications)
        Les agents simples ne peuvent pas créer de bookings
      */}
      {user?.role === 'AGENCY_MANAGER' && (
        <TouchableOpacity
          style={styles.createButton}
          onPress={() => {
            // @ts-ignore
            navigation.navigate('CreateBooking');
          }}
        >
          <Text style={styles.createButtonText}>
            + {t('booking.create')}
          </Text>
        </TouchableOpacity>
      )}

      {/* Affichage des missions groupées par sections */}
      {missions.length > 0 ? (
        <SectionList
          sections={sectionData}
          renderItem={renderMissionCard}
          renderSectionHeader={renderSectionHeader}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.listContent}
          stickySectionHeadersEnabled={false}
          refreshControl={
            <RefreshControl
              refreshing={isRefetching}
              onRefresh={refetch}
            />
          }
        />
      ) : (
        <View style={styles.emptyContainer}>
          <Text style={styles.emptyText}>{t('mission.noMissions')}</Text>
          {!isLoading && (
            <TouchableOpacity
              style={styles.refreshButton}
              onPress={() => refetch()}
            >
              <Text style={styles.refreshButtonText}>{t('common.refresh')}</Text>
            </TouchableOpacity>
          )}
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F5F5',
  },
  createButton: {
    backgroundColor: '#007AFF',
    paddingVertical: 12,
    paddingHorizontal: 16,
    margin: 16,
    borderRadius: 8,
    alignItems: 'center',
  },
  createButtonText: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: '600',
  },
  listContent: {
    padding: 16,
    paddingBottom: 32,
  },
  sectionHeader: {
    backgroundColor: '#F5F5F5',
    paddingVertical: 8,
    paddingHorizontal: 4,
    marginTop: 16,
    marginBottom: 8,
    borderBottomWidth: 2,
    borderBottomColor: '#007AFF',
  },
  sectionHeaderOverdue: {
    borderBottomColor: '#FF3B30',
  },
  sectionHeaderText: {
    fontSize: 18,
    fontWeight: '700',
    color: '#007AFF',
    marginBottom: 4,
  },
  sectionHeaderTextOverdue: {
    color: '#FF3B30',
  },
  sectionHeaderCount: {
    fontSize: 14,
    color: '#666',
    fontWeight: '500',
  },
  missionCard: {
    backgroundColor: '#FFF',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
    borderLeftWidth: 4,
    borderLeftColor: '#007AFF',
  },
  missionCardCompleted: {
    opacity: 0.7,
    borderLeftColor: '#9E9E9E',
  },
  missionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
    flexWrap: 'wrap',
  },
  missionTypeBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
  },
  missionCheckIn: {
    backgroundColor: '#4CAF50',
  },
  missionCheckOut: {
    backgroundColor: '#FF9800',
  },
  missionTypeText: {
    color: '#FFF',
    fontSize: 13,
    fontWeight: '700',
    textTransform: 'uppercase',
  },
  missionTypeBadgeCompleted: {
    backgroundColor: '#9E9E9E',
  },
  completedBadge: {
    backgroundColor: '#4CAF50',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    marginLeft: 8,
  },
  completedBadgeText: {
    color: '#FFF',
    fontSize: 11,
    fontWeight: '600',
  },
  offlineBadge: {
    backgroundColor: '#FFC107',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    marginLeft: 8,
  },
  offlineBadgeText: {
    color: '#000',
    fontSize: 11,
    fontWeight: '600',
  },
  missionInfoRow: {
    flexDirection: 'row',
    marginBottom: 8,
    alignItems: 'flex-start',
  },
  missionInfoLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#666',
    marginRight: 8,
    minWidth: 100,
  },
  missionInfoValue: {
    fontSize: 14,
    color: '#000',
    flex: 1,
    fontWeight: '500',
  },
  missionActions: {
    flexDirection: 'row',
    marginTop: 16,
    gap: 12,
  },
  startButton: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  startButtonCheckIn: {
    backgroundColor: '#4CAF50',
  },
  startButtonCheckOut: {
    backgroundColor: '#FF9800',
  },
  startButtonCompleted: {
    backgroundColor: '#9E9E9E',
  },
  startButtonText: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: '700',
  },
  detailsButton: {
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#007AFF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  detailsButtonText: {
    color: '#007AFF',
    fontSize: 14,
    fontWeight: '600',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 48,
  },
  emptyText: {
    fontSize: 18,
    color: '#666',
    marginBottom: 16,
  },
  refreshButton: {
    backgroundColor: '#007AFF',
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 8,
  },
  refreshButtonText: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: '600',
  },
});
