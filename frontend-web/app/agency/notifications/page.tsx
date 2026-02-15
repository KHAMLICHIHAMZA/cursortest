'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '@/lib/api/client';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { MainLayout } from '@/components/layout/main-layout';
import { RouteGuard } from '@/components/auth/route-guard';

interface Notification {
  id: string;
  type: string;
  status: 'DRAFT' | 'SCHEDULED' | 'SENT' | 'READ';
  title: string;
  message: string;
  actionUrl: string | null;
  createdAt: string;
  readAt: string | null;
}

const TYPE_COLORS: Record<string, string> = {
  CONTRACT_TO_SIGN: 'bg-indigo-500',
  INVOICE_AVAILABLE: 'bg-purple-500',
  BOOKING_LATE: 'bg-red-500',
  CHECK_OUT_REMINDER: 'bg-orange-500',
  INCIDENT_REPORTED: 'bg-red-400',
  SYSTEM_ALERT: 'bg-gray-500',
  ADMIN_ANNOUNCEMENT: 'bg-blue-500',
};

const TYPE_LABELS: Record<string, string> = {
  CONTRACT_TO_SIGN: 'Contrat',
  INVOICE_AVAILABLE: 'Facture',
  BOOKING_LATE: 'Retard',
  CHECK_OUT_REMINDER: 'Check-out',
  INCIDENT_REPORTED: 'Incident',
  SYSTEM_ALERT: 'Système',
  ADMIN_ANNOUNCEMENT: 'Annonce',
};

export default function NotificationsPage() {
  const queryClient = useQueryClient();

  const { data: rawNotifications, isLoading } = useQuery<Notification[]>({
    queryKey: ['notifications'],
    queryFn: async () => {
      const res = await apiClient.get('/notifications/in-app');
      return res.data ?? [];
    },
  });
  const notifications = rawNotifications ?? [];

  const { data: unreadCount } = useQuery<{ count: number }>({
    queryKey: ['notifications-count'],
    queryFn: async () => {
      const res = await apiClient.get('/notifications/in-app/unread-count');
      return res.data;
    },
  });

  const markAsReadMutation = useMutation({
    mutationFn: async (id: string) => {
      return apiClient.patch(`/notifications/in-app/${id}/read`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
      queryClient.invalidateQueries({ queryKey: ['notifications-count'] });
    },
  });

  const markAllAsReadMutation = useMutation({
    mutationFn: async () => {
      return apiClient.post('/notifications/in-app/read-all');
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
      queryClient.invalidateQueries({ queryKey: ['notifications-count'] });
    },
  });

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString('fr-MA', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  if (isLoading) {
    return (
      <RouteGuard allowedRoles={['SUPER_ADMIN', 'COMPANY_ADMIN', 'AGENCY_MANAGER', 'AGENT']}>
        <MainLayout>
          <div className="text-center py-8">Chargement...</div>
        </MainLayout>
      </RouteGuard>
    );
  }

  return (
    <RouteGuard allowedRoles={['SUPER_ADMIN', 'COMPANY_ADMIN', 'AGENCY_MANAGER', 'AGENT']}>
      <MainLayout>
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold">Notifications</h1>
          {unreadCount && unreadCount.count > 0 && (
            <p className="text-sm text-muted-foreground">
              {unreadCount.count} non lue{unreadCount.count > 1 ? 's' : ''}
            </p>
          )}
        </div>
        <Button
          variant="outline"
          onClick={() => markAllAsReadMutation.mutate()}
          disabled={markAllAsReadMutation.isPending || !notifications.some((n) => !n.readAt)}
        >
          Tout marquer comme lu
        </Button>
      </div>

      <div className="space-y-4">
        {notifications.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">Aucune notification</div>
        ) : (
          notifications.map((notification) => (
            <div
              key={notification.id}
              className={`p-4 border rounded-lg ${
                notification.readAt
                  ? 'bg-muted/50'
                  : 'bg-background border-primary/20'
              }`}
            >
              <div className="flex justify-between items-start">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2">
                    <Badge className={TYPE_COLORS[notification.type] || 'bg-gray-500'}>
                      {TYPE_LABELS[notification.type] || notification.type}
                    </Badge>
                    <span className="text-sm text-muted-foreground">
                      {formatDate(notification.createdAt)}
                    </span>
                    {!notification.readAt && (
                      <span className="w-2 h-2 bg-primary rounded-full"></span>
                    )}
                  </div>
                  <h3 className="font-medium">{notification.title}</h3>
                  <p className="text-muted-foreground mt-1">{notification.message}</p>
                </div>
                <div className="flex gap-2">
                  {notification.actionUrl && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => (window.location.href = notification.actionUrl!)}
                    >
                      Voir
                    </Button>
                  )}
                  {!notification.readAt && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => markAsReadMutation.mutate(notification.id)}
                      disabled={markAsReadMutation.isPending}
                    >
                      ✓
                    </Button>
                  )}
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
      </MainLayout>
    </RouteGuard>
  );
}
