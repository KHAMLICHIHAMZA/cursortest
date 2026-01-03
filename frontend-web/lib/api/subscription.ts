import { apiClient } from './client';

export interface Subscription {
  id: string;
  companyId: string;
  planId: string;
  status: 'ACTIVE' | 'SUSPENDED' | 'EXPIRED' | 'CANCELLED';
  billingPeriod: 'MONTHLY' | 'QUARTERLY' | 'YEARLY';
  startDate: string;
  endDate: string;
  amount: number;
  company?: {
    id: string;
    name: string;
  };
  plan?: {
    id: string;
    name: string;
    price: number;
  };
}

export const subscriptionApi = {
  getByCompany: async (companyId: string): Promise<Subscription | null> => {
    try {
      const { data } = await apiClient.get<Subscription[]>('/subscriptions');
      return data.find((s) => s.companyId === companyId) || null;
    } catch {
      return null;
    }
  },
};


