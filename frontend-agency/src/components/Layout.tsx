import { Outlet, useNavigate, useLocation } from 'react-router-dom';
import { LayoutDashboard, Car, Users, Calendar, FileText, AlertCircle, Wrench, LogOut } from 'lucide-react';
import { getStoredUser, clearAuth } from '../lib/auth';

export default function Layout() {
  const navigate = useNavigate();
  const location = useLocation();
  const user = getStoredUser();

  const handleLogout = () => {
    clearAuth();
    navigate('/login');
  };

  const menuItems = [
    { path: '/', label: 'Dashboard', icon: LayoutDashboard },
    { path: '/vehicles', label: 'Véhicules', icon: Car },
    { path: '/clients', label: 'Clients', icon: Users },
    { path: '/bookings', label: 'Locations', icon: Calendar },
    { path: '/fines', label: 'Amendes', icon: AlertCircle },
    { path: '/maintenance', label: 'Maintenance', icon: Wrench },
    { path: '/planning', label: 'Planning', icon: Calendar },
  ];

  return (
    <div className="flex h-screen bg-[#1D1F23]">
      <aside className="w-64 bg-[#2C2F36] border-r border-gray-700">
        <div className="p-6">
          <h1 className="text-2xl font-bold text-[#3E7BFA]">MalocAuto</h1>
          <p className="text-sm text-gray-400 mt-1">Agence</p>
        </div>
        <nav className="mt-8">
          {menuItems.map((item) => {
            const Icon = item.icon;
            const isActive = location.pathname === item.path;
            return (
              <button
                key={item.path}
                onClick={() => navigate(item.path)}
                className={`w-full flex items-center gap-3 px-6 py-3 text-left transition-colors ${
                  isActive
                    ? 'bg-[#3E7BFA] text-white'
                    : 'text-gray-300 hover:bg-gray-700'
                }`}
              >
                <Icon size={20} />
                <span>{item.label}</span>
              </button>
            );
          })}
        </nav>
        <div className="absolute bottom-0 w-64 p-6 border-t border-gray-700">
          <div className="mb-4">
            <p className="text-sm font-medium text-white">{user?.name}</p>
            <p className="text-xs text-gray-400">{user?.email}</p>
          </div>
          <button
            onClick={handleLogout}
            className="w-full flex items-center gap-3 px-4 py-2 text-gray-300 hover:bg-gray-700 rounded-lg transition-colors"
          >
            <LogOut size={18} />
            <span>Déconnexion</span>
          </button>
        </div>
      </aside>

      <main className="flex-1 overflow-auto">
        <div className="p-8">
          <Outlet />
        </div>
      </main>
    </div>
  );
}






