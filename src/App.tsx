import React, { useState, useEffect, Suspense } from 'react';
import { useRoutes, useNavigate, useLocation } from 'react-router-dom';
import Header from './components/layout/Header';
import {
  LoginForm,
  ChangePasswordModal,
  LoadingSpinner,
  LazyComponentErrorBoundary
} from './components/common/LazyComponents';
import { AuthManager } from './utils/authUtils';
import { DataStorage } from './utils/dataStorage';
import { User } from './types';
import { useOfflineSync } from './hooks/useOfflineSync';
import { AppRoutes } from './routes';
import { AOPDataService } from './utils/aopDataService';
import LogisticsDataService from './utils/logisticsDataService';

import { LanguageProvider } from './i18n/LanguageContext';
import { ToastProvider } from './components/common/ToastNotification';

function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [isInitialized, setIsInitialized] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();

  const { syncStatus } = useOfflineSync();
  const routes = useRoutes(AppRoutes({ currentUser }));

  useEffect(() => {
    if (!isInitialized) {
      console.log('Initializing application...');
      const shouldClearData = localStorage.getItem('qr_system_clear_data') === 'true';
      if (shouldClearData) {
        console.log('Clearing data as requested...');
        DataStorage.clearAllData();
        localStorage.removeItem('qr_system_clear_data');
      }
      DataStorage.initializeDefaultAdmin();
      
      // Initialize AOP sample data
      AOPDataService.initializeSampleData();
      
      // Initialize Logistics sample data
      LogisticsDataService.getInstance();
      
      const checkAuth = async () => {
        const authenticated = await AuthManager.isAuthenticated();
        const user = await AuthManager.getCurrentUser();
        if (authenticated && user) {
          setIsAuthenticated(true);
          setCurrentUser(user);
          navigate(location.pathname, { replace: true });
          if (user.isFirstLogin) {
            setShowPasswordModal(true);
          }
        } else {
          // Redirect to login screen
          setIsInitialized(true);
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
    // Redirect operators/workers to the action dashboard
    if (user.role === 'operator') {
      navigate('/worker');
    } else {
      navigate('/');
    }
  };

  const handleLogout = () => {
    AuthManager.logout();
    setIsAuthenticated(false);
    setCurrentUser(null);
    navigate('/login');
  };

  const handlePasswordChange = () => {
    setShowPasswordModal(false);
    const updatedUser = AuthManager.getCurrentUserSync();
    if (updatedUser) {
      updatedUser.isFirstLogin = false;
      setCurrentUser(updatedUser);
    }
  };

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
    <ToastProvider>
      <LanguageProvider>
        <div className="h-screen flex flex-col bg-gray-50" dir={document.documentElement.dir || 'ltr'}>
          <Header currentUser={currentUser} onLogout={handleLogout} />
          <main className="flex-1 overflow-auto">
            {routes}
          </main>
          {showPasswordModal && currentUser && (
            <ChangePasswordModal
              isOpen={showPasswordModal}
              onClose={handlePasswordChange}
              userId={currentUser.id}
              isFirstLogin={currentUser.isFirstLogin}
            />
          )}
        </div>
      </LanguageProvider>
    </ToastProvider>
  );
}

export default App;