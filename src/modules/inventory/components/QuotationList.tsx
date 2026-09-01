import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, Eye, Trash2, CheckCircle, FileText, Search } from 'lucide-react';
import { Quotation, getQuotations, deleteQuotation, createInvoiceFromQuotation, updateQuotation } from '../../../utils/erpInvoiceService';

const QuotationList: React.FC = () => {
  const navigate = useNavigate();
  const [quotations, setQuotations] = useState<Quotation[]>([]);
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState('all');

  useEffect(() => { setQuotations(getQuotations()); }, []);

  const filtered = quotations.filter(q => {
    const matchSearch = q.customerName.toLowerCase().includes(search.toLowerCase()) || q.quotationNumber.toLowerCase().includes(search.toLowerCase());
    const matchFilter = filter === 'all' || q.status === filter;
    return matchSearch && matchFilter;
  });

  const handleDelete = (id: string) => { if (confirm('Delete?')) { deleteQuotation(id); setQuotations(getQuotations()); } };

  const handleConvert = (quotation: Quotation) => {
    if (confirm('Convert to invoice?')) {
      const invoice = createInvoiceFromQuotation(quotation);
      updateQuotation(quotation.id, { status: 'converted', convertedToInvoiceId: invoice.id });
      setQuotations(getQuotations());
      navigate(`/inventory/invoice/${invoice.id}`);
    }
  };

  const statusColor = (status: string) => {
    switch (status) {
      case 'draft': return { bg: '#f1f5f9', color: '#475569' };
      case 'sent': return { bg: '#eff6ff', color: '#2563eb' };
      case 'accepted': return { bg: '#ecfdf5', color: '#059669' };
      case 'converted': return { bg: '#f5f3ff', color: '#7c3aed' };
      default: return { bg: '#f1f5f9', color: '#475569' };
    }
  };

  return (
    <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '32px', background: 'white', borderRadius: '16px', border: '2px solid #e2e8f0', overflow: 'hidden' }}>
      <div style={{ padding: '20px 24px', borderBottom: '2px solid #e2e8f0', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '12px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}><FileText style={{ width: '22px', height: '22px', color: '#002e17' }} /><h3 style={{ fontSize: '18px', fontWeight: '700', color: '#0f172a', margin: 0 }}>Quotations ({quotations.length})</h3></div>
        <button onClick={() => navigate('/inventory/quotations/new')} style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '10px 20px', background: '#002e17', color: 'white', border: 'none', borderRadius: '10px', fontWeight: '700', fontSize: '15px', cursor: 'pointer' }}><Plus style={{ width: '18px', height: '18px' }} /> New</button>
      </div>
      <div style={{ padding: '16px 24px', display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
        <div style={{ flex: 1, minWidth: '200px', position: 'relative' }}>
          <Search style={{ position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)', width: '18px', height: '18px', color: '#9ca3af' }} />
          <input type="text" value={search} onChange={e => setSearch(e.target.value)} placeholder="Search..." style={{ width: '100%', padding: '12px 16px 12px 44px', border: '2px solid #d1d5db', borderRadius: '10px', fontSize: '15px', outline: 'none', boxSizing: 'border-box' }} />
        </div>
        <select value={filter} onChange={e => setFilter(e.target.value)} style={{ padding: '12px 16px', border: '2px solid #d1d5db', borderRadius: '10px', fontSize: '15px', background: 'white' }}>
          <option value="all">All</option><option value="draft">Draft</option><option value="sent">Sent</option><option value="accepted">Accepted</option><option value="converted">Converted</option>
        </select>
      </div>
      <div style={{ maxHeight: '600px', overflowY: 'auto' }}>
        {filtered.length === 0 ? (
          <div style={{ padding: '40px', textAlign: 'center' }}><FileText style={{ width: '40px', height: '40px', color: '#cbd5e1', margin: '0 auto 12px' }} /><p style={{ fontSize: '16px', color: '#64748b' }}>No quotations found</p></div>
        ) : (
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead><tr style={{ borderBottom: '2px solid #e2e8f0' }}><th style={{ padding: '14px 16px', textAlign: 'left', fontSize: '13px', fontWeight: '700', color: '#475569' }}>Number</th><th style={{ padding: '14px 16px', textAlign: 'left', fontSize: '13px', fontWeight: '700', color: '#475569' }}>Customer</th><th style={{ padding: '14px 16px', textAlign: 'left', fontSize: '13px', fontWeight: '700', color: '#475569' }}>Date</th><th style={{ padding: '14px 16px', textAlign: 'right', fontSize: '13px', fontWeight: '700', color: '#475569' }}>Amount</th><th style={{ padding: '14px 16px', textAlign: 'center', fontSize: '13px', fontWeight: '700', color: '#475569' }}>Status</th><th style={{ padding: '14px 16px', textAlign: 'center', fontSize: '13px', fontWeight: '700', color: '#475569' }}>Actions</th></tr></thead>
            <tbody>
              {filtered.map(q => {
                const sc = statusColor(q.status);
                return (
                  <tr key={q.id} style={{ borderBottom: '1px solid #f1f5f9' }}>
                    <td style={{ padding: '14px 16px', fontSize: '14px', fontWeight: '600', color: '#0f172a' }}>{q.quotationNumber}</td>
                    <td style={{ padding: '14px 16px', fontSize: '14px', color: '#475569' }}>{q.customerName}</td>
                    <td style={{ padding: '14px 16px', fontSize: '14px', color: '#6b7280' }}>{q.issueDate}</td>
                    <td style={{ padding: '14px 16px', fontSize: '14px', fontWeight: '700', color: '#0f172a', textAlign: 'right' }}>SAR {q.grandTotal.toFixed(2)}</td>
                    <td style={{ padding: '14px 16px', textAlign: 'center' }}><span style={{ padding: '6px 14px', borderRadius: '20px', fontSize: '13px', fontWeight: '700', background: sc.bg, color: sc.color }}>{q.status}</span></td>
                    <td style={{ padding: '14px 16px', textAlign: 'center' }}>
                      <div style={{ display: 'flex', gap: '6px', justifyContent: 'center' }}>
                        <button onClick={() => handleConvert(q)} title="Convert to Invoice" style={{ padding: '8px', background: '#ecfdf5', color: '#059669', border: 'none', borderRadius: '6px', cursor: 'pointer' }}><CheckCircle style={{ width: '16px', height: '16px' }} /></button>
                        <button onClick={() => handleDelete(q.id)} style={{ padding: '8px', background: '#fef2f2', color: '#dc2626', border: 'none', borderRadius: '6px', cursor: 'pointer' }}><Trash2 style={{ width: '16px', height: '16px' }} /></button>
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

export default QuotationList;
