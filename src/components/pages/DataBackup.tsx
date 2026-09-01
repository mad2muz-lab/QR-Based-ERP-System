import React, { useRef, useState } from 'react';
import { Download, Upload, Database, CheckCircle, AlertTriangle } from 'lucide-react';

const DataBackup: React.FC = () => {
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const showMessage = (type: 'success' | 'error', text: string) => {
    setMessage({ type, text });
    setTimeout(() => setMessage(null), 4000);
  };

  const handleExport = () => {
    try {
      const backup = {
        version: '1.0',
        timestamp: new Date().toISOString(),
        data: {
          employees: JSON.parse(localStorage.getItem('employees') || '[]'),
          equipment: JSON.parse(localStorage.getItem('equipment') || '[]'),
          materials: JSON.parse(localStorage.getItem('materials') || '[]'),
          sites: JSON.parse(localStorage.getItem('sites') || '[]'),
          users: JSON.parse(localStorage.getItem('users') || '[]'),
          warehouses: JSON.parse(localStorage.getItem('registered_warehouses') || '[]'),
          company: JSON.parse(localStorage.getItem('company_details') || '{}'),
          timeLogs: JSON.parse(localStorage.getItem('time_logs') || '[]'),
          materialLogs: JSON.parse(localStorage.getItem('material_logs') || '[]'),
          activityLog: JSON.parse(localStorage.getItem('activity_log') || '[]')
        }
      };

      const blob = new Blob([JSON.stringify(backup, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `erp-backup-${new Date().toISOString().split('T')[0]}.json`;
      a.click();
      URL.revokeObjectURL(url);
      showMessage('success', 'Data exported successfully!');
    } catch (error) {
      showMessage('error', 'Failed to export data');
    }
  };

  const handleImport = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const backup = JSON.parse(event.target?.result as string);
        if (!backup.version || !backup.data) {
          showMessage('error', 'Invalid backup file format');
          return;
        }

        const { data } = backup;
        if (data.employees) localStorage.setItem('employees', JSON.stringify(data.employees));
        if (data.equipment) localStorage.setItem('equipment', JSON.stringify(data.equipment));
        if (data.materials) localStorage.setItem('materials', JSON.stringify(data.materials));
        if (data.sites) localStorage.setItem('sites', JSON.stringify(data.sites));
        if (data.users) localStorage.setItem('users', JSON.stringify(data.users));
        if (data.warehouses) localStorage.setItem('registered_warehouses', JSON.stringify(data.warehouses));
        if (data.company) localStorage.setItem('company_details', JSON.stringify(data.company));
        if (data.timeLogs) localStorage.setItem('time_logs', JSON.stringify(data.timeLogs));
        if (data.materialLogs) localStorage.setItem('material_logs', JSON.stringify(data.materialLogs));
        if (data.activityLog) localStorage.setItem('activity_log', JSON.stringify(data.activityLog));

        showMessage('success', 'Data restored successfully! Refresh the page to see changes.');
      } catch (error) {
        showMessage('error', 'Failed to restore data. Invalid file.');
      }
    };
    reader.readAsText(file);
    e.target.value = '';
  };

  return (
    <div style={{ background: 'white', borderRadius: '16px', border: '2px solid #e2e8f0', padding: '28px' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '20px' }}>
        <div style={{ width: '44px', height: '44px', borderRadius: '12px', background: '#eff6ff', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <Database style={{ width: '22px', height: '22px', color: '#2563eb' }} />
        </div>
        <div>
          <h2 style={{ fontSize: '20px', fontWeight: '700', color: '#0f172a', margin: 0 }}>Data Backup & Restore</h2>
          <p style={{ fontSize: '14px', color: '#6b7280', margin: '2px 0 0 0' }}>Export or import your application data</p>
        </div>
      </div>

      {message && (
        <div style={{ padding: '14px 18px', borderRadius: '12px', marginBottom: '20px', fontSize: '15px', fontWeight: '600', background: message.type === 'success' ? '#d1fae5' : '#fee2e2', color: message.type === 'success' ? '#065f46' : '#991b1b', border: `2px solid ${message.type === 'success' ? '#6ee7b7' : '#fca5a5'}` }}>
          {message.text}
        </div>
      )}

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
        <div style={{ padding: '24px', background: '#f8fafc', borderRadius: '12px', border: '2px solid #e2e8f0', textAlign: 'center' }}>
          <Download style={{ width: '40px', height: '40px', color: '#059669', margin: '0 auto 12px' }} />
          <h3 style={{ fontSize: '18px', fontWeight: '700', color: '#0f172a', margin: '0 0 8px 0' }}>Export Data</h3>
          <p style={{ fontSize: '14px', color: '#6b7280', margin: '0 0 16px 0' }}>Download all application data as a JSON backup file</p>
          <button onClick={handleExport} style={{ padding: '12px 24px', background: '#059669', color: 'white', border: 'none', borderRadius: '10px', fontWeight: '700', fontSize: '15px', cursor: 'pointer' }}>
            <Download style={{ width: '18px', height: '18px', display: 'inline', verticalAlign: 'middle', marginRight: '8px' }} /> Export Backup
          </button>
        </div>
        <div style={{ padding: '24px', background: '#f8fafc', borderRadius: '12px', border: '2px solid #e2e8f0', textAlign: 'center' }}>
          <Upload style={{ width: '40px', height: '40px', color: '#2563eb', margin: '0 auto 12px' }} />
          <h3 style={{ fontSize: '18px', fontWeight: '700', color: '#0f172a', margin: '0 0 8px 0' }}>Restore Data</h3>
          <p style={{ fontSize: '14px', color: '#6b7280', margin: '0 0 16px 0' }}>Import data from a previously exported backup file</p>
          <input ref={fileInputRef} type="file" accept=".json" onChange={handleImport} style={{ display: 'none' }} />
          <button onClick={() => fileInputRef.current?.click()} style={{ padding: '12px 24px', background: '#2563eb', color: 'white', border: 'none', borderRadius: '10px', fontWeight: '700', fontSize: '15px', cursor: 'pointer' }}>
            <Upload style={{ width: '18px', height: '18px', display: 'inline', verticalAlign: 'middle', marginRight: '8px' }} /> Restore Backup
          </button>
        </div>
      </div>

      <div style={{ marginTop: '20px', padding: '16px', background: '#fffbeb', borderRadius: '12px', border: '2px solid #fde68a', display: 'flex', alignItems: 'flex-start', gap: '12px' }}>
        <AlertTriangle style={{ width: '20px', height: '20px', color: '#d97706', flexShrink: 0, marginTop: '2px' }} />
        <div>
          <p style={{ fontSize: '14px', fontWeight: '600', color: '#92400e', margin: '0 0 4px 0' }}>Important</p>
          <p style={{ fontSize: '14px', color: '#92400e', margin: 0 }}>Restoring data will overwrite all existing data. Make sure to export a backup first before restoring.</p>
        </div>
      </div>
    </div>
  );
};

export default DataBackup;
