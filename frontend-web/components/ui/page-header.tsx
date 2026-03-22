'use client';

import React from 'react';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { cn } from '@/lib/utils/cn';

interface PageHeaderProps {
  title: string;
  description?: string;
  actionHref?: string;
  actionOnClick?: () => void;
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
  actionOnClick,
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
    <div className={cn('mb-8 flex flex-col gap-4 md:flex-row md:items-start md:justify-between', className)}>
      <div className="min-w-0">
        <h1 className="text-3xl font-bold text-text">{title}</h1>
        {description && <p className="mt-1 text-text-muted">{description}</p>}
        {children}
      </div>
      {actionHref && actionButton ? (
        <Link href={actionHref} className="block w-full self-start sm:w-auto md:shrink-0 md:pt-1">
          {actionButton}
        </Link>
      ) : actionOnClick && actionButton ? (
        <div className="w-full self-start sm:w-auto md:shrink-0 md:pt-1">
          <Button
            variant="primary"
            className="w-full sm:w-auto whitespace-nowrap"
            disabled={actionDisabled}
            aria-label={actionAriaLabel || actionLabel}
            onClick={actionOnClick}
          >
            {actionIcon}
            {actionLabel}
          </Button>
        </div>
      ) : (
        actionButton
      )}
    </div>
  );
}

