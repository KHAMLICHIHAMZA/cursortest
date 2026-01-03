import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import NetInfo from '@react-native-community/netinfo';
import { useTranslation } from 'react-i18next';
import { offlineService } from '../services/offline.service';

export const OfflineIndicator: React.FC = () => {
  const { t } = useTranslation();
  const [isOnline, setIsOnline] = useState(true);
  const [pendingCount, setPendingCount] = useState(0);

  useEffect(() => {
    const unsubscribe = NetInfo.addEventListener((state) => {
      setIsOnline(state.isConnected === true);
    });

    const checkPending = async () => {
      const count = await offlineService.getActionCount();
      setPendingCount(count);
    };

    checkPending();
    const interval = setInterval(checkPending, 5000);

    return () => {
      unsubscribe();
      clearInterval(interval);
    };
  }, []);

  if (isOnline && pendingCount === 0) return null;

  return (
    <View style={[styles.container, !isOnline && styles.offline]}>
      <Text style={styles.text}>
        {!isOnline
          ? t('offline.message')
          : `${pendingCount} ${t('offline.syncPending')}`}
      </Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#FFA500',
    paddingVertical: 8,
    paddingHorizontal: 16,
    alignItems: 'center',
  },
  offline: {
    backgroundColor: '#FF3B30',
  },
  text: {
    color: '#FFF',
    fontSize: 12,
    fontWeight: '600',
  },
});

