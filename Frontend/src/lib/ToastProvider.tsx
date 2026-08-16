import { Toaster } from 'react-hot-toast';

export function ToastProvider() {
  return (
    <Toaster
      position="top-right"
      reverseOrder={false}
      gutter={8}
      toastOptions={{
        duration: 4000,
        style: {
          background: '#1a1a2e',
          color: '#fff',
          border: '1px solid #2d2d4a',
          borderRadius: '8px',
          padding: '16px',
          fontFamily: 'system-ui, -apple-system, sans-serif',
        },
        success: {
          style: {
            background: '#10b981',
            border: '1px solid #059669',
          },
        },
        error: {
          style: {
            background: '#ef4444',
            border: '1px solid #dc2626',
          },
        },
      }}
    />
  );
}
