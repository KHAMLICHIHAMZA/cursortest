'use client';

import React from 'react';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Search } from 'lucide-react';

interface PageFiltersProps {
  searchValue: string;
  onSearchChange: (value: string) => void;
  searchPlaceholder: string;
  searchAriaLabel?: string;
  rightSlot?: React.ReactNode;
  showReset?: boolean;
  onReset?: () => void;
}

export function PageFilters({
  searchValue,
  onSearchChange,
  searchPlaceholder,
  searchAriaLabel,
  rightSlot,
  showReset = false,
  onReset,
}: PageFiltersProps) {
  return (
    <Card className="mb-6 p-4">
      <div className="flex flex-col sm:flex-row sm:items-center gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-muted" />
          <Input
            type="search"
            value={searchValue}
            onChange={(e) => onSearchChange(e.target.value)}
            placeholder={searchPlaceholder}
            aria-label={searchAriaLabel || searchPlaceholder}
            className="pl-10"
          />
        </div>
        {rightSlot}
        {showReset && onReset && (
          <Button variant="secondary" onClick={onReset}>
            Réinitialiser
          </Button>
        )}
      </div>
    </Card>
  );
}

