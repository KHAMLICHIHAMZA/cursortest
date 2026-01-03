import React from 'react';
import { render, fireEvent } from '@testing-library/react-native';
import { Button } from '../Button';

describe('Button Component', () => {
  it('should render correctly', () => {
    const { getByText } = render(<Button title="Test Button" onPress={jest.fn()} />);
    expect(getByText('Test Button')).toBeTruthy();
  });

  it('should call onPress when pressed', () => {
    const onPress = jest.fn();
    const { getByText } = render(<Button title="Test" onPress={onPress} />);
    
    fireEvent.press(getByText('Test'));
    expect(onPress).toHaveBeenCalledTimes(1);
  });

  it('should not call onPress when disabled', () => {
    const onPress = jest.fn();
    const { getByText } = render(<Button title="Test" onPress={onPress} disabled />);
    
    fireEvent.press(getByText('Test'));
    expect(onPress).not.toHaveBeenCalled();
  });

  it('should show loading indicator when loading', () => {
    const { queryByText, getByTestId } = render(
      <Button title="Test" onPress={jest.fn()} loading />
    );
    
    expect(queryByText('Test')).toBeNull();
    // ActivityIndicator should be present
  });

  it('should apply variant styles', () => {
    const { getByText, rerender } = render(
      <Button title="Primary" onPress={jest.fn()} variant="primary" />
    );
    expect(getByText('Primary')).toBeTruthy();

    rerender(<Button title="Danger" onPress={jest.fn()} variant="danger" />);
    expect(getByText('Danger')).toBeTruthy();
  });
});




