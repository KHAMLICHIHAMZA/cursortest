'use client';

import { Bell, Search, User, Menu } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { useSearch } from '@/contexts/search-context';
import Link from 'next/link';

interface HeaderProps {
  userName?: string;
  userRole?: string;
  onMenuClick?: () => void;
}

export function Header({ userName, userRole, onMenuClick }: HeaderProps) {
  const { searchTerm, setSearchTerm } = useSearch();

  const profileHref = userRole === 'SUPER_ADMIN'
    ? '/admin/profile'
    : userRole === 'COMPANY_ADMIN'
      ? '/company/profile'
      : '/agency/profile';

  return (
    <header className="fixed top-0 left-0 lg:left-64 right-0 h-14 bg-surface-0/80 backdrop-blur-xl border-b border-border flex items-center justify-between px-4 md:px-6 z-10">
      <div className="flex items-center gap-3 flex-1 min-w-0">
        {/* Hamburger menu - mobile only */}
        <button
          onClick={onMenuClick}
          className="lg:hidden flex h-8 w-8 items-center justify-center rounded-md text-foreground-subtle hover:text-foreground hover:bg-surface-2 transition-colors flex-shrink-0"
        >
          <Menu className="h-4 w-4" />
        </button>

        <div className="relative flex-1 max-w-sm min-w-0">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-foreground-subtle" />
          <Input
            type="search"
            placeholder="Rechercher..."
            className="h-8 pl-9 text-xs bg-surface-1 border-border"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
      </div>

      <div className="flex items-center gap-1.5 md:gap-2 flex-shrink-0">
        <button className="flex h-8 w-8 items-center justify-center rounded-md text-foreground-subtle hover:text-foreground hover:bg-surface-2 transition-colors relative">
          <Bell className="h-4 w-4" />
          <span className="absolute top-1.5 right-1.5 h-1.5 w-1.5 rounded-full bg-primary" />
        </button>

        {/* User info - desktop */}
        <Link
          href={profileHref}
          className="hidden md:flex items-center gap-2.5 rounded-md px-2.5 py-1.5 hover:bg-surface-2 transition-colors cursor-pointer"
        >
          <div className="flex h-7 w-7 items-center justify-center rounded-full bg-primary/10 ring-1 ring-primary/20">
            <User className="h-3.5 w-3.5 text-primary" />
          </div>
          <div className="flex flex-col">
            <span className="text-xs font-medium text-foreground">{userName || 'Utilisateur'}</span>
            <span className="text-[10px] text-foreground-subtle">{userRole || 'Role'}</span>
          </div>
        </Link>

        {/* User avatar only - mobile */}
        <Link href={profileHref} className="md:hidden flex h-8 w-8 items-center justify-center rounded-full bg-primary/10 ring-1 ring-primary/20">
          <User className="h-3.5 w-3.5 text-primary" />
        </Link>
      </div>
    </header>
  );
}
