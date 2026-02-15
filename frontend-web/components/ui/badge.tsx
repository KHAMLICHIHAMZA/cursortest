import React from 'react';
import { cn } from '@/lib/utils/cn';
import { colors } from '@/lib/design-system';

type StatusKey = 'confirmed' | 'active' | 'rented' | 'pending' | 'option' | 'available' | 'success' | 'late' | 'incident' | 'alert' | 'error' | 'completed' | 'inactive' | 'blocked' | 'cancelled' | 'draft' | 'returned' | 'in_progress' | 'planned' | 'info' | 'warning';

interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  status?: StatusKey;
  variant?: 'default' | 'outline';
  size?: 'sm' | 'md';
}

const statusMap: Record<string, StatusKey> = {
  // Bookings
  'CONFIRMED': 'confirmed',
  'IN_PROGRESS': 'active',
  'LATE': 'late',
  'RETURNED': 'completed',
  'CANCELLED': 'cancelled',
  'PENDING': 'pending',
  'DRAFT': 'draft',
  'NO_SHOW': 'error',
  
  // Maintenance
  'PLANNED': 'pending',
  'COMPLETED': 'completed',
  
  // Vehicles
  'AVAILABLE': 'available',
  'RENTED': 'rented',
  'MAINTENANCE': 'blocked',
};

export const Badge = React.forwardRef<HTMLSpanElement, BadgeProps>(
  ({ className, status, variant = 'default', size = 'md', children, ...props }, ref) => {
    // Mapper le statut si c'est une string
    const mappedStatus = status || (typeof children === 'string' ? statusMap[children.toUpperCase()] : undefined);
    
    const getStatusStyles = (statusKey?: StatusKey) => {
      if (!statusKey) return 'bg-card text-text border-border';
      
      // Mapping direct des couleurs avec classes Tailwind
      const statusColorMap: Record<StatusKey, { text: string; bg: string; border: string }> = {
        confirmed: { text: 'text-blue-500', bg: 'bg-blue-500/15', border: 'border-blue-500' },
        active: { text: 'text-blue-500', bg: 'bg-blue-500/15', border: 'border-blue-500' },
        rented: { text: 'text-blue-500', bg: 'bg-blue-500/15', border: 'border-blue-500' },
        pending: { text: 'text-orange-500', bg: 'bg-orange-500/15', border: 'border-orange-500' },
        option: { text: 'text-orange-500', bg: 'bg-orange-500/15', border: 'border-orange-500' },
        available: { text: 'text-green-500', bg: 'bg-green-500/15', border: 'border-green-500' },
        success: { text: 'text-green-500', bg: 'bg-green-500/15', border: 'border-green-500' },
        late: { text: 'text-red-500', bg: 'bg-red-500/15', border: 'border-red-500' },
        incident: { text: 'text-red-500', bg: 'bg-red-500/15', border: 'border-red-500' },
        alert: { text: 'text-red-500', bg: 'bg-red-500/15', border: 'border-red-500' },
        error: { text: 'text-red-500', bg: 'bg-red-500/15', border: 'border-red-500' },
        completed: { text: 'text-gray-500', bg: 'bg-gray-500/15', border: 'border-gray-500' },
        inactive: { text: 'text-gray-500', bg: 'bg-gray-500/15', border: 'border-gray-500' },
        blocked: { text: 'text-gray-500', bg: 'bg-gray-500/15', border: 'border-gray-500' },
        cancelled: { text: 'text-gray-500', bg: 'bg-gray-500/15', border: 'border-gray-500' },
        draft: { text: 'text-gray-500', bg: 'bg-gray-500/15', border: 'border-gray-500' },
        returned: { text: 'text-gray-500', bg: 'bg-gray-500/15', border: 'border-gray-500' },
        in_progress: { text: 'text-blue-500', bg: 'bg-blue-500/15', border: 'border-blue-500' },
        planned: { text: 'text-orange-500', bg: 'bg-orange-500/15', border: 'border-orange-500' },
        info: { text: 'text-blue-500', bg: 'bg-blue-500/15', border: 'border-blue-500' },
        warning: { text: 'text-amber-500', bg: 'bg-amber-500/15', border: 'border-amber-500' },
      };
      
      const styles = statusColorMap[statusKey] || statusColorMap.completed;
      
      if (variant === 'outline') {
        return `border ${styles.border} ${styles.text} bg-transparent`;
      }
      
      return `${styles.bg} ${styles.text} border-transparent`;
    };

    const sizeStyles = {
      sm: 'px-2 py-0.5 text-xs',
      md: 'px-2.5 py-1 text-xs',
    };

    return (
      <span
        ref={ref}
        className={cn(
          'inline-flex items-center justify-center rounded-md font-semibold border transition-colors',
          getStatusStyles(mappedStatus),
          sizeStyles[size],
          className,
        )}
        {...props}
      >
        {children}
      </span>
    );
  },
);

Badge.displayName = 'Badge';

