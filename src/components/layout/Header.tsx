import React, { useEffect, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { Activity, MapPin, QrCode, Users, Shield, LogOut, User, Building, Menu, WifiOff, Wifi, Wrench, Package } from 'lucide-react';
import NotificationButton from '../../components/common/NotificationButton';
import { DataStorage } from '../../utils/dataStorage';
import { supabase } from '../../utils/supabaseClient';
import { AuthManager } from '../../utils/authUtils';
import { SupabaseRegistrationService } from '../../utils/supabaseRegistrationService';

interface HeaderProps {
  currentUser?: any;
  onLogout?: () => void;
  onNotificationClick?: (notification: any) => void;
}

const ALL_NAV_ITEMS = [
  { path: '/', label: 'Dashboard', icon: Activity, page_name: 'dashboard' },
  { path: '/scan', label: 'QR Scanner', icon: QrCode, page_name: 'equipment_scanner' },
  { path: '/register', label: 'Register', icon: Users, page_name: 'registration_form' },
  { path: '/map', label: 'Map View', icon: MapPin, page_name: 'map_view' },
  { path: '/maintenance', label: 'Maintenance', icon: Wrench, page_name: 'maintenance' },
  { path: '/inventory', label: 'Inventory', icon: Package, page_name: 'inventory' },
  { path: '/admin', label: 'Admin Panel', icon: Shield, page_name: 'admin_panel' },
  { path: '/departments', label: 'Departments', icon: Building, page_name: 'departments' },

  // Add more as needed
];

const Header: React.FC<HeaderProps> = ({ currentUser, onLogout, onNotificationClick }) => {
  const [company, setCompany] = useState<{ name: string; logoUrl?: string } | null>(null);
  const [navOpen, setNavOpen] = useState(false);
  const [isOnline, setIsOnline] = useState(true);
  const location = useLocation();
  const navigate = useNavigate();
  const [navItems, setNavItems] = useState<typeof ALL_NAV_ITEMS>([]);
  const [navLoading, setNavLoading] = useState(true);
  const [isInventoryMode, setIsInventoryMode] = useState(false);

  // Function to load company data from both sources
  const loadCompanyData = async () => {
    try {
      const useSupabase = await AuthManager.shouldUseSupabase();
      
      if (useSupabase) {
        // Load from Supabase
        const result = await SupabaseRegistrationService.getCompanies();
        if (result.success && result.data && result.data.length > 0) {
          const companyData = result.data[0];
          // Also save to localStorage for consistency
          localStorage.setItem('companies', JSON.stringify(result.data));
          setCompany({ name: companyData.name, logoUrl: companyData.logo_url });
        } else {
          // Fallback to localStorage if Supabase has no data
          const companies = JSON.parse(localStorage.getItem('companies') || '[]');
          if (companies.length > 0) {
            setCompany({ name: companies[0].name, logoUrl: companies[0].logoUrl });
          } else {
            setCompany(null);
          }
        }
      } else {
        // Load from localStorage
        const companies = JSON.parse(localStorage.getItem('companies') || '[]');
        if (companies.length > 0) {
          setCompany({ name: companies[0].name, logoUrl: companies[0].logoUrl });
        } else {
          setCompany(null);
        }
      }
    } catch (error) {
      console.error('Error loading company data:', error);
      // Fallback to localStorage on error
      try {
        const companies = JSON.parse(localStorage.getItem('companies') || '[]');
        if (companies.length > 0) {
          setCompany({ name: companies[0].name, logoUrl: companies[0].logoUrl });
        } else {
          setCompany(null);
        }
      } catch (fallbackError) {
        console.error('Fallback company loading also failed:', fallbackError);
        setCompany(null);
      }
    }
  };

  useEffect(() => {
    loadCompanyData();
    
    // Listen for company updates
    const handleCompanyUpdate = () => {
      console.log('Company updated, reloading company data...');
      loadCompanyData();
    };
    
    // Listen for data source changes
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === 'selectedDataSource') {
        console.log('Data source changed, reloading company data...');
        loadCompanyData();
      }
    };
    
    window.addEventListener('companyUpdated', handleCompanyUpdate);
    window.addEventListener('storage', handleStorageChange);
    
    return () => {
      window.removeEventListener('companyUpdated', handleCompanyUpdate);
      window.removeEventListener('storage', handleStorageChange);
    };
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

  // Remove role-based filtering and always show all nav items
  useEffect(() => {
    setNavItems(ALL_NAV_ITEMS);
    setNavLoading(false);
  }, [currentUser]);

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
            {navLoading ? (
              <div className="flex items-center justify-center w-full"><span className="text-gray-400 text-sm">Loading menu...</span></div>
            ) : (
              navItems.map(item => {
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
              })
            )}
          </nav>
          {currentUser && (
            <div className="flex items-center space-x-3 pl-4 border-l border-gray-200">
              <NotificationButton
                currentUser={currentUser}
                onNotificationClick={onNotificationClick || (async (notification: any) => {
                  console.log('[DEBUG] Notification clicked:', notification);
                  const allEquipment = DataStorage.loadEquipment();
                  console.log('[DEBUG] All equipment IDs:', allEquipment.map((eq: any) => eq.id), 'Notification entity_id:', notification.entity_id);
                  let equipment = allEquipment.find((eq: any) => eq.id === notification.entity_id || eq.custom_equipment_id === notification.entity_id);
                  // If not found in local storage, fetch from Supabase
                  if (!equipment) {
                    const { data, error } = await supabase
                      .from('equipment')
                      .select('*')
                      .eq('id', notification.entity_id)
                      .single();
                    if (!error && data) {
                      // Normalize fields to match frontend Equipment interface
                      equipment = {
                        id: data.id,
                        custom_equipment_id: data.custom_equipment_id || data.customEquipmentId || '',
                        name: data.name || '',
                        type: data.type || '',
                        model: data.model || '',
                        site: data.site || '',
                        qrCode: data.qr_code || data.qrCode || '',
                        status: data.status || 'available',
                        operational_status: data.operational_status || data.operationalStatus || 'working',
                        createdAt: data.created_at || data.createdAt || '',
                        lastUpdated: data.last_updated || data.lastUpdated || '',
                        serialNumber: data.serial_number || data.serialNumber || '',
                        oldId: data.old_id || data.oldId || '',
                        companyId: data.company_id || data.companyId || '',
                        costCenterCode: data.cost_center_code || data.costCenterCode || '',
                        profitCenterCode: data.profit_center_code || data.profitCenterCode || '',
                        hourly_rate: data.hourly_rate || 0,
                      };
                      console.log('[DEBUG] Equipment fetched and normalized from Supabase:', equipment);
                    } else {
                      console.log('[DEBUG] Equipment not found in Supabase:', error);
                    }
                  }
                  console.log('[DEBUG] Notification type not handled:', notification.type, notification.entity_type);
                })}
              />
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
              {navLoading ? (
                <div className="flex items-center justify-center w-full"><span className="text-gray-400 text-base">Loading menu...</span></div>
              ) : (
                navItems.map(item => {
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
                })
              )}
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