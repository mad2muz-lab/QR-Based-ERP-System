import React, { useEffect, useState } from 'react';
import { supabase } from '../../utils/supabaseClient';

interface UserAuditLogModalProps {
  userId: string;
  userName: string;
  open: boolean;
  onClose: () => void;
}

interface AuditLogEntry {
  id: string;
  action: string;
  entity_type: string;
  entity_id: string;
  details: any;
  created_at: string;
}

function exportToCSV(logs: AuditLogEntry[], userName: string) {
  const headers = ['Date', 'User', 'Action', 'Entity Type', 'Entity ID', 'Details'];
  const rows = logs.map(log => [
    new Date(log.created_at).toLocaleString(),
    userName,
    log.action,
    log.entity_type,
    log.entity_id,
    log.details ? JSON.stringify(log.details) : ''
  ]);
  const csvContent = [headers, ...rows]
    .map(row => row.map(field => '"' + String(field).replace(/"/g, '""') + '"').join(','))
    .join('\n');
  const blob = new Blob([csvContent], { type: 'text/csv' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `audit_log_${userName}.csv`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

function exportToJSON(logs: AuditLogEntry[], userName: string) {
  const data = logs.map(log => ({
    date: new Date(log.created_at).toLocaleString(),
    user: userName,
    action: log.action,
    entity_type: log.entity_type,
    entity_id: log.entity_id,
    details: log.details
  }));
  const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `audit_log_${userName}.json`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

const UserAuditLogModal: React.FC<UserAuditLogModalProps> = ({ userId, userName, open, onClose }) => {
  const [logs, setLogs] = useState<AuditLogEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!open) return;
    const fetchLogs = async () => {
      setLoading(true);
      setError('');
      try {
        const { data, error } = await supabase
          .from('audit_log')
          .select('*')
          .eq('user_id', userId)
          .order('created_at', { ascending: false })
          .limit(50);
        if (error) throw error;
        setLogs(data || []);
      } catch (e: any) {
        setError('Failed to load audit log');
      } finally {
        setLoading(false);
      }
    };
    fetchLogs();
  }, [userId, open]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-30 z-50">
      <div className="bg-white rounded shadow-lg p-6 max-w-2xl w-full relative">
        <button className="absolute top-2 right-2 text-gray-500 hover:text-gray-800" onClick={onClose}>✕</button>
        <h3 className="text-xl font-bold mb-4">Audit Log for {userName}</h3>
        <div className="flex items-center mb-4 gap-2">
          <button
            className="bg-blue-600 text-white px-4 py-2 rounded"
            onClick={() => exportToCSV(logs, userName)}
            disabled={logs.length === 0}
          >
            Export CSV
          </button>
          <button
            className="bg-green-600 text-white px-4 py-2 rounded"
            onClick={() => exportToJSON(logs, userName)}
            disabled={logs.length === 0}
          >
            Export JSON
          </button>
        </div>
        {error && <div className="text-red-600 mb-2">{error}</div>}
        {loading ? (
          <div>Loading...</div>
        ) : (
          <table className="min-w-full border border-gray-200 text-xs">
            <thead>
              <tr className="bg-gray-100">
                <th className="p-2 border">Date</th>
                <th className="p-2 border">Action</th>
                <th className="p-2 border">Entity Type</th>
                <th className="p-2 border">Entity ID</th>
                <th className="p-2 border">Details</th>
              </tr>
            </thead>
            <tbody>
              {logs.map(log => (
                <tr key={log.id}>
                  <td className="p-2 border whitespace-nowrap">{new Date(log.created_at).toLocaleString()}</td>
                  <td className="p-2 border">{log.action}</td>
                  <td className="p-2 border">{log.entity_type}</td>
                  <td className="p-2 border">{log.entity_id}</td>
                  <td className="p-2 border max-w-xs overflow-x-auto">
                    <pre className="whitespace-pre-wrap break-all">{log.details ? JSON.stringify(log.details, null, 2) : ''}</pre>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
};

export default UserAuditLogModal; 