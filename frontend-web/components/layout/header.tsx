'use client';

import { Search, User, Menu } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { ThemeToggle } from '@/components/ui/theme-toggle';
import { NotificationsDropdown } from '@/components/layout/notifications-dropdown';
import { useSearch } from '@/contexts/search-context';
import Link from 'next/link';

interface HeaderProps {
  userName?: string;
  userRole?: string;
  onMenuClick?: () => void;
}

export function Header({ userName, userRole, onMenuClick }: HeaderProps) {
  const { searchTerm, setSearchTerm } = useSearch();

  const profileHref =
    userRole === 'SUPER_ADMIN'
      ? '/admin/profile'
      : userRole === 'COMPANY_ADMIN'
        ? '/company/profile'
        : '/agency/profile';

  return (
    <header className="fixed top-0 left-0 lg:left-64 right-0 h-14 md:h-16 bg-surface-0/85 backdrop-blur-xl border-b border-border flex items-center justify-between px-3 md:px-6 z-10">
      <div className="flex items-center gap-2 md:gap-3 flex-1 min-w-0">
        <button
          type="button"
          onClick={onMenuClick}
          className="lg:hidden flex h-9 w-9 items-center justify-center rounded-md text-foreground-muted hover:text-foreground hover:bg-surface-2 transition-colors flex-shrink-0"
          aria-label="Ouvrir le menu"
        >
          <Menu className="h-5 w-5" />
        </button>

        <div className="relative flex-1 min-w-0 max-w-[min(100%,14rem)] sm:max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-foreground-subtle pointer-events-none" />
          <Input
            type="search"
            placeholder="Rechercher..."
            className="h-9 pl-9 text-sm bg-surface-1 border-border"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            aria-label="Recherche globale"
          />
        </div>
      </div>

      <div className="flex items-center gap-1 md:gap-2 flex-shrink-0">
        <ThemeToggle compact />
        <NotificationsDropdown userRole={userRole} />

        <Link
          href={profileHref}
          className="hidden md:flex items-center gap-2.5 rounded-lg px-2 py-1.5 hover:bg-surface-2 border border-transparent hover:border-border transition-colors cursor-pointer"
        >
          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary text-primary-foreground">
            <User className="h-4 w-4" />
          </div>
          <div className="flex flex-col min-w-0">
            <span className="text-xs font-medium text-foreground truncate max-w-[140px]">
              {userName || 'Utilisateur'}
            </span>
            <span className="text-[10px] text-foreground-subtle truncate max-w-[140px]">
              {userRole || 'Rôle'}
            </span>
          </div>
        </Link>

        <Link
          href={profileHref}
          className="md:hidden flex h-9 w-9 items-center justify-center rounded-full bg-primary text-primary-foreground"
          aria-label="Profil"
        >
          <User className="h-4 w-4" />
        </Link>
      </div>
    </header>
  );
}
