import React from 'react';
import { LucideIcon } from 'lucide-react';
import { Card } from './card';
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
  onClick
}: StatCardProps) {
  return (
    <Card 
      className={cn(
        onClick && 'cursor-pointer hover:border-primary/60 hover:shadow-md transition-all duration-200',
        className
      )}
      onClick={onClick}
    >
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0">
          <p className="text-text-muted text-xs sm:text-sm mb-1 tracking-wide uppercase">{title}</p>
          <p className="text-2xl sm:text-3xl font-bold text-text leading-tight">
            {isLoading ? '...' : value}
          </p>
        </div>
        <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl bg-primary/10 border border-primary/20 flex items-center justify-center shrink-0">
          <Icon className={cn('w-5 h-5 sm:w-6 sm:h-6', iconColor)} />
        </div>
      </div>
    </Card>
  );
}



