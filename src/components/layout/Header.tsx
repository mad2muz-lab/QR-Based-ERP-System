import React, { useEffect, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { Activity, MapPin, QrCode, Users, Shield, LogOut, User, Wrench, Package, Building, Database, Menu, WifiOff, Wifi } from 'lucide-react';
import { AuthManager } from '../../utils/authUtils';

interface HeaderProps {
  currentUser?: any;
  onLogout?: () => void;
}

const Header: React.FC<HeaderProps> = ({ currentUser, onLogout }) => {
  const [company, setCompany] = useState<{ name: string; logoUrl?: string } | null>(null);
  const [navOpen, setNavOpen] = useState(false);
  const [isOnline, setIsOnline] = useState(true);
  const location = useLocation();
  const navigate = useNavigate();

  useEffect(() => {
    try {
      const companies = JSON.parse(localStorage.getItem('companies') || '[]');
      if (companies.length > 0) {
        setCompany({ name: companies[0].name, logoUrl: companies[0].logoUrl });
      }
    } catch {
      setCompany(null);
    }
  }, []);

  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    setIsOnline(navigator.onLine);
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  const getNavItems = () => {
    const items = [
      { path: '/', label: 'Dashboard', icon: Activity, minAccessLevel: 'operator' },
      { path: '/scan', label: 'QR Scanner', icon: QrCode, minAccessLevel: 'operator' },
    ];

    if (AuthManager.hasPermission('manager')) {
      items.push({ path: '/register', label: 'Register', icon: Users, minAccessLevel: 'manager' });
    }
    
    if (AuthManager.hasPermission('operator')) {
      items.push({ path: '/map', label: 'Map View', icon: MapPin, minAccessLevel: 'operator' });
    }
    
    if (AuthManager.hasPermission('admin')) {
      items.push({ path: '/admin', label: 'Admin Panel', icon: Shield, minAccessLevel: 'admin' });
    }
    
    return items;
  };
  
  const navItems = getNavItems();

  return (
    <header className="bg-white shadow-sm border-b border-gray-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          <div className="flex items-center space-x-3">
            <div className="w-12 h-12 rounded-lg flex items-center justify-center bg-gradient-to-r from-blue-800 to-blue-600 overflow-hidden">
              {company && company.logoUrl ? (
                <img src={company.logoUrl} alt="Company Logo" className="w-full h-full object-contain" style={{ objectFit: 'cover' }} />
              ) : (
                <QrCode className="w-8 h-8 text-white" />
              )}
            </div>
            <div className="hidden sm:block">
              <h1 className="text-xl font-bold text-gray-900">{company ? company.name : 'Company Name'}</h1>
              <p className="text-sm text-gray-500">KSA Operations Dashboard</p>
            </div>
          </div>
          <div className="flex items-center space-x-2 sm:hidden">
            <button
              onClick={() => setNavOpen(!navOpen)}
              className="p-2 rounded-lg text-gray-700 hover:bg-blue-50 focus:outline-none focus:ring-2 focus:ring-blue-500"
              aria-label="Open navigation menu"
            >
              <Menu className="w-7 h-7" />
            </button>
          </div>
          <div className="flex items-center space-x-2">
            {isOnline ? (
              <span className="flex items-center text-green-600 text-xs"><Wifi className="w-4 h-4 mr-1" />Online</span>
            ) : (
              <span className="flex items-center text-red-600 text-xs"><WifiOff className="w-4 h-4 mr-1" />Offline</span>
            )}
          </div>
        </div>
        <div className="hidden sm:flex items-center justify-between py-2">
          <nav className="flex space-x-1 w-full">
            {navItems.map(item => {
              const Icon = item.icon;
              return (
                <button
                  key={item.path}
                  onClick={() => navigate(item.path)}
                  className={`flex items-center space-x-2 px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${
                    location.pathname === item.path
                      ? 'bg-blue-800 text-white shadow-lg transform scale-105'
                      : 'text-gray-600 hover:text-blue-800 hover:bg-blue-50'
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  <span>{item.label}</span>
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
                <span>Logout</span>
              </button>
            </div>
          )}
        </div>
        {navOpen && (
          <div className="sm:hidden bg-white border-t border-gray-200 py-2 animate-fadeIn">
            <nav className="flex flex-col space-y-2">
              {navItems.map(item => {
                const Icon = item.icon;
                return (
                  <button
                    key={item.path}
                    onClick={() => { setNavOpen(false); navigate(item.path); }}
                    className={`flex items-center space-x-3 px-4 py-3 rounded-lg text-base font-medium transition-all duration-200 ${
                      location.pathname === item.path
                        ? 'bg-blue-800 text-white shadow-lg'
                        : 'text-gray-700 hover:text-blue-800 hover:bg-blue-50'
                    }`}
                  >
                    <Icon className="w-5 h-5" />
                    <span>{item.label}</span>
                  </button>
                );
              })}
            </nav>
            {currentUser && (
              <div className="flex flex-col items-start space-y-2 mt-4 border-t border-gray-100 pt-2 px-4">
                <div className="flex items-center space-x-2">
                  <User className="w-5 h-5 text-gray-500" />
                  <div className="text-base font-medium text-gray-900">{currentUser.name}</div>
                  <div className="text-gray-500 capitalize text-sm">{currentUser.role}</div>
                </div>
                <button
                  onClick={onLogout}
                  className="flex items-center space-x-2 px-3 py-2 text-gray-600 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                >
                  <LogOut className="w-4 h-4" />
                  <span>Logout</span>
                </button>
              </div>
            )}
          </div>
        )}
      </div>
    </header>
  );
};

export default Header;