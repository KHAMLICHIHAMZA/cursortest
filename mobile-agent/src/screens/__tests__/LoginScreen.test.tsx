import React from 'react';
import { render, fireEvent, waitFor } from '@testing-library/react-native';
import { LoginScreen } from '../LoginScreen';
import { useAuth } from '../../contexts/AuthContext';
import { authService } from '../../services/auth.service';

jest.mock('../../contexts/AuthContext');
jest.mock('../../services/auth.service', () => {
  const actual = jest.requireActual('../../services/auth.service');
  return {
    __esModule: true,
    ...actual,
    authService: {
      ...actual.authService,
      login: jest.fn(),
    },
  };
});

describe('LoginScreen', () => {
  const mockLogin = jest.fn();
  const mockUseAuth = useAuth as jest.Mock;

  beforeEach(() => {
    jest.clearAllMocks();
    mockUseAuth.mockReturnValue({
      login: mockLogin,
    });
  });

  it('should render correctly', () => {
    const { getByText, getByPlaceholderText } = render(<LoginScreen />);
    
    expect(getByText('MalocAuto')).toBeTruthy();
    expect(getByPlaceholderText('auth.email')).toBeTruthy();
    expect(getByPlaceholderText('auth.password')).toBeTruthy();
  });

  it('should validate email format', async () => {
    const { getByPlaceholderText, getAllByText } = render(<LoginScreen />);
    
    fireEvent.changeText(getByPlaceholderText('auth.email'), 'invalid-email');
    fireEvent.changeText(getByPlaceholderText('auth.password'), 'password123');
    const loginButtons = getAllByText('auth.login');
    fireEvent.press(loginButtons[loginButtons.length - 1]);

    await waitFor(() => {
      // Should show validation error
      expect(authService.login).not.toHaveBeenCalled();
    });
  });

  it('should validate password length', async () => {
    const { getByPlaceholderText, getAllByText } = render(<LoginScreen />);
    
    fireEvent.changeText(getByPlaceholderText('auth.email'), 'test@example.com');
    fireEvent.changeText(getByPlaceholderText('auth.password'), 'short');
    const loginButtons = getAllByText('auth.login');
    fireEvent.press(loginButtons[loginButtons.length - 1]);

    await waitFor(() => {
      expect(authService.login).not.toHaveBeenCalled();
    });
  });

  it('should call login with valid credentials', async () => {
    const mockResponse = {
      access_token: 'token',
      user: { id: '1', email: 'test@example.com', role: 'AGENT' },
      agencies: [],
      permissions: [],
      modules: [],
    };

    (authService.login as jest.Mock).mockResolvedValue(mockResponse);

    const { getByPlaceholderText, getAllByText } = render(<LoginScreen />);
    
    fireEvent.changeText(getByPlaceholderText('auth.email'), 'test@example.com');
    fireEvent.changeText(getByPlaceholderText('auth.password'), 'password123');
    const loginButtons = getAllByText('auth.login');
    fireEvent.press(loginButtons[loginButtons.length - 1]);

    await waitFor(() => {
      expect(authService.login).toHaveBeenCalledWith({
        email: 'test@example.com',
        password: 'password123',
      });
      expect(mockLogin).toHaveBeenCalledWith(mockResponse);
    });
  });
});




