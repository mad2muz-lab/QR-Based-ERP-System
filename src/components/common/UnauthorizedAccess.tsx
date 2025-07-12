import React from 'react';
import { ShieldAlert, AlertTriangle, ArrowLeft } from 'lucide-react';

interface UnauthorizedAccessProps {
  requiredRole: string;
  message?: string;
}

const UnauthorizedAccess: React.FC<UnauthorizedAccessProps> = ({ 
  requiredRole, 
  message 
}) => {
  const getRoleName = (role: string): string => {
    switch (role) {
      case 'developer': return 'Developer (Level 0)';
      case 'admin': return 'Administrator (Level 1)';
      case 'manager': return 'Manager (Level 2)';
      case 'operator': return 'Operator (Level 3)';
      case 'viewer': return 'Viewer (Level 4)';
      default: return role;
    }
  };

  return (
    <div className="min-h-[60vh] flex items-center justify-center">
      <div className="bg-white rounded-xl shadow-lg p-8 max-w-md w-full border-2 border-red-200">
        <div className="flex flex-col items-center text-center">
          <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mb-4">
            <ShieldAlert className="w-8 h-8 text-red-600" />
          </div>
          
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Access Restricted</h2>
          
          <p className="text-gray-600 mb-6">
            {message || `You don't have permission to access this page. This feature requires ${getRoleName(requiredRole)} access or higher.`}
          </p>
          
          <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 mb-6 w-full">
            <div className="flex items-start">
              <AlertTriangle className="w-5 h-5 text-amber-600 mt-0.5 flex-shrink-0" />
              <div className="ml-3">
                <h3 className="text-sm font-medium text-amber-800">Access Level Required</h3>
                <p className="text-sm text-amber-700 mt-1">
                  This page requires <strong>{getRoleName(requiredRole)}</strong> privileges.
                </p>
                <p className="text-sm text-amber-700 mt-2">
                  Please contact your system administrator if you believe you should have access.
                </p>
              </div>
            </div>
          </div>
          
          <button 
            onClick={() => window.history.back()}
            className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Go Back</span>
          </button>
        </div>
      </div>
    </div>
  );
};

export default UnauthorizedAccess;