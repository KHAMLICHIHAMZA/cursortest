import React from 'react';
import { render, fireEvent } from '@testing-library/react-native';
import { BookingsScreen } from '../BookingsScreen';
import { useAuth } from '../../contexts/AuthContext';
import { bookingService } from '../../services/booking.service';

jest.mock('../../contexts/AuthContext');
jest.mock('../../services/booking.service');

let mockQueryData: any[] = [];
jest.mock('@tanstack/react-query', () => ({
  useQuery: jest.fn(() => ({
    data: mockQueryData,
    isLoading: false,
    refetch: jest.fn(),
    isRefetching: false,
  })),
}));

describe('BookingsScreen', () => {
  const mockUseAuth = useAuth as jest.Mock;
  const mockNavigation = {
    navigate: jest.fn(),
  };

  beforeEach(() => {
    jest.clearAllMocks();
    mockQueryData = [];
    mockUseAuth.mockReturnValue({
      agencies: [{ id: 'agency-1', name: 'Agency 1' }],
      user: { id: 'user-1', role: 'AGENT' },
    });
    
    (require('@react-navigation/native').useNavigation as jest.Mock).mockReturnValue(mockNavigation);
  });

  it('should render correctly', () => {
    mockQueryData = [];
    const { getByText } = render(<BookingsScreen />);
    expect(getByText('mission.noMissions')).toBeTruthy();
  });

  it('should display missions list when bookings are confirmed', () => {
    const now = new Date();
    const start = now.toISOString();
    const end = new Date(now.getTime() + 24 * 60 * 60 * 1000).toISOString();
    mockQueryData = [
      {
        id: 'booking-1',
        bookingNumber: 'BN001',
        status: 'CONFIRMED',
        startDate: start,
        endDate: end,
        vehicleId: 'vehicle-1',
        clientId: 'client-1',
        client: { name: 'Client 1' },
        vehicle: { registrationNumber: 'ABC-123', brand: 'Renault', model: 'Clio' },
      },
    ];
    
    const { getByText } = render(<BookingsScreen />);
    expect(getByText('mission.deliveryCheckIn')).toBeTruthy();
    expect(getByText('Client 1')).toBeTruthy();
    expect(getByText('BN001')).toBeTruthy();
  });

  it('should show create button for AGENCY_MANAGER', () => {
    mockUseAuth.mockReturnValue({
      agencies: [{ id: 'agency-1' }],
      user: { id: 'user-1', role: 'AGENCY_MANAGER' },
    });

    const { getByText } = render(<BookingsScreen />);
    expect(getByText(/booking.create/i)).toBeTruthy();
  });

  it('should navigate to booking details on press', () => {
    const now = new Date();
    const start = now.toISOString();
    const end = new Date(now.getTime() + 24 * 60 * 60 * 1000).toISOString();
    mockQueryData = [
      {
        id: 'booking-1',
        bookingNumber: 'BN001',
        status: 'CONFIRMED',
        startDate: start,
        endDate: end,
        vehicleId: 'vehicle-1',
        clientId: 'client-1',
        client: { name: 'Client 1' },
        vehicle: { registrationNumber: 'ABC-123', brand: 'Renault', model: 'Clio' },
      },
    ];
    
    const { getByText } = render(<BookingsScreen />);
    fireEvent.press(getByText('booking.details'));
    
    expect(mockNavigation.navigate).toHaveBeenCalledWith('BookingDetails', {
      bookingId: 'booking-1',
    });
  });
});




