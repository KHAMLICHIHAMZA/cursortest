import { useQuery, UseQueryOptions } from '@tanstack/react-query';
import { useMemo } from 'react';

/**
 * Hook optimisé pour les requêtes avec cache et stale time
 */
export function useOptimizedQuery<TData = unknown, TError = unknown>(
  queryKey: string[],
  queryFn: () => Promise<TData>,
  options?: Omit<UseQueryOptions<TData, TError>, 'queryKey' | 'queryFn'>,
) {
  const optimizedOptions = useMemo(
    () => ({
      staleTime: 5 * 60 * 1000, // 5 minutes
      gcTime: 10 * 60 * 1000, // 10 minutes (formerly cacheTime in v4)
      refetchOnWindowFocus: false,
      refetchOnMount: false,
      ...options,
    }),
    [options],
  );

  return useQuery<TData, TError>({
    queryKey,
    queryFn,
    ...optimizedOptions,
  });
}



