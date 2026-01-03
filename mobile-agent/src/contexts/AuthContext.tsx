import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { authService, User, Agency, Permission, Module } from '../services/auth.service';
import { syncService } from '../services/sync.service';
import { offlineService } from '../services/offline.service';
import { setUnauthorizedCallback } from '../services/api';

interface AuthContextType {
  user: User | null;
  agencies: Agency[];
  permissions: Permission[];
  modules: Module[];
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (data: {
    user: User;
    agencies: Agency[];
    permissions: Permission[];
    modules: Module[];
  }) => Promise<void>;
  logout: () => Promise<void>;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [agencies, setAgencies] = useState<Agency[]>([]);
  const [permissions, setPermissions] = useState<Permission[]>([]);
  const [modules, setModules] = useState<Module[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const initializeAuth = async () => {
    try {
      const isAuth = await authService.isAuthenticated();
      if (isAuth) {
        const [userData, agenciesData, permissionsData, modulesData] = await Promise.all([
          authService.getUser(),
          authService.getAgencies(),
          authService.getPermissions(),
          authService.getModules(),
        ]);

        if (userData) {
          setUser(userData);
          setAgencies(agenciesData);
          setPermissions(permissionsData);
          setModules(modulesData);

          // Initialize offline service and sync
          await offlineService.init();
          await syncService.startAutoSync();
        }
      }
    } catch (error) {
      console.error('Error initializing auth:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const login = async (data: {
    user: User;
    agencies: Agency[];
    permissions: Permission[];
    modules: Module[];
  }) => {
    setUser(data.user);
    setAgencies(data.agencies);
    setPermissions(data.permissions);
    setModules(data.modules);

    // Initialize offline service and sync
    await offlineService.init();
    await syncService.startAutoSync();
  };

  const logout = async () => {
    await authService.logout();
    await syncService.stopAutoSync();
    setUser(null);
    setAgencies([]);
    setPermissions([]);
    setModules([]);
  };

  const refreshUser = async () => {
    const [userData, agenciesData, permissionsData, modulesData] = await Promise.all([
      authService.getUser(),
      authService.getAgencies(),
      authService.getPermissions(),
      authService.getModules(),
    ]);

    if (userData) {
      setUser(userData);
      setAgencies(agenciesData);
      setPermissions(permissionsData);
      setModules(modulesData);
    }
  };

  useEffect(() => {
    initializeAuth();
    
    // Configurer le callback pour les erreurs 401
    setUnauthorizedCallback(() => {
      logout();
    });
  }, []);

  return (
    <AuthContext.Provider
      value={{
        user,
        agencies,
        permissions,
        modules,
        isAuthenticated: !!user,
        isLoading,
        login,
        logout,
        refreshUser,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    console.error('useAuth must be used within an AuthProvider');
    // Retourner des valeurs par défaut pour éviter le crash
    return {
      user: null,
      agencies: [],
      permissions: [],
      modules: [],
      isAuthenticated: false,
      isLoading: true,
      login: async () => {
        console.error('AuthProvider not available');
      },
      logout: async () => {
        console.error('AuthProvider not available');
      },
      refreshUser: async () => {
        console.error('AuthProvider not available');
      },
    };
  }
  return context;
};

