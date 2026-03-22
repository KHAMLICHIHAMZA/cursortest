'use client';

import { Sun, Moon } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useTheme } from '@/contexts/theme-context';
import { cn } from '@/lib/utils/cn';

interface ThemeToggleProps {
  className?: string;
  /** Mode icône seule (header v0) */
  compact?: boolean;
}

export function ThemeToggle({ className, compact }: ThemeToggleProps) {
  const { theme, toggleTheme } = useTheme();
  const actionLabel = theme === 'dark' ? 'Passer en clair' : 'Passer en sombre';

  if (compact) {
    return (
      <button
        type="button"
        onClick={toggleTheme}
        aria-label={theme === 'dark' ? 'Activer le thème clair' : 'Activer le thème sombre'}
        title={actionLabel}
        className={cn(
          'flex h-9 w-9 items-center justify-center rounded-md border border-border bg-surface-1 text-foreground-muted hover:text-foreground hover:bg-surface-2 transition-colors',
          className,
        )}
      >
        {theme === 'dark' ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
      </button>
    );
  }

  return (
    <Button
      type="button"
      variant="secondary"
      size="sm"
      onClick={toggleTheme}
      aria-label={theme === 'dark' ? 'Activer le thème clair' : 'Activer le thème sombre'}
      title={actionLabel}
      className={cn('border border-border', className)}
    >
      {theme === 'dark' ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
      <span className="hidden md:inline ml-2 text-xs">{actionLabel}</span>
    </Button>
  );
}
