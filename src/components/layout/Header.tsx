import React, { useEffect, useState } from 'react';
import { Activity, MapPin, QrCode, Users, Shield, LogOut, User, Wrench, Package, Building, Database } from 'lucide-react';
import { AuthManager } from '../../utils/authUtils';

interface HeaderProps {
  currentView: string;
  onViewChange: (view: string) => void;
  currentUser?: any;
  onLogout?: () => void;
  onDatabaseTest?: () => void;
}

const Header: React.FC<HeaderProps> = ({ currentView, onViewChange, currentUser, onLogout, onDatabaseTest }) => {
  // Company info state
  const [company, setCompany] = useState<{ name: string; logoUrl?: string } | null>(null);

  useEffect(() => {
    // Try to get company info from localStorage (used by CompanyManager)
    try {
      const companies = JSON.parse(localStorage.getItem('companies') || '[]');
      if (companies.length > 0) {
        setCompany({ name: companies[0].name, logoUrl: companies[0].logoUrl });
      }
    } catch {
      setCompany(null);
    }
  }, []);

  // Define navigation items based on user role
  const getNavItems = () => {
    const items = [
      { id: 'dashboard', label: 'Dashboard', icon: Activity, minAccessLevel: 'operator' }, // Level 3
      { id: 'scan', label: 'QR Scanner', icon: QrCode, minAccessLevel: 'operator' },      // Level 3
    ];

    // Add registration for manager and above (Level 2+)
    if (AuthManager.hasPermission('manager')) {
      items.push({ id: 'register', label: 'Register', icon: Users, minAccessLevel: 'manager' });
    }
    
    // Add map view for operator and above (Level 3+)
    if (AuthManager.hasPermission('operator')) {
      items.push({ id: 'map', label: 'Map View', icon: MapPin, minAccessLevel: 'operator' });
    }
    
    // Add admin panel for admin and developer (Level 1+)
    if (AuthManager.hasPermission('admin')) {
      items.push({ id: 'admin', label: 'Admin Panel', icon: Shield, minAccessLevel: 'admin' });
    }
    
    return items;
  };
  
  const navItems = getNavItems();

  return (
    <header className="bg-white shadow-sm border-b border-gray-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          <div className="flex items-center space-x-3">
            {/* Company Logo or fallback icon, larger and zoomed */}
            <div className="w-12 h-12 rounded-lg flex items-center justify-center bg-gradient-to-r from-blue-800 to-blue-600 overflow-hidden">
              {company && company.logoUrl ? (
                <img src={company.logoUrl} alt="Company Logo" className="w-full h-full object-contain" style={{ objectFit: 'cover' }} />
              ) : (
                <QrCode className="w-8 h-8 text-white" />
              )}
            </div>
            <div>
              <h1 className="text-xl font-bold text-gray-900">{company ? company.name : 'Company Name'}</h1>
              <p className="text-sm text-gray-500">KSA Operations Dashboard</p>
            </div>
          </div>
          
          <div className="flex items-center space-x-4">
            {/* Database Test Button - Only for admins and developers */}
            {currentUser?.role === 'admin' || currentUser?.role === 'developer' ? (
              <button
                onClick={onDatabaseTest}
                className="flex items-center space-x-2 px-4 py-2 text-gray-600 hover:text-blue-800 hover:bg-blue-50 rounded-lg transition-colors"
              >
                <Database className="w-4 h-4" />
                <span className="hidden sm:inline">Test DB</span>
              </button>
            ) : null}
            
            <nav className="flex space-x-1">
              {navItems.map(item => {
                const Icon = item.icon;
                return (
                  <button
                    key={item.id}
                    onClick={() => onViewChange(item.id)}
                    className={`flex items-center space-x-2 px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${
                      currentView === item.id
                        ? 'bg-blue-800 text-white shadow-lg transform scale-105'
                        : 'text-gray-600 hover:text-blue-800 hover:bg-blue-50'
                    }`}
                  >
                    <Icon className="w-4 h-4" />
                    <span className="hidden sm:inline">{item.label}</span>
                  </button>
                );
              })}
            </nav>

            {currentUser && (
              <div className="flex items-center space-x-3 pl-4 border-l border-gray-200">
                <div className="flex items-center space-x-2">
                  <User className="w-4 h-4 text-gray-500" />
                  <div className="text-sm">
                    <div className="font-medium text-gray-900">{currentUser.name}</div>
                    <div className="text-gray-500 capitalize">{currentUser.role}</div>
                  </div>
                </div>
                <button
                  onClick={onLogout}
                  className="flex items-center space-x-1 px-3 py-2 text-gray-600 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                >
                  <LogOut className="w-4 h-4" />
                  <span className="hidden sm:inline">Logout</span>
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  );
};

export default Header;