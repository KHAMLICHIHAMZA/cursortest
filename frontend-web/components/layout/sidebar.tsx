'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  LayoutDashboard,
  Building2,
  MapPin,
  Users,
  Car,
  UserCircle,
  Calendar,
  Wrench,
  FileText,
  Settings,
  LogOut,
  BarChart3,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import Cookies from 'js-cookie';
import { useRouter } from 'next/navigation';

interface SidebarProps {
  userRole?: string;
}

export function Sidebar({ userRole }: SidebarProps) {
  const pathname = usePathname();
  const router = useRouter();

  const handleLogout = () => {
    Cookies.remove('accessToken');
    Cookies.remove('refreshToken');
    router.push('/login');
  };

  const isAdmin = userRole === 'SUPER_ADMIN';
  const isCompanyAdmin = userRole === 'COMPANY_ADMIN';
  const isAgencyUser = userRole === 'AGENCY_MANAGER' || userRole === 'AGENT';

  const adminLinks = [
    { href: '/admin', label: 'Tableau de bord', icon: LayoutDashboard },
    { href: '/admin/companies', label: 'Entreprises', icon: Building2 },
    { href: '/admin/agencies', label: 'Agences', icon: MapPin },
    { href: '/admin/users', label: 'Utilisateurs', icon: Users },
  ];

  const companyAdminLinks = [
    { href: '/company', label: 'Tableau de bord', icon: LayoutDashboard },
    { href: '/company/agencies', label: 'Agences', icon: MapPin },
    { href: '/company/users', label: 'Utilisateurs', icon: Users },
    { href: '/company/analytics', label: 'Analytics', icon: BarChart3 },
    { href: '/company/planning', label: 'Planning', icon: Calendar },
  ];

  const agencyLinks = [
    { href: '/agency', label: 'Tableau de bord', icon: LayoutDashboard },
    { href: '/agency/vehicles', label: 'Véhicules', icon: Car },
    { href: '/agency/clients', label: 'Clients', icon: UserCircle },
    { href: '/agency/bookings', label: 'Locations', icon: Calendar },
    { href: '/agency/maintenance', label: 'Maintenance', icon: Wrench },
    { href: '/agency/fines', label: 'Amendes', icon: FileText },
    { href: '/agency/planning', label: 'Planning', icon: Calendar },
  ];

  const links = isAdmin ? adminLinks : isCompanyAdmin ? companyAdminLinks : agencyLinks;

  return (
    <div className="fixed left-0 top-0 h-screen w-64 bg-card border-r border-border flex flex-col">
      <div className="p-6 border-b border-border">
        <h1 className="text-xl font-bold text-text">MalocAuto</h1>
        <p className="text-xs text-text-muted mt-1">
          {isAdmin ? 'Administration' : isCompanyAdmin ? 'Entreprise' : 'Agence'}
        </p>
      </div>

      <nav className="flex-1 p-4 space-y-2 overflow-y-auto">
        {links.map((link) => {
          const Icon = link.icon;
          const isActive = pathname === link.href || pathname?.startsWith(link.href + '/');
          return (
            <Link key={link.href} href={link.href}>
              <div
                className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${
                  isActive
                    ? 'bg-primary text-white'
                    : 'text-text-muted hover:bg-background hover:text-text'
                }`}
              >
                <Icon className="w-5 h-5" />
                <span className="font-medium">{link.label}</span>
              </div>
            </Link>
          );
        })}
      </nav>

      <div className="p-4 border-t border-border">
        <Button
          variant="ghost"
          className="w-full justify-start text-text-muted hover:text-text"
          onClick={handleLogout}
        >
          <LogOut className="w-5 h-5 mr-3" />
          Déconnexion
        </Button>
      </div>
    </div>
  );
}

