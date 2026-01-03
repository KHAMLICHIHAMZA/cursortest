import React from 'react';
import { Card } from './card';

interface LoadingStateProps {
  message?: string;
  fullHeight?: boolean;
}

export function LoadingState({ message = 'Chargement...', fullHeight = false }: LoadingStateProps) {
  return (
    <div className={fullHeight ? 'flex items-center justify-center min-h-[400px]' : 'py-12'}>
      <Card variant="outlined" padding="md" className="text-center">
        <div className="flex flex-col items-center justify-center">
          <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin mb-4"></div>
          <p className="text-sm text-text-muted">{message}</p>
        </div>
      </Card>
    </div>
  );
}



