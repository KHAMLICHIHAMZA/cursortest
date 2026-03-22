'use client';

import React from 'react';
import { Sun, Moon } from 'lucide-react';
import { useTheme } from '@/contexts/theme-context';
import { cn } from '@/lib/utils/cn';

interface ThemeToggleProps {
  className?: string;
  showLabel?: boolean;
}

export function ThemeToggle({ className, showLabel = false }: ThemeToggleProps) {
  const { theme, toggleTheme } = useTheme();
  const isDark = theme === 'dark';

  return (
    <button
      onClick={toggleTheme}
      className={cn(
        'flex items-center gap-2 rounded-md px-3 py-2 text-sm transition-colors',
        'text-foreground-muted hover:text-foreground hover:bg-surface-2',
        className,
      )}
      aria-label={isDark ? 'Passer en clair' : 'Passer en sombre'}
    >
      {isDark ? (
        <>
          <Sun className="h-4 w-4" />
          {showLabel && <span>Passer en clair</span>}
        </>
      ) : (
        <>
          <Moon className="h-4 w-4" />
          {showLabel && <span>Passer en sombre</span>}
        </>
      )}
    </button>
  );
}
