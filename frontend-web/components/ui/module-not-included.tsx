'use client';

import React from 'react';
import { Lock, AlertCircle } from 'lucide-react';
import { Card } from './card';
import { Button } from './button';

interface ModuleNotIncludedProps {
  moduleName: string;
  onUpgrade?: () => void;
  className?: string;
}

const moduleNames: Record<string, string> = {
  VEHICLES: 'Gestion des véhicules',
  BOOKINGS: 'Gestion des réservations',
  INVOICES: 'Gestion des factures',
  MAINTENANCE: 'Gestion de la maintenance',
  FINES: 'Gestion des amendes',
  ANALYTICS: 'Analyses et statistiques',
};

export function ModuleNotIncluded({ 
  moduleName, 
  onUpgrade,
  className 
}: ModuleNotIncludedProps) {
  const displayName = moduleNames[moduleName] || moduleName;

  return (
    <Card variant="outlined" padding="lg" className={`text-center ${className || ''}`}>
      <div className="flex flex-col items-center justify-center py-12">
        <div className="w-16 h-16 rounded-full bg-warning/10 flex items-center justify-center mb-4">
          <Lock className="w-8 h-8 text-warning" />
        </div>
        <h3 className="text-lg font-semibold text-text mb-2">
          Module non inclus
        </h3>
        <p className="text-sm text-text-muted mb-2 max-w-md">
          Le module <strong>{displayName}</strong> n'est pas inclus dans votre abonnement actuel.
        </p>
        <p className="text-xs text-text-muted mb-6 max-w-md">
          Contactez votre administrateur pour mettre à niveau votre plan et accéder à cette fonctionnalité.
        </p>
        {onUpgrade && (
          <Button variant="primary" onClick={onUpgrade}>
            Voir les plans disponibles
          </Button>
        )}
      </div>
    </Card>
  );
}

interface FeatureNotIncludedProps {
  featureName: string;
  moduleName?: string;
  className?: string;
}

export function FeatureNotIncluded({ 
  featureName, 
  moduleName,
  className 
}: FeatureNotIncludedProps) {
  return (
    <div className={`flex items-center gap-2 p-3 rounded-lg bg-warning/10 border border-warning/20 ${className || ''}`}>
      <AlertCircle className="w-5 h-5 text-warning flex-shrink-0" />
      <div className="flex-1">
        <p className="text-sm text-text">
          <strong>{featureName}</strong> n'est pas disponible avec votre abonnement actuel.
        </p>
        {moduleName && (
          <p className="text-xs text-text-muted mt-1">
            Module requis: {moduleNames[moduleName] || moduleName}
          </p>
        )}
      </div>
    </div>
  );
}


