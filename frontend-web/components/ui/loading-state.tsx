import React from 'react';

interface LoadingStateProps {
  message?: string;
  fullHeight?: boolean;
}

export function LoadingState({ message = 'Chargement...', fullHeight = false }: LoadingStateProps) {
  return (
    <div className={`flex flex-col items-center justify-center ${fullHeight ? 'min-h-[400px]' : 'py-16'}`}>
      {/* Animated spinner */}
      <div className="relative mb-4">
        <div className="h-10 w-10 rounded-full border-2 border-surface-3" />
        <div className="absolute inset-0 h-10 w-10 rounded-full border-2 border-t-primary border-r-transparent border-b-transparent border-l-transparent animate-spin" />
      </div>
      <p className="text-xs text-foreground-subtle animate-pulse">{message}</p>
    </div>
  );
}



