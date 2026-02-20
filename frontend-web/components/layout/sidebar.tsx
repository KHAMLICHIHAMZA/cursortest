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
    { href: '/admin/plans', label: 'Plans', icon: ScrollText },
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

  const agencyLinks4CompanyAdmin = getCompanyAdminAgencyLinks();
  
  const getFilteredCompanyAdminLinks = () => {
    if (agencyLinks4CompanyAdmin.length === 0) return companyAdminLinks;
    
    const agencyHrefs = new Set(agencyLinks4CompanyAdmin.map(l => l.href));
    return companyAdminLinks.filter(link => {
      if (link.href === '/company/planning' && agencyHrefs.has('/agency/planning')) return false;
      if (link.href === '/company/analytics' && agencyHrefs.has('/agency/kpi')) return false;
      return true;
    });
  };

  const companyAdminWithAgencyLinks = [
    ...getFilteredCompanyAdminLinks(),
    ...agencyLinks4CompanyAdmin,
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
          className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40 lg:hidden"
          onClick={onClose}
        />
      )}

      {/* Sidebar */}
      <aside
        className={`fixed left-0 top-0 h-screen w-64 bg-surface-0 border-r border-border flex flex-col z-50 transition-transform duration-300 ease-out lg:translate-x-0 ${
          isOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        {/* Brand header */}
        <div className="flex h-14 items-center justify-between px-5 border-b border-border">
          <div className="flex items-center gap-2.5">
            <div className="flex h-7 w-7 items-center justify-center rounded-md bg-primary">
              <Car className="h-3.5 w-3.5 text-primary-foreground" />
            </div>
            <div className="flex flex-col">
              <span className="text-sm font-semibold tracking-tight text-foreground">MalocAuto</span>
              <span className="text-[10px] font-medium uppercase tracking-widest text-foreground-subtle">
                {isAdmin ? 'Admin' : isCompanyAdmin ? 'Entreprise' : 'Agence'}
              </span>
            </div>
          </div>
          <button
            onClick={onClose}
            className="lg:hidden flex h-7 w-7 items-center justify-center rounded-md text-foreground-subtle hover:text-foreground hover:bg-surface-2 transition-colors"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Navigation */}
        <nav className="flex-1 px-3 py-4 space-y-0.5 overflow-y-auto">
          {links.map((link, index) => {
            const Icon = link.icon;
            const isActive = pathname === link.href || pathname?.startsWith(link.href + '/');
            const showAgencySeparator = isCompanyAdmin && agencyId && index > 0
              && link.href.startsWith('/agency')
              && !links[index - 1]?.href.startsWith('/agency');
            return (
              <div key={link.href}>
                {showAgencySeparator && (
                  <div className="mt-5 mb-2 px-3">
                    <p className="text-[10px] font-semibold uppercase tracking-widest text-foreground-subtle">
                      Operations Agence
                    </p>
                  </div>
                )}
                <Link href={link.href} onClick={handleLinkClick}>
                  <div
                    className={`group relative flex items-center gap-3 px-3 py-2 rounded-md text-sm transition-all duration-150 ${
                      isActive
                        ? 'bg-primary/10 text-primary font-medium'
                        : 'text-foreground-muted hover:text-foreground hover:bg-surface-2'
                    }`}
                  >
                    {/* Active indicator bar */}
                    {isActive && (
                      <div className="absolute left-0 top-1/2 -translate-y-1/2 h-5 w-[3px] rounded-full bg-primary" />
                    )}
                    <Icon className={`h-4 w-4 flex-shrink-0 ${isActive ? 'text-primary' : 'text-foreground-subtle group-hover:text-foreground-muted'}`} />
                    <span>{link.label}</span>
                  </div>
                </Link>
              </div>
            );
          })}
        </nav>

        {/* Logout */}
        <div className="px-3 py-3 border-t border-border">
          <button
            onClick={handleLogout}
            className="flex w-full items-center gap-3 rounded-md px-3 py-2 text-sm text-foreground-subtle hover:text-foreground hover:bg-surface-2 transition-colors"
          >
            <LogOut className="h-4 w-4" />
            <span>Deconnexion</span>
          </button>
        </div>
      </aside>
    </>
  );
}
