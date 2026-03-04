'use client';

import React from 'react';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { cn } from '@/lib/utils/cn';

interface PageHeaderProps {
  title: string;
  description?: string;
  actionHref?: string;
  actionLabel?: string;
  actionIcon?: React.ReactNode;
  actionDisabled?: boolean;
  actionAriaLabel?: string;
  children?: React.ReactNode;
  className?: string;
}

export function PageHeader({
  title,
  description,
  actionHref,
  actionLabel,
  actionIcon,
  actionDisabled = false,
  actionAriaLabel,
  children,
  className,
}: PageHeaderProps) {
  const actionButton = actionLabel ? (
    <Button
      variant="primary"
      className="w-full sm:w-auto whitespace-nowrap"
      disabled={actionDisabled}
      aria-label={actionAriaLabel || actionLabel}
    >
      {actionIcon}
      {actionLabel}
    </Button>
  ) : null;

  return (
    <div className={cn('flex flex-col gap-3 md:flex-row md:items-center md:justify-between mb-8', className)}>
      <div>
        <h1 className="text-3xl font-bold text-text mb-2">{title}</h1>
        {description && <p className="text-text-muted">{description}</p>}
        {children}
      </div>
      {actionHref && actionButton ? (
        <Link href={actionHref} className="w-full sm:w-auto block md:shrink-0">
          {actionButton}
        </Link>
      ) : (
        actionButton
      )}
    </div>
  );
}

