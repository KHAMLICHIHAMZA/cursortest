'use client';

import { useState, useRef, useEffect } from 'react';
import { Bell, Check, Calendar, Car, Users, AlertTriangle, Info } from 'lucide-react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { inAppNotificationApi, InAppNotification } from '@/lib/api/notification';
import { cn } from '@/lib/utils/cn';
import Link from 'next/link';

const notificationIcons: Record<string, React.ElementType> = {
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

  if (diffMins < 1) return 'A l\'instant';
  if (diffMins < 60) return `Il y a ${diffMins} min`;
  if (diffHours < 24) return `Il y a ${diffHours}h`;
  if (diffDays < 7) return `Il y a ${diffDays}j`;
  return date.toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' });
}

export function NotificationsDropdown() {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const queryClient = useQueryClient();

  const { data: notifications = [], isLoading } = useQuery({
    queryKey: ['notifications', 'recent'],
    queryFn: () => inAppNotificationApi.getRecent(10),
    refetchInterval: 60000, // Refresh every minute
  });

  const { data: unreadCount = 0 } = useQuery({
    queryKey: ['notifications', 'unread-count'],
    queryFn: () => inAppNotificationApi.getUnreadCount(),
    refetchInterval: 30000, // Refresh every 30 seconds
  });

  const markAsReadMutation = useMutation({
    mutationFn: inAppNotificationApi.markAsRead,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
    },
  });

  const markAllAsReadMutation = useMutation({
    mutationFn: inAppNotificationApi.markAllAsRead,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
    },
  });

  // Click outside to close
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Close on escape
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setIsOpen(false);
    };
    document.addEventListener('keydown', handleEscape);
    return () => document.removeEventListener('keydown', handleEscape);
  }, []);

  const handleNotificationClick = (notif: InAppNotification) => {
    if (!notif.read) {
      markAsReadMutation.mutate(notif.id);
    }
  };

  return (
    <div className="relative" ref={dropdownRef}>
      {/* Bell button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex h-8 w-8 items-center justify-center rounded-md text-foreground-subtle hover:text-foreground hover:bg-surface-2 transition-colors relative"
        aria-label="Notifications"
        aria-expanded={isOpen}
      >
        <Bell className="h-4 w-4" />
        {unreadCount > 0 && (
          <span className="absolute top-1 right-1 flex h-2 w-2">
            <span className="absolute inline-flex h-full w-full rounded-full bg-primary opacity-75 animate-ping" />
            <span className="relative inline-flex h-2 w-2 rounded-full bg-primary" />
          </span>
        )}
      </button>

      {/* Dropdown panel */}
      {isOpen && (
        <div className="absolute right-0 top-full mt-2 w-80 rounded-lg border border-border bg-surface-1 shadow-elevation-3 overflow-hidden animate-fade-in z-50">
          {/* Header */}
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
                onClick={() => markAllAsReadMutation.mutate()}
                disabled={markAllAsReadMutation.isPending}
                className="flex items-center gap-1 text-xs text-primary hover:underline disabled:opacity-50"
              >
                <Check className="h-3 w-3" />
                Tout marquer lu
              </button>
            )}
          </div>

          {/* List */}
          <div className="max-h-80 overflow-y-auto">
            {isLoading ? (
              <div className="py-8 text-center">
                <div className="inline-block h-5 w-5 rounded-full border-2 border-surface-3 border-t-primary animate-spin" />
              </div>
            ) : notifications.length === 0 ? (
              <div className="py-12 text-center">
                <Bell className="h-8 w-8 text-foreground-subtle mx-auto mb-2 opacity-50" />
                <p className="text-sm text-foreground-subtle">Aucune notification</p>
              </div>
            ) : (
              notifications.map((notif) => {
                const Icon = notificationIcons[notif.type] || Info;
                return (
                  <div
                    key={notif.id}
                    className={cn(
                      'flex gap-3 px-4 py-3 border-b border-border last:border-0 hover:bg-surface-2 transition-colors cursor-pointer',
                      !notif.read && 'bg-primary/5'
                    )}
                    onClick={() => handleNotificationClick(notif)}
                    role="button"
                    tabIndex={0}
                  >
                    <div className={cn(
                      'flex h-8 w-8 items-center justify-center rounded-full flex-shrink-0',
                      notif.read ? 'bg-surface-2 text-foreground-subtle' : 'bg-primary/10 text-primary'
                    )}>
                      <Icon className="h-4 w-4" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className={cn(
                        'text-sm truncate',
                        notif.read ? 'text-foreground-muted' : 'text-foreground font-medium'
                      )}>
                        {notif.title}
                      </p>
                      {notif.message && (
                        <p className="text-xs text-foreground-subtle truncate mt-0.5">
                          {notif.message}
                        </p>
                      )}
                      <p className="text-[10px] text-foreground-subtle mt-1">
                        {formatTimeAgo(notif.createdAt)}
                      </p>
                    </div>
                    {!notif.read && (
                      <div className="flex-shrink-0 mt-1">
                        <div className="h-2 w-2 rounded-full bg-primary" />
                      </div>
                    )}
                  </div>
                );
              })
            )}
          </div>

          {/* Footer */}
          <Link
            href="/agency/notifications"
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
