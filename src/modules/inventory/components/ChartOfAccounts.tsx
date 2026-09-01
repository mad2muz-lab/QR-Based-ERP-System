import React, { useState, useEffect } from 'react';
import { Plus, Edit, Trash2, Search, DollarSign } from 'lucide-react';
import { ChartOfAccount, getChartOfAccounts } from '../../../utils/erpInvoiceService';

const ChartOfAccounts: React.FC = () => {
  const [accounts, setAccounts] = useState<ChartOfAccount[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<ChartOfAccount | null>(null);
  const [formData, setFormData] = useState({ code: '', name: '', type: 'asset' as ChartOfAccount['type'], nameArabic: '' });

  useEffect(() => { setAccounts(getChartOfAccounts()); }, []);

  const typeColor = (type: string) => {
    switch (type) {
      case 'asset': return { bg: '#ecfdf5', color: '#059669' };
      case 'liability': return { bg: '#fef2f2', color: '#dc2626' };
      case 'equity': return { bg: '#f5f3ff', color: '#7c3aed' };
      case 'revenue': return { bg: '#eff6ff', color: '#2563eb' };
      case 'expense': return { bg: '#fff7ed', color: '#ea580c' };
      default: return { bg: '#f1f5f9', color: '#475569' };
    }
  };

  const handleSave = () => {
    if (!formData.code || !formData.name) { alert('Code and name required'); return; }
    const newAccount: ChartOfAccount = {
      id: editing?.id || `acc-${Date.now()}`,
      code: formData.code,
      name: formData.name,
      nameArabic: formData.nameArabic,
      type: formData.type,
      isActive: true,
      createdAt: editing?.createdAt || new Date().toISOString()
    };
    const updated = editing ? accounts.map(a => a.id === editing.id ? newAccount : a) : [...accounts, newAccount];
    localStorage.setItem('erp_chart_of_accounts', JSON.stringify(updated));
    setAccounts(updated);
    setShowForm(false);
    setEditing(null);
    setFormData({ code: '', name: '', type: 'asset', nameArabic: '' });
  };

  const handleEdit = (acc: ChartOfAccount) => {
    setEditing(acc);
    setFormData({ code: acc.code, name: acc.name, type: acc.type, nameArabic: acc.nameArabic || '' });
    setShowForm(true);
  };

  const handleDelete = (id: string) => {
    if (confirm('Delete this account?')) {
      const updated = accounts.filter(a => a.id !== id);
      localStorage.setItem('erp_chart_of_accounts', JSON.stringify(updated));
      setAccounts(updated);
    }
  };

  return (
    <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '32px', background: 'white', borderRadius: '16px', border: '2px solid #e2e8f0', overflow: 'hidden' }}>
      <div style={{ padding: '20px 24px', borderBottom: '2px solid #e2e8f0', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}><DollarSign style={{ width: '22px', height: '22px', color: '#002e17' }} /><h3 style={{ fontSize: '18px', fontWeight: '700', color: '#0f172a', margin: 0 }}>Chart of Accounts</h3></div>
        <button onClick={() => { setShowForm(true); setEditing(null); setFormData({ code: '', name: '', type: 'asset', nameArabic: '' }); }} style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '10px 20px', background: '#002e17', color: 'white', border: 'none', borderRadius: '10px', fontWeight: '700', fontSize: '15px', cursor: 'pointer' }}><Plus style={{ width: '18px', height: '18px' }} /> Add Account</button>
      </div>

      {showForm && (
        <div style={{ padding: '20px 24px', background: '#f8fafc', borderBottom: '2px solid #e2e8f0' }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr 1fr auto', gap: '12px', alignItems: 'end' }}>
            <div><label style={{ fontSize: '13px', fontWeight: '600', color: '#374151' }}>Code</label><input type="text" value={formData.code} onChange={e => setFormData({ ...formData, code: e.target.value })} placeholder="1000" style={{ width: '100%', padding: '10px', border: '2px solid #d1d5db', borderRadius: '8px', fontSize: '14px' }} /></div>
            <div><label style={{ fontSize: '13px', fontWeight: '600', color: '#374151' }}>Name</label><input type="text" value={formData.name} onChange={e => setFormData({ ...formData, name: e.target.value })} placeholder="Account name" style={{ width: '100%', padding: '10px', border: '2px solid #d1d5db', borderRadius: '8px', fontSize: '14px' }} /></div>
            <div><label style={{ fontSize: '13px', fontWeight: '600', color: '#374151' }}>Arabic Name</label><input type="text" value={formData.nameArabic} onChange={e => setFormData({ ...formData, nameArabic: e.target.value })} placeholder="اسم الحساب" style={{ width: '100%', padding: '10px', border: '2px solid #d1d5db', borderRadius: '8px', fontSize: '14px' }} /></div>
            <div><label style={{ fontSize: '13px', fontWeight: '600', color: '#374151' }}>Type</label><select value={formData.type} onChange={e => setFormData({ ...formData, type: e.target.value as any })} style={{ width: '100%', padding: '10px', border: '2px solid #d1d5db', borderRadius: '8px', fontSize: '14px' }}><option value="asset">Asset</option><option value="liability">Liability</option><option value="equity">Equity</option><option value="revenue">Revenue</option><option value="expense">Expense</option></select></div>
            <div style={{ display: 'flex', gap: '8px' }}>
              <button onClick={handleSave} style={{ padding: '10px 20px', background: '#059669', color: 'white', border: 'none', borderRadius: '8px', fontWeight: '600', cursor: 'pointer' }}>Save</button>
              <button onClick={() => { setShowForm(false); setEditing(null); }} style={{ padding: '10px 20px', background: '#f1f5f9', color: '#475569', border: 'none', borderRadius: '8px', fontWeight: '600', cursor: 'pointer' }}>Cancel</button>
            </div>
          </div>
        </div>
      )}

      <div style={{ maxHeight: '500px', overflowY: 'auto' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead><tr style={{ borderBottom: '2px solid #e2e8f0' }}><th style={{ padding: '14px 16px', textAlign: 'left', fontSize: '13px', fontWeight: '700', color: '#475569' }}>Code</th><th style={{ padding: '14px 16px', textAlign: 'left', fontSize: '13px', fontWeight: '700', color: '#475569' }}>Name</th><th style={{ padding: '14px 16px', textAlign: 'left', fontSize: '13px', fontWeight: '700', color: '#475569' }}>Name (AR)</th><th style={{ padding: '14px 16px', textAlign: 'center', fontSize: '13px', fontWeight: '700', color: '#475569' }}>Type</th><th style={{ padding: '14px 16px', textAlign: 'center', fontSize: '13px', fontWeight: '700', color: '#475569' }}>Actions</th></tr></thead>
          <tbody>
            {accounts.map(acc => {
              const tc = typeColor(acc.type);
              return (
                <tr key={acc.id} style={{ borderBottom: '1px solid #f1f5f9' }}>
                  <td style={{ padding: '14px 16px', fontSize: '14px', fontWeight: '600', color: '#0f172a' }}>{acc.code}</td>
                  <td style={{ padding: '14px 16px', fontSize: '14px', color: '#475569' }}>{acc.name}</td>
                  <td style={{ padding: '14px 16px', fontSize: '14px', color: '#6b7280', direction: 'rtl' }}>{acc.nameArabic || '-'}</td>
                  <td style={{ padding: '14px 16px', textAlign: 'center' }}><span style={{ padding: '4px 12px', borderRadius: '20px', fontSize: '12px', fontWeight: '700', background: tc.bg, color: tc.color }}>{acc.type}</span></td>
                  <td style={{ padding: '14px 16px', textAlign: 'center' }}>
                    <div style={{ display: 'flex', gap: '6px', justifyContent: 'center' }}>
                      <button onClick={() => handleEdit(acc)} style={{ padding: '6px', background: '#eff6ff', color: '#2563eb', border: 'none', borderRadius: '6px', cursor: 'pointer' }}><Edit style={{ width: '14px', height: '14px' }} /></button>
                      <button onClick={() => handleDelete(acc.id)} style={{ padding: '6px', background: '#fef2f2', color: '#dc2626', border: 'none', borderRadius: '6px', cursor: 'pointer' }}><Trash2 style={{ width: '14px', height: '14px' }} /></button>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
       </div>
    </div>
  );
};

export default ChartOfAccounts;
