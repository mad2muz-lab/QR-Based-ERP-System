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
          // Debug: Print user ID and roles
          const roles = await AuthManager.getUserRolesWithHierarchy(user.id);
          console.log('[ProtectedRoute] Current user ID:', user.id, 'Roles:', roles);
          permission = await AuthManager.canUserAccessPage(user.id, requiredRole);
          console.log('[ProtectedRoute] Can access page', requiredRole, ':', permission);
        } else {
          console.log('[ProtectedRoute] No user found');
        }
      } else {
        console.log('[ProtectedRoute] Not authenticated');
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
    return null; // Do not render the page at all if no access
  }
  return element;
};

export default ProtectedRoute;