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
        onClick && 'cursor-pointer hover:border-primary transition-all duration-200',
        className
      )}
      onClick={onClick}
    >
      <div className="flex items-center justify-between">
        <div>
          <p className="text-text-muted text-sm mb-1">{title}</p>
          <p className="text-3xl font-bold text-text">
            {isLoading ? '...' : value}
          </p>
        </div>
        <Icon className={cn('w-12 h-12', iconColor)} />
      </div>
    </Card>
  );
}



