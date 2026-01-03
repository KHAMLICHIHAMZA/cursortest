import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Image, Alert } from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { useTranslation } from 'react-i18next';

interface PhotoPickerProps {
  photos: string[];
  onPhotosChange: (photos: string[]) => void;
  minPhotos?: number;
  maxPhotos?: number;
  label?: string;
  required?: boolean;
}

export const PhotoPicker: React.FC<PhotoPickerProps> = ({
  photos,
  onPhotosChange,
  minPhotos = 0,
  maxPhotos = 10,
  label,
  required = false,
}) => {
  const { t } = useTranslation();
  const [permission, requestPermission] = ImagePicker.useCameraPermissions();

  const pickImage = async (useCamera: boolean) => {
    if (useCamera) {
      if (!permission?.granted) {
        const result = await requestPermission();
        if (!result.granted) {
          Alert.alert(
            t('common.error'), 
            t('common.cameraPermissionRequired') || 'Autorisation de la caméra requise'
          );
          return;
        }
      }
    }

    try {
      const result = useCamera
        ? await ImagePicker.launchCameraAsync({
            mediaTypes: ['images'],
            allowsEditing: true,
            aspect: [4, 3],
            quality: 0.8,
          })
        : await ImagePicker.launchImageLibraryAsync({
            mediaTypes: ['images'],
            allowsEditing: false, // Désactiver l'édition pour permettre la sélection multiple
            allowsMultipleSelection: true, // Activer la sélection multiple
            selectionLimit: maxPhotos - photos.length, // Limiter le nombre de photos sélectionnables
            quality: 0.8,
          });

      if (!result.canceled && result.assets && result.assets.length > 0) {
        // Calculer combien de photos on peut encore ajouter
        const remainingSlots = maxPhotos - photos.length;
        const photosToAdd = result.assets.slice(0, remainingSlots);
        
        if (photosToAdd.length > 0) {
          const newPhotos = [...photos, ...photosToAdd.map(asset => asset.uri)];
          
          if (newPhotos.length <= maxPhotos) {
            onPhotosChange(newPhotos);
          } else {
            // Si on dépasse le maximum, ajouter seulement ce qui est possible
            const validPhotos = newPhotos.slice(0, maxPhotos);
            onPhotosChange(validPhotos);
            Alert.alert(
              t('common.error'), 
              t('common.maxPhotosExceeded', { max: maxPhotos }) || `Maximum ${maxPhotos} photos autorisées. Seules les premières photos ont été ajoutées.`
            );
          }
          
          // Avertir si certaines photos n'ont pas pu être ajoutées
          if (result.assets.length > remainingSlots) {
            Alert.alert(
              t('common.warning') || 'Attention',
              t('common.somePhotosNotAdded', { 
                added: photosToAdd.length, 
                total: result.assets.length,
                max: maxPhotos 
              }) || `${photosToAdd.length} sur ${result.assets.length} photos ajoutées (maximum ${maxPhotos} photos autorisées)`
            );
          }
        } else {
          Alert.alert(
            t('common.error'),
            t('common.maxPhotosReached', { max: maxPhotos }) || `Vous avez déjà atteint le maximum de ${maxPhotos} photos`
          );
        }
      }
    } catch (error: any) {
      const errorMessage = useCamera 
        ? (t('common.errorPickingCamera') || 'Erreur lors de la prise de photo')
        : (t('common.errorPickingGallery') || 'Erreur lors de la sélection depuis la galerie');
      Alert.alert(t('common.error'), errorMessage);
    }
  };

  const removePhoto = (index: number) => {
    const newPhotos = photos.filter((_, i) => i !== index);
    onPhotosChange(newPhotos);
  };

  return (
    <View style={styles.container}>
      {label && (
        <Text style={styles.label}>
          {label}
          {required && <Text style={styles.required}> *</Text>}
        </Text>
      )}

      <View style={styles.buttonRow}>
        <TouchableOpacity
          style={styles.button}
          onPress={() => pickImage(true)}
        >
          <Text style={styles.buttonText}>📷 {t('common.camera') || 'Camera'}</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.button}
          onPress={() => pickImage(false)}
        >
          <Text style={styles.buttonText}>🖼️ {t('common.gallery') || 'Gallery'}</Text>
        </TouchableOpacity>
      </View>

      {photos.length < minPhotos && (
        <Text style={styles.error}>
          {t('common.minPhotos', { count: minPhotos }) || `Minimum ${minPhotos} photos requises`}
        </Text>
      )}

      <View style={styles.photosGrid}>
        {photos.map((uri, index) => (
          <View key={index} style={styles.photoContainer}>
            <Image source={{ uri }} style={styles.photo} />
            <TouchableOpacity
              style={styles.removeButton}
              onPress={() => removePhoto(index)}
            >
              <Text style={styles.removeButtonText}>×</Text>
            </TouchableOpacity>
          </View>
        ))}
      </View>
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
  required: {
    color: '#FF3B30',
  },
  buttonRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 8,
  },
  button: {
    flex: 1,
    backgroundColor: '#007AFF',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    alignItems: 'center',
  },
  buttonText: {
    color: '#FFF',
    fontSize: 14,
    fontWeight: '600',
  },
  photosGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  photoContainer: {
    position: 'relative',
    width: 100,
    height: 100,
  },
  photo: {
    width: '100%',
    height: '100%',
    borderRadius: 8,
  },
  removeButton: {
    position: 'absolute',
    top: -8,
    right: -8,
    backgroundColor: '#FF3B30',
    width: 24,
    height: 24,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  removeButtonText: {
    color: '#FFF',
    fontSize: 18,
    fontWeight: 'bold',
  },
  error: {
    color: '#FF3B30',
    fontSize: 12,
    marginTop: 4,
  },
});

