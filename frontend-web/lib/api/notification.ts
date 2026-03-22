import { apiClient } from './client';

export interface InAppNotification {
  id: string;
  type: 'BOOKING_RETURN' | 'BOOKING_START' | 'MAINTENANCE_DUE' | 'CLIENT_NEW' | 'FINE_ADDED' | 'SYSTEM' | 'INFO';
  title: string;
  message: string;
  read: boolean;
  createdAt: string;
  data?: Record<string, unknown>;
}

export const inAppNotificationApi = {
  getRecent: async (limit = 10, unreadOnly = false): Promise<InAppNotification[]> => {
    const res = await apiClient.get('/notifications/in-app', {
      params: { limit, unreadOnly }
    });
    return res.data;
  },

  getUnreadCount: async (): Promise<number> => {
    const res = await apiClient.get('/notifications/in-app/unread-count');
    return res.data.count;
  },

  markAsRead: async (id: string): Promise<void> => {
    await apiClient.patch(`/notifications/in-app/${id}/read`);
  },

  markAllAsRead: async (): Promise<void> => {
    await apiClient.post('/notifications/in-app/read-all');
  },
};
