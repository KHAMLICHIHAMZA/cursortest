import NetInfo from '@react-native-community/netinfo';
import { offlineService, OfflineAction } from './offline.service';
import api from './api';
import * as FileSystem from 'expo-file-system';

class SyncService {
  private isSyncing = false;
  private syncInterval: NodeJS.Timeout | null = null;

  async startAutoSync(intervalMs: number = 30000): Promise<void> {
    if (this.syncInterval) return;

    this.syncInterval = setInterval(async () => {
      const state = await NetInfo.fetch();
      if (state.isConnected) {
        await this.syncPendingActions();
      }
    }, intervalMs);
  }

  stopAutoSync(): void {
    if (this.syncInterval) {
      clearInterval(this.syncInterval);
      this.syncInterval = null;
    }
  }

  async syncPendingActions(): Promise<void> {
    if (this.isSyncing) return;

    const state = await NetInfo.fetch();
    if (!state.isConnected) return;

    this.isSyncing = true;

    try {
      const actions = await offlineService.getPendingActions();

      for (const action of actions) {
        try {
          await this.processAction(action);
          await offlineService.removeAction(action.id);
        } catch (error: any) {
          await offlineService.updateActionError(
            action.id,
            error.message || 'Unknown error'
          );
        }
      }
    } finally {
      this.isSyncing = false;
    }
  }

  private async processAction(action: OfflineAction): Promise<void> {
    const payload = JSON.parse(action.payload);

    // Upload files first if any
    const uploadedFiles: string[] = [];
    if (action.files && action.files.length > 0) {
      for (const fileUri of action.files) {
        const uploadedUrl = await this.uploadFile(fileUri);
        uploadedFiles.push(uploadedUrl);
      }
    }

    // Update payload with uploaded file URLs
    if (uploadedFiles.length > 0) {
      // Merge uploaded files into payload based on action type
      // This is action-specific logic
    }

    // Execute the action
    switch (action.actionType) {
      case 'BOOKING_CREATE':
        await api.post('/bookings', payload);
        break;
      case 'BOOKING_CHECKIN':
        await api.post(`/bookings/${payload.bookingId}/checkin`, payload);
        break;
      case 'BOOKING_CHECKOUT':
        await api.post(`/bookings/${payload.bookingId}/checkout`, payload);
        break;
      default:
        throw new Error(`Unknown action type: ${action.actionType}`);
    }
  }

  async uploadFile(fileUri: string): Promise<string> {
    try {
      // Lire le fichier depuis le système de fichiers
      const fileInfo = await FileSystem.getInfoAsync(fileUri);
      if (!fileInfo.exists) {
        throw new Error(`File not found: ${fileUri}`);
      }

      const filename = fileUri.split('/').pop() || 'file';
      const formData = new FormData();
      
      // Pour React Native, utiliser le format correct
      formData.append('file', {
        uri: fileUri,
        type: 'image/jpeg', // Détecter le type MIME si possible
        name: filename,
      } as any);

      const response = await api.post('/upload', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
        timeout: 60000, // 60 secondes pour les gros fichiers
      });

      return response.data.url;
    } catch (error: any) {
      console.error('Error uploading file:', error);
      throw new Error(`Failed to upload file: ${error.message}`);
    }
  }

  async isOnline(): Promise<boolean> {
    const state = await NetInfo.fetch();
    return state.isConnected === true;
  }
}

export const syncService = new SyncService();

