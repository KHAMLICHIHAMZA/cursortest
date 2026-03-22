import { apiClient } from './client';

/** Aligné sur l’API backend `/notifications/in-app` */
export interface InAppNotification {
  id: string;
  type?: string;
  title: string;
  message: string;
  actionUrl?: string | null;
  readAt?: string | null;
  createdAt: string;
}

export const inAppNotificationApi = {
  getRecent: async (limit = 10, unreadOnly = false): Promise<InAppNotification[]> => {
    const res = await apiClient.get<InAppNotification[]>('/notifications/in-app', {
      params: { limit, unreadOnly: unreadOnly ? 'true' : undefined },
    });
    return res.data ?? [];
  },

  getUnreadCount: async (): Promise<number> => {
    const res = await apiClient.get<{ count: number }>('/notifications/in-app/unread-count');
    return res.data?.count ?? 0;
  },

  markAsRead: async (id: string): Promise<void> => {
    await apiClient.patch(`/notifications/in-app/${id}/read`);
  },

  markAllAsRead: async (): Promise<void> => {
    await apiClient.post('/notifications/in-app/read-all');
  },
};
