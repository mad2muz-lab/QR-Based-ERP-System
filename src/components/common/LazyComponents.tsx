import React from 'react';

// Centralized lazy loading configuration for better code organization
// This file contains all lazy-loaded components with proper error boundaries

// Main application components
export const Dashboard = React.lazy(() => 
  import('../dashboard/Dashboard').then(module => ({ default: module.Dashboard }))
);

export const QRScanner = React.lazy(() => 
  import('../scanner/QRScanner')
);

export const RegistrationForm = React.lazy(() => 
  import('../registration/RegistrationForm')
);

export const MapView = React.lazy(() => 
  import('../map/MapView')
);

export const AdminPanel = React.lazy(() => 
  import('../admin/AdminPanel')
);

// Authentication components
export const LoginForm = React.lazy(() => 
  import('../auth/LoginForm')
);

export const ChangePasswordModal = React.lazy(() => 
  import('../auth/ChangePasswordModal')
);

// Utility components
export const DatabaseConnectionTest = React.lazy(() => 
  import('./DatabaseConnectionTest')
);

// Page components (for future use)
export const EmployeesPage = React.lazy(() => 
  import('../pages/EmployeesPage')
);

export const EquipmentPage = React.lazy(() => 
  import('../pages/EquipmentPage')
);

export const MaterialsPage = React.lazy(() => 
  import('../pages/MaterialsPage')
);

export const SitesPage = React.lazy(() => 
  import('../pages/SitesPage')
);

// Loading component for consistent UI
export const LoadingSpinner: React.FC<{ message?: string }> = ({ message = 'Loading...' }) => (
  <div className="flex items-center justify-center min-h-[400px]">
    <div className="text-center">
      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-2"></div>
      <p className="text-gray-600 text-sm">{message}</p>
    </div>
  </div>
);

// Error boundary for lazy-loaded components
export class LazyComponentErrorBoundary extends React.Component<
  { children: React.ReactNode; fallback?: React.ReactNode },
  { hasError: boolean }
> {
  constructor(props: { children: React.ReactNode; fallback?: React.ReactNode }) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(): { hasError: boolean } {
    return { hasError: true };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('Lazy component loading error:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return this.props.fallback || (
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="text-center">
            <div className="text-red-500 mb-2">⚠️</div>
            <p className="text-gray-600 text-sm">Failed to load component. Please refresh the page.</p>
            <button 
              onClick={() => window.location.reload()} 
              className="mt-2 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
            >
              Refresh Page
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}