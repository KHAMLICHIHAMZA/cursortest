import { apiClient } from './client';

export interface Invoice {
  id: string;
  subscriptionId: string;
  companyId: string;
  amount: number;
  status: 'PENDING' | 'PAID' | 'FAILED';
  dueDate: string;
  paidAt?: string;
  invoiceNumber?: string;
  invoiceUrl?: string;
}

export const billingApi = {
  getCompanyInvoices: async (companyId: string): Promise<Invoice[]> => {
    const { data } = await apiClient.get<Invoice[]>(`/billing/company/${companyId}/invoices`);
    return data;
  },
};


