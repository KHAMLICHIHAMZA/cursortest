import React from 'react';
import { render, fireEvent } from '@testing-library/react-native';
import { SignaturePad } from '../SignaturePad';

jest.mock('react-native-signature-canvas', () => {
  return jest.fn().mockImplementation(({ onOK, ref }) => {
    if (ref) {
      ref.current = {
        clearSignature: jest.fn(),
        readSignature: jest.fn(() => onOK('base64-signature')),
      };
    }
    return null;
  });
});

describe('SignaturePad Component', () => {
  it('should render correctly', () => {
    const { getByText } = render(
      <SignaturePad onSignatureChange={jest.fn()} label="Signature" />
    );
    expect(getByText('Signature')).toBeTruthy();
  });

  it('should show required indicator', () => {
    const { getByText } = render(
      <SignaturePad onSignatureChange={jest.fn()} label="Signature" required />
    );
    expect(getByText('*')).toBeTruthy();
  });

  it('should display error message', () => {
    const { getByText } = render(
      <SignaturePad onSignatureChange={jest.fn()} error="Signature required" />
    );
    expect(getByText('Signature required')).toBeTruthy();
  });

  it('should render fallback UI when SignatureCanvas is unavailable', () => {
    const onSignatureChange = jest.fn();
    const { getByText } = render(
      <SignaturePad onSignatureChange={onSignatureChange} />
    );

    // In Jest, SignatureCanvas may be unavailable -> fallback UI.
    expect(getByText('common.signatureNotAvailable')).toBeTruthy();
    expect(getByText('common.useMobileApp')).toBeTruthy();
  });
});




