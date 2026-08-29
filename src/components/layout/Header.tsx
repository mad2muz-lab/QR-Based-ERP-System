import React, { useEffect, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { Activity, MapPin, QrCode, Users, Shield, LogOut, User, Wrench, Package, Menu, WifiOff, Wifi, LayoutDashboard } from 'lucide-react';
import { AuthManager } from '../../utils/authUtils';
import { useLanguage } from '../../i18n/LanguageContext';

interface HeaderProps {
  currentUser?: any;
  onLogout?: () => void;
}

const ALL_NAV_ITEMS = [
  { path: '/', label: 'Dashboard', icon: Activity, page_name: 'dashboard' },
  { path: '/scan', label: 'QR Scanner', icon: QrCode, page_name: 'equipment_scanner' },
  { path: '/register', label: 'Register', icon: Users, page_name: 'registration_form' },
  { path: '/map', label: 'Map View', icon: MapPin, page_name: 'map_view' },
  { path: '/admin', label: 'Admin Panel', icon: Shield, page_name: 'admin_panel' },
  { path: '/inventory', label: 'Inventory', icon: Package, page_name: 'inventory' },
];

const Header: React.FC<HeaderProps> = ({ currentUser, onLogout }) => {
  const { lang, setLang } = useLanguage();
  const [company, setCompany] = useState<{ name: string; logoUrl?: string } | null>(null);
  const [navOpen, setNavOpen] = useState(false);
  const [isOnline, setIsOnline] = useState(true);
  const location = useLocation();
  const navigate = useNavigate();
  const [navItems, setNavItems] = useState<typeof ALL_NAV_ITEMS>([]);
  const [navLoading, setNavLoading] = useState(true);

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

  useEffect(() => {
    setNavItems(ALL_NAV_ITEMS);
    setNavLoading(false);
  }, [currentUser]);

  return (
    <header className="sticky top-0 z-40 bg-primary-900 text-white backdrop-blur-xl border-b border-primary-800/60 shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary-700 to-primary-900 flex items-center justify-center shadow-lg shadow-primary-900/20">
              <QrCode className="w-5 h-5 text-white" />
            </div>
            <div className="hidden sm:block">
              <h1 className="text-base font-bold text-slate-900 leading-tight">{company ? company.name : 'CIRM ERP'}</h1>
              <p className="text-xs text-slate-500 leading-tight">KSA Operations Dashboard</p>
            </div>
          </div>

          <div className="flex items-center gap-2 sm:hidden">
            <button
              onClick={() => setNavOpen(!navOpen)}
              className="p-2 rounded-lg text-slate-700 hover:bg-slate-100 focus:outline-none focus:ring-2 focus:ring-slate-900"
              aria-label="Open navigation menu"
            >
              <Menu className="w-6 h-6" />
            </button>
          </div>

          <div className="flex items-center gap-2">
            {isOnline ? (
              <span className="hidden sm:flex items-center text-emerald-600 text-xs">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 mr-1.5 animate-pulse" />Online
              </span>
            ) : (
              <span className="hidden sm:flex items-center text-rose-600 text-xs">
                <span className="w-1.5 h-1.5 rounded-full bg-rose-500 mr-1.5" />Offline
              </span>
            )}
          </div>
        </div>

        <div className="hidden sm:flex items-center justify-between py-2">
          <nav className="flex items-center gap-1 w-full">
            {navLoading ? (
              <div className="flex items-center justify-center w-full"><span className="text-slate-400 text-sm">Loading menu…</span></div>
            ) : (
              <>
                {navItems.map(item => {
                  const Icon = item.icon;
                  const isActive = location.pathname === item.path;
                  return (
                    <button
                      key={item.path}
                      onClick={() => navigate(item.path)}
                      className={`flex items-center gap-2 px-3.5 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${
                        isActive
                          ? 'bg-slate-900 text-white shadow-lg shadow-slate-900/20'
                          : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                      }`}
                    >
                      <Icon className="w-4 h-4" />
                      <span>{item.label}</span>
                    </button>
                  );
                })}
              </>
            )}
          </nav>
          {currentUser && (
            <div className="flex items-center gap-3 pl-4 border-l border-slate-200">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-indigo-500 to-fuchsia-500 flex items-center justify-center">
                  <User className="w-4 h-4 text-white" />
                </div>
                <div className="text-sm">
                  <div className="font-medium text-slate-900">{currentUser.name}</div>
                  <div className="text-slate-500 capitalize text-xs">{currentUser.role}</div>
                </div>
              </div>
                <button
                  onClick={() => setLang(lang === 'en' ? 'ar' : 'en')}
                  className="flex items-center gap-1 px-2.5 py-2 text-xs font-bold rounded-lg bg-primary-50 text-primary-700 hover:bg-primary-100 border border-primary-200 transition"
                  aria-label="Switch language"
                >
                  {lang === 'en' ? 'AR' : 'EN'}
                </button>
                {onLogout && (
                  <button
                    onClick={onLogout}
                    className="flex items-center gap-1.5 px-3 py-2 text-slate-600 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors text-sm font-medium"
                  >
                    <LogOut className="w-4 h-4" />
                    <span>Logout</span>
                  </button>
                )}
            </div>
          )}
        </div>
        {navOpen && (
          <div className="sm:hidden bg-white border-t border-slate-200 py-2 animate-fadeIn">
            <nav className="flex flex-col space-y-1">
              {navLoading ? (
                <div className="flex items-center justify-center w-full"><span className="text-slate-400 text-sm">Loading menu…</span></div>
              ) : (
                <>
                  {navItems.map(item => {
                    const Icon = item.icon;
                    const isActive = location.pathname === item.path;
                    return (
                      <button
                        key={item.path}
                        onClick={() => { setNavOpen(false); navigate(item.path); }}
                        className={`flex items-center gap-3 px-4 py-3 rounded-lg text-base font-medium transition-all duration-200 ${
                          isActive
                            ? 'bg-slate-900 text-white shadow-lg'
                            : 'text-slate-700 hover:text-slate-900 hover:bg-slate-100'
                        }`}
                      >
                        <Icon className="w-5 h-5" />
                        <span>{item.label}</span>
                      </button>
                    );
                  })}
                </>
              )}
              {currentUser && (
                <div className="border-t border-slate-100 pt-2 mt-2 space-y-2">
                  <div className="flex items-center gap-2 px-4">
                    <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-indigo-500 to-fuchsia-500 flex items-center justify-center">
                      <User className="w-4 h-4 text-white" />
                    </div>
                    <div>
                      <div className="text-base font-medium text-slate-900">{currentUser.name}</div>
                      <div className="text-slate-500 capitalize text-sm">{currentUser.role}</div>
                    </div>
                  </div>
                  {onLogout && (
                    <button
                      onClick={() => { setNavOpen(false); onLogout(); }}
                      className="flex items-center gap-2 px-4 py-2 text-rose-600 hover:bg-rose-50 rounded-lg transition-colors text-base font-medium"
                    >
                      <LogOut className="w-5 h-5" />
                      <span>Logout</span>
                    </button>
                  )}
                </div>
              )}
            </nav>
          </div>
        )}
      </div>
    </header>
  );
};

export default Header;