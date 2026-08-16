import { BrowserRouter } from 'react-router-dom';
import { AppProvider } from '@/store';
import { ProfileProvider } from '@/lib/profileContext';
import { AuthProvider } from '@/lib/authContext';
import { ToastProvider } from '@/lib/ToastProvider';
import AppRoutes from '@/routes';

export default function App() {
  return (
    <BrowserRouter>
      <ToastProvider />
      <AuthProvider>
        <ProfileProvider>
          <AppProvider>
            <AppRoutes />
          </AppProvider>
        </ProfileProvider>
      </AuthProvider>
    </BrowserRouter>
  );
}
