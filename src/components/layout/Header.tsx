import React, { useEffect, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { Activity, MapPin, QrCode, Shield, LogOut, User, Package, Menu, WifiOff, Wifi, Bell, Settings as SettingsIcon, DollarSign, FileText, Sun, Moon } from 'lucide-react';
import { AuthManager } from '../../utils/authUtils';
import { useLanguage } from '../../i18n/LanguageContext';
import { useTheme } from '../../context/ThemeContext';
import { InventoryStorageService } from '../../modules/inventory/utils/inventoryStorage';

interface HeaderProps {
  currentUser?: any;
  onLogout?: () => void;
}

const ALL_NAV_ITEMS = [
  { path: '/', label: 'Dashboard', icon: Activity },
  { path: '/scan', label: 'QR Scanner', icon: QrCode },
  { path: '/inventory', label: 'Inventory', icon: Package },
  { path: '/reports', label: 'Reports', icon: FileText },
  { path: '/accounts', label: 'Accounts', icon: DollarSign },
  { path: '/admin', label: 'Admin Panel', icon: Shield },
];

const Header: React.FC<HeaderProps> = ({ currentUser, onLogout }) => {
  const { lang, setLang } = useLanguage();
  const { theme, toggleTheme } = useTheme();
  const [company, setCompany] = useState<{ name: string; logoUrl?: string } | null>(null);
  const [navOpen, setNavOpen] = useState(false);
  const [isOnline, setIsOnline] = useState(true);
  const [lowStockCount, setLowStockCount] = useState(0);
  const [showNotifications, setShowNotifications] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();
  const [navItems, setNavItems] = useState<typeof ALL_NAV_ITEMS>([]);
  const [navLoading, setNavLoading] = useState(true);

  useEffect(() => {
    const updateLowStockCount = () => {
      try {
        const inventoryStorage = InventoryStorageService.getInstance();
        const items = inventoryStorage.getItems();
        const lowStock = items.filter(item => item.quantity <= (item.reorderLevel || 0) || item.quantity <= 0);
        setLowStockCount(lowStock.length);
      } catch {
        setLowStockCount(0);
      }
    };

    updateLowStockCount();
    window.addEventListener('storage', updateLowStockCount);
    return () => window.removeEventListener('storage', updateLowStockCount);
  }, []);

  useEffect(() => {
    const loadCompany = () => {
      try {
        const companies = JSON.parse(localStorage.getItem('companies') || '[]');
        if (companies.length > 0) {
          setCompany({ name: companies[0].name, logoUrl: companies[0].logoUrl });
        } else {
          setCompany(null);
        }
      } catch {
        setCompany(null);
      }
    };

    loadCompany();
    window.addEventListener('storage', loadCompany);
    window.addEventListener('companyUpdated', loadCompany);
    return () => {
      window.removeEventListener('storage', loadCompany);
      window.removeEventListener('companyUpdated', loadCompany);
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

  useEffect(() => {
    setNavItems(ALL_NAV_ITEMS);
    setNavLoading(false);
  }, [currentUser]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as HTMLElement;
      if (!target.closest('.notification-dropdown')) {
        setShowNotifications(false);
      }
    };

    if (showNotifications) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [showNotifications]);

  return (
    <header className="sticky top-0 z-40 bg-white/95 dark:bg-[#0F172A]/95 backdrop-blur-md border-b border-slate-200/90 dark:border-slate-800 shadow-sm text-slate-800 dark:text-slate-100 transition-colors duration-150">
      <div className="w-full px-4 sm:px-8">
        <div className="flex items-center justify-between h-20 gap-4">
          {/* Logo & Brand */}
          <div className="flex items-center gap-3.5 flex-shrink-0 cursor-pointer" onClick={() => navigate('/')}>
            {company?.logoUrl ? (
              <div className="w-12 h-12 rounded-2xl bg-white dark:bg-[#131B2A] border border-slate-200 dark:border-[#202C3F] p-1 flex items-center justify-center shadow-md overflow-hidden flex-shrink-0">
                <img
                  src={company.logoUrl}
                  alt={company.name || 'Company Logo'}
                  className="w-full h-full object-contain rounded-xl"
                  onError={(e) => {
                    // Fallback to QR code icon if uploaded image fails to render
                    e.currentTarget.style.display = 'none';
                  }}
                />
              </div>
            ) : (
              <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-emerald-600 to-teal-500 flex items-center justify-center shadow-lg shadow-emerald-950/20 text-white flex-shrink-0">
                <QrCode className="w-6 h-6" />
              </div>
            )}
            <div className="flex flex-col">
              <div className="flex items-center gap-2">
                <span className="font-black text-xl tracking-tight text-slate-900 dark:text-white leading-none">
                  {company ? company.name : 'CIRM ERP'}
                </span>
                <span className="hidden xl:inline-block px-2 py-0.5 text-[10px] font-black tracking-wider uppercase bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20 rounded-md">
                  KSA ENTERPRISE
                </span>
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400 font-semibold tracking-wide mt-1 leading-none">
                Multi-Warehouse & Asset Tracking
              </p>
            </div>
          </div>

          {/* Desktop Navigation - Formidable, Uniform Sized Tabs */}
          <nav className="hidden lg:flex items-center gap-1.5 bg-slate-100/90 dark:bg-[#131B2A] p-1.5 rounded-2xl border border-slate-200/90 dark:border-[#202C3F] shadow-inner">
            {navLoading ? (
              <span className="text-sm text-slate-400 px-6 py-2.5 font-medium">Loading navigation...</span>
            ) : (
              navItems.map(item => {
                const Icon = item.icon;
                const isActive = location.pathname === item.path || (item.path !== '/' && location.pathname.startsWith(item.path));
                return (
                  <button
                    key={item.path}
                    onClick={() => navigate(item.path)}
                    className={`flex items-center justify-center gap-2 px-4 py-2.5 min-w-[112px] xl:min-w-[125px] rounded-xl text-xs xl:text-sm font-black transition-all duration-150 ${
                      isActive
                        ? 'bg-emerald-600 text-white shadow-md shadow-emerald-950/20 ring-1 ring-emerald-500'
                        : 'text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white hover:bg-slate-200/70 dark:hover:bg-slate-800'
                    }`}
                  >
                    <Icon className="w-4 h-4 flex-shrink-0" />
                    <span>{item.label}</span>
                  </button>
                );
              })
            )}
          </nav>

          {/* Right Action Tools & Profile */}
          <div className="flex items-center gap-2 flex-shrink-0">
            {/* Day / Night Mode Toggle */}
            <button
              onClick={toggleTheme}
              className="flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold transition-all border bg-slate-100 hover:bg-slate-200 border-slate-200 text-slate-700 dark:bg-[#131B2A] dark:hover:bg-slate-800 dark:border-[#202C3F] dark:text-slate-200 shadow-sm"
              title={theme === 'dark' ? 'Switch to Day Mode' : 'Switch to Night Mode'}
            >
              {theme === 'dark' ? (
                <>
                  <Sun className="w-4 h-4 text-amber-400" />
                  <span className="hidden sm:inline">Light</span>
                </>
              ) : (
                <>
                  <Moon className="w-4 h-4 text-indigo-500" />
                  <span className="hidden sm:inline">Dark</span>
                </>
              )}
            </button>

            {/* Language Switch */}
            <button
              onClick={() => setLang(lang === 'en' ? 'ar' : 'en')}
              className="px-3 py-2 text-xs font-bold rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 dark:bg-[#131B2A] dark:hover:bg-slate-800 dark:text-slate-200 border border-slate-200 dark:border-[#202C3F] transition shadow-sm"
              title="Toggle Language"
            >
              {lang === 'en' ? 'العربية' : 'EN'}
            </button>

            {/* Network Status Pill */}
            <div className="hidden xl:flex items-center gap-2 px-3.5 py-2 rounded-xl bg-slate-100 dark:bg-[#131B2A] border border-slate-200 dark:border-[#202C3F] text-xs font-bold">
              <span className={`w-2 h-2 rounded-full ${isOnline ? 'bg-emerald-500 animate-pulse' : 'bg-rose-500'}`} />
              <span className={isOnline ? 'text-slate-700 dark:text-slate-200' : 'text-rose-600 dark:text-rose-400'}>
                {isOnline ? 'Online' : 'Offline'}
              </span>
            </div>

            {/* Notifications Dropdown */}
            <div className="relative notification-dropdown">
              <button
                onClick={() => setShowNotifications(!showNotifications)}
                className="relative p-2.5 text-slate-600 hover:text-slate-900 dark:text-slate-300 dark:hover:text-white rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-[#131B2A] dark:hover:bg-slate-800 border border-slate-200 dark:border-[#202C3F] transition shadow-sm"
                title="Notifications"
              >
                <Bell className="w-4 h-4" />
                {lowStockCount > 0 && (
                  <span className="absolute -top-1 -right-1 bg-rose-500 text-white text-[10px] font-bold rounded-full w-4 h-4 flex items-center justify-center shadow-sm">
                    {lowStockCount > 9 ? '9+' : lowStockCount}
                  </span>
                )}
              </button>

              {showNotifications && (
                <div className="absolute right-0 mt-2 w-80 bg-white dark:bg-[#131B2A] rounded-xl shadow-xl border border-slate-200 dark:border-slate-700 z-50 text-slate-800 dark:text-slate-100 overflow-hidden animate-in fade-in slide-in-from-top-1 duration-150">
                  <div className="px-4 py-3 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between bg-slate-50 dark:bg-slate-800/50">
                    <h4 className="font-bold text-xs uppercase tracking-wider text-slate-700 dark:text-slate-300">Inventory Alerts</h4>
                    {lowStockCount > 0 && (
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-rose-100 dark:bg-rose-950/40 text-rose-700 dark:text-rose-400 border border-rose-200 dark:border-rose-900/50">
                        {lowStockCount} Action Required
                      </span>
                    )}
                  </div>
                  <div className="max-h-64 overflow-y-auto divide-y divide-slate-100 dark:divide-slate-800 text-xs">
                    {lowStockCount === 0 ? (
                      <div className="py-6 text-center text-slate-400">All inventory levels healthy</div>
                    ) : (
                      (() => {
                        try {
                          const inventoryStorage = InventoryStorageService.getInstance();
                          const items = inventoryStorage.getItems();
                          const lowItems = items.filter(item => item.quantity <= (item.reorderLevel || 0) || item.quantity <= 0).slice(0, 5);
                          return lowItems.map(item => (
                            <div key={item.id} className="p-3 hover:bg-slate-50 dark:hover:bg-slate-800/60 transition cursor-pointer" onClick={() => { setShowNotifications(false); navigate('/inventory/alerts'); }}>
                              <div className="font-semibold text-slate-900 dark:text-white">{item.name}</div>
                              <div className="text-[11px] text-slate-500 dark:text-slate-400 flex items-center justify-between mt-0.5">
                                <span>Stock: <strong>{item.quantity} {item.unit}</strong></span>
                                {item.quantity === 0 ? (
                                  <span className="text-rose-600 dark:text-rose-400 font-bold uppercase text-[10px]">Out of Stock</span>
                                ) : (
                                  <span className="text-amber-600 dark:text-amber-400 font-semibold text-[10px]">Low Threshold</span>
                                )}
                              </div>
                            </div>
                          ));
                        } catch {
                          return null;
                        }
                      })()
                    )}
                  </div>
                  <button
                    onClick={() => { setShowNotifications(false); navigate('/inventory/alerts'); }}
                    className="w-full text-center py-2.5 text-xs font-semibold text-emerald-700 dark:text-emerald-400 bg-emerald-50/50 dark:bg-emerald-950/20 hover:bg-emerald-50 dark:hover:bg-emerald-950/40 border-t border-slate-100 dark:border-slate-800 transition"
                  >
                    View All Stock Alerts →
                  </button>
                </div>
              )}
            </div>

            {/* User Profile info */}
            {currentUser && (
              <div className="flex items-center gap-2 pl-2 border-l border-slate-200 dark:border-slate-800">
                <div className="w-9 h-9 rounded-xl bg-slate-900 dark:bg-emerald-600 flex items-center justify-center text-white shadow-sm font-bold text-xs">
                  {currentUser.name ? currentUser.name.charAt(0).toUpperCase() : 'U'}
                </div>
                <div className="hidden lg:block text-left leading-tight">
                  <div className="text-xs font-bold text-slate-900 dark:text-white">{currentUser.name}</div>
                  <div className="text-[10px] text-emerald-600 dark:text-emerald-400 capitalize font-medium">{currentUser.role}</div>
                </div>
              </div>
            )}

            {/* Settings button */}
            <button
              onClick={() => navigate('/settings')}
              className="p-2.5 text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-[#131B2A] dark:hover:bg-slate-800 border border-slate-200 dark:border-[#202C3F] transition shadow-sm"
              title="System Settings"
            >
              <SettingsIcon className="w-4 h-4" />
            </button>

            {/* Logout button */}
            {onLogout && (
              <button
                onClick={onLogout}
                className="hidden sm:flex items-center gap-1.5 px-3 py-2 text-xs font-bold text-slate-500 dark:text-slate-400 hover:text-rose-600 dark:hover:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-500/10 rounded-xl transition"
                title="Logout"
              >
                <LogOut className="w-4 h-4" />
                <span>Exit</span>
              </button>
            )}

            {/* Mobile menu toggle */}
            <button
              onClick={() => setNavOpen(!navOpen)}
              className="lg:hidden p-2.5 rounded-xl bg-slate-100 dark:bg-[#131B2A] border border-slate-200 dark:border-[#202C3F] text-slate-700 dark:text-slate-200 hover:bg-slate-200"
            >
              <Menu className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Mobile Dropdown Nav */}
        {navOpen && (
          <div className="md:hidden py-3 border-t border-slate-800 bg-slate-900/95 space-y-1">
            {navItems.map(item => {
              const Icon = item.icon;
              const isActive = location.pathname === item.path;
              return (
                <button
                  key={item.path}
                  onClick={() => { setNavOpen(false); navigate(item.path); }}
                  className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg text-xs font-semibold ${
                    isActive ? 'bg-emerald-600 text-white' : 'text-slate-300 hover:bg-slate-800'
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  <span>{item.label}</span>
                </button>
              );
            })}
            {onLogout && (
              <button
                onClick={() => { setNavOpen(false); onLogout(); }}
                className="w-full flex items-center gap-3 px-3 py-2 rounded-lg text-xs font-semibold text-rose-400 hover:bg-rose-500/10"
              >
                <LogOut className="w-4 h-4" />
                <span>Logout</span>
              </button>
            )}
          </div>
        )}
      </div>
    </header>
  );
};

export default Header;
