import { apiService } from './api';

export interface InAppNotification {
  id: string;
  type: 'CONTRACT_TO_SIGN' | 'INVOICE_AVAILABLE' | 'BOOKING_LATE' | 'CHECK_OUT_REMINDER' | 'INCIDENT_REPORTED' | 'SYSTEM_ALERT';
  status: 'DRAFT' | 'SCHEDULED' | 'SENT' | 'READ';
  title: string;
  message: string;
  actionUrl: string | null;
  bookingId: string | null;
  contractId: string | null;
  invoiceId: string | null;
  createdAt: string;
  readAt: string | null;
}

class NotificationService {
  async getNotifications(options?: {
    unreadOnly?: boolean;
    limit?: number;
  }): Promise<InAppNotification[]> {
    const params = new URLSearchParams();
    if (options?.unreadOnly) params.set('unreadOnly', 'true');
    if (options?.limit) params.set('limit', String(options.limit));

    const response = await apiService.get(`/notifications/in-app?${params.toString()}`);
    return response.data;
  }

  async getUnreadCount(): Promise<number> {
    const response = await apiService.get('/notifications/in-app/unread-count');
    return response.data.count;
  }

  async markAsRead(id: string): Promise<InAppNotification> {
    const response = await apiService.patch(`/notifications/in-app/${id}/read`);
    return response.data;
  }

  async markAllAsRead(): Promise<number> {
    const response = await apiService.post('/notifications/in-app/read-all');
    return response.data.markedAsRead;
  }
}

export const notificationService = new NotificationService();
