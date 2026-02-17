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
  LogOut,
  BarChart3,
  CreditCard,
  Heart,
  ScrollText,
  BookOpen,
  Bell,
  Navigation,
  Receipt,
  X,
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

// Roles autorisés par route agency (si absent = tous les roles agency)
const agencyRouteRoleMap: Record<string, string[]> = {
  '/agency': ['AGENCY_MANAGER', 'AGENT'],
  '/agency/vehicles': ['AGENCY_MANAGER', 'AGENT'],
  '/agency/clients': ['AGENCY_MANAGER', 'AGENT'],
  '/agency/bookings': ['AGENCY_MANAGER', 'AGENT'],
  '/agency/planning': ['AGENCY_MANAGER', 'AGENT'],
  '/agency/invoices': ['AGENCY_MANAGER'], // Factures : manager uniquement
  '/agency/contracts': ['AGENCY_MANAGER'], // Contrats : manager uniquement
  '/agency/journal': ['AGENCY_MANAGER'], // Journal : manager uniquement
  '/agency/fines': ['AGENCY_MANAGER'], // Amendes : manager uniquement
  '/agency/charges': ['AGENCY_MANAGER'], // Charges & Depenses : manager uniquement
  '/agency/kpi': ['AGENCY_MANAGER'], // KPI : manager uniquement
  '/agency/gps': ['AGENCY_MANAGER', 'AGENT'], // GPS : tous
  '/agency/notifications': ['AGENCY_MANAGER', 'AGENT'],
};

interface SidebarProps {
  userRole?: string;
  companyId?: string;
  agencyId?: string;
  effectiveAgencyRole?: 'AGENCY_MANAGER' | 'AGENT' | 'BOTH' | null;
  isOpen?: boolean;
  onClose?: () => void;
}

export function Sidebar({ userRole, companyId, agencyId, effectiveAgencyRole, isOpen, onClose }: SidebarProps) {
  const pathname = usePathname();
  const router = useRouter();
  const [activeModules, setActiveModules] = useState<ActiveModule[]>([]);
  const [modulesLoaded, setModulesLoaded] = useState(false);

  const isAdmin = userRole === 'SUPER_ADMIN';
  const isCompanyAdmin = userRole === 'COMPANY_ADMIN';
  const isAgencyManager = userRole === 'AGENCY_MANAGER';
  const isAgent = userRole === 'AGENT';
  const isAgencyUser = isAgencyManager || isAgent;

  // Charger les modules actifs
  useEffect(() => {
    const loadModules = async () => {
      try {
        if (isAgencyUser && agencyId) {
          const modules = await fetchAgencyModules(agencyId);
          setActiveModules(modules);
        } else if (isCompanyAdmin) {
          let modules: ActiveModule[] = [];
          if (companyId) {
            modules = await fetchCompanyModules(companyId);
          }
          if (agencyId) {
            const agencyModules = await fetchAgencyModules(agencyId);
            const mergedMap = new Map<string, ActiveModule>();
            [...modules, ...agencyModules].forEach(m => {
              const existing = mergedMap.get(m.moduleCode);
              if (!existing || m.isActive) {
                mergedMap.set(m.moduleCode, m);
              }
            });
            modules = Array.from(mergedMap.values());
          }
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

  const shouldShowLink = (href: string): boolean => {
    if (isAdmin) return true;

    if (isAgent && userRole) {
      const allowedRoles = agencyRouteRoleMap[href];
      if (allowedRoles && !allowedRoles.includes(userRole)) {
        return false;
      }
    }

    if (isCompanyAdmin && href.startsWith('/agency') && effectiveAgencyRole) {
      const allowedRoles = agencyRouteRoleMap[href];
      if (allowedRoles) {
        if (effectiveAgencyRole === 'BOTH') {
          // Solo : acces total
        } else if (!allowedRoles.includes(effectiveAgencyRole)) {
          return false;
        }
      }
      const requiredModule = agencyRouteModuleMap[href];
      if (!requiredModule) return true;
      return isModuleActive(activeModules, requiredModule as ModuleCode);
    }
    
    const routeMap = isAgencyUser ? agencyRouteModuleMap : companyRouteModuleMap;
    const requiredModule = routeMap[href];
    if (!requiredModule) return true;
    return isModuleActive(activeModules, requiredModule as ModuleCode);
  };

  const adminLinks = [
    { href: '/admin', label: 'Tableau de bord', icon: LayoutDashboard },
    { href: '/admin/companies', label: 'Entreprises', icon: Building2 },
    { href: '/admin/agencies', label: 'Agences', icon: MapPin },
    { href: '/admin/users', label: 'Utilisateurs', icon: Users },
    { href: '/admin/subscriptions', label: 'Abonnements', icon: CreditCard },
    { href: '/admin/company-health', label: 'Santé comptes', icon: Heart },
    { href: '/admin/notifications', label: 'Notifications', icon: Bell },
  ];

  const companyAdminLinks = [
    { href: '/company', label: 'Tableau de bord', icon: LayoutDashboard },
    { href: '/company/agencies', label: 'Agences', icon: MapPin },
    { href: '/company/users', label: 'Utilisateurs', icon: Users },
    { href: '/company/analytics', label: 'Analytics', icon: BarChart3 },
    { href: '/company/planning', label: 'Planning', icon: Calendar },
  ];

  const agencyOperationalLinks = [
    { href: '/agency/vehicles', label: 'Véhicules', icon: Car },
    { href: '/agency/clients', label: 'Clients', icon: UserCircle },
    { href: '/agency/bookings', label: 'Locations', icon: Calendar },
    { href: '/agency/planning', label: 'Planning agence', icon: Calendar },
    { href: '/agency/invoices', label: 'Factures', icon: FileText },
    { href: '/agency/contracts', label: 'Contrats', icon: ScrollText },
    { href: '/agency/journal', label: 'Journal', icon: BookOpen },
    { href: '/agency/fines', label: 'Amendes', icon: FileText },
    { href: '/agency/charges', label: 'Charges & Dépenses', icon: Receipt },
    { href: '/agency/kpi', label: 'KPI', icon: BarChart3 },
    { href: '/agency/gps', label: 'GPS', icon: Navigation },
    { href: '/agency/notifications', label: 'Notifications', icon: Bell },
  ];

  const agencyLinks = [
    { href: '/agency', label: 'Tableau de bord', icon: LayoutDashboard },
    ...agencyOperationalLinks,
  ];

  const agencyAgentOnlyLinks = agencyOperationalLinks.filter(l => {
    const allowed = agencyRouteRoleMap[l.href];
    return !allowed || allowed.includes('AGENT');
  });

  const agencyManagerOnlyLinks = agencyOperationalLinks.filter(l => {
    const allowed = agencyRouteRoleMap[l.href];
    return !allowed || allowed.includes('AGENCY_MANAGER');
  });

  const getCompanyAdminAgencyLinks = () => {
    if (!agencyId || !effectiveAgencyRole) return [];
    if (effectiveAgencyRole === 'BOTH') return agencyOperationalLinks;
    if (effectiveAgencyRole === 'AGENCY_MANAGER') return agencyManagerOnlyLinks;
    if (effectiveAgencyRole === 'AGENT') return agencyAgentOnlyLinks;
    return [];
  };

  const companyAdminWithAgencyLinks = [
    ...companyAdminLinks,
    ...getCompanyAdminAgencyLinks(),
  ];

  const allLinks = isAdmin ? adminLinks : isCompanyAdmin ? companyAdminWithAgencyLinks : agencyLinks;
  const links = modulesLoaded ? allLinks.filter(link => shouldShowLink(link.href)) : [];

  const handleLinkClick = () => {
    if (onClose) onClose();
  };

  return (
    <>
      {/* Mobile overlay */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-40 lg:hidden"
          onClick={onClose}
        />
      )}

      {/* Sidebar */}
      <div
        className={`fixed left-0 top-0 h-screen w-64 bg-card border-r border-border flex flex-col z-50 transition-transform duration-300 lg:translate-x-0 ${
          isOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <div className="p-4 md:p-6 border-b border-border flex items-center justify-between">
          <div>
            <h1 className="text-lg md:text-xl font-bold text-text">MalocAuto</h1>
            <p className="text-xs text-text-muted mt-1">
              {isAdmin ? 'Administration' : isCompanyAdmin ? 'Entreprise' : 'Agence'}
            </p>
          </div>
          <button
            onClick={onClose}
            className="lg:hidden p-1 rounded-md text-text-muted hover:text-text hover:bg-background"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <nav className="flex-1 p-3 md:p-4 space-y-1 overflow-y-auto">
          {links.map((link, index) => {
            const Icon = link.icon;
            const isActive = pathname === link.href || pathname?.startsWith(link.href + '/');
            const showAgencySeparator = isCompanyAdmin && agencyId && index > 0 
              && link.href.startsWith('/agency') 
              && !links[index - 1]?.href.startsWith('/agency');
            return (
              <div key={link.href}>
                {showAgencySeparator && (
                  <div className="mt-4 mb-2 px-4">
                    <p className="text-[10px] uppercase tracking-wider text-text-muted font-semibold">
                      Opérations Agence
                    </p>
                    <div className="border-t border-border mt-1" />
                  </div>
                )}
                <Link href={link.href} onClick={handleLinkClick}>
                  <div
                    className={`flex items-center gap-3 px-3 md:px-4 py-2.5 rounded-lg transition-colors ${
                      isActive
                        ? 'bg-primary text-white'
                        : 'text-text-muted hover:bg-background hover:text-text'
                    }`}
                  >
                    <Icon className="w-5 h-5 flex-shrink-0" />
                    <span className="font-medium text-sm">{link.label}</span>
                  </div>
                </Link>
              </div>
            );
          })}
        </nav>

        <div className="p-3 md:p-4 border-t border-border">
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
    </>
  );
}
