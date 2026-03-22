'use client';

import * as React from 'react';
import { X } from 'lucide-react';
import { cn } from '@/lib/utils/cn';

interface DialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  children: React.ReactNode;
}

export function Dialog({ open, onOpenChange, children }: DialogProps) {
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/70 backdrop-blur-sm animate-fade-in"
        onClick={() => onOpenChange(false)}
      />

      {/* Dialog */}
      <div className="relative z-50 w-full max-w-md animate-fade-in">
        {children}
      </div>
    </div>
  );
}

export const DialogContent = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement> & { onClose?: () => void }
>(({ className, children, onClose, ...props }, ref) => (
  <div
    ref={ref}
    className={cn(
      'relative bg-surface-1 border border-border rounded-lg shadow-elevation-3 p-5',
      className,
    )}
    {...props}
  >
    {onClose && (
      <button
        onClick={onClose}
        className="absolute right-3 top-3 flex h-7 w-7 items-center justify-center rounded-md text-foreground-subtle hover:text-foreground hover:bg-surface-2 transition-colors"
      >
        <X className="h-4 w-4" />
        <span className="sr-only">Fermer</span>
      </button>
    )}
    {children}
  </div>
));
DialogContent.displayName = 'DialogContent';

export const DialogHeader = ({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) => (
  <div
    className={cn('flex flex-col gap-1 mb-4', className)}
    {...props}
  />
);
DialogHeader.displayName = 'DialogHeader';

export const DialogTitle = React.forwardRef<
  HTMLHeadingElement,
  React.HTMLAttributes<HTMLHeadingElement>
>(({ className, ...props }, ref) => (
  <h2
    ref={ref}
    className={cn('text-base font-semibold text-foreground tracking-tight', className)}
    {...props}
  />
));
DialogTitle.displayName = 'DialogTitle';

export const DialogDescription = React.forwardRef<
  HTMLParagraphElement,
  React.HTMLAttributes<HTMLParagraphElement>
>(({ className, ...props }, ref) => (
  <p
    ref={ref}
    className={cn('text-sm text-foreground-muted', className)}
    {...props}
  />
));
DialogDescription.displayName = 'DialogDescription';

export const DialogFooter = ({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) => (
  <div
    className={cn('flex items-center justify-end gap-2 mt-5 pt-4 border-t border-border', className)}
    {...props}
  />
);
DialogFooter.displayName = 'DialogFooter';



