import { ReactNode } from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '@/lib/authContext';
import { useProfile } from '@/lib/profileContext';
import { Loader } from 'lucide-react';

interface Props {
  children: ReactNode;
  requireProfile?: boolean;
}

/**
 * Protected route that requires User Authentication (auth cookie)
 * If requireProfile is true, also requires Profile Token
 */
export default function ProtectedRoute({ children, requireProfile = false }: Props) {
  const { isAuthenticated, isLoading } = useAuth();
  const { profileToken } = useProfile();

  // Loading state while checking auth
  if (isLoading) {
    return (
      <div className="min-h-screen bg-ink-950 flex items-center justify-center">
        <div className="text-center">
          <Loader size={40} className="text-brand-500 animate-spin mx-auto mb-4" />
          <p className="text-gray-400">Loading...</p>
        </div>
      </div>
    );
  }

  // Check if user is authenticated
  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  // Check if profile is selected (for routes that need it)
  if (requireProfile && !profileToken) {
    return <Navigate to="/profiles" replace />;
  }

  // User is authenticated (and profile selected if required)
  return <>{children}</>;
}
