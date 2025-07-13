import React, { useState, useEffect } from 'react';
import Header from './components/layout/Header';
import { Dashboard } from './components/dashboard/Dashboard';
import QRScanner from './components/scanner/QRScanner';
import RegistrationForm from './components/registration/RegistrationForm';
import NavigationExample from './components/navigation/NavigationExample';
import DatabaseConnectionTest from './components/common/DatabaseConnectionTest';
import EmployeesPage from './components/pages/EmployeesPage';
import EquipmentPage from './components/pages/EquipmentPage';
import MaterialsPage from './components/pages/MaterialsPage';
import SitesPage from './components/pages/SitesPage';
import MapView from './components/map/MapView';
import AdminPanel from './components/admin/AdminPanel';
import LoginForm from './components/auth/LoginForm';
import ChangePasswordModal from './components/auth/ChangePasswordModal';
import SyncStatusIndicator from './components/common/SyncStatusIndicator';
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
    const updatedUser = AuthManager.getCurrentUser();
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
        return <Dashboard />;
      case 'scan':
        return <QRScanner />;
      case 'register':
        return canAccessRegistration ? 
          <RegistrationForm currentUser={currentUser} /> : 
          <UnauthorizedAccess requiredRole="manager" />;
      case 'map':
        return canAccessMap ? 
          <MapView /> : 
          <UnauthorizedAccess requiredRole="operator" />;
      case 'database-test':
        return canAccessAdmin ? 
          <DatabaseConnectionTest /> : 
          <UnauthorizedAccess requiredRole="admin" />;
      case 'admin':
        return canAccessAdmin ? 
          <AdminPanel currentUser={currentUser} /> : 
          <UnauthorizedAccess requiredRole="admin" />;
      default:
        return <Dashboard />;
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
    return <LoginForm onLogin={handleLogin} />;
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
      
      {/* Database Test Modal */}
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
              <DatabaseConnectionTest />
            </div>
          </div>
        </div>
      )}
      
      {showPasswordModal && currentUser && (
        <ChangePasswordModal
          isOpen={showPasswordModal}
          onClose={handlePasswordChange}
          userId={currentUser.id}
          isFirstLogin={currentUser.isFirstLogin}
        />
      )}
    </div>
  );
}

export default App;