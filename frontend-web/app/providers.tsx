'use client';

import { MutationCache, QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useEffect, useState } from 'react';
import { ToastProvider } from '@/components/ui/toast';
import { ThemeProvider } from '@/contexts/theme-context';
import { SearchProvider } from '@/contexts/search-context';

function ChunkRecovery() {
  useEffect(() => {
    const shouldRecover = (value: unknown) => {
      const text = typeof value === 'string' ? value : (value as any)?.message || '';
      return (
        text.includes('ChunkLoadError') ||
        text.includes('Loading chunk') ||
        text.includes('/_next/static/chunks/') ||
        text.includes('/_next/static/css/')
      );
    };

    const recoverOnce = () => {
      const key = 'chunk-recovery-reloaded';
      if (sessionStorage.getItem(key) === '1') return;
      sessionStorage.setItem(key, '1');
      window.location.reload();
    };

    const onWindowError = (event: ErrorEvent) => {
      if (shouldRecover(event.error) || shouldRecover(event.message)) {
        recoverOnce();
      }
    };

    const onUnhandledRejection = (event: PromiseRejectionEvent) => {
      if (shouldRecover(event.reason)) {
        recoverOnce();
      }
    };

    const onRouteSuccess = () => {
      sessionStorage.removeItem('chunk-recovery-reloaded');
    };

    window.addEventListener('error', onWindowError);
    window.addEventListener('unhandledrejection', onUnhandledRejection);
    window.addEventListener('load', onRouteSuccess);

    return () => {
      window.removeEventListener('error', onWindowError);
      window.removeEventListener('unhandledrejection', onUnhandledRejection);
      window.removeEventListener('load', onRouteSuccess);
    };
  }, []);

  return null;
}

export function Providers({ children }: { children: React.ReactNode }) {
  const [queryClient] = useState(
    () => {
      let client: QueryClient;
      client = new QueryClient({
        mutationCache: new MutationCache({
          onSuccess: async () => {
            // Global UX rule: after any successful mutation, mark cached queries stale
            // so lists and dashboards reflect new values immediately without manual refresh.
            // Performance-safe: only invalidate currently active queries.
            await client.invalidateQueries({
              type: 'active',
              refetchType: 'active',
            });
          },
        }),
        defaultOptions: {
          queries: {
            // Keep cache benefits while reducing stale UI after mutations/navigation.
            staleTime: 60 * 1000, // 1 minute
            gcTime: 30 * 60 * 1000, // 30 minutes
            refetchOnWindowFocus: false,
            refetchOnReconnect: false,
            refetchOnMount: 'always',
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
        <SearchProvider>
          <ChunkRecovery />
          <ToastProvider />
          {children}
        </SearchProvider>
      </QueryClientProvider>
    </ThemeProvider>
  );
}
