import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { LoadingSpinner } from '../components/common/CommonComponents';

export const ProtectedRoute = ({ children, requiredRole }) => {
  const { user, loading } = useAuth();

  if (loading) {
    return <LoadingSpinner label="Validating Authentication Credentials..." />;
  }

  // Not logged in -> Redirect strictly to Login page
  if (!user) {
    return <Navigate to="/login" replace />;
  }

  // Citizen trying to access admin pages -> Redirect to citizen dashboard
  if (requiredRole === 'admin' && user.role !== 'admin') {
    return <Navigate to="/dashboard" replace />;
  }

  // Admin trying to access citizen specific pages -> Redirect to admin dashboard
  if (requiredRole === 'citizen' && user.role === 'admin') {
    return <Navigate to="/admin" replace />;
  }

  return children;
};
