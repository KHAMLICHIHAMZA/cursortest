import { useQuery } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import api from '../lib/axios';
import { Building2, Users, TrendingUp, CreditCard, Heart } from 'lucide-react';

export default function Dashboard() {
  const navigate = useNavigate();
  const { data: companies } = useQuery({
    queryKey: ['companies'],
    queryFn: async () => {
      const res = await api.get('/companies');
      return res.data;
    },
  });

  const { data: agencies } = useQuery({
    queryKey: ['agencies'],
    queryFn: async () => {
      const res = await api.get('/agencies');
      return res.data;
    },
  });

  const { data: users } = useQuery({
    queryKey: ['users'],
    queryFn: async () => {
      const res = await api.get('/users');
      return res.data;
    },
  });

  const { data: subscriptions } = useQuery({
    queryKey: ['subscriptions'],
    queryFn: async () => {
      const res = await api.get('/subscriptions');
      return res.data;
    },
  });

  const stats = [
    {
      label: 'Entreprises',
      value: companies?.length || 0,
      icon: Building2,
      color: 'text-blue-400',
      path: '/companies',
    },
    {
      label: 'Agences',
      value: agencies?.length || 0,
      icon: Building2,
      color: 'text-green-400',
      path: '/agencies',
    },
    {
      label: 'Utilisateurs',
      value: users?.length || 0,
      icon: Users,
      color: 'text-purple-400',
      path: '/users',
    },
    {
      label: 'Entreprises actives',
      value: companies?.filter((c: any) => c.status === 'ACTIVE' || c.isActive).length || 0,
      icon: TrendingUp,
      color: 'text-yellow-400',
      path: '/companies',
    },
    {
      label: 'Abonnements',
      value: subscriptions?.length || 0,
      icon: CreditCard,
      color: 'text-blue-400',
      path: '/subscriptions',
    },
    {
      label: 'Comptes suspendus',
      value: companies?.filter((c: any) => c.status === 'SUSPENDED').length || 0,
      icon: Heart,
      color: 'text-red-400',
      path: '/company-health',
    },
  ];

  return (
    <div>
      <h1 className="text-3xl font-bold mb-8">Dashboard</h1>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        {stats.map((stat) => {
          const Icon = stat.icon;
          return (
            <div
              key={stat.label}
              onClick={() => navigate(stat.path)}
              className="bg-[#2C2F36] rounded-lg p-6 border border-gray-700 cursor-pointer hover:border-gray-500 hover:bg-[#353840] transition-all duration-200"
            >
              <div className="flex items-center justify-between mb-4">
                <Icon className={`${stat.color} w-8 h-8`} />
              </div>
              <p className="text-3xl font-bold text-white mb-1">{stat.value}</p>
              <p className="text-gray-400 text-sm">{stat.label}</p>
            </div>
          );
        })}
      </div>

      <div className="bg-[#2C2F36] rounded-lg p-6 border border-gray-700">
        <h2 className="text-xl font-semibold mb-4">Entreprises récentes</h2>
        {companies && companies.length > 0 ? (
          <div className="space-y-3">
            {companies.slice(0, 5).map((company: any) => (
              <div
                key={company.id}
                className="flex items-center justify-between p-4 bg-[#1D1F23] rounded-lg"
              >
                <div>
                  <p className="font-medium text-white">{company.name}</p>
                  <p className="text-sm text-gray-400">
                    {company._count?.agencies || 0} agences •{' '}
                    {company._count?.users || 0} utilisateurs
                  </p>
                </div>
                <span
                  className={`px-3 py-1 rounded-full text-xs font-medium ${
                    company.isActive
                      ? 'bg-green-500/20 text-green-400'
                      : 'bg-red-500/20 text-red-400'
                  }`}
                >
                  {company.isActive ? 'Active' : 'Inactive'}
                </span>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-gray-400">Aucune entreprise</p>
        )}
      </div>
    </div>
  );
}






