import React from 'react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from './card';
import { Button } from './button';

interface FormCardProps {
  title: string;
  description?: string;
  backHref: string;
  backLabel?: string;
  children: React.ReactNode;
  onSubmit?: (e: React.FormEvent) => void;
  submitLabel?: string;
  isLoading?: boolean;
  isSubmitDisabled?: boolean;
  maxWidth?: 'sm' | 'md' | 'lg' | 'xl' | '2xl' | '4xl' | '6xl' | '7xl';
}

export function FormCard({
  title,
  description,
  backHref,
  backLabel = 'Retour',
  children,
  onSubmit,
  submitLabel = 'Enregistrer',
  isLoading = false,
  isSubmitDisabled = false,
  maxWidth = '6xl',
}: FormCardProps) {
  const maxWidthClasses = {
    sm: 'max-w-sm',
    md: 'max-w-md',
    lg: 'max-w-lg',
    xl: 'max-w-xl',
    '2xl': 'max-w-2xl',
    '4xl': 'max-w-4xl',
    '6xl': 'max-w-6xl',
    '7xl': 'max-w-7xl',
  };

  return (
    <div className={`${maxWidthClasses[maxWidth]} mx-auto px-2 sm:px-0`}>
      <Card>
        <CardHeader>
          <CardTitle>{title}</CardTitle>
          {description && <CardDescription>{description}</CardDescription>}
        </CardHeader>
        <CardContent>
          <form onSubmit={onSubmit} className="space-y-6" noValidate>
            {children}
            {onSubmit && (
              <div className="flex items-center justify-end gap-4 pt-4 border-t border-border">
                <Button
                  type="submit"
                  variant="primary"
                  disabled={isLoading || isSubmitDisabled}
                  isLoading={isLoading}
                >
                  {submitLabel}
                </Button>
              </div>
            )}
          </form>
        </CardContent>
      </Card>
    </div>
  );
}

