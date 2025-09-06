import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useUser } from '@clerk/clerk-react';
import { useClerkAuthStore } from '@/stores/clerkAuthStore';

interface RoleGuardProps {
  children: React.ReactNode;
  requireRole?: 'performer' | 'audience';
}

export function RoleGuard({ children, requireRole }: RoleGuardProps) {
  const navigate = useNavigate();
  const { user: clerkUser, isSignedIn } = useUser();
  const { user: dbUser, isLoading } = useClerkAuthStore();

  useEffect(() => {
    if (!isSignedIn || !clerkUser) return;

    // Simple check: if no user in store, redirect to role selection
    if (!dbUser || !dbUser.role) {
      navigate('/role-selection');
      return;
    }

    // If specific role required and user doesn't have it, redirect to role selection
    if (requireRole && dbUser.role !== requireRole) {
      navigate('/role-selection');
      return;
    }
  }, [isSignedIn, clerkUser, dbUser, navigate, requireRole]);

  // Show loading while checking
  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-50 to-orange-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  // If user doesn't have a role, don't render children (will redirect)
  if (!dbUser || !dbUser.role) {
    return null;
  }

  // If specific role required and user doesn't have it, don't render children
  if (requireRole && dbUser.role !== requireRole) {
    return null;
  }

  return <>{children}</>;
}
