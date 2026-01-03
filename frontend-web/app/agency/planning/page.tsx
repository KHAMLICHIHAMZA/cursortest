'use client';

import { useState } from 'react';
import { PlanningCalendar } from '@/components/planning/planning-calendar';
import { MainLayout } from '@/components/layout/main-layout';
import { RouteGuard } from '@/components/auth/route-guard';
import { AgencyFilter } from '@/components/ui/agency-filter';

export default function PlanningPage() {
  const [selectedAgencyId, setSelectedAgencyId] = useState<string | null>(null);

  return (
    <RouteGuard allowedRoles={['SUPER_ADMIN', 'COMPANY_ADMIN', 'AGENCY_MANAGER', 'AGENT']}>
      <MainLayout>
        <div className="max-w-[1600px] mx-auto">
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-text mb-2">Planning des véhicules</h1>
            <p className="text-text-muted">
              Visualisez les réservations, maintenances et tous les événements de tous les véhicules
            </p>
          </div>

          <div className="mb-6 flex items-center gap-4">
            <AgencyFilter
              selectedAgencyId={selectedAgencyId}
              onAgencyChange={setSelectedAgencyId}
              className="flex-1 max-w-xs"
            />
          </div>

          <PlanningCalendar selectedAgencyId={selectedAgencyId} />
        </div>
      </MainLayout>
    </RouteGuard>
  );
}

