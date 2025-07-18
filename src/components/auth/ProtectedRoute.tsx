import React, { useEffect, useState } from 'react';
import { Navigate } from 'react-router-dom';
import { AuthManager } from '../../utils/authUtils';
import UnauthorizedAccess from '../common/UnauthorizedAccess';
import { LoadingSpinner } from '../common/LazyComponents';

interface ProtectedRouteProps {
  element: React.ReactElement;
  requiredRole: string;
}

const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ element, requiredRole }) => {
  const [loading, setLoading] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [hasPermission, setHasPermission] = useState(false);

  useEffect(() => {
    let mounted = true;
    const checkAuth = async () => {
      const authenticated = await AuthManager.isAuthenticated();
      let permission = false;
      if (authenticated) {
        const user = await AuthManager.getCurrentUser();
        if (user) {
          const roleHierarchy = {
            'viewer': 4,
            'operator': 3,
            'manager': 2,
            'admin': 1,
            'developer': 0
          };
          const userLevel = roleHierarchy[user.role as keyof typeof roleHierarchy] || 0;
          const requiredLevel = roleHierarchy[requiredRole as keyof typeof roleHierarchy] || 0;
          permission = userLevel <= requiredLevel;
        }
      }
      if (mounted) {
        setIsAuthenticated(authenticated);
        setHasPermission(permission);
        setLoading(false);
      }
    };
    checkAuth();
    return () => { mounted = false; };
  }, [requiredRole]);

  if (loading) {
    return <div className="flex justify-center items-center min-h-[200px]"><LoadingSpinner message="Checking access..." /></div>;
  }
  if (!isAuthenticated) {
    return <Navigate to="/login" />;
  }
  if (!hasPermission) {
    return <UnauthorizedAccess requiredRole={requiredRole} />;
  }
  return element;
};

export default ProtectedRoute;