import React, { useState, useEffect } from 'react';
import { Bell, X, Trash2, Wrench, AlertTriangle, Package } from 'lucide-react';
import { Menu, Transition } from '@headlessui/react';
import { supabase } from '../../utils/supabaseClient';
import { MaintenanceNotification } from '../../types/correctiveMaintenance';
import { InventoryNotification } from '../../types/inventory';

interface NotificationButtonProps {
  currentUser: { id: string; role: string; name: string };
  onNotificationClick: (notification: any) => void;
}

export default function NotificationButton({ currentUser, onNotificationClick }: NotificationButtonProps) {
  const [notifications, setNotifications] = useState<(MaintenanceNotification | InventoryNotification)[]>([]);
  const [loading, setLoading] = useState(true);

  // Fetch notifications function
  const fetchNotifications = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('notifications')
      .select('*')
      .order('created_at', { ascending: false });
    if (!error && data) setNotifications(data);
    setLoading(false);
  };

  useEffect(() => {
    fetchNotifications();
    // Real-time subscription
    const channel = supabase.channel('notifications-realtime')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'notifications',
        },
        (payload) => {
          const n = payload.new || payload.old;
          if (n && typeof n === 'object') {
            if (
              ('user_id' in n && n.user_id === currentUser.id) ||
              ('role' in n && n.role === currentUser.role)
            ) {
              fetchNotifications();
            }
          }
        }
      )
      .subscribe();
    return () => {
      supabase.removeChannel(channel);
    };
  }, [currentUser.id, currentUser.role]);

  useEffect(() => {
    (async () => {
      const { data, error } = await supabase.from('equipment').select('*');
      console.log('EQUIPMENT TEST:', data, error);
    })();
  }, []);

  const unreadCount = notifications.filter(n => !n.is_read).length;

  const markAsRead = async (id: string) => {
    await supabase.from('notifications').update({ is_read: true }).eq('id', id);
    setNotifications(notifications => notifications.map(n => n.id === id ? { ...n, is_read: true } : n));
  };

  const dismiss = async (id: string) => {
    await supabase.from('notifications').delete().eq('id', id);
    setNotifications(notifications => notifications.filter(n => n.id !== id));
  };

  const clearAllNotifications = async () => {
    try {
      // Delete all notifications for the current user or role
      const { error } = await supabase
        .from('notifications')
        .delete()
        .or(`user_id.eq.${currentUser.id},role.eq.${currentUser.role}`);
      
      if (error) {
        console.error('Error clearing notifications:', error);
        return;
      }
      
      // Clear local state
      setNotifications([]);
      console.log('All notifications cleared successfully');
    } catch (error) {
      console.error('Error clearing notifications:', error);
    }
  };

  return (
    <Menu as="div" className="relative inline-block text-left">
      <Menu.Button className="relative p-2 rounded-full hover:bg-blue-50 focus:outline-none focus:ring-2 focus:ring-blue-500">
        <Bell className="w-6 h-6 text-gray-700" />
        {unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 inline-flex items-center justify-center px-1.5 py-0.5 text-xs font-bold leading-none text-white bg-red-600 rounded-full">
            {unreadCount}
          </span>
        )}
      </Menu.Button>
      <Transition
        as={React.Fragment}
        enter="transition ease-out duration-100"
        enterFrom="transform opacity-0 scale-95"
        enterTo="transform opacity-100 scale-100"
        leave="transition ease-in duration-75"
        leaveFrom="transform opacity-100 scale-100"
        leaveTo="transform opacity-0 scale-95"
      >
        <Menu.Items className="origin-top-right absolute right-0 mt-2 w-96 rounded-md shadow-lg bg-white ring-1 ring-black ring-opacity-5 focus:outline-none z-50">
          <div className="p-4 border-b border-gray-100 font-semibold text-gray-900 flex items-center justify-between">
            <span>Notifications</span>
            <div className="flex items-center space-x-2">
              {loading && <span className="text-xs text-gray-400 font-normal">Loading...</span>}
              {!loading && notifications.length === 0 && <span className="text-xs text-gray-400 font-normal">No notifications</span>}
              {!loading && notifications.length > 0 && (
                <button
                  onClick={clearAllNotifications}
                  className="text-xs text-red-600 hover:text-red-800 font-normal flex items-center space-x-1"
                  title="Clear all notifications"
                >
                  <Trash2 className="w-3 h-3" />
                  <span>Clear All</span>
                </button>
              )}
            </div>
          </div>
          <div className="max-h-96 overflow-y-auto divide-y divide-gray-100">
            {notifications.map(n => (
              <div key={n.id} className={`flex items-start px-4 py-3 hover:bg-blue-50 transition cursor-pointer ${!n.is_read ? 'bg-blue-50' : ''}`}
                onClick={async () => { await markAsRead(n.id); onNotificationClick(n); }}>
                <div className="flex-1">
                  <div className="flex items-center justify-between">
                    <div className="font-medium text-gray-900 text-sm flex items-center">
                      {n.type === 'maintenance' && <Wrench className="w-4 h-4 mr-2 text-orange-500" />}
                      {n.type === 'inventory' && <Package className="w-4 h-4 mr-2 text-blue-500" />}
                      {n.title}
                    </div>
                    {n.priority && (
                      <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${
                        n.priority === 'urgent' ? 'bg-red-100 text-red-800' :
                        n.priority === 'high' ? 'bg-orange-100 text-orange-800' :
                        n.priority === 'medium' ? 'bg-yellow-100 text-yellow-800' :
                        'bg-blue-100 text-blue-800'
                      }`}>
                        {n.priority}
                      </span>
                    )}
                  </div>
                  <div className="text-gray-600 text-xs mt-0.5">{n.message}</div>
                  <div className="text-gray-400 text-xs mt-1">{new Date(n.created_at).toLocaleString()}</div>
                </div>
                <button className="ml-2 p-1 text-gray-400 hover:text-red-500" onClick={e => { e.stopPropagation(); dismiss(n.id); }}>
                  <X className="w-4 h-4" />
                </button>
              </div>
            ))}
          </div>
        </Menu.Items>
      </Transition>
    </Menu>
  );
} 