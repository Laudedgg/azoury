import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import { Skeleton } from '@/components/ui/Skeleton';
import { ShieldX } from 'lucide-react';
import { Button } from '@/components/ui/Button';

function ProtectedRoute({ children, allowedRoles = [] }) {
  const { isAuthenticated, isLoading, user } = useAuth();
  const location = useLocation();

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-brand-base">
        <div className="space-y-4 w-full max-w-2xl p-8">
          <Skeleton className="h-8 w-48" />
          <Skeleton className="h-4 w-80" />
          <div className="grid grid-cols-3 gap-4 mt-8">
            <Skeleton className="h-32" />
            <Skeleton className="h-32" />
            <Skeleton className="h-32" />
          </div>
          <Skeleton className="h-64 mt-4" />
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  if (allowedRoles.length > 0 && !allowedRoles.includes(user?.role)) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-brand-base text-center px-4">
        <div className="p-4 rounded-full bg-brand-error/10 mb-6">
          <ShieldX className="h-12 w-12 text-brand-error" />
        </div>
        <h1 className="text-2xl font-bold text-brand-primary mb-2">Access Denied</h1>
        <p className="text-brand-secondary mb-6 max-w-md">
          You do not have permission to access this page. Please contact your administrator if you believe this is an error.
        </p>
        <Button onClick={() => window.history.back()} variant="secondary">
          Go Back
        </Button>
      </div>
    );
  }

  return children;
}

export { ProtectedRoute };
export default ProtectedRoute;
