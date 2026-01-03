'use client';

import { useState, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useQuery as useAuthQuery } from '@tanstack/react-query';
import { authApi } from '@/lib/api/auth';
import { agencyApi } from '@/lib/api/agency';
import { PlanningCalendar } from '@/components/planning/planning-calendar';
import { MainLayout } from '@/components/layout/main-layout';
import { RouteGuard } from '@/components/auth/route-guard';
import { Select } from '@/components/ui/select';
import Cookies from 'js-cookie';

export default function CompanyPlanningPage() {
  const [selectedAgencyId, setSelectedAgencyId] = useState<string | null>(null);

  const { data: user } = useAuthQuery({
    queryKey: ['me'],
    queryFn: () => authApi.getMe(),
    enabled: !!Cookies.get('accessToken'),
  });

  const { data: agencies } = useQuery({
    queryKey: ['agencies'],
    queryFn: () => agencyApi.getAll(),
    enabled: !!user?.companyId,
  });

  // Filtrer les agences par companyId
  const companyAgencies = useMemo(() => {
    if (!agencies || !user?.companyId) return [];
    return agencies.filter((agency) => agency.companyId === user.companyId);
  }, [agencies, user?.companyId]);

  return (
    <RouteGuard allowedRoles={['COMPANY_ADMIN', 'SUPER_ADMIN']}>
      <MainLayout>
        <div className="max-w-[1600px] mx-auto">
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-text mb-2">Planning Entreprise</h1>
            <p className="text-text-muted">
              Visualisez les réservations, maintenances et tous les événements de toutes vos agences
            </p>
          </div>

          <div className="mb-6 flex items-center gap-4">
            <div className="flex-1 max-w-xs">
              <label htmlFor="agency" className="block text-sm font-medium text-text mb-2">
                Filtrer par agence
              </label>
              <Select
                id="agency"
                value={selectedAgencyId || ''}
                onChange={(e) => setSelectedAgencyId(e.target.value || null)}
              >
                <option value="">Toutes les agences</option>
                {companyAgencies.map((agency) => (
                  <option key={agency.id} value={agency.id}>
                    {agency.name}
                  </option>
                ))}
              </Select>
            </div>
          </div>

          <PlanningCalendar selectedAgencyId={selectedAgencyId} />
        </div>
      </MainLayout>
    </RouteGuard>
  );
}

