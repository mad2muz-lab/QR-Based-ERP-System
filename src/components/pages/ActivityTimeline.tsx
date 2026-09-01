import React, { useState, useEffect } from 'react';
import { Activity, User, Package, Wrench, Clock, CheckCircle, AlertCircle, ArrowLeftRight, Building, Settings } from 'lucide-react';

interface ActivityItem {
  id: string;
  type: string;
  action: string;
  entity: string;
  details: string;
  timestamp: string;
  user?: string;
}

const ActivityTimeline: React.FC = () => {
  const [activities, setActivities] = useState<ActivityItem[]>([]);
  const [filter, setFilter] = useState<'all' | 'scan' | 'inventory' | 'registration'>('all');

  useEffect(() => {
    const stored = localStorage.getItem('activity_log');
    if (stored) {
      try {
        const parsed = JSON.parse(stored);
        setActivities(parsed.reverse());
      } catch {
        setActivities([]);
      }
    }
  }, []);

  const getIcon = (type: string) => {
    switch (type) {
      case 'scan': return <CheckCircle style={{ width: '18px', height: '18px' }} />;
      case 'inventory': return <Package style={{ width: '18px', height: '18px' }} />;
      case 'registration': return <User style={{ width: '18px', height: '18px' }} />;
      case 'transfer': return <ArrowLeftRight style={{ width: '18px', height: '18px' }} />;
      case 'warehouse': return <Building style={{ width: '18px', height: '18px' }} />;
      default: return <Activity style={{ width: '18px', height: '18px' }} />;
    }
  };

  const getIconColor = (type: string) => {
    switch (type) {
      case 'scan': return { bg: '#ecfdf5', color: '#059669' };
      case 'inventory': return { bg: '#fff7ed', color: '#ea580c' };
      case 'registration': return { bg: '#eff6ff', color: '#2563eb' };
      case 'transfer': return { bg: '#f5f3ff', color: '#7c3aed' };
      case 'warehouse': return { bg: '#fdf2f8', color: '#db2777' };
      default: return { bg: '#f1f5f9', color: '#475569' };
    }
  };

  const formatTime = (timestamp: string) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const mins = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);
    const days = Math.floor(diff / 86400000);

    if (mins < 1) return 'Just now';
    if (mins < 60) return `${mins}m ago`;
    if (hours < 24) return `${hours}h ago`;
    if (days < 7) return `${days}d ago`;
    return date.toLocaleDateString();
  };

  const filteredActivities = filter === 'all' ? activities : activities.filter(a => a.type === filter);

  return (
    <div style={{ background: 'white', borderRadius: '16px', border: '2px solid #e2e8f0', overflow: 'hidden' }}>
      <div style={{ padding: '20px 24px', borderBottom: '2px solid #e2e8f0', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '12px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <Activity style={{ width: '22px', height: '22px', color: '#002e17' }} />
          <h3 style={{ fontSize: '18px', fontWeight: '700', color: '#0f172a', margin: 0 }}>Activity Timeline</h3>
        </div>
        <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
          {(['all', 'scan', 'inventory', 'registration'] as const).map(f => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              style={{
                padding: '8px 16px',
                borderRadius: '8px',
                border: 'none',
                background: filter === f ? '#002e17' : '#f1f5f9',
                color: filter === f ? 'white' : '#475569',
                fontWeight: '600',
                fontSize: '14px',
                cursor: 'pointer',
                textTransform: 'capitalize'
              }}
            >
              {f}
            </button>
          ))}
        </div>
      </div>

      <div style={{ maxHeight: '500px', overflowY: 'auto' }}>
        {filteredActivities.length === 0 ? (
          <div style={{ padding: '40px', textAlign: 'center' }}>
            <Clock style={{ width: '40px', height: '40px', color: '#cbd5e1', margin: '0 auto 12px' }} />
            <p style={{ fontSize: '16px', color: '#64748b', fontWeight: '600' }}>No activity yet</p>
            <p style={{ fontSize: '14px', color: '#94a3b8' }}>Actions will appear here as you use the app</p>
          </div>
        ) : (
          <div style={{ padding: '16px' }}>
            {filteredActivities.slice(0, 50).map((activity, index) => {
              const colors = getIconColor(activity.type);
              return (
                <div key={activity.id} style={{ display: 'flex', gap: '16px', padding: '12px 0', borderBottom: index < filteredActivities.length - 1 ? '1px solid #f1f5f9' : 'none' }}>
                  <div style={{ width: '40px', height: '40px', borderRadius: '10px', background: colors.bg, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                    <div style={{ color: colors.color }}>{getIcon(activity.type)}</div>
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '8px' }}>
                      <span style={{ fontSize: '15px', fontWeight: '600', color: '#0f172a' }}>{activity.action}</span>
                      <span style={{ fontSize: '13px', color: '#94a3b8', flexShrink: 0 }}>{formatTime(activity.timestamp)}</span>
                    </div>
                    <p style={{ fontSize: '14px', color: '#475569', margin: '2px 0 0 0', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{activity.details}</p>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};

export const logActivity = (type: string, action: string, entity: string, details: string) => {
  const activity = {
    id: `act-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
    type,
    action,
    entity,
    details,
    timestamp: new Date().toISOString()
  };

  const stored = localStorage.getItem('activity_log');
  const activities = stored ? JSON.parse(stored) : [];
  activities.push(activity);
  if (activities.length > 200) activities.splice(0, activities.length - 200);
  localStorage.setItem('activity_log', JSON.stringify(activities));
};

export default ActivityTimeline;
