import React from 'react';
import { render, fireEvent } from '@testing-library/react-native';
import { PhotoPicker } from '../PhotoPicker';
import * as ImagePicker from 'expo-image-picker';

jest.mock('expo-image-picker', () => ({
  launchImageLibraryAsync: jest.fn(),
  launchCameraAsync: jest.fn(),
  useCameraPermissions: jest.fn(() => [{ granted: true }, jest.fn()]),
}));

describe('PhotoPicker Component', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should render correctly', () => {
    const { getByText } = render(
      <PhotoPicker photos={[]} onPhotosChange={jest.fn()} label="Photos" />
    );
    expect(getByText('Photos')).toBeTruthy();
  });

  it('should show required indicator', () => {
    const { getByText } = render(
      <PhotoPicker photos={[]} onPhotosChange={jest.fn()} label="Photos" required />
    );
    expect(getByText('*')).toBeTruthy();
  });

  it('should display error when minPhotos not met', () => {
    const { getByText } = render(
      <PhotoPicker photos={[]} onPhotosChange={jest.fn()} minPhotos={2} />
    );
    // i18n is mocked to return translation keys
    expect(getByText('common.minPhotos')).toBeTruthy();
  });

  it('should call onPhotosChange when photo is added', async () => {
    const onPhotosChange = jest.fn();
    (ImagePicker.launchImageLibraryAsync as jest.Mock).mockResolvedValue({
      canceled: false,
      assets: [{ uri: 'file://photo.jpg' }],
    });

    const { getByText } = render(
      <PhotoPicker photos={[]} onPhotosChange={onPhotosChange} />
    );

    fireEvent.press(getByText('🖼️ common.gallery'));
    
    // Wait for async operation
    await new Promise(resolve => setTimeout(resolve, 100));
    
    expect(onPhotosChange).toHaveBeenCalledWith(['file://photo.jpg']);
  });

  it('should remove photo when remove button is pressed', () => {
    const onPhotosChange = jest.fn();
    const { getAllByText } = render(
      <PhotoPicker
        photos={['file://photo1.jpg', 'file://photo2.jpg']}
        onPhotosChange={onPhotosChange}
      />
    );

    const removeButtons = getAllByText('×');
    fireEvent.press(removeButtons[0]);
    
    expect(onPhotosChange).toHaveBeenCalled();
  });
});

