import React, { useEffect, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { Activity, MapPin, QrCode, Users, Shield, LogOut, User, Package, Menu, WifiOff, Wifi, Bell, Settings as SettingsIcon, DollarSign } from 'lucide-react';
import { AuthManager } from '../../utils/authUtils';
import { useLanguage } from '../../i18n/LanguageContext';
import { InventoryStorageService } from '../../modules/inventory/utils/inventoryStorage';

interface HeaderProps {
  currentUser?: any;
  onLogout?: () => void;
}

const ALL_NAV_ITEMS = [
  { path: '/', label: 'Dashboard', icon: Activity },
  { path: '/scan', label: 'QR Scanner', icon: QrCode },
  { path: '/register', label: 'Register', icon: Users },
  { path: '/inventory', label: 'Inventory', icon: Package },
  { path: '/accounts', label: 'Accounts', icon: DollarSign },
  { path: '/admin', label: 'Admin Panel', icon: Shield },
];

const Header: React.FC<HeaderProps> = ({ currentUser, onLogout }) => {
  const { lang, setLang } = useLanguage();
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
    <header style={{ position: 'sticky', top: 0, zIndex: 40, background: '#002e17', borderBottom: '1px solid #004d26', boxShadow: '0 4px 20px rgba(0,0,0,0.15)' }}>
      <div style={{ maxWidth: '1280px', margin: '0 auto', padding: '0 20px' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', height: '64px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div style={{ width: '44px', height: '44px', borderRadius: '12px', background: 'linear-gradient(135deg, #004d26, #002e17)', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 4px 12px rgba(0,0,0,0.2)' }}>
              <QrCode style={{ width: '22px', height: '22px', color: 'white' }} />
            </div>
            <div style={{ display: 'none' }} className="sm:block">
              <h1 style={{ fontSize: '24px', fontWeight: '800', color: 'white', margin: 0 }}>{company ? company.name : 'CIRM ERP'}</h1>
              <p style={{ fontSize: '16px', color: '#99cbb3', margin: 0, fontWeight: '500' }}>KSA Operations Dashboard</p>
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }} className="sm:hidden">
            <button
              onClick={() => setNavOpen(!navOpen)}
              style={{ padding: '10px', borderRadius: '10px', background: '#004d26', border: 'none', cursor: 'pointer' }}
            >
              <Menu style={{ width: '22px', height: '22px', color: 'white' }} />
            </button>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            {isOnline ? (
              <span style={{ display: 'flex', alignItems: 'center', color: '#6ee7b7', fontSize: '16px', fontWeight: '600' }}>
                <span style={{ width: '10px', height: '10px', borderRadius: '50%', background: '#6ee7b7', marginRight: '8px' }} />Online
              </span>
            ) : (
              <span style={{ display: 'flex', alignItems: 'center', color: '#fca5a5', fontSize: '16px', fontWeight: '600' }}>
                <span style={{ width: '10px', height: '10px', borderRadius: '50%', background: '#fca5a5', marginRight: '8px' }} />Offline
              </span>
            )}
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px 0' }} className="sm:flex">
          <nav style={{ display: 'flex', alignItems: 'center', gap: '6px', width: '100%' }}>
            {navLoading ? (
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: '100%' }}>
                <span style={{ color: '#99cbb3', fontSize: '14px' }}>Loading menu…</span>
              </div>
            ) : (
              <>
                {navItems.map(item => {
                  const Icon = item.icon;
                  const isActive = location.pathname === item.path || (item.path !== '/' && location.pathname.startsWith(item.path));
                  return (
                    <button
                      key={item.path}
                      onClick={() => navigate(item.path)}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '10px',
                        padding: '14px 22px',
                        borderRadius: '12px',
                        fontSize: '18px',
                        fontWeight: '700',
                        border: 'none',
                        cursor: 'pointer',
                        transition: 'all 0.2s',
                        background: isActive ? 'white' : 'transparent',
                        color: isActive ? '#002e17' : '#e2e8f0',
                        boxShadow: isActive ? '0 4px 12px rgba(0,0,0,0.15)' : 'none'
                      }}
                    >
                      <Icon style={{ width: '18px', height: '18px' }} />
                      <span>{item.label}</span>
                    </button>
                  );
                })}
              </>
            )}
          </nav>
          {currentUser && (
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', paddingLeft: '16px', borderLeft: '1px solid #004d26' }}>
              <div style={{ position: 'relative' }}>
                <button
                  onClick={() => setShowNotifications(!showNotifications)}
                  style={{ position: 'relative', padding: '10px', color: '#e2e8f0', background: 'transparent', border: 'none', borderRadius: '10px', cursor: 'pointer' }}
                >
                  <Bell style={{ width: '18px', height: '18px' }} />
                  {lowStockCount > 0 && (
                    <span style={{ position: 'absolute', top: '-2px', right: '-2px', background: '#ef4444', color: 'white', fontSize: '14px', borderRadius: '50%', width: '24px', height: '24px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: '700' }}>
                      {lowStockCount > 9 ? '9+' : lowStockCount}
                    </span>
                  )}
                </button>
                {showNotifications && (
                  <div style={{ position: 'absolute', right: 0, top: '100%', marginTop: '8px', width: '320px', background: 'white', borderRadius: '12px', boxShadow: '0 10px 40px rgba(0,0,0,0.2)', zIndex: 50, border: '1px solid #e2e8f0' }} className="notification-dropdown">
                    <div style={{ padding: '16px', borderBottom: '1px solid #e2e8f0' }}>
                      <h4 style={{ fontWeight: '700', color: '#0f172a', margin: 0, fontSize: '18px' }}>Notifications</h4>
                    </div>
                    <div style={{ maxHeight: '320px', overflowY: 'auto' }}>
                      {lowStockCount === 0 ? (
                        <div style={{ padding: '16px', fontSize: '16px', color: '#475569', textAlign: 'center' }}>No low stock alerts</div>
                      ) : (
                        <div style={{ padding: '8px' }}>
                          <div style={{ fontSize: '15px', color: '#dc2626', fontWeight: '600', padding: '8px 12px' }}>
                            {lowStockCount} item{lowStockCount !== 1 ? 's' : ''} need attention
                          </div>
                          {(() => {
                            try {
                              const inventoryStorage = InventoryStorageService.getInstance();
                              const items = inventoryStorage.getItems();
                              const lowItems = items.filter(item => item.quantity <= (item.reorderLevel || 0) || item.quantity <= 0).slice(0, 5);
                              return lowItems.map(item => (
                                <div key={item.id} style={{ padding: '12px', fontSize: '16px', borderRadius: '8px', cursor: 'pointer' }}>
                                  <div style={{ fontWeight: '600', color: '#0f172a' }}>{item.name}</div>
                                  <div style={{ fontSize: '15px', color: '#475569' }}>
                                    {item.quantity} {item.unit} left
                                    {item.quantity === 0 && <span style={{ color: '#dc2626', fontWeight: '600', marginLeft: '4px' }}>OUT OF STOCK</span>}
                                  </div>
                                </div>
                              ));
                            } catch {
                              return null;
                            }
                          })()}
                          <button
                            onClick={() => { setShowNotifications(false); navigate('/inventory/alerts'); }}
                            style={{ width: '100%', textAlign: 'left', padding: '12px', fontSize: '16px', color: '#2563eb', background: 'none', border: 'none', borderRadius: '8px', cursor: 'pointer', fontWeight: '600' }}
                          >
                            View all inventory alerts →
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <div style={{ width: '36px', height: '36px', borderRadius: '10px', background: 'linear-gradient(135deg, #6366f1, #a855f7)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <User style={{ width: '18px', height: '18px', color: 'white' }} />
                </div>
                <div style={{ fontSize: '16px' }}>
                  <div style={{ fontWeight: '700', color: 'white', fontSize: '18px' }}>{currentUser.name}</div>
                  <div style={{ color: '#99cbb3', fontSize: '15px', textTransform: 'capitalize' }}>{currentUser.role}</div>
                </div>
              </div>
              <button
                onClick={() => navigate('/settings')}
                style={{ padding: '10px', color: '#e2e8f0', background: 'transparent', border: 'none', borderRadius: '10px', cursor: 'pointer' }}
              >
                <SettingsIcon style={{ width: '18px', height: '18px' }} />
              </button>
              <button
                onClick={() => setLang(lang === 'en' ? 'ar' : 'en')}
                style={{ padding: '8px 12px', fontSize: '13px', fontWeight: '700', borderRadius: '8px', background: '#004d26', color: '#e2e8f0', border: '1px solid #006C35', cursor: 'pointer' }}
              >
                {lang === 'en' ? 'AR' : 'EN'}
              </button>
              {onLogout && (
                <button
                  onClick={onLogout}
                  style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '8px 12px', color: '#fca5a5', background: 'transparent', border: 'none', borderRadius: '8px', cursor: 'pointer', fontSize: '14px', fontWeight: '600' }}
                >
                  <LogOut style={{ width: '16px', height: '16px' }} />
                  <span>Logout</span>
                </button>
              )}
            </div>
          )}
        </div>
        {navOpen && (
          <div style={{ padding: '12px 0', borderTop: '1px solid #004d26' }} className="sm:hidden">
            <nav style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
              {navLoading ? (
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: '100%' }}>
                  <span style={{ color: '#99cbb3', fontSize: '14px' }}>Loading menu…</span>
                </div>
              ) : (
                <>
                  {navItems.map(item => {
                    const Icon = item.icon;
                    const isActive = location.pathname === item.path;
                    return (
                      <button
                        key={item.path}
                        onClick={() => { setNavOpen(false); navigate(item.path); }}
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: '12px',
                          padding: '14px 16px',
                          borderRadius: '10px',
                          fontSize: '16px',
                          fontWeight: '600',
                          border: 'none',
                          cursor: 'pointer',
                          background: isActive ? 'white' : 'transparent',
                          color: isActive ? '#002e17' : '#e2e8f0'
                        }}
                      >
                        <Icon style={{ width: '20px', height: '20px' }} />
                        <span>{item.label}</span>
                      </button>
                    );
                  })}
                </>
              )}
              {currentUser && (
                <div style={{ borderTop: '1px solid #004d26', paddingTop: '12px', marginTop: '12px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '0 16px' }}>
                    <div style={{ width: '36px', height: '36px', borderRadius: '10px', background: 'linear-gradient(135deg, #6366f1, #a855f7)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      <User style={{ width: '18px', height: '18px', color: 'white' }} />
                    </div>
                    <div>
                      <div style={{ fontSize: '16px', fontWeight: '600', color: 'white' }}>{currentUser.name}</div>
                      <div style={{ color: '#99cbb3', fontSize: '14px', textTransform: 'capitalize' }}>{currentUser.role}</div>
                    </div>
                  </div>
                  {onLogout && (
                    <button
                      onClick={() => { setNavOpen(false); onLogout(); }}
                      style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '12px 16px', color: '#fca5a5', background: 'transparent', border: 'none', borderRadius: '10px', cursor: 'pointer', fontSize: '16px', fontWeight: '600' }}
                    >
                      <LogOut style={{ width: '20px', height: '20px' }} />
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
