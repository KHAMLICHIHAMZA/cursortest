'use client';

import { useState, useRef, useEffect } from 'react';
import {
  Bell,
  Check,
  Calendar,
  Car,
  Users,
  AlertTriangle,
  Info,
  FileText,
  Receipt,
} from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '@/lib/api/client';
import { cn } from '@/lib/utils/cn';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

interface InAppNotificationItem {
  id: string;
  title: string;
  message: string;
  actionUrl: string | null;
  createdAt: string;
  readAt: string | null;
  type?: string | null;
}

const notificationIcons: Record<string, LucideIcon> = {
  CONTRACT_TO_SIGN: FileText,
  INVOICE_AVAILABLE: Receipt,
  BOOKING_LATE: Calendar,
  CHECK_OUT_REMINDER: Calendar,
  INCIDENT_REPORTED: AlertTriangle,
  SYSTEM_ALERT: Info,
  ADMIN_ANNOUNCEMENT: Bell,
  BOOKING_RETURN: Calendar,
  BOOKING_START: Calendar,
  MAINTENANCE_DUE: Car,
  CLIENT_NEW: Users,
  FINE_ADDED: AlertTriangle,
  SYSTEM: Info,
  INFO: Info,
};

function formatTimeAgo(dateString: string): string {
  const date = new Date(dateString);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMins / 60);
  const diffDays = Math.floor(diffHours / 24);

  if (diffMins < 1) return "À l'instant";
  if (diffMins < 60) return `Il y a ${diffMins} min`;
  if (diffHours < 24) return `Il y a ${diffHours}h`;
  if (diffDays < 7) return `Il y a ${diffDays}j`;
  return date.toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' });
}

function notificationsHrefForRole(role?: string): string {
  if (role === 'COMPANY_ADMIN') return '/company/notifications';
  if (role === 'SUPER_ADMIN') return '/admin/notifications';
  return '/agency/notifications';
}

interface NotificationsDropdownProps {
  userRole?: string;
}

export function NotificationsDropdown({ userRole }: NotificationsDropdownProps) {
  const router = useRouter();
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const queryClient = useQueryClient();
  const listHref = notificationsHrefForRole(userRole);

  const {
    data: unreadData,
    isError: unreadError,
  } = useQuery({
    queryKey: ['header-notifications-count', userRole],
    queryFn: async () => {
      const res = await apiClient.get<{ count: number }>('/notifications/in-app/unread-count');
      return res.data?.count ?? 0;
    },
    retry: false,
    refetchInterval: 30000,
    staleTime: 15000,
  });
  const unreadCount = unreadError ? 0 : (unreadData ?? 0);

  const {
    data: notifications = [],
    isLoading,
    isError: listError,
  } = useQuery<InAppNotificationItem[]>({
    queryKey: ['header-notifications-list', userRole],
    queryFn: async () => {
      const res = await apiClient.get<InAppNotificationItem[]>('/notifications/in-app', {
        params: { limit: '10' },
      });
      return res.data ?? [];
    },
    retry: false,
    enabled: isOpen,
    staleTime: 30000,
  });

  const markAsReadMutation = useMutation({
    mutationFn: async (id: string) => {
      await apiClient.patch(`/notifications/in-app/${id}/read`);
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['header-notifications-count'] });
      await queryClient.invalidateQueries({ queryKey: ['header-notifications-list'] });
    },
  });

  const markAllAsReadMutation = useMutation({
    mutationFn: async () => {
      await apiClient.post('/notifications/in-app/read-all');
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['header-notifications-count'] });
      await queryClient.invalidateQueries({ queryKey: ['header-notifications-list'] });
    },
  });

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setIsOpen(false);
    };
    document.addEventListener('keydown', handleEscape);
    return () => document.removeEventListener('keydown', handleEscape);
  }, []);

  const handleRowClick = async (n: InAppNotificationItem) => {
    if (!n.readAt) {
      await markAsReadMutation.mutateAsync(n.id);
    }
    setIsOpen(false);
    router.push(n.actionUrl || listHref);
  };

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="flex h-9 w-9 items-center justify-center rounded-md text-foreground-muted hover:text-foreground hover:bg-surface-2 transition-colors relative"
        aria-label="Notifications"
        aria-expanded={isOpen}
      >
        <Bell className="h-4 w-4" />
        {unreadCount > 0 && (
          <span className="absolute -top-0.5 -right-0.5 min-w-[18px] h-[18px] px-1 rounded-full bg-red-500 text-white text-[10px] leading-[18px] text-center font-semibold">
            {unreadCount > 99 ? '99+' : unreadCount}
          </span>
        )}
      </button>

      {isOpen && (
        <div className="absolute right-0 top-full mt-2 w-[min(100vw-2rem,20rem)] sm:w-80 rounded-lg border border-border bg-surface-1 shadow-elevation-3 overflow-hidden animate-fade-in z-50">
          <div className="flex items-center justify-between px-4 py-3 border-b border-border bg-surface-0">
            <div className="flex items-center gap-2">
              <span className="text-sm font-semibold text-foreground">Notifications</span>
              {unreadCount > 0 && (
                <span className="flex h-5 min-w-5 items-center justify-center rounded-full bg-primary/10 px-1.5 text-[10px] font-semibold text-primary">
                  {unreadCount}
                </span>
              )}
            </div>
            {unreadCount > 0 && (
              <button
                type="button"
                onClick={() => markAllAsReadMutation.mutate()}
                disabled={markAllAsReadMutation.isPending}
                className="flex items-center gap-1 text-xs text-primary hover:underline disabled:opacity-50"
              >
                <Check className="h-3 w-3" />
                Tout marquer lu
              </button>
            )}
          </div>

          <div className="max-h-80 overflow-y-auto">
            {isLoading ? (
              <div className="py-8 text-center">
                <div className="inline-block h-5 w-5 rounded-full border-2 border-surface-3 border-t-primary animate-spin" />
              </div>
            ) : listError ? (
              <div className="py-8 px-4 text-center text-sm text-foreground-subtle">
                Notifications indisponibles (module ou droits requis).
              </div>
            ) : notifications.length === 0 ? (
              <div className="py-12 text-center">
                <Bell className="h-8 w-8 text-foreground-subtle mx-auto mb-2 opacity-50" />
                <p className="text-sm text-foreground-subtle">Aucune notification</p>
              </div>
            ) : (
              notifications.map((notif) => {
                const Icon = (notif.type && notificationIcons[notif.type]) || Info;
                const isUnread = !notif.readAt;
                return (
                  <button
                    key={notif.id}
                    type="button"
                    className={cn(
                      'w-full flex gap-3 px-4 py-3 border-b border-border last:border-0 hover:bg-surface-2 transition-colors text-left',
                      isUnread && 'bg-primary/5',
                    )}
                    onClick={() => handleRowClick(notif)}
                  >
                    <div
                      className={cn(
                        'flex h-8 w-8 items-center justify-center rounded-full flex-shrink-0',
                        isUnread ? 'bg-primary/10 text-primary' : 'bg-surface-2 text-foreground-subtle',
                      )}
                    >
                      <Icon className="h-4 w-4" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p
                        className={cn(
                          'text-sm truncate',
                          isUnread ? 'text-foreground font-medium' : 'text-foreground-muted',
                        )}
                      >
                        {notif.title}
                      </p>
                      {notif.message && (
                        <p className="text-xs text-foreground-subtle truncate mt-0.5">{notif.message}</p>
                      )}
                      <p className="text-[10px] text-foreground-subtle mt-1">
                        {formatTimeAgo(notif.createdAt)}
                      </p>
                    </div>
                    {isUnread && (
                      <div className="flex-shrink-0 mt-1">
                        <div className="h-2 w-2 rounded-full bg-primary" />
                      </div>
                    )}
                  </button>
                );
              })
            )}
          </div>

          <Link
            href={listHref}
            className="flex items-center justify-center gap-1 px-4 py-3 text-xs font-medium text-primary hover:bg-surface-2 border-t border-border transition-colors"
            onClick={() => setIsOpen(false)}
          >
            Voir toutes les notifications
          </Link>
        </div>
      )}
    </div>
  );
}
