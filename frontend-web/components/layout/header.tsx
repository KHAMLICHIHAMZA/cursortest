'use client';

import { useState } from 'react';
import { Bell, Search, User } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { useSearch } from '@/contexts/search-context';

interface HeaderProps {
  userName?: string;
  userRole?: string;
}

export function Header({ userName, userRole }: HeaderProps) {
  const { searchTerm, setSearchTerm } = useSearch();

  return (
    <header className="fixed top-0 left-64 right-0 h-16 bg-card border-b border-border flex items-center justify-between px-6 z-10">
      <div className="flex items-center gap-4 flex-1">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-text-muted" />
          <Input
            type="search"
            placeholder="Rechercher..."
            className="pl-10 bg-background border-border"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
      </div>

      <div className="flex items-center gap-4">
        <Button variant="ghost" size="sm">
          <Bell className="w-5 h-5 text-text-muted" />
        </Button>

        <div className="flex items-center gap-3 px-4 py-2 rounded-lg bg-background border border-border">
          <div className="w-8 h-8 rounded-full bg-primary flex items-center justify-center">
            <User className="w-4 h-4 text-white" />
          </div>
          <div className="flex flex-col">
            <span className="text-sm font-medium text-text">{userName || 'Utilisateur'}</span>
            <span className="text-xs text-text-muted">{userRole || 'Rôle'}</span>
          </div>
        </div>
      </div>
    </header>
  );
}

