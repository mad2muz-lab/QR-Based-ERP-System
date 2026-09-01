import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, Eye, Trash2, FileText, Search, AlertCircle } from 'lucide-react';
import { ProformaInvoice, getProformas, deleteProforma, saveProforma } from '../../../utils/proformaService';

const ProformaList: React.FC = () => {
  const navigate = useNavigate();
  const [proformas, setProformas] = useState<ProformaInvoice[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');

  useEffect(() => {
    setProformas(getProformas());
  }, []);

  const filtered = proformas.filter(p => {
    const matchesSearch = p.customerName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.proformaNumber.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = statusFilter === 'all' || p.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'draft': return { bg: '#f1f5f9', color: '#475569' };
      case 'sent': return { bg: '#eff6ff', color: '#2563eb' };
      case 'accepted': return { bg: '#ecfdf5', color: '#059669' };
      case 'rejected': return { bg: '#fef2f2', color: '#dc2626' };
      case 'converted': return { bg: '#f5f3ff', color: '#7c3aed' };
      case 'cancelled': return { bg: '#fff7ed', color: '#ea580c' };
      default: return { bg: '#f1f5f9', color: '#475569' };
    }
  };

  const handleDelete = (id: string) => {
    if (confirm('Are you sure you want to delete this proforma?')) {
      deleteProforma(id);
      setProformas(getProformas());
    }
  };

  const handleStatusChange = (id: string, newStatus: ProformaInvoice['status']) => {
    const proforma = proformas.find(p => p.id === id);
    if (proforma) {
      saveProforma({ ...proforma, status: newStatus });
      setProformas(getProformas());
    }
  };

  return (
    <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '32px', background: 'white', borderRadius: '16px', border: '2px solid #e2e8f0', overflow: 'hidden' }}>
      <div style={{ padding: '20px 24px', borderBottom: '2px solid #e2e8f0', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '12px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <FileText style={{ width: '22px', height: '22px', color: '#002e17' }} />
          <h3 style={{ fontSize: '18px', fontWeight: '700', color: '#0f172a', margin: 0 }}>Proforma Invoices ({proformas.length})</h3>
        </div>
        <button onClick={() => navigate('/inventory/proforma/new')} style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '10px 20px', background: '#002e17', color: 'white', border: 'none', borderRadius: '10px', fontWeight: '700', fontSize: '15px', cursor: 'pointer' }}>
          <Plus style={{ width: '18px', height: '18px' }} /> New Proforma
        </button>
      </div>

      <div style={{ padding: '16px 24px', display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
        <div style={{ flex: 1, minWidth: '200px', position: 'relative' }}>
          <Search style={{ position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)', width: '18px', height: '18px', color: '#9ca3af' }} />
          <input type="text" value={searchQuery} onChange={e => setSearchQuery(e.target.value)} placeholder="Search by customer or number..." style={{ width: '100%', padding: '12px 16px 12px 44px', border: '2px solid #d1d5db', borderRadius: '10px', fontSize: '15px', outline: 'none', boxSizing: 'border-box' }} />
        </div>
        <select value={statusFilter} onChange={e => setStatusFilter(e.target.value)} style={{ padding: '12px 16px', border: '2px solid #d1d5db', borderRadius: '10px', fontSize: '15px', outline: 'none', background: 'white' }}>
          <option value="all">All Status</option>
          <option value="draft">Draft</option>
          <option value="sent">Sent</option>
          <option value="accepted">Accepted</option>
          <option value="rejected">Rejected</option>
          <option value="converted">Converted</option>
        </select>
      </div>

      <div style={{ maxHeight: '600px', overflowY: 'auto' }}>
        {filtered.length === 0 ? (
          <div style={{ padding: '40px', textAlign: 'center' }}>
            <AlertCircle style={{ width: '40px', height: '40px', color: '#cbd5e1', margin: '0 auto 12px' }} />
            <p style={{ fontSize: '16px', color: '#64748b', fontWeight: '600' }}>No proforma invoices found</p>
            <p style={{ fontSize: '14px', color: '#94a3b8' }}>Create your first proforma invoice</p>
          </div>
        ) : (
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ borderBottom: '2px solid #e2e8f0' }}>
                <th style={{ padding: '14px 16px', textAlign: 'left', fontSize: '13px', fontWeight: '700', color: '#475569', textTransform: 'uppercase' }}>Number</th>
                <th style={{ padding: '14px 16px', textAlign: 'left', fontSize: '13px', fontWeight: '700', color: '#475569', textTransform: 'uppercase' }}>Customer</th>
                <th style={{ padding: '14px 16px', textAlign: 'left', fontSize: '13px', fontWeight: '700', color: '#475569', textTransform: 'uppercase' }}>Date</th>
                <th style={{ padding: '14px 16px', textAlign: 'right', fontSize: '13px', fontWeight: '700', color: '#475569', textTransform: 'uppercase' }}>Amount</th>
                <th style={{ padding: '14px 16px', textAlign: 'center', fontSize: '13px', fontWeight: '700', color: '#475569', textTransform: 'uppercase' }}>Status</th>
                <th style={{ padding: '14px 16px', textAlign: 'center', fontSize: '13px', fontWeight: '700', color: '#475569', textTransform: 'uppercase' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map(p => {
                const statusColor = getStatusColor(p.status);
                return (
                  <tr key={p.id} style={{ borderBottom: '1px solid #f1f5f9' }}>
                    <td style={{ padding: '14px 16px', fontSize: '14px', fontWeight: '600', color: '#0f172a' }}>{p.proformaNumber}</td>
                    <td style={{ padding: '14px 16px', fontSize: '14px', color: '#475569' }}>{p.customerName}</td>
                    <td style={{ padding: '14px 16px', fontSize: '14px', color: '#6b7280' }}>{p.issueDate}</td>
                    <td style={{ padding: '14px 16px', fontSize: '14px', fontWeight: '700', color: '#0f172a', textAlign: 'right' }}>SAR {p.grandTotal.toFixed(2)}</td>
                    <td style={{ padding: '14px 16px', textAlign: 'center' }}>
                      <select value={p.status} onChange={e => handleStatusChange(p.id, e.target.value as any)} style={{ padding: '6px 12px', borderRadius: '20px', border: 'none', fontSize: '13px', fontWeight: '700', background: statusColor.bg, color: statusColor.color, cursor: 'pointer' }}>
                        <option value="draft">Draft</option>
                        <option value="sent">Sent</option>
                        <option value="accepted">Accepted</option>
                        <option value="rejected">Rejected</option>
                        <option value="converted">Converted</option>
                        <option value="cancelled">Cancelled</option>
                      </select>
                    </td>
                    <td style={{ padding: '14px 16px', textAlign: 'center' }}>
                      <div style={{ display: 'flex', gap: '8px', justifyContent: 'center' }}>
                        <button onClick={() => navigate(`/inventory/proforma/${p.id}`)} style={{ padding: '8px', background: '#eff6ff', color: '#2563eb', border: 'none', borderRadius: '6px', cursor: 'pointer' }}>
                          <Eye style={{ width: '16px', height: '16px' }} />
                        </button>
                        <button onClick={() => handleDelete(p.id)} style={{ padding: '8px', background: '#fef2f2', color: '#dc2626', border: 'none', borderRadius: '6px', cursor: 'pointer' }}>
                          <Trash2 style={{ width: '16px', height: '16px' }} />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
};

export default ProformaList;
