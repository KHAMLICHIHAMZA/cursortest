'use client';

import { Sun, Moon } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useTheme } from '@/contexts/theme-context';

export function ThemeToggle({ className }: { className?: string }) {
  const { theme, toggleTheme } = useTheme();
  const actionLabel = theme === 'dark' ? 'Passer en clair' : 'Passer en sombre';

  return (
    <Button
      type="button"
      variant="secondary"
      size="sm"
      onClick={toggleTheme}
      aria-label={theme === 'dark' ? 'Activer le thème clair' : 'Activer le thème sombre'}
      title={actionLabel}
      className={`border border-border ${className || ''}`}
    >
      {theme === 'dark' ? (
        <Sun className="w-4 h-4" />
      ) : (
        <Moon className="w-4 h-4" />
      )}
      <span className="hidden md:inline ml-2 text-xs">{actionLabel}</span>
    </Button>
  );
}
