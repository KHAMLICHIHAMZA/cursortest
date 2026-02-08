'use client';

import { useEffect, useState } from 'react';
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
  CreditCard,
  Heart,
  ScrollText,
  BookOpen,
  Bell,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import Cookies from 'js-cookie';
import { useRouter } from 'next/navigation';
import { 
  fetchAgencyModules, 
  fetchCompanyModules, 
  isModuleActive, 
  agencyRouteModuleMap, 
  companyRouteModuleMap,
  clearModulesCache,
  ActiveModule,
  ModuleCode
} from '@/lib/modules';

interface SidebarProps {
  userRole?: string;
  companyId?: string;
  agencyId?: string;
}

export function Sidebar({ userRole, companyId, agencyId }: SidebarProps) {
  const pathname = usePathname();
  const router = useRouter();
  const [activeModules, setActiveModules] = useState<ActiveModule[]>([]);
  const [modulesLoaded, setModulesLoaded] = useState(false);

  const isAdmin = userRole === 'SUPER_ADMIN';
  const isCompanyAdmin = userRole === 'COMPANY_ADMIN';
  const isAgencyUser = userRole === 'AGENCY_MANAGER' || userRole === 'AGENT';

  // Charger les modules actifs
  useEffect(() => {
    const loadModules = async () => {
      try {
        if (isAgencyUser && agencyId) {
          const modules = await fetchAgencyModules(agencyId);
          setActiveModules(modules);
        } else if (isCompanyAdmin && companyId) {
          const modules = await fetchCompanyModules(companyId);
          setActiveModules(modules);
        }
      } catch (error) {
        console.error('Erreur chargement modules:', error);
      }
      setModulesLoaded(true);
    };
    
    if (!isAdmin) {
      loadModules();
    } else {
      setModulesLoaded(true);
    }
  }, [isAdmin, isAgencyUser, isCompanyAdmin, agencyId, companyId]);

  const handleLogout = () => {
    Cookies.remove('accessToken');
    Cookies.remove('refreshToken');
    clearModulesCache();
    router.push('/login');
  };

  // Vérifier si un lien doit être affiché
  const shouldShowLink = (href: string): boolean => {
    // Admin voit tout
    if (isAdmin) return true;
    
    // Déterminer le mapping selon le type d'utilisateur
    const routeMap = isAgencyUser ? agencyRouteModuleMap : companyRouteModuleMap;
    const requiredModule = routeMap[href];
    
    // Si pas de module requis, toujours afficher
    if (!requiredModule) return true;
    
    // Vérifier si le module est actif
    return isModuleActive(activeModules, requiredModule as ModuleCode);
  };

  const adminLinks = [
    { href: '/admin', label: 'Tableau de bord', icon: LayoutDashboard },
    { href: '/admin/companies', label: 'Entreprises', icon: Building2 },
    { href: '/admin/agencies', label: 'Agences', icon: MapPin },
    { href: '/admin/users', label: 'Utilisateurs', icon: Users },
    { href: '/admin/subscriptions', label: 'Abonnements', icon: CreditCard },
    { href: '/admin/company-health', label: 'Santé comptes', icon: Heart },
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
    { href: '/agency/planning', label: 'Planning', icon: Calendar },
    { href: '/agency/invoices', label: 'Factures', icon: FileText },
    { href: '/agency/contracts', label: 'Contrats', icon: ScrollText },
    { href: '/agency/journal', label: 'Journal', icon: BookOpen },
    { href: '/agency/fines', label: 'Amendes', icon: FileText },
    { href: '/agency/maintenance', label: 'Maintenance', icon: Wrench },
    { href: '/agency/notifications', label: 'Notifications', icon: Bell },
  ];

  const allLinks = isAdmin ? adminLinks : isCompanyAdmin ? companyAdminLinks : agencyLinks;
  
  // Filtrer les liens selon les modules actifs
  const links = modulesLoaded ? allLinks.filter(link => shouldShowLink(link.href)) : [];

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

