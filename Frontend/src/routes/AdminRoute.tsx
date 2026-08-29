import { ReactNode } from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '@/lib/authContext';
import { useProfile } from '@/lib/profileContext';
import { Loader, ShieldOff } from 'lucide-react';

interface Props {
  children: ReactNode;
  /** Roles allowed to access this route. Defaults to super_admin only. */
  allowedRoles?: string[];
}

/**
 * Route guard for admin area.
 * - Requires authentication + profile token.
 * - Requires user role to be in allowedRoles (default: ['super_admin']).
 */
export default function AdminRoute({
  children,
  allowedRoles = ['super_admin'],
}: Props) {
  const { isAuthenticated, isLoading, user } = useAuth();
  const { profileToken } = useProfile();

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

  if (!isAuthenticated) return <Navigate to="/login" replace />;
  if (!profileToken) return <Navigate to="/profiles" replace />;

  if (!user?.role || !allowedRoles.includes(user.role)) {
    return (
      <div className="min-h-screen bg-ink-950 flex items-center justify-center p-4">
        <div className="text-center max-w-sm">
          <ShieldOff size={48} className="text-red-500 mx-auto mb-4" />
          <h1 className="text-2xl font-bold text-white mb-2">Access Denied</h1>
          <p className="text-gray-400 mb-6">
            This area requires {allowedRoles.join(' or ')} access.
          </p>
          <a href="/" className="btn-primary px-6 py-2 inline-block">Go Home</a>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}
