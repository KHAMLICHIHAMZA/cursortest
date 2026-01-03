import React from 'react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from './card';
import { Button } from './button';
import { ArrowLeft } from 'lucide-react';
import Link from 'next/link';

interface FormCardProps {
  title: string;
  description?: string;
  backHref: string;
  backLabel?: string;
  children: React.ReactNode;
  onSubmit?: (e: React.FormEvent) => void;
  submitLabel?: string;
  isLoading?: boolean;
  maxWidth?: 'sm' | 'md' | 'lg' | 'xl' | '2xl';
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
  maxWidth = '2xl',
}: FormCardProps) {
  const maxWidthClasses = {
    sm: 'max-w-sm',
    md: 'max-w-md',
    lg: 'max-w-lg',
    xl: 'max-w-xl',
    '2xl': 'max-w-2xl',
  };

  return (
    <div className={`${maxWidthClasses[maxWidth]} mx-auto`}>
      <Link href={backHref}>
        <Button variant="ghost" className="mb-6">
          <ArrowLeft className="w-4 h-4 mr-2" />
          {backLabel}
        </Button>
      </Link>

      <Card>
        <CardHeader>
          <CardTitle>{title}</CardTitle>
          {description && <CardDescription>{description}</CardDescription>}
        </CardHeader>
        <CardContent>
          <form onSubmit={onSubmit} className="space-y-6 max-h-[90vh] overflow-y-auto" noValidate>
            {children}
            {onSubmit && (
              <div className="flex items-center justify-end gap-4 pt-4 border-t border-border">
                <Link href={backHref}>
                  <Button type="button" variant="ghost">
                    Annuler
                  </Button>
                </Link>
                <Button 
                  type="submit" 
                  variant="primary" 
                  disabled={isLoading}
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

