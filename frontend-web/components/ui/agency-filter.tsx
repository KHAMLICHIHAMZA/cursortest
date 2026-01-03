'use client';

import { useQuery } from '@tanstack/react-query';
import { agencyApi } from '@/lib/api/agency';
import { authApi } from '@/lib/api/auth';
import { Select } from './select';

interface AgencyFilterProps {
  selectedAgencyId: string | null;
  onAgencyChange: (agencyId: string | null) => void;
  className?: string;
}

export function AgencyFilter({ selectedAgencyId, onAgencyChange, className }: AgencyFilterProps) {
  const { data: user } = useQuery({
    queryKey: ['me'],
    queryFn: () => authApi.getMe(),
  });

  const { data: agencies, isLoading } = useQuery({
    queryKey: ['agencies'],
    queryFn: () => agencyApi.getAll(),
    enabled: !!user,
  });

  // Filtrer les agences selon les permissions de l'utilisateur
  const accessibleAgencies = agencies?.filter((agency) => {
    if (user?.role === 'SUPER_ADMIN') {
      return true; // Super admin voit toutes les agences
    }
    if (user?.role === 'COMPANY_ADMIN' && user.companyId) {
      return agency.companyId === user.companyId;
    }
    if (user?.role === 'AGENCY_MANAGER' || user?.role === 'AGENT') {
      // Vérifier si l'utilisateur a accès à cette agence via agencyIds
      return user.agencyIds?.includes(agency.id);
    }
    return false;
  });

  if (isLoading || !accessibleAgencies) {
    return null;
  }

  // Si l'utilisateur n'a accès qu'à une seule agence, ne pas afficher le filtre
  if (accessibleAgencies.length <= 1) {
    return null;
  }

  return (
    <div className={className}>
      <label className="block text-sm font-medium text-text mb-2">Filtrer par agence</label>
      <Select
        value={selectedAgencyId || 'all'}
        onChange={(e) => {
          const value = e.target.value;
          onAgencyChange(value === 'all' ? null : value);
        }}
        className="w-full max-w-xs"
      >
        <option value="all">Toutes les agences</option>
        {accessibleAgencies.map((agency) => (
          <option key={agency.id} value={agency.id}>
            {agency.name}
          </option>
        ))}
      </Select>
    </div>
  );
}

