import { ReactNode } from 'react';
import { useAuth } from '@/lib/authContext';
import { Loader } from 'lucide-react';

interface Props {
  children: ReactNode;
}

/**
 * Public route that shows loading while auth is being checked
 * Does not redirect - just passes through
 */
export default function PublicRoute({ children }: Props) {
  const { isLoading } = useAuth();

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

  return <>{children}</>;
}
