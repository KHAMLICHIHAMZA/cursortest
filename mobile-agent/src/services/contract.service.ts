import { apiService } from './api';

export interface Contract {
  id: string;
  bookingId: string;
  status: 'DRAFT' | 'PENDING_SIGNATURE' | 'SIGNED' | 'EXPIRED' | 'CANCELLED';
  version: number;
  clientSignedAt: string | null;
  agentSignedAt: string | null;
  effectiveAt: string | null;
  payload: any;
  createdAt: string;
}

export interface SignContractInput {
  signatureData: string;
  signerType: 'client' | 'agent';
  deviceInfo?: string;
}

class ContractService {
  async getContractByBooking(bookingId: string): Promise<Contract | null> {
    try {
      const response = await apiService.get(`/contracts/booking/${bookingId}`);
      return response.data;
    } catch (error: any) {
      if (error.response?.status === 404) {
        return null;
      }
      throw error;
    }
  }

  async getContract(id: string): Promise<Contract> {
    const response = await apiService.get(`/contracts/${id}`);
    return response.data;
  }

  async createContract(bookingId: string, templateId?: string): Promise<Contract> {
    const response = await apiService.post('/contracts', {
      bookingId,
      templateId,
    });
    return response.data;
  }

  async signContract(contractId: string, data: SignContractInput): Promise<Contract> {
    const response = await apiService.post(`/contracts/${contractId}/sign`, data);
    return response.data;
  }

  async getContractPayload(contractId: string): Promise<any> {
    const response = await apiService.get(`/contracts/${contractId}/payload`);
    return response.data;
  }
}

export const contractService = new ContractService();
