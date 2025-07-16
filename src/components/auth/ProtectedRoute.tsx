import React from 'react';
import { Navigate } from 'react-router-dom';
import { AuthManager } from '../../utils/authUtils';
import UnauthorizedAccess from '../common/UnauthorizedAccess';

interface ProtectedRouteProps {
  element: React.ReactElement;
  requiredRole: string;
}

const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ element, requiredRole }) => {
  if (!AuthManager.isAuthenticatedSync()) {
    return <Navigate to="/login" />;
  }

  if (!AuthManager.hasPermission(requiredRole)) {
    return <UnauthorizedAccess requiredRole={requiredRole} />;
  }

  return element;
};

export default ProtectedRoute;