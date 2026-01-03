import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import api from '../lib/axios';
import { TrendingUp, Building2, Car, Users, Calendar, DollarSign } from 'lucide-react';

export default function Analytics() {
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');

  const { data: kpis, isLoading } = useQuery({
    queryKey: ['analytics', 'global', startDate, endDate],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (startDate) params.append('startDate', startDate);
      if (endDate) params.append('endDate', endDate);
      const res = await api.get(`/analytics/global/kpis?${params}`);
      return res.data;
    },
  });

  if (isLoading) return <div className="text-center py-8">Chargement...</div>;

  const stats = [
    {
      label: 'Entreprises',
      value: kpis?.kpis?.totalCompanies || 0,
      icon: Building2,
      color: 'text-blue-400',
      subValue: `${kpis?.kpis?.activeCompanies || 0} actives`,
    },
    {
      label: 'Agences',
      value: kpis?.kpis?.totalAgencies || 0,
      icon: Building2,
      color: 'text-green-400',
    },
    {
      label: 'Véhicules',
      value: kpis?.kpis?.totalVehicles || 0,
      icon: Car,
      color: 'text-purple-400',
    },
    {
      label: 'Utilisateurs',
      value: kpis?.kpis?.totalUsers || 0,
      icon: Users,
      color: 'text-yellow-400',
    },
    {
      label: 'Locations',
      value: kpis?.kpis?.totalBookings || 0,
      icon: Calendar,
      color: 'text-pink-400',
      subValue: `${kpis?.kpis?.completedBookings || 0} terminées`,
    },
    {
      label: 'Revenus totaux',
      value: `${(kpis?.kpis?.totalRevenue || 0).toLocaleString('fr-FR')} €`,
      icon: DollarSign,
      color: 'text-green-400',
      subValue: `${(kpis?.kpis?.revenuePerVehicle || 0).toLocaleString('fr-FR')} €/véhicule`,
    },
  ];

  return (
    <div>
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold">Analytics Global</h1>
        <div className="flex gap-4">
          <input
            type="date"
            value={startDate}
            onChange={(e) => setStartDate(e.target.value)}
            className="px-4 py-2 bg-[#2C2F36] border border-gray-600 rounded-lg text-white"
            placeholder="Date de début"
          />
          <input
            type="date"
            value={endDate}
            onChange={(e) => setEndDate(e.target.value)}
            className="px-4 py-2 bg-[#2C2F36] border border-gray-600 rounded-lg text-white"
            placeholder="Date de fin"
          />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
        {stats.map((stat) => {
          const Icon = stat.icon;
          return (
            <div
              key={stat.label}
              className="bg-[#2C2F36] rounded-lg p-6 border border-gray-700"
            >
              <div className="flex items-center justify-between mb-4">
                <Icon className={`${stat.color} w-8 h-8`} />
              </div>
              <p className="text-3xl font-bold text-white mb-1">{stat.value}</p>
              <p className="text-gray-400 text-sm">{stat.label}</p>
              {stat.subValue && (
                <p className="text-gray-500 text-xs mt-1">{stat.subValue}</p>
              )}
            </div>
          );
        })}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Most Active Companies */}
        <div className="bg-[#2C2F36] rounded-lg p-6 border border-gray-700">
          <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
            <TrendingUp className="w-5 h-5 text-blue-400" />
            Entreprises les plus actives
          </h2>
          {kpis?.kpis?.mostActiveCompanies && kpis.kpis.mostActiveCompanies.length > 0 ? (
            <div className="space-y-3">
              {kpis.kpis.mostActiveCompanies.map((item: any, index: number) => (
                <div
                  key={item.companyId}
                  className="flex items-center justify-between p-4 bg-[#1D1F23] rounded-lg"
                >
                  <div className="flex items-center gap-3">
                    <span className="text-2xl font-bold text-gray-500 w-8">
                      #{index + 1}
                    </span>
                    <div>
                      <p className="font-medium text-white">
                        {item.company?.name || 'Entreprise inconnue'}
                      </p>
                    </div>
                  </div>
                  <span className="text-lg font-bold text-blue-400">
                    {item.bookingCount} locations
                  </span>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-gray-400">Aucune donnée disponible</p>
          )}
        </div>

        {/* Most Active Agencies */}
        <div className="bg-[#2C2F36] rounded-lg p-6 border border-gray-700">
          <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
            <TrendingUp className="w-5 h-5 text-green-400" />
            Agences les plus actives
          </h2>
          {kpis?.kpis?.mostActiveAgencies && kpis.kpis.mostActiveAgencies.length > 0 ? (
            <div className="space-y-3">
              {kpis.kpis.mostActiveAgencies.map((item: any, index: number) => (
                <div
                  key={item.agencyId}
                  className="flex items-center justify-between p-4 bg-[#1D1F23] rounded-lg"
                >
                  <div className="flex items-center gap-3">
                    <span className="text-2xl font-bold text-gray-500 w-8">
                      #{index + 1}
                    </span>
                    <div>
                      <p className="font-medium text-white">
                        {item.agency?.name || 'Agence inconnue'}
                      </p>
                    </div>
                  </div>
                  <span className="text-lg font-bold text-green-400">
                    {item.bookingCount} locations
                  </span>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-gray-400">Aucune donnée disponible</p>
          )}
        </div>
      </div>

      {/* Additional Metrics */}
      <div className="mt-6 bg-[#2C2F36] rounded-lg p-6 border border-gray-700">
        <h2 className="text-xl font-semibold mb-4">Métriques supplémentaires</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <p className="text-gray-400 text-sm mb-1">Durée moyenne de location</p>
            <p className="text-2xl font-bold text-white">
              {kpis?.kpis?.averageBookingDurationDays
                ? `${kpis.kpis.averageBookingDurationDays.toFixed(1)} jours`
                : 'N/A'}
            </p>
          </div>
          <div>
            <p className="text-gray-400 text-sm mb-1">Taux de complétion</p>
            <p className="text-2xl font-bold text-white">
              {kpis?.kpis?.totalBookings
                ? `${Math.round((kpis.kpis.completedBookings / kpis.kpis.totalBookings) * 100)}%`
                : 'N/A'}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}



