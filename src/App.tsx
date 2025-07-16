import React, { useState, useEffect, Suspense } from 'react';
import Header from './components/layout/Header';
import SyncStatusIndicator from './components/common/SyncStatusIndicator';
import UnauthorizedAccess from './components/common/UnauthorizedAccess';

// Import lazy components and utilities from centralized file
import {
  Dashboard,
  QRScanner,
  RegistrationForm,
  DatabaseConnectionTest,
  MapView,
  AdminPanel,
  LoginForm,
  ChangePasswordModal,
  LoadingSpinner,
  LazyComponentErrorBoundary
} from './components/common/LazyComponents';
import { AuthManager } from './utils/authUtils';
import { DataStorage } from './utils/dataStorage';
import { User } from './types';
import { useOfflineSync } from './hooks/useOfflineSync';


function App() {
  const [currentView, setCurrentView] = useState('dashboard');
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [isInitialized, setIsInitialized] = useState(false);
  
  // State for database test
  const [showDatabaseTest, setShowDatabaseTest] = useState(false);
  
  // Initialize offline sync
  const { syncStatus } = useOfflineSync();

  // In your useEffect for initialization, change to:
  
  useEffect(() => {
    // Only initialize once
    if (!isInitialized) {
      console.log('Initializing application...');
      
      // Only clear data in development if explicitly needed
      const shouldClearData = localStorage.getItem('qr_system_clear_data') === 'true';
      if (shouldClearData) {
        console.log('Clearing data as requested...');
        DataStorage.clearAllData();
        localStorage.removeItem('qr_system_clear_data');
      }
      
      // Initialize default admin user
      DataStorage.initializeDefaultAdmin();
      
      // Check if user is already authenticated (async)
      const checkAuth = async () => {
        const authenticated = await AuthManager.isAuthenticated();
        const user = await AuthManager.getCurrentUser();
        
        if (authenticated && user) {
          setIsAuthenticated(true);
          setCurrentUser(user);
          
          // Show password change modal if first login
          if (user.isFirstLogin) {
            setShowPasswordModal(true);
          }
        }
        
        setIsInitialized(true);
      };
      
      checkAuth();
    }
  }, [isInitialized]);

  const handleLogin = (user: User) => {
    setIsAuthenticated(true);
    setCurrentUser(user);
    
    if (user.isFirstLogin) {
      setShowPasswordModal(true);
    }
  };

  const handleLogout = () => {
    AuthManager.logout();
    setIsAuthenticated(false);
    setCurrentUser(null);
    setCurrentView('dashboard');
  };

  const handlePasswordChange = () => {
    setShowPasswordModal(false);
    // Refresh user data
    const updatedUser = AuthManager.getCurrentUserSync();
    if (updatedUser) {
      updatedUser.isFirstLogin = false;
      setCurrentUser(updatedUser);
    }
  };

  const renderCurrentView = () => {
    // Check permissions for each view
    const canAccessAdmin = AuthManager.hasPermission('admin');
    const canAccessRegistration = AuthManager.hasPermission('manager'); // Level 2 or higher
    const canAccessMap = AuthManager.hasPermission('operator'); // Level 3 or higher
    
    switch (currentView) {
      case 'dashboard':
        return (
          <LazyComponentErrorBoundary>
            <Suspense fallback={<LoadingSpinner message="Loading Dashboard..." />}>
              <Dashboard currentView={currentView} />
            </Suspense>
          </LazyComponentErrorBoundary>
        );
      case 'scan':
        return (
          <LazyComponentErrorBoundary>
            <Suspense fallback={<LoadingSpinner message="Loading QR Scanner..." />}>
              <QRScanner />
            </Suspense>
          </LazyComponentErrorBoundary>
        );
      case 'register':
        return canAccessRegistration ? (
          <LazyComponentErrorBoundary>
            <Suspense fallback={<LoadingSpinner message="Loading Registration Form..." />}>
              <RegistrationForm currentUser={currentUser || undefined} />
            </Suspense>
          </LazyComponentErrorBoundary>
        ) : (
          <UnauthorizedAccess requiredRole="manager" />
        );
      case 'map':
        return canAccessMap ? (
          <LazyComponentErrorBoundary>
            <Suspense fallback={<LoadingSpinner message="Loading Map View..." />}>
              <MapView />
            </Suspense>
          </LazyComponentErrorBoundary>
        ) : (
          <UnauthorizedAccess requiredRole="operator" />
        );
      case 'database-test':
        return canAccessAdmin ? (
          <LazyComponentErrorBoundary>
            <Suspense fallback={<LoadingSpinner message="Loading Database Test..." />}>
              <DatabaseConnectionTest />
            </Suspense>
          </LazyComponentErrorBoundary>
        ) : (
          <UnauthorizedAccess requiredRole="admin" />
        );
      case 'admin':
        return canAccessAdmin ? (
          <LazyComponentErrorBoundary>
            <Suspense fallback={<LoadingSpinner message="Loading Admin Panel..." />}>
              <AdminPanel currentUser={currentUser || undefined} />
            </Suspense>
          </LazyComponentErrorBoundary>
        ) : (
          <UnauthorizedAccess requiredRole="admin" />
        );
      default:
        return (
          <LazyComponentErrorBoundary>
            <Suspense fallback={<LoadingSpinner message="Loading Dashboard..." />}>
              <Dashboard />
            </Suspense>
          </LazyComponentErrorBoundary>
        );
    }
  };

  // Show loading screen during initialization
  if (!isInitialized) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Initializing QR Timecard System...</p>
        </div>
      </div>
    );
  }
  if (!isAuthenticated) {
    return (
      <LazyComponentErrorBoundary>
        <Suspense fallback={<LoadingSpinner message="Loading Login..." />}>
          <LoginForm onLogin={handleLogin} />
        </Suspense>
      </LazyComponentErrorBoundary>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <SyncStatusIndicator showDetails={true} position="top-right" />
      <Header 
        currentView={currentView} 
        onViewChange={setCurrentView}
        currentUser={currentUser}
        onLogout={handleLogout}
        onDatabaseTest={() => setShowDatabaseTest(true)}
      />
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {renderCurrentView()}
      </main>
      
      {showDatabaseTest && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-semibold text-gray-900">Database Connection Test</h2>
                <button
                  onClick={() => setShowDatabaseTest(false)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  ×
                </button>
              </div>
              <LazyComponentErrorBoundary>
                <Suspense fallback={<LoadingSpinner message="Loading Database Test..." />}>
                  <DatabaseConnectionTest />
                </Suspense>
              </LazyComponentErrorBoundary>
            </div>
          </div>
        </div>
      )}
      
      {showPasswordModal && currentUser && (
        <Suspense fallback={<LoadingSpinner />}>
          <ChangePasswordModal
            isOpen={showPasswordModal}
            onClose={handlePasswordChange}
            userId={currentUser.id}
            isFirstLogin={currentUser.isFirstLogin}
          />
        </Suspense>
      )}
    </div>
  );
}

export default App;