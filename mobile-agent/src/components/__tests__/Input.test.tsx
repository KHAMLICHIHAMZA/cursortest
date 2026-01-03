import React from 'react';
import { render, fireEvent } from '@testing-library/react-native';
import { Input } from '../Input';

describe('Input Component', () => {
  it('should render correctly', () => {
    const { getByPlaceholderText } = render(
      <Input label="Test" placeholder="Enter text" />
    );
    expect(getByPlaceholderText('Enter text')).toBeTruthy();
  });

  it('should call onChangeText when text changes', () => {
    const onChangeText = jest.fn();
    const { getByPlaceholderText } = render(
      <Input label="Test" placeholder="Enter text" onChangeText={onChangeText} />
    );

    fireEvent.changeText(getByPlaceholderText('Enter text'), 'new text');
    expect(onChangeText).toHaveBeenCalledWith('new text');
  });

  it('should display error message', () => {
    const { getByText } = render(
      <Input label="Test" error="This is an error" />
    );
    expect(getByText('This is an error')).toBeTruthy();
  });

  it('should show required indicator', () => {
    const { getByText } = render(<Input label="Test" required />);
    expect(getByText('*')).toBeTruthy();
  });
});




