import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
} from 'react-native';
import { useTranslation } from 'react-i18next';
import { Picker } from '@react-native-picker/picker';
import { Input } from './Input';
import { PhotoPicker } from './PhotoPicker';
import { Damage, DamageZone, DamageType, DamageSeverity } from '../types';

interface DamageFormProps {
  damages: Damage[];
  onDamagesChange: (damages: Damage[]) => void;
  label?: string;
}

export const DamageForm: React.FC<DamageFormProps> = ({
  damages,
  onDamagesChange,
  label,
}) => {
  const { t } = useTranslation();

  const addDamage = () => {
    const newDamage: Damage = {
      zone: 'FRONT',
      type: 'SCRATCH',
      severity: 'LOW',
      description: '',
      photos: [],
    };
    onDamagesChange([...damages, newDamage]);
  };

  const removeDamage = (index: number) => {
    const newDamages = damages.filter((_, i) => i !== index);
    onDamagesChange(newDamages);
  };

  const updateDamage = (index: number, field: keyof Damage, value: any) => {
    const newDamages = [...damages];
    newDamages[index] = { ...newDamages[index], [field]: value };
    onDamagesChange(newDamages);
  };

  return (
    <View style={styles.container}>
      {label && <Text style={styles.label}>{label}</Text>}

      {damages.map((damage, index) => (
        <View key={index} style={styles.damageCard}>
          <View style={styles.damageHeader}>
            <Text style={styles.damageTitle}>
              {t('checkIn.damage.title') || 'Damage'} {index + 1}
            </Text>
            <TouchableOpacity
              onPress={() => removeDamage(index)}
              style={styles.removeButton}
            >
              <Text style={styles.removeButtonText}>×</Text>
            </TouchableOpacity>
          </View>

          <View style={styles.pickerContainer}>
            <Text style={styles.pickerLabel}>
              {t('checkIn.damage.zone')} <Text style={styles.required}>*</Text>
            </Text>
            <Picker
              selectedValue={damage.zone}
              onValueChange={(value) => updateDamage(index, 'zone', value)}
            >
              {(['FRONT', 'REAR', 'LEFT', 'RIGHT', 'ROOF', 'INTERIOR', 'WHEELS', 'WINDOWS'] as DamageZone[]).map(
                (zone) => (
                  <Picker.Item
                    key={zone}
                    label={t(`damage.zones.${zone}`)}
                    value={zone}
                  />
                )
              )}
            </Picker>
          </View>

          <View style={styles.pickerContainer}>
            <Text style={styles.pickerLabel}>
              {t('checkIn.damage.type')} <Text style={styles.required}>*</Text>
            </Text>
            <Picker
              selectedValue={damage.type}
              onValueChange={(value) => updateDamage(index, 'type', value)}
            >
              {(['SCRATCH', 'DENT', 'BROKEN', 'PAINT', 'GLASS', 'OTHER'] as DamageType[]).map(
                (type) => (
                  <Picker.Item
                    key={type}
                    label={t(`damage.types.${type}`)}
                    value={type}
                  />
                )
              )}
            </Picker>
          </View>

          <View style={styles.pickerContainer}>
            <Text style={styles.pickerLabel}>
              {t('checkIn.damage.severity')} <Text style={styles.required}>*</Text>
            </Text>
            <Picker
              selectedValue={damage.severity}
              onValueChange={(value) => updateDamage(index, 'severity', value)}
            >
              {(['LOW', 'MEDIUM', 'HIGH'] as DamageSeverity[]).map((severity) => (
                <Picker.Item
                  key={severity}
                  label={t(`damage.severities.${severity}`)}
                  value={severity}
                />
              ))}
            </Picker>
          </View>

          <Input
            label={t('checkIn.damage.description')}
            value={damage.description || ''}
            onChangeText={(text) => updateDamage(index, 'description', text)}
            multiline
            numberOfLines={3}
          />

          <PhotoPicker
            photos={damage.photos}
            onPhotosChange={(photos) => updateDamage(index, 'photos', photos)}
            minPhotos={1}
            label={t('checkIn.damage.photos')}
            required
          />
        </View>
      ))}

      <TouchableOpacity style={styles.addButton} onPress={addDamage}>
        <Text style={styles.addButtonText}>+ {t('checkIn.addDamage')}</Text>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginBottom: 16,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 8,
    color: '#000',
  },
  damageCard: {
    backgroundColor: '#FFF',
    borderRadius: 8,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#DDD',
  },
  damageHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  damageTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#000',
  },
  removeButton: {
    backgroundColor: '#FF3B30',
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  removeButtonText: {
    color: '#FFF',
    fontSize: 18,
    fontWeight: 'bold',
  },
  pickerContainer: {
    marginBottom: 16,
  },
  pickerLabel: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 8,
    color: '#000',
  },
  required: {
    color: '#FF3B30',
  },
  addButton: {
    backgroundColor: '#007AFF',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    alignItems: 'center',
  },
  addButtonText: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: '600',
  },
});

