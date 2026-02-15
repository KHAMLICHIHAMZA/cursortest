import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useOptimizedQuery } from '@/lib/hooks/use-optimized-query';
import React from 'react';

// Unmock react-query for this test file
vi.unmock('@tanstack/react-query');

describe('useOptimizedQuery hook', () => {
  let queryClient: QueryClient;

  beforeEach(() => {
    queryClient = new QueryClient({
      defaultOptions: {
        queries: {
          retry: false,
        },
      },
    });
  });

  const wrapper = ({ children }: { children: React.ReactNode }) => (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  );

  it('should fetch data successfully', async () => {
    const mockData = { id: 1, name: 'Test' };
    const mockQueryFn = vi.fn().mockResolvedValue(mockData);

    const { result } = renderHook(
      () => useOptimizedQuery(['test'], mockQueryFn),
      { wrapper }
    );

    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true);
    }, { timeout: 3000 });

    expect(result.current.data).toEqual(mockData);
    expect(mockQueryFn).toHaveBeenCalledTimes(1);
  });

  it('should use optimized cache settings', async () => {
    const mockData = { id: 1, name: 'Test' };
    const mockQueryFn = vi.fn().mockResolvedValue(mockData);

    const { result } = renderHook(
      () => useOptimizedQuery(['test'], mockQueryFn),
      { wrapper }
    );

    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true);
    }, { timeout: 3000 });

    // Check that the query has the optimized options (use type assertion for v5 QueryOptions)
    const query = queryClient.getQueryCache().find({ queryKey: ['test'] });
    const opts = query?.options as { staleTime?: number; gcTime?: number };
    expect(opts?.staleTime).toBe(5 * 60 * 1000); // 5 minutes
    expect(opts?.gcTime).toBe(10 * 60 * 1000); // 10 minutes (gcTime in v5)
  });

  it('should handle errors', async () => {
    const mockError = new Error('Test error');
    const mockQueryFn = vi.fn().mockRejectedValue(mockError);

    const { result } = renderHook(
      () => useOptimizedQuery(['test-error'], mockQueryFn),
      { wrapper }
    );

    await waitFor(() => {
      expect(result.current.isError).toBe(true);
    }, { timeout: 3000 });

    expect(result.current.error).toEqual(mockError);
  });

  it('should allow custom options override', async () => {
    const mockData = { id: 1, name: 'Test' };
    const mockQueryFn = vi.fn().mockResolvedValue(mockData);

    const { result } = renderHook(
      () => useOptimizedQuery(
        ['test-override'],
        mockQueryFn,
        { staleTime: 10 * 60 * 1000 } // Override to 10 minutes
      ),
      { wrapper }
    );

    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true);
    }, { timeout: 3000 });

    const query = queryClient.getQueryCache().find({ queryKey: ['test-override'] });
    const opts = query?.options as { staleTime?: number };
    expect(opts?.staleTime).toBe(10 * 60 * 1000); // Should be overridden
  });
});

