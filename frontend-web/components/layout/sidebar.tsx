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
  /** Pour COMPANY_ADMIN : rôle agence hérité dynamiquement selon les users existants */
  effectiveAgencyRole?: 'AGENCY_MANAGER' | 'AGENT' | 'BOTH' | null;
}

export function Sidebar({ userRole, companyId, agencyId, effectiveAgencyRole }: SidebarProps) {
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
          // COMPANY_ADMIN: charger les modules company + agency si agencyId disponible
          let modules: ActiveModule[] = [];
          if (companyId) {
            modules = await fetchCompanyModules(companyId);
          }
          // Si le COMPANY_ADMIN a un agencyId (solo operator), fusionner les modules agence
          if (agencyId) {
            const agencyModules = await fetchAgencyModules(agencyId);
            // Fusionner : si un module est actif dans l'agence OU la company, il est actif
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

  // Vérifier si un lien doit être affiché (role + module)
  const shouldShowLink = (href: string): boolean => {
    // Admin voit tout
    if (isAdmin) return true;

    // 1. Vérifier le rôle pour les routes agency (AGENT restrictions)
    if (isAgent && userRole) {
      const allowedRoles = agencyRouteRoleMap[href];
      if (allowedRoles && !allowedRoles.includes(userRole)) {
        return false; // AGENT n'a pas accès à ce menu
      }
    }

    // COMPANY_ADMIN avec rôle agence hérité : filtrer selon le rôle effectif
    if (isCompanyAdmin && href.startsWith('/agency') && effectiveAgencyRole) {
      // Vérifier d'abord le rôle effectif
      const allowedRoles = agencyRouteRoleMap[href];
      if (allowedRoles) {
        if (effectiveAgencyRole === 'BOTH') {
          // Solo : accès total, pas de filtre rôle
        } else if (!allowedRoles.includes(effectiveAgencyRole)) {
          return false;
        }
      }
      // Puis vérifier le module
      const requiredModule = agencyRouteModuleMap[href];
      if (!requiredModule) return true;
      return isModuleActive(activeModules, requiredModule as ModuleCode);
    }
    
    // 2. Vérifier le module requis
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
    { href: '/admin/notifications', label: 'Notifications', icon: Bell },
  ];

  const companyAdminLinks = [
    { href: '/company', label: 'Tableau de bord', icon: LayoutDashboard },
    { href: '/company/agencies', label: 'Agences', icon: MapPin },
    { href: '/company/users', label: 'Utilisateurs', icon: Users },
    { href: '/company/analytics', label: 'Analytics', icon: BarChart3 },
    { href: '/company/planning', label: 'Planning', icon: Calendar },
  ];

  // Menus opérationnels agence (pour AGENCY_MANAGER et COMPANY_ADMIN avec accès agence)
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

  // Menus agent uniquement (opérationnel terrain)
  const agencyAgentOnlyLinks = agencyOperationalLinks.filter(l => {
    const allowed = agencyRouteRoleMap[l.href];
    return !allowed || allowed.includes('AGENT');
  });

  // Menus manager uniquement (gestion avancée)
  const agencyManagerOnlyLinks = agencyOperationalLinks.filter(l => {
    const allowed = agencyRouteRoleMap[l.href];
    return !allowed || allowed.includes('AGENCY_MANAGER');
  });

  // COMPANY_ADMIN : menus agence dynamiques selon les rôles couverts
  // - BOTH : solo, personne d'autre → tous les menus agence
  // - AGENCY_MANAGER : pas de manager créé → il gère (menus manager)
  // - AGENT : pas d'agent créé → il opère (menus agent)
  // - null : tout est couvert → pas de menus agence
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

      <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
        {links.map((link, index) => {
          const Icon = link.icon;
          const isActive = pathname === link.href || pathname?.startsWith(link.href + '/');
          // Séparateur visuel entre section Entreprise et section Agence (COMPANY_ADMIN solo)
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
              <Link href={link.href}>
                <div
                  className={`flex items-center gap-3 px-4 py-2.5 rounded-lg transition-colors ${
                    isActive
                      ? 'bg-primary text-white'
                      : 'text-text-muted hover:bg-background hover:text-text'
                  }`}
                >
                  <Icon className="w-5 h-5" />
                  <span className="font-medium text-sm">{link.label}</span>
                </div>
              </Link>
            </div>
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

