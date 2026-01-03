'use client';

import { useEffect } from 'react';
import { Toaster, toast as hotToast } from 'react-hot-toast';

export function ToastProvider() {
  return (
    <Toaster
      position="top-right"
      toastOptions={{
        duration: 4000,
        style: {
          background: '#2C2F36',
          color: '#E5E7EB',
          border: '1px solid #3E7BFA',
        },
        success: {
          iconTheme: {
            primary: '#10B981',
            secondary: '#E5E7EB',
          },
        },
        error: {
          iconTheme: {
            primary: '#EF4444',
            secondary: '#E5E7EB',
          },
        },
      }}
    />
  );
}

export const toast = hotToast;



