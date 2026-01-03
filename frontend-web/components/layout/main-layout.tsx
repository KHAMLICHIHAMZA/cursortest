'use client';

import { Sidebar } from './sidebar';
import { Header } from './header';
import { useQuery } from '@tanstack/react-query';
import { authApi } from '@/lib/api/auth';

interface MainLayoutProps {
  children: React.ReactNode;
}

export function MainLayout({ children }: MainLayoutProps) {
  const { data: user } = useQuery({
    queryKey: ['me'],
    queryFn: () => authApi.getMe(),
    retry: false,
  });

  return (
    <div className="flex min-h-screen bg-background">
      <Sidebar userRole={user?.role} />
      <div className="flex-1 ml-64">
        <Header userName={user?.name} userRole={user?.role} />
        <main className="pt-16 p-8">{children}</main>
      </div>
    </div>
  );
}



