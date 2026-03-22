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
          background: 'rgb(var(--card))',
          color: 'rgb(var(--text))',
          border: '1px solid rgb(var(--border))',
        },
        success: {
          iconTheme: {
            primary: 'rgb(var(--success))',
            secondary: 'rgb(var(--text))',
          },
        },
        error: {
          iconTheme: {
            primary: 'rgb(var(--error))',
            secondary: 'rgb(var(--text))',
          },
        },
      }}
    />
  );
}

export const toast = hotToast;



