import React, { useState, useEffect } from 'react';
import { DollarSign, TrendingUp, Calendar, AlertCircle } from 'lucide-react';
import { getInvoices, getPayments } from '../../../utils/erpInvoiceService';

const FinancialReports: React.FC = () => {
  const [reportType, setReportType] = useState<'revenue' | 'aging' | 'payments'>('revenue');
  const [invoices, setInvoices] = useState<any[]>([]);
  const [payments, setPayments] = useState<any[]>([]);

  useEffect(() => {
    setInvoices(getInvoices());
    setPayments(getPayments());
  }, []);

  const totalRevenue = invoices.reduce((sum, i) => sum + i.grandTotal, 0);
  const totalPaid = invoices.filter(i => i.status === 'paid').reduce((sum, i) => sum + i.grandTotal, 0);
  const totalOutstanding = invoices.filter(i => i.status !== 'paid' && i.status !== 'cancelled').reduce((sum, i) => sum + (i.grandTotal - (i.amountPaid || 0)), 0);
  const overdueInvoices = invoices.filter(i => {
    if (i.status === 'paid' || i.status === 'cancelled') return false;
    const dueDate = new Date(i.dueDate);
    return dueDate < new Date();
  });

  const agingBuckets = {
    current: invoices.filter(i => { if (i.status === 'paid' || i.status === 'cancelled') return false; const due = new Date(i.dueDate); const diff = (due.getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24); return diff >= 0; }),
    '30': invoices.filter(i => { if (i.status === 'paid' || i.status === 'cancelled') return false; const due = new Date(i.dueDate); const diff = (new Date().getTime() - due.getTime()) / (1000 * 60 * 60 * 24); return diff > 0 && diff <= 30; }),
    '60': invoices.filter(i => { if (i.status === 'paid' || i.status === 'cancelled') return false; const due = new Date(i.dueDate); const diff = (new Date().getTime() - due.getTime()) / (1000 * 60 * 60 * 24); return diff > 30 && diff <= 60; }),
    '90': invoices.filter(i => { if (i.status === 'paid' || i.status === 'cancelled') return false; const due = new Date(i.dueDate); const diff = (new Date().getTime() - due.getTime()) / (1000 * 60 * 60 * 24); return diff > 60; }),
  };

  const bucketAmounts = {
    current: agingBuckets.current.reduce((sum, i) => sum + (i.grandTotal - (i.amountPaid || 0)), 0),
    '30': agingBuckets['30'].reduce((sum, i) => sum + (i.grandTotal - (i.amountPaid || 0)), 0),
    '60': agingBuckets['60'].reduce((sum, i) => sum + (i.grandTotal - (i.amountPaid || 0)), 0),
    '90': agingBuckets['90'].reduce((sum, i) => sum + (i.grandTotal - (i.amountPaid || 0)), 0),
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      {/* Summary Stats */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px' }}>
        <div style={{ background: 'white', borderRadius: '16px', border: '2px solid #e2e8f0', padding: '20px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div style={{ width: '40px', height: '40px', borderRadius: '10px', background: '#eff6ff', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><DollarSign style={{ width: '20px', height: '20px', color: '#2563eb' }} /></div>
            <div><p style={{ fontSize: '13px', color: '#6b7280', margin: 0 }}>Total Revenue</p><p style={{ fontSize: '24px', fontWeight: '800', color: '#0f172a', margin: 0 }}>SAR {totalRevenue.toFixed(2)}</p></div>
          </div>
        </div>
        <div style={{ background: 'white', borderRadius: '16px', border: '2px solid #e2e8f0', padding: '20px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div style={{ width: '40px', height: '40px', borderRadius: '10px', background: '#ecfdf5', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><TrendingUp style={{ width: '20px', height: '20px', color: '#059669' }} /></div>
            <div><p style={{ fontSize: '13px', color: '#6b7280', margin: 0 }}>Collected</p><p style={{ fontSize: '24px', fontWeight: '800', color: '#059669', margin: 0 }}>SAR {totalPaid.toFixed(2)}</p></div>
          </div>
        </div>
        <div style={{ background: 'white', borderRadius: '16px', border: '2px solid #e2e8f0', padding: '20px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div style={{ width: '40px', height: '40px', borderRadius: '10px', background: '#fef2f2', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><AlertCircle style={{ width: '20px', height: '20px', color: '#dc2626' }} /></div>
            <div><p style={{ fontSize: '13px', color: '#6b7280', margin: 0 }}>Outstanding</p><p style={{ fontSize: '24px', fontWeight: '800', color: '#dc2626', margin: 0 }}>SAR {totalOutstanding.toFixed(2)}</p></div>
          </div>
        </div>
        <div style={{ background: 'white', borderRadius: '16px', border: '2px solid #e2e8f0', padding: '20px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div style={{ width: '40px', height: '40px', borderRadius: '10px', background: '#fff7ed', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><Calendar style={{ width: '20px', height: '20px', color: '#ea580c' }} /></div>
            <div><p style={{ fontSize: '13px', color: '#6b7280', margin: 0 }}>Overdue</p><p style={{ fontSize: '24px', fontWeight: '800', color: '#ea580c', margin: 0 }}>{overdueInvoices.length} invoices</p></div>
          </div>
        </div>
      </div>

      {/* Report Type Selector */}
      <div style={{ display: 'flex', gap: '12px' }}>
        {(['revenue', 'aging', 'payments'] as const).map(type => (
          <button key={type} onClick={() => setReportType(type)} style={{ padding: '12px 24px', borderRadius: '10px', border: 'none', background: reportType === type ? '#002e17' : '#f1f5f9', color: reportType === type ? 'white' : '#475569', fontWeight: '700', fontSize: '15px', cursor: 'pointer', textTransform: 'capitalize' }}>
            {type} Report
          </button>
        ))}
      </div>

      {/* Report Content */}
      <div style={{ background: 'white', borderRadius: '16px', border: '2px solid #e2e8f0', overflow: 'hidden' }}>
        {reportType === 'revenue' && (
          <div style={{ padding: '24px' }}>
            <h3 style={{ fontSize: '18px', fontWeight: '700', color: '#0f172a', margin: '0 0 20px 0' }}>Revenue Summary</h3>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead><tr style={{ borderBottom: '2px solid #e2e8f0' }}><th style={{ padding: '12px', textAlign: 'left', fontSize: '13px', fontWeight: '700', color: '#475569' }}>Invoice</th><th style={{ padding: '12px', textAlign: 'left', fontSize: '13px', fontWeight: '700', color: '#475569' }}>Customer</th><th style={{ padding: '12px', textAlign: 'left', fontSize: '13px', fontWeight: '700', color: '#475569' }}>Date</th><th style={{ padding: '12px', textAlign: 'right', fontSize: '13px', fontWeight: '700', color: '#475569' }}>Amount</th><th style={{ padding: '12px', textAlign: 'center', fontSize: '13px', fontWeight: '700', color: '#475569' }}>Status</th></tr></thead>
              <tbody>
                {invoices.map(inv => (
                  <tr key={inv.id} style={{ borderBottom: '1px solid #f1f5f9' }}>
                    <td style={{ padding: '12px', fontSize: '14px', fontWeight: '600', color: '#0f172a' }}>{inv.invoiceNumber}</td>
                    <td style={{ padding: '12px', fontSize: '14px', color: '#475569' }}>{inv.customerName}</td>
                    <td style={{ padding: '12px', fontSize: '14px', color: '#6b7280' }}>{inv.issueDate}</td>
                    <td style={{ padding: '12px', fontSize: '14px', fontWeight: '700', color: '#0f172a', textAlign: 'right' }}>SAR {inv.grandTotal.toFixed(2)}</td>
                    <td style={{ padding: '12px', textAlign: 'center' }}><span style={{ padding: '4px 12px', borderRadius: '20px', fontSize: '12px', fontWeight: '700', background: inv.status === 'paid' ? '#ecfdf5' : '#fef2f2', color: inv.status === 'paid' ? '#059669' : '#dc2626' }}>{inv.status}</span></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {reportType === 'aging' && (
          <div style={{ padding: '24px' }}>
            <h3 style={{ fontSize: '18px', fontWeight: '700', color: '#0f172a', margin: '0 0 20px 0' }}>Aging Report</h3>
            <div style={{ display: 'grid', gap: '12px' }}>
              {[
                { label: 'Current', amount: bucketAmounts.current, count: agingBuckets.current.length, color: '#059669' },
                { label: '1-30 Days', amount: bucketAmounts['30'], count: agingBuckets['30'].length, color: '#d97706' },
                { label: '31-60 Days', amount: bucketAmounts['60'], count: agingBuckets['60'].length, color: '#ea580c' },
                { label: '60+ Days', amount: bucketAmounts['90'], count: agingBuckets['90'].length, color: '#dc2626' },
              ].map(bucket => (
                <div key={bucket.label} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '16px', background: '#f8fafc', borderRadius: '12px' }}>
                  <div><span style={{ fontSize: '15px', fontWeight: '600', color: '#0f172a' }}>{bucket.label}</span><span style={{ fontSize: '13px', color: '#6b7280', marginLeft: '12px' }}>({bucket.count} invoices)</span></div>
                  <span style={{ fontSize: '18px', fontWeight: '800', color: bucket.color }}>SAR {bucket.amount.toFixed(2)}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {reportType === 'payments' && (
          <div style={{ padding: '24px' }}>
            <h3 style={{ fontSize: '18px', fontWeight: '700', color: '#0f172a', margin: '0 0 20px 0' }}>Payment History</h3>
            {payments.length === 0 ? (
              <p style={{ fontSize: '14px', color: '#94a3b8', textAlign: 'center', padding: '20px' }}>No payments recorded</p>
            ) : (
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead><tr style={{ borderBottom: '2px solid #e2e8f0' }}><th style={{ padding: '12px', textAlign: 'left', fontSize: '13px', fontWeight: '700', color: '#475569' }}>Payment #</th><th style={{ padding: '12px', textAlign: 'left', fontSize: '13px', fontWeight: '700', color: '#475569' }}>Invoice</th><th style={{ padding: '12px', textAlign: 'left', fontSize: '13px', fontWeight: '700', color: '#475569' }}>Date</th><th style={{ padding: '12px', textAlign: 'center', fontSize: '13px', fontWeight: '700', color: '#475569' }}>Method</th><th style={{ padding: '12px', textAlign: 'right', fontSize: '13px', fontWeight: '700', color: '#475569' }}>Amount</th></tr></thead>
                <tbody>
                  {payments.map(p => (
                    <tr key={p.id} style={{ borderBottom: '1px solid #f1f5f9' }}>
                      <td style={{ padding: '12px', fontSize: '14px', fontWeight: '600', color: '#0f172a' }}>{p.paymentNumber}</td>
                      <td style={{ padding: '12px', fontSize: '14px', color: '#475569' }}>{p.invoiceNumber || p.invoiceId}</td>
                      <td style={{ padding: '12px', fontSize: '14px', color: '#6b7280' }}>{p.paymentDate}</td>
                      <td style={{ padding: '12px', textAlign: 'center', fontSize: '13px', color: '#475569' }}>{p.paymentMethod?.replace('_', ' ')}</td>
                      <td style={{ padding: '12px', fontSize: '14px', fontWeight: '700', color: '#059669', textAlign: 'right' }}>SAR {p.amount.toFixed(2)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default FinancialReports;
