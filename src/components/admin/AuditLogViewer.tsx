import React, { useEffect, useState } from 'react';
import { supabase } from '../../utils/supabaseClient';
import dayjs from 'dayjs';

interface AuditLogEntry {
  id: string;
  user_id: string;
  action: string;
  entity_type: string;
  entity_id: string;
  details: any;
  created_at: string;
}

interface UserMap {
  [userId: string]: string; // userId -> userName
}

function exportToCSV(logs: AuditLogEntry[], userMap: UserMap) {
  const headers = ['Date', 'User', 'Action', 'Entity Type', 'Entity ID', 'Details'];
  const rows = logs.map(log => [
    new Date(log.created_at).toLocaleString(),
    userMap[log.user_id] || log.user_id,
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
  a.download = 'audit_log.csv';
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

function exportToJSON(logs: AuditLogEntry[], userMap: UserMap) {
  const data = logs.map(log => ({
    date: new Date(log.created_at).toLocaleString(),
    user: userMap[log.user_id] || log.user_id,
    action: log.action,
    entity_type: log.entity_type,
    entity_id: log.entity_id,
    details: log.details
  }));
  const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = 'audit_log.json';
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

const PAGE_SIZE = 100;

const AuditLogViewer: React.FC = () => {
  const [logs, setLogs] = useState<AuditLogEntry[]>([]);
  const [userMap, setUserMap] = useState<UserMap>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(0);
  const [hasNext, setHasNext] = useState(false);
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [actionFilter, setActionFilter] = useState('');
  const [userFilter, setUserFilter] = useState('');

  useEffect(() => {
    const fetchLogs = async () => {
      setLoading(true);
      setError('');
      try {
        const { data, error } = await supabase
          .from('audit_log')
          .select('*')
          .order('created_at', { ascending: false })
          .range(page * PAGE_SIZE, (page + 1) * PAGE_SIZE - 1);
        if (error) throw error;
        setLogs(data || []);
        // Check if there are more entries for next page
        const { count } = await supabase
          .from('audit_log')
          .select('*', { count: 'exact', head: true });
        setHasNext(((page + 1) * PAGE_SIZE) < (count || 0));
        // Fetch user names for all unique user_ids
        const userIds = Array.from(new Set((data || []).map((l: any) => l.user_id).filter(Boolean)));
        if (userIds.length > 0) {
          const { data: users } = await supabase
            .from('users')
            .select('id, name')
            .in('id', userIds);
          const map: UserMap = {};
          (users || []).forEach((u: any) => { map[u.id] = u.name; });
          setUserMap(map);
        }
      } catch (e: any) {
        setError('Failed to load audit log');
      } finally {
        setLoading(false);
      }
    };
    fetchLogs();
  }, [page]);

  const uniqueActions = Array.from(new Set(logs.map(l => l.action))).sort();
  const uniqueUsers = Array.from(new Set(logs.map(l => l.user_id))).sort();

  const filteredLogs = logs.filter(log => {
    const userName = userMap[log.user_id] || log.user_id;
    const logDate = dayjs(log.created_at);
    return (
      (!startDate || logDate.isAfter(dayjs(startDate).subtract(1, 'day')))
      && (!endDate || logDate.isBefore(dayjs(endDate).add(1, 'day')))
      && (!actionFilter || log.action === actionFilter)
      && (!userFilter || log.user_id === userFilter)
      && (
        userName.toLowerCase().includes(search.toLowerCase()) ||
        log.action.toLowerCase().includes(search.toLowerCase()) ||
        log.entity_type.toLowerCase().includes(search.toLowerCase())
      )
    );
  });

  return (
    <div className="p-6">
      <h2 className="text-2xl font-bold mb-4">Audit Log</h2>
      <div className="flex flex-wrap items-center gap-2 mb-4">
        <input
          type="text"
          placeholder="Search by user, action, or entity..."
          className="border p-2 rounded w-full max-w-md mr-2"
          value={search}
          onChange={e => setSearch(e.target.value)}
        />
        <input
          type="date"
          className="border p-2 rounded"
          value={startDate}
          onChange={e => setStartDate(e.target.value)}
        />
        <input
          type="date"
          className="border p-2 rounded"
          value={endDate}
          onChange={e => setEndDate(e.target.value)}
        />
        <select
          className="border p-2 rounded"
          value={actionFilter}
          onChange={e => setActionFilter(e.target.value)}
        >
          <option value="">All Actions</option>
          {uniqueActions.map(action => (
            <option key={action} value={action}>{action}</option>
          ))}
        </select>
        <select
          className="border p-2 rounded"
          value={userFilter}
          onChange={e => setUserFilter(e.target.value)}
        >
          <option value="">All Users</option>
          {uniqueUsers.map(uid => (
            <option key={uid} value={uid}>{userMap[uid] || uid}</option>
          ))}
        </select>
        <button
          className="bg-blue-600 text-white px-4 py-2 rounded mr-2"
          onClick={() => exportToCSV(filteredLogs, userMap)}
          disabled={filteredLogs.length === 0}
        >
          Export CSV
        </button>
        <button
          className="bg-green-600 text-white px-4 py-2 rounded"
          onClick={() => exportToJSON(filteredLogs, userMap)}
          disabled={filteredLogs.length === 0}
        >
          Export JSON
        </button>
      </div>
      <div className="flex items-center justify-between mb-2">
        <button
          className="bg-gray-200 px-3 py-1 rounded mr-2"
          onClick={() => setPage(p => Math.max(0, p - 1))}
          disabled={page === 0 || loading}
        >
          Previous
        </button>
        <span>Page {page + 1}</span>
        <button
          className="bg-gray-200 px-3 py-1 rounded ml-2"
          onClick={() => setPage(p => p + 1)}
          disabled={!hasNext || loading}
        >
          Next
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
              <th className="p-2 border">User</th>
              <th className="p-2 border">Action</th>
              <th className="p-2 border">Entity Type</th>
              <th className="p-2 border">Entity ID</th>
              <th className="p-2 border">Details</th>
            </tr>
          </thead>
          <tbody>
            {filteredLogs.map(log => (
              <tr key={log.id}>
                <td className="p-2 border whitespace-nowrap">{new Date(log.created_at).toLocaleString()}</td>
                <td className="p-2 border">{userMap[log.user_id] || log.user_id}</td>
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
  );
};

export default AuditLogViewer; 