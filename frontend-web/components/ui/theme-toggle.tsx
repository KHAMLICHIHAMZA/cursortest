'use client';

import { Sun, Moon } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useTheme } from '@/contexts/theme-context';

export function ThemeToggle({ className }: { className?: string }) {
  const { theme, toggleTheme } = useTheme();

  return (
    <Button
      type="button"
      variant="ghost"
      size="sm"
      onClick={toggleTheme}
      aria-label={theme === 'dark' ? 'Activer le thème clair' : 'Activer le thème sombre'}
      title={theme === 'dark' ? 'Passer en clair' : 'Passer en sombre'}
      className={className}
    >
      {theme === 'dark' ? (
        <Sun className="w-5 h-5 text-text-muted" />
      ) : (
        <Moon className="w-5 h-5 text-text-muted" />
      )}
    </Button>
  );
}
