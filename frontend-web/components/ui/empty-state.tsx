import React from 'react';
import { LucideIcon } from 'lucide-react';

interface EmptyStateProps {
  icon: LucideIcon;
  title: string;
  description?: string;
  action?: React.ReactNode;
}

export function EmptyState({ icon: Icon, title, description, action }: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center rounded-lg border border-dashed border-border bg-surface-1/50 py-16 px-6 text-center">
      <div className="flex h-14 w-14 items-center justify-center rounded-full bg-surface-2 mb-4">
        <Icon className="h-6 w-6 text-foreground-subtle" />
      </div>
      <h3 className="text-sm font-semibold text-foreground mb-1">{title}</h3>
      {description && (
        <p className="text-xs text-foreground-muted mb-5 max-w-xs">{description}</p>
      )}
      {action && <div>{action}</div>}
    </div>
  );
}



