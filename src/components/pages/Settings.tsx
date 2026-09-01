import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, User, Bell, Database, Globe, Shield, Save, CheckCircle } from 'lucide-react';
import { useLanguage } from '../../i18n/LanguageContext';
import { AuthManager } from '../../utils/authUtils';

const Settings: React.FC = () => {
  const navigate = useNavigate();
  const { lang, setLang } = useLanguage();
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [notifications, setNotifications] = useState({
    lowStock: true,
    expiry: true,
    sync: false
  });
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    const user = AuthManager.getCurrentUserSync();
    setCurrentUser(user);
    const savedNotifications = localStorage.getItem('notification_settings');
    if (savedNotifications) {
      try {
        setNotifications(JSON.parse(savedNotifications));
      } catch {}
    }
  }, []);

  const handleSave = () => {
    localStorage.setItem('notification_settings', JSON.stringify(notifications));
    setSaved(true);
    setTimeout(() => setSaved(false), 3000);
  };

  const isAdmin = currentUser?.role === 'admin' || currentUser?.role === 'developer';

  return (
    <div style={{ maxWidth: '800px', margin: '0 auto', padding: '24px' }}>
      {/* Header */}
      <div style={{ marginBottom: '24px' }}>
        <button onClick={() => navigate('/')} style={{ display: 'flex', alignItems: 'center', gap: '8px', background: 'none', border: 'none', color: '#2563eb', fontWeight: '600', fontSize: '16px', cursor: 'pointer', marginBottom: '16px', padding: 0 }}>
          <ArrowLeft style={{ width: '18px', height: '18px' }} /> Back to Dashboard
        </button>
        <h1 style={{ fontSize: '32px', fontWeight: '800', color: '#0f172a', margin: '0 0 8px 0' }}>Settings</h1>
        <p style={{ fontSize: '16px', color: '#64748b', margin: 0 }}>Manage your application preferences</p>
      </div>

      {saved && (
        <div style={{ padding: '16px 20px', borderRadius: '12px', marginBottom: '24px', fontSize: '16px', fontWeight: '600', background: '#d1fae5', color: '#065f46', border: '2px solid #6ee7b7', display: 'flex', alignItems: 'center', gap: '10px' }}>
          <CheckCircle style={{ width: '20px', height: '20px' }} /> Settings saved successfully!
        </div>
      )}

      <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
        {/* User Profile */}
        <div style={{ background: 'white', borderRadius: '16px', border: '2px solid #e2e8f0', padding: '28px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '20px' }}>
            <div style={{ width: '44px', height: '44px', borderRadius: '12px', background: '#f0fdf4', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <User style={{ width: '22px', height: '22px', color: '#059669' }} />
            </div>
            <div>
              <h2 style={{ fontSize: '20px', fontWeight: '700', color: '#0f172a', margin: 0 }}>User Profile</h2>
              <p style={{ fontSize: '14px', color: '#6b7280', margin: '2px 0 0 0' }}>Your account information</p>
            </div>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
            <div>
              <label style={{ display: 'block', fontSize: '14px', fontWeight: '600', color: '#6b7280', marginBottom: '6px' }}>Name</label>
              <div style={{ padding: '14px 18px', background: '#f9fafb', borderRadius: '10px', fontSize: '16px', color: '#111827', fontWeight: '600' }}>{currentUser?.name || 'N/A'}</div>
            </div>
            <div>
              <label style={{ display: 'block', fontSize: '14px', fontWeight: '600', color: '#6b7280', marginBottom: '6px' }}>Role</label>
              <div style={{ padding: '14px 18px', background: '#f9fafb', borderRadius: '10px', fontSize: '16px', color: '#111827', fontWeight: '600', textTransform: 'capitalize' }}>{currentUser?.role || 'N/A'}</div>
            </div>
            <div>
              <label style={{ display: 'block', fontSize: '14px', fontWeight: '600', color: '#6b7280', marginBottom: '6px' }}>Username</label>
              <div style={{ padding: '14px 18px', background: '#f9fafb', borderRadius: '10px', fontSize: '16px', color: '#111827', fontWeight: '600' }}>{currentUser?.username || 'N/A'}</div>
            </div>
            <div>
              <label style={{ display: 'block', fontSize: '14px', fontWeight: '600', color: '#6b7280', marginBottom: '6px' }}>Email</label>
              <div style={{ padding: '14px 18px', background: '#f9fafb', borderRadius: '10px', fontSize: '16px', color: '#111827', fontWeight: '600' }}>{currentUser?.email || 'N/A'}</div>
            </div>
          </div>
        </div>

        {/* Language */}
        <div style={{ background: 'white', borderRadius: '16px', border: '2px solid #e2e8f0', padding: '28px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '20px' }}>
            <div style={{ width: '44px', height: '44px', borderRadius: '12px', background: '#fef3c7', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Globe style={{ width: '22px', height: '22px', color: '#d97706' }} />
            </div>
            <div>
              <h2 style={{ fontSize: '20px', fontWeight: '700', color: '#0f172a', margin: 0 }}>Language</h2>
              <p style={{ fontSize: '14px', color: '#6b7280', margin: '2px 0 0 0' }}>Choose your preferred language</p>
            </div>
          </div>
          <div style={{ display: 'flex', gap: '12px' }}>
            <button
              onClick={() => setLang('en')}
              style={{ flex: 1, padding: '14px 24px', borderRadius: '12px', border: `2px solid ${lang === 'en' ? '#002e17' : '#d1d5db'}`, background: lang === 'en' ? '#002e17' : 'white', color: lang === 'en' ? 'white' : '#374151', fontWeight: '700', fontSize: '16px', cursor: 'pointer' }}
            >
              English
            </button>
            <button
              onClick={() => setLang('ar')}
              style={{ flex: 1, padding: '14px 24px', borderRadius: '12px', border: `2px solid ${lang === 'ar' ? '#002e17' : '#d1d5db'}`, background: lang === 'ar' ? '#002e17' : 'white', color: lang === 'ar' ? 'white' : '#374151', fontWeight: '700', fontSize: '16px', cursor: 'pointer' }}
            >
              العربية
            </button>
          </div>
        </div>

        {/* Notifications */}
        <div style={{ background: 'white', borderRadius: '16px', border: '2px solid #e2e8f0', padding: '28px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '20px' }}>
            <div style={{ width: '44px', height: '44px', borderRadius: '12px', background: '#fee2e2', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Bell style={{ width: '22px', height: '22px', color: '#dc2626' }} />
            </div>
            <div>
              <h2 style={{ fontSize: '20px', fontWeight: '700', color: '#0f172a', margin: 0 }}>Notifications</h2>
              <p style={{ fontSize: '14px', color: '#6b7280', margin: '2px 0 0 0' }}>Configure alert preferences</p>
            </div>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            <label style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '16px', background: '#f9fafb', borderRadius: '12px', cursor: 'pointer' }}>
              <div>
                <div style={{ fontSize: '16px', fontWeight: '600', color: '#111827' }}>Low Stock Alerts</div>
                <div style={{ fontSize: '14px', color: '#6b7280' }}>Notify when items fall below reorder level</div>
              </div>
              <input type="checkbox" checked={notifications.lowStock} onChange={e => setNotifications({ ...notifications, lowStock: e.target.checked })} style={{ width: '20px', height: '20px' }} />
            </label>
            <label style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '16px', background: '#f9fafb', borderRadius: '12px', cursor: 'pointer' }}>
              <div>
                <div style={{ fontSize: '16px', fontWeight: '600', color: '#111827' }}>Expiry Warnings</div>
                <div style={{ fontSize: '14px', color: '#6b7280' }}>Notify when items are near expiration</div>
              </div>
              <input type="checkbox" checked={notifications.expiry} onChange={e => setNotifications({ ...notifications, expiry: e.target.checked })} style={{ width: '20px', height: '20px' }} />
            </label>
            <label style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '16px', background: '#f9fafb', borderRadius: '12px', cursor: 'pointer' }}>
              <div>
                <div style={{ fontSize: '16px', fontWeight: '600', color: '#111827' }}>Sync Notifications</div>
                <div style={{ fontSize: '14px', color: '#6b7280' }}>Notify when data sync completes</div>
              </div>
              <input type="checkbox" checked={notifications.sync} onChange={e => setNotifications({ ...notifications, sync: e.target.checked })} style={{ width: '20px', height: '20px' }} />
            </label>
          </div>
        </div>

        {/* Data Source */}
        <div style={{ background: 'white', borderRadius: '16px', border: '2px solid #e2e8f0', padding: '28px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '20px' }}>
            <div style={{ width: '44px', height: '44px', borderRadius: '12px', background: '#eff6ff', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Database style={{ width: '22px', height: '22px', color: '#2563eb' }} />
            </div>
            <div>
              <h2 style={{ fontSize: '20px', fontWeight: '700', color: '#0f172a', margin: 0 }}>Data Source</h2>
              <p style={{ fontSize: '14px', color: '#6b7280', margin: '2px 0 0 0' }}>Current data storage mode</p>
            </div>
          </div>
          <div style={{ padding: '16px', background: '#f0fdf4', borderRadius: '12px', border: '2px solid #a7f3d0' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <Database style={{ width: '20px', height: '20px', color: '#059669' }} />
              <span style={{ fontSize: '16px', fontWeight: '600', color: '#065f46' }}>Local Storage</span>
              <span style={{ marginLeft: 'auto', padding: '4px 12px', background: '#d1fae5', borderRadius: '20px', fontSize: '13px', fontWeight: '700', color: '#065f46' }}>Active</span>
            </div>
            <p style={{ fontSize: '14px', color: '#059669', margin: '8px 0 0 0' }}>Data is stored locally in your browser. Enable Supabase for cloud sync.</p>
          </div>
        </div>

        {/* Save Button */}
        <button
          onClick={handleSave}
          style={{ width: '100%', padding: '16px', background: '#002e17', color: 'white', border: 'none', borderRadius: '12px', fontSize: '17px', fontWeight: '700', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px', boxShadow: '0 4px 12px rgba(0,46,23,0.3)' }}
        >
          <Save style={{ width: '20px', height: '20px' }} /> Save Settings
        </button>
      </div>
    </div>
  );
};

export default Settings;
