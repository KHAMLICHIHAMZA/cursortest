import { apiClient } from './client';

export interface PlanningResource {
  id: string;
  title: string;
  extendedProps: {
    agencyId: string;
    agencyName: string;
    brand: string;
    model: string;
    registrationNumber: string;
    status: string;
  };
}

export interface PlanningEvent {
  id: string;
  resourceId: string;
  title: string;
  start: string;
  end: string;
  backgroundColor: string;
  borderColor: string;
  extendedProps: {
    type: string;
    bookingId?: string;
    maintenanceId?: string;
    status?: string;
    [key: string]: any;
  };
}

export interface PlanningData {
  resources: PlanningResource[];
  events: PlanningEvent[];
}

export const planningApi = {
  getPlanning: async (params?: {
    agencyId?: string;
    start?: string;
    end?: string;
  }): Promise<PlanningData> => {
    const response = await apiClient.get('/planning', { params });
    return response.data;
  },

  checkAvailability: async (data: {
    vehicleId: string;
    startDate: string;
    endDate: string;
  }) => {
    const response = await apiClient.post('/planning/check-availability', data);
    return response.data;
  },

  getNextAvailability: async (vehicleId: string, from?: string) => {
    const response = await apiClient.get(
      `/planning/next-availability/${vehicleId}`,
      { params: { from } },
    );
    return response.data;
  },
};





