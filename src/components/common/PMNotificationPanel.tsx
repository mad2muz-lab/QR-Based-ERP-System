import React, { useEffect, useRef, useState } from 'react';
import { supabase } from '../../utils/supabaseClient';

const PMNotificationPanel: React.FC<{ onClose: () => void }> = ({ onClose }) => {
  const [notifications, setNotifications] = useState<any[]>([]);
  const [userId, setUserId] = useState('');
  const panelRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    async function fetchUserAndNotifications() {
      const { data } = await supabase.auth.getUser();
      let uid = '';
      if (data && data.user) {
        uid = data.user.id;
        setUserId(uid);
      } else {
        uid = 'mock-user-id';
        setUserId(uid);
      }
      const { data: notifData } = await supabase
        .from('notifications')
        .select('*')
        .eq('user_id', uid)
        .in('type', ['pm_due_soon', 'pm_overdue'])
        .eq('is_read', false)
        .order('created_at', { ascending: false });
      setNotifications(notifData || []);
    }
    fetchUserAndNotifications();
  }, []);

  // Close panel when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (panelRef.current && !panelRef.current.contains(event.target as Node)) {
        onClose();
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [onClose]);

  const acknowledgeNotification = async (notifId: string) => {
    await supabase.from('notifications').update({ is_read: true }).eq('id', notifId);
    setNotifications((prev) => prev.filter((n) => n.id !== notifId));
  };

  return (
    <div ref={panelRef} style={{
      position: 'absolute',
      top: 40,
      right: 0,
      width: 340,
      background: '#fff',
      border: '1px solid #ccc',
      borderRadius: 8,
      boxShadow: '0 4px 16px rgba(0,0,0,0.12)',
      zIndex: 1000,
      padding: 16,
    }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
        <span style={{ fontWeight: 'bold', fontSize: 16 }}>PM Notifications</span>
        <button onClick={onClose} style={{ background: 'none', border: 'none', fontSize: 18, cursor: 'pointer' }}>&times;</button>
      </div>
      {notifications.length === 0 ? (
        <div style={{ color: '#888', textAlign: 'center', padding: 16 }}>No new notifications.</div>
      ) : (
        notifications.map((notif) => (
          <div key={notif.id} style={{ marginBottom: 12, padding: 10, background: '#fffbe6', borderRadius: 6, border: '1px solid #ffe58f' }}>
            <div style={{ fontWeight: 'bold', marginBottom: 2 }}>{notif.title}</div>
            <div style={{ fontSize: 13, color: '#888', marginBottom: 6 }}>{notif.message}</div>
            <div>
              <button style={{ marginRight: 8 }} onClick={() => acknowledgeNotification(notif.id)}>Acknowledge</button>
              <a href={notif.action_url} target="_blank" rel="noopener noreferrer">
                <button>View Details</button>
              </a>
            </div>
          </div>
        ))
      )}
    </div>
  );
};

export default PMNotificationPanel; 