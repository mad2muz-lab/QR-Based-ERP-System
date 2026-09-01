import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { DollarSign, Search, TrendingUp, Calendar } from 'lucide-react';
import { getPayments, getInvoices } from '../../../utils/erpInvoiceService';

const PaymentList: React.FC = () => {
  const navigate = useNavigate();
  const [payments, setPayments] = useState<any[]>([]);
  const [search, setSearch] = useState('');
  const [methodFilter, setMethodFilter] = useState('all');

  useEffect(() => {
    const p = getPayments();
    const invs = getInvoices();
    const enriched = p.map(pay => {
      const inv = invs.find(i => i.id === pay.invoiceId);
      return { ...pay, invoiceNumber: inv?.invoiceNumber || 'N/A', customerName: inv?.customerName || 'N/A' };
    });
    setPayments(enriched.reverse());
  }, []);

  const filtered = payments.filter(p => {
    const matchSearch = (p.invoiceNumber || '').toLowerCase().includes(search.toLowerCase()) || (p.customerName || '').toLowerCase().includes(search.toLowerCase()) || (p.paymentNumber || '').toLowerCase().includes(search.toLowerCase());
    const matchMethod = methodFilter === 'all' || p.paymentMethod === methodFilter;
    return matchSearch && matchMethod;
  });

  const totalPayments = filtered.reduce((sum, p) => sum + p.amount, 0);
  const methodBadge = (method: string) => {
    switch (method) {
      case 'cash': return { bg: '#ecfdf5', color: '#059669' };
      case 'bank_transfer': return { bg: '#eff6ff', color: '#2563eb' };
      case 'check': return { bg: '#fff7ed', color: '#ea580c' };
      case 'credit_card': return { bg: '#f5f3ff', color: '#7c3aed' };
      default: return { bg: '#f1f5f9', color: '#475569' };
    }
  };

  return (
    <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '32px', display: 'flex', flexDirection: 'column', gap: '20px' }}>
      {/* Stats */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px' }}>
        <div style={{ background: 'white', borderRadius: '16px', border: '2px solid #e2e8f0', padding: '20px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div style={{ width: '40px', height: '40px', borderRadius: '10px', background: '#ecfdf5', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><DollarSign style={{ width: '20px', height: '20px', color: '#059669' }} /></div>
            <div><p style={{ fontSize: '13px', color: '#6b7280', margin: 0 }}>Total Payments</p><p style={{ fontSize: '24px', fontWeight: '800', color: '#0f172a', margin: 0 }}>SAR {totalPayments.toFixed(2)}</p></div>
          </div>
        </div>
        <div style={{ background: 'white', borderRadius: '16px', border: '2px solid #e2e8f0', padding: '20px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div style={{ width: '40px', height: '40px', borderRadius: '10px', background: '#eff6ff', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><TrendingUp style={{ width: '20px', height: '20px', color: '#2563eb' }} /></div>
            <div><p style={{ fontSize: '13px', color: '#6b7280', margin: 0 }}>Payment Count</p><p style={{ fontSize: '24px', fontWeight: '800', color: '#0f172a', margin: 0 }}>{filtered.length}</p></div>
          </div>
        </div>
      </div>

      {/* Payment List */}
      <div style={{ background: 'white', borderRadius: '16px', border: '2px solid #e2e8f0', overflow: 'hidden' }}>
        <div style={{ padding: '20px 24px', borderBottom: '2px solid #e2e8f0', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '12px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}><DollarSign style={{ width: '22px', height: '22px', color: '#002e17' }} /><h3 style={{ fontSize: '18px', fontWeight: '700', color: '#0f172a', margin: 0 }}>Payments</h3></div>
        </div>
        <div style={{ padding: '16px 24px', display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
          <div style={{ flex: 1, minWidth: '200px', position: 'relative' }}>
            <Search style={{ position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)', width: '18px', height: '18px', color: '#9ca3af' }} />
            <input type="text" value={search} onChange={e => setSearch(e.target.value)} placeholder="Search..." style={{ width: '100%', padding: '12px 16px 12px 44px', border: '2px solid #d1d5db', borderRadius: '10px', fontSize: '15px', outline: 'none', boxSizing: 'border-box' }} />
          </div>
          <select value={methodFilter} onChange={e => setMethodFilter(e.target.value)} style={{ padding: '12px 16px', border: '2px solid #d1d5db', borderRadius: '10px', fontSize: '15px', background: 'white' }}>
            <option value="all">All Methods</option><option value="cash">Cash</option><option value="bank_transfer">Bank Transfer</option><option value="check">Check</option><option value="credit_card">Credit Card</option>
          </select>
        </div>
        <div style={{ maxHeight: '500px', overflowY: 'auto' }}>
          {filtered.length === 0 ? (
            <div style={{ padding: '40px', textAlign: 'center' }}><Calendar style={{ width: '40px', height: '40px', color: '#cbd5e1', margin: '0 auto 12px' }} /><p style={{ fontSize: '16px', color: '#64748b' }}>No payments found</p></div>
          ) : (
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead><tr style={{ borderBottom: '2px solid #e2e8f0' }}><th style={{ padding: '14px 16px', textAlign: 'left', fontSize: '13px', fontWeight: '700', color: '#475569' }}>Payment #</th><th style={{ padding: '14px 16px', textAlign: 'left', fontSize: '13px', fontWeight: '700', color: '#475569' }}>Invoice</th><th style={{ padding: '14px 16px', textAlign: 'left', fontSize: '13px', fontWeight: '700', color: '#475569' }}>Customer</th><th style={{ padding: '14px 16px', textAlign: 'left', fontSize: '13px', fontWeight: '700', color: '#475569' }}>Date</th><th style={{ padding: '14px 16px', textAlign: 'center', fontSize: '13px', fontWeight: '700', color: '#475569' }}>Method</th><th style={{ padding: '14px 16px', textAlign: 'right', fontSize: '13px', fontWeight: '700', color: '#475569' }}>Amount</th></tr></thead>
              <tbody>
                {filtered.map(p => {
                  const mb = methodBadge(p.paymentMethod);
                  return (
                    <tr key={p.id} style={{ borderBottom: '1px solid #f1f5f9' }}>
                      <td style={{ padding: '14px 16px', fontSize: '14px', fontWeight: '600', color: '#0f172a' }}>{p.paymentNumber}</td>
                      <td style={{ padding: '14px 16px', fontSize: '14px', color: '#475569', cursor: 'pointer' }} onClick={() => navigate(`/inventory/invoice/${p.invoiceId}`)}>{p.invoiceNumber}</td>
                      <td style={{ padding: '14px 16px', fontSize: '14px', color: '#475569' }}>{p.customerName}</td>
                      <td style={{ padding: '14px 16px', fontSize: '14px', color: '#6b7280' }}>{p.paymentDate}</td>
                      <td style={{ padding: '14px 16px', textAlign: 'center' }}><span style={{ padding: '4px 12px', borderRadius: '20px', fontSize: '12px', fontWeight: '700', background: mb.bg, color: mb.color }}>{p.paymentMethod?.replace('_', ' ')}</span></td>
                      <td style={{ padding: '14px 16px', fontSize: '15px', fontWeight: '700', color: '#059669', textAlign: 'right' }}>SAR {p.amount.toFixed(2)}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  );
};

export default PaymentList;
