import React from 'react';
import { AlertCircle } from 'lucide-react';
import { Card } from './card';
import { Button } from './button';

interface ErrorStateProps {
  title?: string;
  message: string;
  onRetry?: () => void;
}

export function ErrorState({ 
  title = 'Une erreur est survenue', 
  message, 
  onRetry 
}: ErrorStateProps) {
  return (
    <Card variant="outlined" padding="lg" className="text-center">
      <div className="flex flex-col items-center justify-center py-12">
        <div className="w-16 h-16 rounded-full bg-error/10 flex items-center justify-center mb-4">
          <AlertCircle className="w-8 h-8 text-error" />
        </div>
        <h3 className="text-lg font-semibold text-text mb-2">{title}</h3>
        <p className="text-sm text-text-muted mb-6 max-w-md">{message}</p>
        {onRetry && (
          <Button variant="primary" onClick={onRetry}>
            Réessayer
          </Button>
        )}
      </div>
    </Card>
  );
}



