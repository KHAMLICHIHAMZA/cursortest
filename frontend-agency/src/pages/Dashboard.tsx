import { useQuery } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import api from '../lib/axios';
import { Car, Users, Calendar, TrendingUp } from 'lucide-react';
import { getImageUrl } from '../lib/utils/image-url';

export default function Dashboard() {
  const navigate = useNavigate();

  const { data: vehicles } = useQuery({
    queryKey: ['vehicles'],
    queryFn: async () => {
      const res = await api.get('/vehicles');
      return res.data;
    },
  });

  const { data: bookings } = useQuery({
    queryKey: ['bookings'],
    queryFn: async () => {
      const res = await api.get('/bookings');
      return res.data;
    },
  });

  const { data: clients } = useQuery({
    queryKey: ['clients'],
    queryFn: async () => {
      const res = await api.get('/clients');
      return res.data;
    },
  });

  const stats = [
    {
      label: 'Véhicules',
      value: vehicles?.length || 0,
      icon: Car,
      color: 'text-blue-400',
      path: '/vehicles',
    },
    {
      label: 'Clients',
      value: clients?.length || 0,
      icon: Users,
      color: 'text-green-400',
      path: '/clients',
    },
    {
      label: 'Locations',
      value: bookings?.length || 0,
      icon: Calendar,
      color: 'text-purple-400',
      path: '/bookings',
    },
    {
      label: 'Véhicules disponibles',
      value: vehicles?.filter((v: any) => v.status === 'AVAILABLE').length || 0,
      icon: TrendingUp,
      color: 'text-yellow-400',
      path: '/vehicles',
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

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-[#2C2F36] rounded-lg p-6 border border-gray-700">
          <h2 className="text-xl font-semibold mb-4">Locations récentes</h2>
          {bookings && bookings.length > 0 ? (
            <div className="space-y-3">
              {bookings.slice(0, 5).map((booking: any) => (
                <div
                  key={booking.id}
                  className="flex items-center gap-4 p-4 bg-[#1D1F23] rounded-lg"
                >
                  {booking.vehicle?.imageUrl ? (
                    <img
                      src={getImageUrl(booking.vehicle.imageUrl) || ''}
                      alt={`${booking.vehicle.brand} ${booking.vehicle.model}`}
                      className="w-16 h-16 object-cover rounded-lg"
                    />
                  ) : (
                    <div className="w-16 h-16 bg-gray-700 rounded-lg flex items-center justify-center">
                      <Car className="w-8 h-8 text-gray-500" />
                    </div>
                  )}
                  <div className="flex-1">
                    <p className="font-medium text-white">
                      {booking.client?.name} - {booking.vehicle?.brand} {booking.vehicle?.model}
                    </p>
                    <p className="text-sm text-gray-400">
                      {new Date(booking.startDate).toLocaleDateString()} - {new Date(booking.endDate).toLocaleDateString()}
                    </p>
                  </div>
                  <span
                    className={`px-3 py-1 rounded-full text-xs font-medium ${
                      booking.status === 'ACTIVE'
                        ? 'bg-green-500/20 text-green-400'
                        : booking.status === 'CONFIRMED'
                        ? 'bg-blue-500/20 text-blue-400'
                        : 'bg-gray-500/20 text-gray-400'
                    }`}
                  >
                    {booking.status}
                  </span>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-gray-400">Aucune location</p>
          )}
        </div>

        <div className="bg-[#2C2F36] rounded-lg p-6 border border-gray-700">
          <h2 className="text-xl font-semibold mb-4">Véhicules en location</h2>
          {vehicles?.filter((v: any) => v.status === 'RENTED').length > 0 ? (
            <div className="space-y-3">
              {vehicles
                .filter((v: any) => v.status === 'RENTED')
                .slice(0, 5)
                .map((vehicle: any) => (
                  <div
                    key={vehicle.id}
                    className="flex items-center gap-4 p-4 bg-[#1D1F23] rounded-lg"
                  >
                    {vehicle.imageUrl ? (
                      <img
                        src={getImageUrl(vehicle.imageUrl) || ''}
                        alt={`${vehicle.brand} ${vehicle.model}`}
                        className="w-16 h-16 object-cover rounded-lg"
                      />
                    ) : (
                      <div className="w-16 h-16 bg-gray-700 rounded-lg flex items-center justify-center">
                        <Car className="w-8 h-8 text-gray-500" />
                      </div>
                    )}
                    <div className="flex-1">
                      <p className="font-medium text-white">
                        {vehicle.brand} {vehicle.model}
                      </p>
                      <p className="text-sm text-gray-400">
                        {vehicle.registrationNumber}
                      </p>
                    </div>
                    <span className="px-3 py-1 rounded-full text-xs font-medium bg-red-500/20 text-red-400">
                      En location
                    </span>
                  </div>
                ))}
            </div>
          ) : (
            <p className="text-gray-400">Aucun véhicule en location</p>
          )}
        </div>
      </div>
    </div>
  );
}






