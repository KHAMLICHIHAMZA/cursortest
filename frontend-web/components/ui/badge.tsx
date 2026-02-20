import React from 'react';
import { cn } from '@/lib/utils/cn';

type StatusKey = 'confirmed' | 'active' | 'rented' | 'pending' | 'option' | 'available' | 'success' | 'late' | 'incident' | 'alert' | 'error' | 'completed' | 'inactive' | 'blocked' | 'cancelled' | 'draft' | 'returned' | 'in_progress' | 'planned' | 'info' | 'warning';

interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  status?: StatusKey;
  variant?: 'default' | 'outline';
  size?: 'sm' | 'md';
}

const statusMap: Record<string, StatusKey> = {
  'CONFIRMED': 'confirmed',
  'IN_PROGRESS': 'active',
  'LATE': 'late',
  'RETURNED': 'completed',
  'CANCELLED': 'cancelled',
  'PENDING': 'pending',
  'DRAFT': 'draft',
  'NO_SHOW': 'error',
  'PLANNED': 'pending',
  'COMPLETED': 'completed',
  'AVAILABLE': 'available',
  'RENTED': 'rented',
  'MAINTENANCE': 'blocked',
};

const statusColorMap: Record<StatusKey, { text: string; bg: string; dot: string }> = {
  confirmed:   { text: 'text-blue-400',   bg: 'bg-blue-400/10',   dot: 'bg-blue-400' },
  active:      { text: 'text-blue-400',   bg: 'bg-blue-400/10',   dot: 'bg-blue-400' },
  rented:      { text: 'text-blue-400',   bg: 'bg-blue-400/10',   dot: 'bg-blue-400' },
  in_progress: { text: 'text-blue-400',   bg: 'bg-blue-400/10',   dot: 'bg-blue-400' },
  info:        { text: 'text-blue-400',   bg: 'bg-blue-400/10',   dot: 'bg-blue-400' },
  pending:     { text: 'text-amber-400',  bg: 'bg-amber-400/10',  dot: 'bg-amber-400' },
  option:      { text: 'text-amber-400',  bg: 'bg-amber-400/10',  dot: 'bg-amber-400' },
  planned:     { text: 'text-amber-400',  bg: 'bg-amber-400/10',  dot: 'bg-amber-400' },
  warning:     { text: 'text-amber-400',  bg: 'bg-amber-400/10',  dot: 'bg-amber-400' },
  available:   { text: 'text-emerald-400', bg: 'bg-emerald-400/10', dot: 'bg-emerald-400' },
  success:     { text: 'text-emerald-400', bg: 'bg-emerald-400/10', dot: 'bg-emerald-400' },
  late:        { text: 'text-red-400',    bg: 'bg-red-400/10',    dot: 'bg-red-400' },
  incident:    { text: 'text-red-400',    bg: 'bg-red-400/10',    dot: 'bg-red-400' },
  alert:       { text: 'text-red-400',    bg: 'bg-red-400/10',    dot: 'bg-red-400' },
  error:       { text: 'text-red-400',    bg: 'bg-red-400/10',    dot: 'bg-red-400' },
  completed:   { text: 'text-foreground-subtle', bg: 'bg-surface-3', dot: 'bg-foreground-subtle' },
  inactive:    { text: 'text-foreground-subtle', bg: 'bg-surface-3', dot: 'bg-foreground-subtle' },
  blocked:     { text: 'text-foreground-subtle', bg: 'bg-surface-3', dot: 'bg-foreground-subtle' },
  cancelled:   { text: 'text-foreground-subtle', bg: 'bg-surface-3', dot: 'bg-foreground-subtle' },
  draft:       { text: 'text-foreground-subtle', bg: 'bg-surface-3', dot: 'bg-foreground-subtle' },
  returned:    { text: 'text-foreground-subtle', bg: 'bg-surface-3', dot: 'bg-foreground-subtle' },
};

export const Badge = React.forwardRef<HTMLSpanElement, BadgeProps>(
  ({ className, status, variant = 'default', size = 'md', children, ...props }, ref) => {
    const mappedStatus = status || (typeof children === 'string' ? statusMap[children.toUpperCase()] : undefined);

    const styles = mappedStatus
      ? statusColorMap[mappedStatus] || statusColorMap.completed
      : { text: 'text-foreground-muted', bg: 'bg-surface-2', dot: 'bg-foreground-subtle' };

    const sizeStyles = {
      sm: 'px-2 py-0.5 text-[10px]',
      md: 'px-2.5 py-0.5 text-[11px]',
    };

    return (
      <span
        ref={ref}
        className={cn(
          'inline-flex items-center gap-1.5 rounded-full font-medium tracking-wide uppercase transition-colors',
          variant === 'outline' ? `border border-current/20 bg-transparent ${styles.text}` : `${styles.bg} ${styles.text}`,
          sizeStyles[size],
          className,
        )}
        {...props}
      >
        <span className={cn('h-1.5 w-1.5 rounded-full animate-pulse-dot', styles.dot)} />
        {children}
      </span>
    );
  },
);

Badge.displayName = 'Badge';

