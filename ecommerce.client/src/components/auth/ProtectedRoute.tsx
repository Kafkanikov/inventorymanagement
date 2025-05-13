// src/components/auth/ProtectedRoute.tsx
import React from 'react';
import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { Skeleton } from '@/components/ui/skeleton'; // For loading state

interface ProtectedRouteProps {
  children?: React.ReactNode; // Allow children if not using Outlet exclusively
}

export const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ children }) => {
  const { isAuthenticated, isLoading } = useAuth();
  const location = useLocation();

  if (isLoading) {
    // Show a loading state while authentication status is being determined
    return (
      <div className="flex flex-col items-center justify-center min-h-screen p-4">
        <Skeleton className="h-8 w-64 mb-4" />
        <Skeleton className="h-screen w-full" />
      </div>
    );
  }

  if (!isAuthenticated) {
    // Redirect them to the /login page, but save the current location they were
    // trying to go to so we can send them there after they login.
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  return children ? <>{children}</> : <Outlet />; // Render children or Outlet for nested routes
};