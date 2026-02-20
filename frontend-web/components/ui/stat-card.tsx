import React from 'react';
import { LucideIcon } from 'lucide-react';
import { cn } from '@/lib/utils/cn';

interface StatCardProps {
  title: string;
  value: string | number;
  icon: LucideIcon;
  iconColor?: string;
  isLoading?: boolean;
  className?: string;
  onClick?: () => void;
}

export function StatCard({
  title,
  value,
  icon: Icon,
  iconColor = 'text-primary',
  isLoading = false,
  className,
  onClick,
}: StatCardProps) {
  return (
    <div
      className={cn(
        'group relative overflow-hidden rounded-lg border border-border bg-surface-1 p-5 transition-all duration-200 animate-fade-in',
        onClick && 'cursor-pointer hover:border-primary/30 hover:shadow-glow',
        className,
      )}
      onClick={onClick}
    >
      {/* Subtle accent glow in top-left corner */}
      <div className="pointer-events-none absolute -left-8 -top-8 h-24 w-24 rounded-full bg-primary/5 blur-2xl transition-opacity duration-300 group-hover:bg-primary/10" />

      <div className="relative flex items-start justify-between">
        <div className="flex flex-col gap-1">
          <p className="text-[11px] font-semibold uppercase tracking-widest text-foreground-subtle">
            {title}
          </p>
          <p className="text-2xl font-semibold tracking-tight text-foreground">
            {isLoading ? (
              <span className="inline-block h-7 w-16 animate-pulse rounded bg-surface-3" />
            ) : (
              value
            )}
          </p>
        </div>
        <div className={cn(
          'flex h-10 w-10 items-center justify-center rounded-lg bg-surface-2 transition-colors duration-200 group-hover:bg-primary/10',
        )}>
          <Icon className={cn('h-5 w-5', iconColor)} />
        </div>
      </div>
    </div>
  );
}



