'use client';

import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { MutationCache } from '@tanstack/react-query';
import { useState } from 'react';
import { ToastProvider } from '@/components/ui/toast';
import { ThemeProvider } from '@/contexts/theme-context';

export function Providers({ children }: { children: React.ReactNode }) {
  const [queryClient] = useState(
    () => {
      let client: QueryClient;
      client = new QueryClient({
        mutationCache: new MutationCache({
          onSuccess: () => {
            // Keep caches coherent without blocking mutation resolution in the UI.
            void client.invalidateQueries({ refetchType: 'active' });
          },
        }),
        defaultOptions: {
          queries: {
            // Keep data fresh enough while avoiding aggressive re-fetches on every navigation.
            staleTime: 5 * 60 * 1000, // 5 minutes
            gcTime: 30 * 60 * 1000, // 30 minutes
            refetchOnWindowFocus: false,
            refetchOnReconnect: false,
            refetchOnMount: true,
            retry: 1,
          },
          mutations: {
            retry: 0,
          },
        },
      });
      return client;
    },
  );

  return (
    <ThemeProvider>
      <QueryClientProvider client={queryClient}>
        <ToastProvider />
        {children}
      </QueryClientProvider>
    </ThemeProvider>
  );
}



