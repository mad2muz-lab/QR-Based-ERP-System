import React, { useState, useEffect } from 'react';
import { Search, Filter } from 'lucide-react';
import { JournalEntry, getJournalEntries } from '../../../utils/erpInvoiceService';

const GeneralLedger: React.FC = () => {
  const [entries, setEntries] = useState<JournalEntry[]>([]);
  const [search, setSearch] = useState('');
  const [dateFilter, setDateFilter] = useState('all');

  useEffect(() => {
    const stored = getJournalEntries();
    setEntries(stored.reverse());
  }, []);

  const filtered = entries.filter(e => {
    const matchSearch = (e.description || '').toLowerCase().includes(search.toLowerCase()) || (e.reference || '').toLowerCase().includes(search.toLowerCase());
    if (dateFilter === 'all') return matchSearch;
    const entryDate = new Date(e.date);
    const now = new Date();
    if (dateFilter === 'today') return matchSearch && entryDate.toDateString() === now.toDateString();
    if (dateFilter === 'week') { const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000); return matchSearch && entryDate >= weekAgo; }
    if (dateFilter === 'month') { const monthAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000); return matchSearch && entryDate >= monthAgo; }
    return matchSearch;
  });

  const totalDebits = filtered.reduce((sum, e) => sum + e.amount, 0);
  const totalCredits = filtered.reduce((sum, e) => sum + e.amount, 0);

  return (
    <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '32px', background: 'white', borderRadius: '16px', border: '2px solid #e2e8f0', overflow: 'hidden' }}>
      <div style={{ padding: '20px 24px', borderBottom: '2px solid #e2e8f0', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '12px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}><Filter style={{ width: '22px', height: '22px', color: '#002e17' }} /><h3 style={{ fontSize: '18px', fontWeight: '700', color: '#0f172a', margin: 0 }}>General Ledger</h3></div>
        <div style={{ display: 'flex', gap: '16px', fontSize: '14px' }}>
          <span style={{ color: '#059669', fontWeight: '600' }}>Total Debits: SAR {totalDebits.toFixed(2)}</span>
          <span style={{ color: '#dc2626', fontWeight: '600' }}>Total Credits: SAR {totalCredits.toFixed(2)}</span>
        </div>
      </div>

      <div style={{ padding: '16px 24px', display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
        <div style={{ flex: 1, minWidth: '200px', position: 'relative' }}>
          <Search style={{ position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)', width: '18px', height: '18px', color: '#9ca3af' }} />
          <input type="text" value={search} onChange={e => setSearch(e.target.value)} placeholder="Search entries..." style={{ width: '100%', padding: '12px 16px 12px 44px', border: '2px solid #d1d5db', borderRadius: '10px', fontSize: '15px', outline: 'none', boxSizing: 'border-box' }} />
        </div>
        <select value={dateFilter} onChange={e => setDateFilter(e.target.value)} style={{ padding: '12px 16px', border: '2px solid #d1d5db', borderRadius: '10px', fontSize: '15px', background: 'white' }}>
          <option value="all">All Time</option><option value="today">Today</option><option value="week">This Week</option><option value="month">This Month</option>
        </select>
      </div>

      <div style={{ maxHeight: '500px', overflowY: 'auto' }}>
        {filtered.length === 0 ? (
          <div style={{ padding: '40px', textAlign: 'center' }}><Filter style={{ width: '40px', height: '40px', color: '#cbd5e1', margin: '0 auto 12px' }} /><p style={{ fontSize: '16px', color: '#64748b' }}>No journal entries found</p></div>
        ) : (
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead><tr style={{ borderBottom: '2px solid #e2e8f0' }}><th style={{ padding: '14px 16px', textAlign: 'left', fontSize: '13px', fontWeight: '700', color: '#475569' }}>Date</th><th style={{ padding: '14px 16px', textAlign: 'left', fontSize: '13px', fontWeight: '700', color: '#475569' }}>Entry #</th><th style={{ padding: '14px 16px', textAlign: 'left', fontSize: '13px', fontWeight: '700', color: '#475569' }}>Description</th><th style={{ padding: '14px 16px', textAlign: 'left', fontSize: '13px', fontWeight: '700', color: '#475569' }}>Reference</th><th style={{ padding: '14px 16px', textAlign: 'right', fontSize: '13px', fontWeight: '700', color: '#059669' }}>Debit</th><th style={{ padding: '14px 16px', textAlign: 'right', fontSize: '13px', fontWeight: '700', color: '#dc2626' }}>Credit</th></tr></thead>
            <tbody>
              {filtered.map(entry => (
                <tr key={entry.id} style={{ borderBottom: '1px solid #f1f5f9' }}>
                  <td style={{ padding: '14px 16px', fontSize: '14px', color: '#6b7280' }}>{entry.date}</td>
                  <td style={{ padding: '14px 16px', fontSize: '14px', fontWeight: '600', color: '#0f172a' }}>{entry.entryNumber}</td>
                  <td style={{ padding: '14px 16px', fontSize: '14px', color: '#475569' }}>{entry.description}</td>
                  <td style={{ padding: '14px 16px', fontSize: '14px', color: '#6b7280' }}>{entry.reference || '-'}</td>
                  <td style={{ padding: '14px 16px', fontSize: '14px', fontWeight: '700', color: '#059669', textAlign: 'right' }}>SAR {entry.amount.toFixed(2)}</td>
                  <td style={{ padding: '14px 16px', fontSize: '14px', fontWeight: '700', color: '#dc2626', textAlign: 'right' }}>SAR {entry.amount.toFixed(2)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
};

export default GeneralLedger;
