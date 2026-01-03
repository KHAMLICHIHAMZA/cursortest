import React from 'react';
import { render, fireEvent } from '@testing-library/react-native';
import { BookingsScreen } from '../BookingsScreen';
import { useAuth } from '../../contexts/AuthContext';
import { bookingService } from '../../services/booking.service';

jest.mock('../../contexts/AuthContext');
jest.mock('../../services/booking.service');
jest.mock('@tanstack/react-query', () => ({
  useQuery: jest.fn(({ queryFn }) => ({
    data: queryFn ? queryFn() : [],
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
    mockUseAuth.mockReturnValue({
      agencies: [{ id: 'agency-1', name: 'Agency 1' }],
      user: { id: 'user-1', role: 'AGENT' },
    });
    
    (require('@react-navigation/native').useNavigation as jest.Mock).mockReturnValue(mockNavigation);
  });

  it('should render correctly', () => {
    (bookingService.getBookings as jest.Mock).mockResolvedValue([]);
    
    const { getByText } = render(<BookingsScreen />);
    expect(getByText(/No bookings/i)).toBeTruthy();
  });

  it('should display bookings list', () => {
    const mockBookings = [
      {
        id: 'booking-1',
        status: 'PENDING',
        startDate: '2024-01-01',
        endDate: '2024-01-02',
        price: 100,
      },
    ];

    (bookingService.getBookings as jest.Mock).mockResolvedValue(mockBookings);
    
    const { getByText } = render(<BookingsScreen />);
    expect(getByText('#booking-1')).toBeTruthy();
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
    const mockBookings = [
      {
        id: 'booking-1',
        status: 'PENDING',
        startDate: '2024-01-01',
        endDate: '2024-01-02',
        price: 100,
      },
    ];

    (bookingService.getBookings as jest.Mock).mockResolvedValue(mockBookings);
    
    const { getByText } = render(<BookingsScreen />);
    fireEvent.press(getByText('#booking-1'));
    
    expect(mockNavigation.navigate).toHaveBeenCalledWith('BookingDetails', {
      bookingId: 'booking-1',
    });
  });
});




