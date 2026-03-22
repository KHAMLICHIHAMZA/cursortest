'use client';

import { useEffect, useRef, useState } from 'react';
import { Bell, User, Menu } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ThemeToggle } from '@/components/ui/theme-toggle';
import Link from 'next/link';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '@/lib/api/client';
import { useRouter } from 'next/navigation';

interface HeaderProps {
  userName?: string;
  userRole?: string;
  onMenuClick?: () => void;
}

interface InAppNotificationItem {
  id: string;
  title: string;
  message: string;
  actionUrl: string | null;
  createdAt: string;
  readAt: string | null;
}

export function Header({ userName, userRole, onMenuClick }: HeaderProps) {
  const queryClient = useQueryClient();
  const router = useRouter();
  const [isNotificationsOpen, setIsNotificationsOpen] = useState(false);
  const notificationsRef = useRef<HTMLDivElement | null>(null);

  const profileHref = userRole === 'SUPER_ADMIN'
    ? '/admin/profile'
    : userRole === 'COMPANY_ADMIN'
      ? '/company/profile'
      : '/agency/profile';
  const notificationsHref = userRole === 'COMPANY_ADMIN' ? '/company/notifications' : '/agency/notifications';

  const { data: unreadData } = useQuery<{ count: number }>({
    queryKey: ['header-notifications-count', userRole],
    queryFn: async () => {
      const res = await apiClient.get('/notifications/in-app/unread-count');
      return res.data;
    },
    retry: false,
    refetchOnWindowFocus: false,
    refetchInterval: 30000,
    staleTime: 15000,
  });
  const unreadCount = unreadData?.count || 0;

  const { data: notifications = [], isLoading: notificationsLoading } = useQuery<InAppNotificationItem[]>({
    queryKey: ['header-notifications-list', userRole],
    queryFn: async () => {
      const res = await apiClient.get('/notifications/in-app', {
        params: { limit: '8' },
      });
      return res.data ?? [];
    },
    retry: false,
    enabled: isNotificationsOpen,
    staleTime: 30000,
  });

  const markAsReadMutation = useMutation({
    mutationFn: async (id: string) => apiClient.patch(`/notifications/in-app/${id}/read`),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['header-notifications-count'] });
      await queryClient.invalidateQueries({ queryKey: ['header-notifications-list'] });
    },
  });

  useEffect(() => {
    const handleOutsideClick = (event: MouseEvent) => {
      if (!notificationsRef.current) return;
      if (!notificationsRef.current.contains(event.target as Node)) {
        setIsNotificationsOpen(false);
      }
    };
    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setIsNotificationsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleOutsideClick);
    document.addEventListener('keydown', handleEscape);
    return () => {
      document.removeEventListener('mousedown', handleOutsideClick);
      document.removeEventListener('keydown', handleEscape);
    };
  }, []);

  const handleNotificationClick = async (notification: InAppNotificationItem) => {
    if (!notification.readAt) {
      await markAsReadMutation.mutateAsync(notification.id);
    }
    setIsNotificationsOpen(false);
    router.push(notification.actionUrl || notificationsHref);
  };

  return (
    <header className="fixed top-0 left-0 lg:left-64 right-0 h-14 md:h-16 bg-card border-b border-border flex items-center justify-between px-3 md:px-6 z-10">
      <div className="flex items-center gap-2 md:gap-4 flex-1 min-w-0">
        {/* Hamburger menu - mobile only */}
        <button
          onClick={onMenuClick}
          className="lg:hidden p-2 rounded-md text-text-muted hover:text-text hover:bg-background flex-shrink-0"
        >
          <Menu className="w-5 h-5" />
        </button>

      </div>

      <div className="flex items-center gap-2 md:gap-4 flex-shrink-0">
        <ThemeToggle />
        <div className="relative" ref={notificationsRef}>
          <Button variant="ghost" size="sm" onClick={() => setIsNotificationsOpen((prev) => !prev)}>
            <Bell className="w-5 h-5 text-text-muted" />
          </Button>
          {unreadCount > 0 && (
            <span className="absolute -top-1 -right-1 min-w-[18px] h-[18px] px-1 rounded-full bg-red-500 text-white text-[10px] leading-[18px] text-center font-semibold">
              {unreadCount > 99 ? '99+' : unreadCount}
            </span>
          )}

          {isNotificationsOpen && (
            <div className="absolute right-0 mt-2 w-[340px] max-w-[90vw] rounded-xl border border-border bg-card shadow-xl z-50">
              <div className="px-4 py-3 border-b border-border flex items-center justify-between">
                <p className="text-sm font-semibold text-text">Notifications</p>
                {unreadCount > 0 && (
                  <span className="text-xs text-text-muted">{unreadCount} non lue{unreadCount > 1 ? 's' : ''}</span>
                )}
              </div>
              <div className="max-h-[380px] overflow-y-auto">
                {notificationsLoading ? (
                  <p className="px-4 py-4 text-sm text-text-muted">Chargement...</p>
                ) : notifications.length === 0 ? (
                  <p className="px-4 py-4 text-sm text-text-muted">Aucune notification</p>
                ) : (
                  notifications.map((notification) => (
                    <button
                      key={notification.id}
                      type="button"
                      onClick={() => handleNotificationClick(notification)}
                      className={`w-full text-left px-4 py-3 border-b border-border/60 hover:bg-background transition-colors ${
                        notification.readAt ? '' : 'bg-primary/5'
                      }`}
                    >
                      <div className="flex items-start justify-between gap-2">
                        <p className="text-sm font-medium text-text line-clamp-1">{notification.title}</p>
                        {!notification.readAt && <span className="mt-1 w-2 h-2 rounded-full bg-primary flex-shrink-0" />}
                      </div>
                      <p className="text-xs text-text-muted mt-1 line-clamp-2">{notification.message}</p>
                    </button>
                  ))
                )}
              </div>
              <div className="px-4 py-2 border-t border-border">
                <Link
                  href={notificationsHref}
                  className="text-xs text-primary hover:underline"
                  onClick={() => setIsNotificationsOpen(false)}
                >
                  Voir toutes les notifications
                </Link>
              </div>
            </div>
          )}
        </div>

        {/* User info - hidden on mobile, visible on md+ */}
        <Link href={profileHref} className="hidden md:flex items-center gap-3 px-4 py-2 rounded-lg bg-background border border-border hover:border-primary/50 transition-colors cursor-pointer">
          <div className="w-8 h-8 rounded-full bg-primary flex items-center justify-center">
            <User className="w-4 h-4 text-white" />
          </div>
          <div className="flex flex-col">
            <span className="text-sm font-medium text-text">{userName || 'Utilisateur'}</span>
            <span className="text-xs text-text-muted">{userRole || 'Rôle'}</span>
          </div>
        </Link>

        {/* User avatar only - mobile */}
        <Link href={profileHref} className="md:hidden w-8 h-8 rounded-full bg-primary flex items-center justify-center">
          <User className="w-4 h-4 text-white" />
        </Link>
      </div>
    </header>
  );
}
