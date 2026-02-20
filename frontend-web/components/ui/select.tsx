import React from 'react';
import { cn } from '@/lib/utils/cn';

interface SelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
  children: React.ReactNode;
}

export const Select = React.forwardRef<HTMLSelectElement, SelectProps>(
  ({ className, children, ...props }, ref) => {
    return (
      <select
        ref={ref}
        className={cn(
          'flex h-10 w-full rounded-md border border-border bg-surface-1 px-3 py-2 text-sm text-foreground transition-colors duration-200 focus:outline-none focus:border-primary/50 focus:ring-1 focus:ring-primary/30 disabled:cursor-not-allowed disabled:opacity-40',
          className,
        )}
        {...props}
      >
        {children}
      </select>
    );
  },
);

Select.displayName = 'Select';



