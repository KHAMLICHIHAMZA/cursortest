import React from 'react';
import { LucideIcon } from 'lucide-react';
import { Card } from './card';

interface EmptyStateProps {
  icon: LucideIcon;
  title: string;
  description?: string;
  action?: React.ReactNode;
}

export function EmptyState({ icon: Icon, title, description, action }: EmptyStateProps) {
  return (
    <Card variant="outlined" padding="lg" className="text-center">
      <div className="flex flex-col items-center justify-center py-12">
        <div className="w-16 h-16 rounded-full bg-background flex items-center justify-center mb-4">
          <Icon className="w-8 h-8 text-text-muted" />
        </div>
        <h3 className="text-lg font-semibold text-text mb-2">{title}</h3>
        {description && (
          <p className="text-sm text-text-muted mb-6 max-w-md">{description}</p>
        )}
        {action && <div>{action}</div>}
      </div>
    </Card>
  );
}



