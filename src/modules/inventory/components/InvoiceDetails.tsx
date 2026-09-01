import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, Printer, Plus, DollarSign, CheckCircle } from 'lucide-react';
import { Invoice, getInvoiceById, saveInvoice, getPaymentsByInvoice, savePayment, generatePaymentNumber } from '../../../utils/invoiceService';

const InvoiceDetails: React.FC = () => {
  const navigate = useNavigate();
  const { id } = useParams();
  const [invoice, setInvoice] = useState<Invoice | null>(null);
  const [payments, setPayments] = useState<any[]>([]);
  const [showPaymentForm, setShowPaymentForm] = useState(false);
  const [paymentAmount, setPaymentAmount] = useState(0);
  const [paymentMethod, setPaymentMethod] = useState<'cash' | 'bank_transfer' | 'check' | 'credit_card'>('cash');
  const [paymentRef, setPaymentRef] = useState('');

  useEffect(() => {
    if (id) {
      setInvoice(getInvoiceById(id) || null);
      setPayments(getPaymentsByInvoice(id));
    }
  }, [id]);

  if (!invoice) {
    return <div style={{ padding: '40px', textAlign: 'center' }}><p style={{ fontSize: '16px', color: '#6b7280' }}>Invoice not found</p></div>;
  }

  const handlePrint = () => {
    const printWindow = window.open('', '_blank');
    if (!printWindow) return;
    const company = JSON.parse(localStorage.getItem('company_details') || '{}');
    const html = `
      <html><head><title>Invoice ${invoice.invoiceNumber}</title>
      <style>
        body { font-family: Arial, sans-serif; padding: 40px; color: #0f172a; }
        .header { display: flex; justify-content: space-between; margin-bottom: 30px; border-bottom: 2px solid #002e17; padding-bottom: 20px; }
        .company { font-size: 24px; font-weight: bold; color: #002e17; }
        .title { font-size: 28px; font-weight: bold; color: #002e17; }
        .info-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 20px; margin-bottom: 30px; }
        .info-label { font-size: 12px; color: #6b7280; text-transform: uppercase; }
        .info-value { font-size: 16px; font-weight: 600; color: #0f172a; margin-top: 4px; }
        table { width: 100%; border-collapse: collapse; margin-bottom: 30px; }
        th { background: #f8fafc; padding: 12px; text-align: left; font-size: 13px; color: #475569; border-bottom: 2px solid #e2e8f0; }
        td { padding: 12px; border-bottom: 1px solid #f1f5f9; font-size: 14px; }
        .totals { margin-left: auto; width: 300px; }
        .total-row { display: flex; justify-content: space-between; padding: 8px 0; }
        .grand-total { font-size: 20px; font-weight: bold; color: #002e17; border-top: 2px solid #002e17; padding-top: 12px; }
        .status { display: inline-block; padding: 6px 16px; border-radius: 20px; font-size: 14px; font-weight: 600; }
        .payment-box { margin-top: 20px; padding: 16px; background: #f0fdf4; border-radius: 12px; border: 2px solid #6ee7b7; }
      </style></head><body>
      <div class="header">
        <div><div class="company">${company.name || 'Company Name'}</div><div style="color: #6b7280; margin-top: 4px;">Tax ID: ${company.taxId || 'N/A'}</div></div>
        <div style="text-align: right;"><div class="title">TAX INVOICE</div><div style="color: #6b7280; margin-top: 4px;">${invoice.invoiceNumber}</div></div>
      </div>
      <div class="info-grid">
        <div><div class="info-label">Bill To</div><div class="info-value">${invoice.customerName}</div>${invoice.customerAddress ? `<div style="color: #6b7280; margin-top: 4px;">${invoice.customerAddress}</div>` : ''}${invoice.customerVatNumber ? `<div style="color: #6b7280; margin-top: 4px;">VAT: ${invoice.customerVatNumber}</div>` : ''}</div>
        <div style="text-align: right;"><div class="info-label">Issue Date</div><div class="info-value">${invoice.issueDate}</div><div class="info-label" style="margin-top: 12px;">Due Date</div><div class="info-value">${invoice.dueDate}</div></div>
      </div>
      <table><thead><tr><th>#</th><th>Description</th><th>Qty</th><th>Price</th><th>Discount</th><th>VAT</th><th style="text-align: right;">Total</th></tr></thead>
      <tbody>${invoice.items.map((item, idx) => `<tr><td>${idx + 1}</td><td>${item.description}</td><td>${item.quantity} ${item.unit}</td><td>SAR ${item.unitPrice.toFixed(2)}</td><td>SAR ${item.discount.toFixed(2)}</td><td>SAR ${item.vatAmount.toFixed(2)}</td><td style="text-align: right; font-weight: 600;">SAR ${item.totalAmount.toFixed(2)}</td></tr>`).join('')}</tbody></table>
      <div class="totals">
        <div class="total-row"><span>Subtotal:</span><span>SAR ${invoice.subtotal.toFixed(2)}</span></div>
        <div class="total-row"><span>Discount:</span><span style="color: #dc2626;">- SAR ${invoice.totalDiscount.toFixed(2)}</span></div>
        <div class="total-row"><span>VAT (15%):</span><span>SAR ${invoice.totalVat.toFixed(2)}</span></div>
        <div class="total-row grand-total"><span>Grand Total:</span><span>SAR ${invoice.grandTotal.toFixed(2)}</span></div>
        <div class="total-row" style="color: #059669;"><span>Amount Paid:</span><span>SAR ${invoice.amountPaid.toFixed(2)}</span></div>
        <div class="total-row" style="font-weight: bold;"><span>Balance Due:</span><span>SAR ${(invoice.grandTotal - invoice.amountPaid).toFixed(2)}</span></div>
      </div>
      <script>window.onload = () => { window.print(); };</script></body></html>
    `;
    printWindow.document.write(html);
    printWindow.document.close();
  };

  const handleRecordPayment = () => {
    if (paymentAmount <= 0) { alert('Enter a valid amount'); return; }
    if (paymentAmount > invoice.grandTotal - invoice.amountPaid) { alert('Amount exceeds balance due'); return; }

    const payment = {
      id: `pay-${Date.now()}`,
      paymentNumber: generatePaymentNumber(),
      invoiceId: invoice.id,
      paymentDate: new Date().toISOString().split('T')[0],
      amount: paymentAmount,
      paymentMethod,
      reference: paymentRef,
      notes: '',
      createdBy: 'System',
      createdAt: new Date().toISOString()
    };

    savePayment(payment);
    setPayments(getPaymentsByInvoice(invoice.id));
    setInvoice(getInvoiceById(invoice.id));
    setShowPaymentForm(false);
    setPaymentAmount(0);
    setPaymentRef('');
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'draft': return { bg: '#f1f5f9', color: '#475569' };
      case 'sent': return { bg: '#eff6ff', color: '#2563eb' };
      case 'paid': return { bg: '#ecfdf5', color: '#059669' };
      case 'overdue': return { bg: '#fef2f2', color: '#dc2626' };
      default: return { bg: '#f1f5f9', color: '#475569' };
    }
  };

  const statusColor = getStatusColor(invoice.status);

  return (
    <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '32px', background: 'white', borderRadius: '16px', border: '2px solid #e2e8f0', padding: '28px' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '24px', flexWrap: 'wrap', gap: '12px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <button onClick={() => navigate('/inventory/invoices')} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: '8px' }}>
            <ArrowLeft style={{ width: '20px', height: '20px', color: '#475569' }} />
          </button>
          <div>
            <h2 style={{ fontSize: '22px', fontWeight: '700', color: '#0f172a', margin: 0 }}>{invoice.invoiceNumber}</h2>
            <p style={{ fontSize: '14px', color: '#6b7280', margin: '2px 0 0 0' }}>Tax Invoice</p>
          </div>
        </div>
        <div style={{ display: 'flex', gap: '10px' }}>
          <button onClick={handlePrint} style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '10px 20px', background: '#4b5563', color: 'white', border: 'none', borderRadius: '10px', fontWeight: '600', fontSize: '14px', cursor: 'pointer' }}>
            <Printer style={{ width: '16px', height: '16px' }} /> Print
          </button>
        </div>
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '24px' }}>
        <span style={{ padding: '6px 16px', borderRadius: '20px', fontSize: '14px', fontWeight: '700', background: statusColor.bg, color: statusColor.color }}>{invoice.status}</span>
        <span style={{ padding: '6px 16px', borderRadius: '20px', fontSize: '14px', fontWeight: '700', background: invoice.paymentStatus === 'paid' ? '#ecfdf5' : '#fef2f2', color: invoice.paymentStatus === 'paid' ? '#059669' : '#dc2626' }}>{invoice.paymentStatus}</span>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px', marginBottom: '24px', padding: '20px', background: '#f8fafc', borderRadius: '12px' }}>
        <div>
          <h4 style={{ fontSize: '13px', fontWeight: '700', color: '#6b7280', textTransform: 'uppercase', margin: '0 0 8px 0' }}>Bill To</h4>
          <p style={{ fontSize: '16px', fontWeight: '700', color: '#0f172a', margin: '0 0 4px 0' }}>{invoice.customerName}</p>
          {invoice.customerAddress && <p style={{ fontSize: '14px', color: '#6b7280', margin: '0 0 4px 0' }}>{invoice.customerAddress}</p>}
          {invoice.customerVatNumber && <p style={{ fontSize: '14px', color: '#6b7280', margin: 0 }}>VAT: {invoice.customerVatNumber}</p>}
        </div>
        <div style={{ textAlign: 'right' }}>
          <div style={{ marginBottom: '12px' }}><span style={{ fontSize: '13px', fontWeight: '700', color: '#6b7280', textTransform: 'uppercase' }}>Issue Date</span><p style={{ fontSize: '16px', fontWeight: '600', color: '#0f172a', margin: '4px 0 0 0' }}>{invoice.issueDate}</p></div>
          <div><span style={{ fontSize: '13px', fontWeight: '700', color: '#6b7280', textTransform: 'uppercase' }}>Due Date</span><p style={{ fontSize: '16px', fontWeight: '600', color: '#0f172a', margin: '4px 0 0 0' }}>{invoice.dueDate}</p></div>
        </div>
      </div>

      <table style={{ width: '100%', borderCollapse: 'collapse', marginBottom: '24px' }}>
        <thead><tr style={{ borderBottom: '2px solid #e2e8f0' }}><th style={{ padding: '12px', textAlign: 'left', fontSize: '13px', fontWeight: '700', color: '#475569' }}>#</th><th style={{ padding: '12px', textAlign: 'left', fontSize: '13px', fontWeight: '700', color: '#475569' }}>Description</th><th style={{ padding: '12px', textAlign: 'center', fontSize: '13px', fontWeight: '700', color: '#475569' }}>Qty</th><th style={{ padding: '12px', textAlign: 'right', fontSize: '13px', fontWeight: '700', color: '#475569' }}>Price</th><th style={{ padding: '12px', textAlign: 'right', fontSize: '13px', fontWeight: '700', color: '#475569' }}>VAT</th><th style={{ padding: '12px', textAlign: 'right', fontSize: '13px', fontWeight: '700', color: '#475569' }}>Total</th></tr></thead>
        <tbody>{invoice.items.map((item, idx) => (<tr key={item.id} style={{ borderBottom: '1px solid #f1f5f9' }}><td style={{ padding: '12px', fontSize: '14px', color: '#6b7280' }}>{idx + 1}</td><td style={{ padding: '12px', fontSize: '14px', fontWeight: '600', color: '#0f172a' }}>{item.description}</td><td style={{ padding: '12px', fontSize: '14px', color: '#475569', textAlign: 'center' }}>{item.quantity} {item.unit}</td><td style={{ padding: '12px', fontSize: '14px', color: '#475569', textAlign: 'right' }}>{item.unitPrice.toFixed(2)}</td><td style={{ padding: '12px', fontSize: '14px', color: '#475569', textAlign: 'right' }}>{item.vatAmount.toFixed(2)}</td><td style={{ padding: '12px', fontSize: '14px', fontWeight: '700', color: '#0f172a', textAlign: 'right' }}>{item.totalAmount.toFixed(2)}</td></tr>))}</tbody>
      </table>

      <div style={{ width: '300px', marginLeft: 'auto', padding: '20px', background: '#f8fafc', borderRadius: '12px', marginBottom: '24px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}><span style={{ fontSize: '14px', color: '#6b7280' }}>Subtotal:</span><span style={{ fontSize: '14px', fontWeight: '600', color: '#0f172a' }}>SAR {invoice.subtotal.toFixed(2)}</span></div>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}><span style={{ fontSize: '14px', color: '#6b7280' }}>VAT:</span><span style={{ fontSize: '14px', fontWeight: '600', color: '#0f172a' }}>SAR {invoice.totalVat.toFixed(2)}</span></div>
        <div style={{ display: 'flex', justifyContent: 'space-between', paddingTop: '12px', borderTop: '2px solid #002e17' }}><span style={{ fontSize: '18px', fontWeight: '700', color: '#0f172a' }}>Grand Total:</span><span style={{ fontSize: '18px', fontWeight: '800', color: '#002e17' }}>SAR {invoice.grandTotal.toFixed(2)}</span></div>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '8px', color: '#059669' }}><span style={{ fontSize: '14px', fontWeight: '600' }}>Paid:</span><span style={{ fontSize: '14px', fontWeight: '700' }}>SAR {invoice.amountPaid.toFixed(2)}</span></div>
        <div style={{ display: 'flex', justifyContent: 'space-between', color: '#dc2626' }}><span style={{ fontSize: '14px', fontWeight: '600' }}>Balance:</span><span style={{ fontSize: '14px', fontWeight: '700' }}>SAR {(invoice.grandTotal - invoice.amountPaid).toFixed(2)}</span></div>
      </div>

      {/* Payments */}
      <div style={{ marginBottom: '24px' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '12px' }}>
          <h3 style={{ fontSize: '18px', fontWeight: '700', color: '#0f172a', margin: 0 }}>Payments</h3>
          {invoice.status !== 'paid' && invoice.status !== 'cancelled' && (
            <button onClick={() => setShowPaymentForm(!showPaymentForm)} style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '8px 16px', background: '#059669', color: 'white', border: 'none', borderRadius: '8px', fontWeight: '600', fontSize: '14px', cursor: 'pointer' }}>
              <Plus style={{ width: '16px', height: '16px' }} /> Record Payment
            </button>
          )}
        </div>

        {showPaymentForm && (
          <div style={{ padding: '20px', background: '#f0fdf4', borderRadius: '12px', border: '2px solid #6ee7b7', marginBottom: '16px' }}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr auto', gap: '12px', alignItems: 'end' }}>
              <div><label style={{ fontSize: '13px', fontWeight: '600', color: '#374151' }}>Amount (SAR)</label><input type="number" min="0.01" step="0.01" value={paymentAmount || ''} onChange={e => setPaymentAmount(Number(e.target.value))} style={{ width: '100%', padding: '10px', border: '2px solid #d1d5db', borderRadius: '8px', fontSize: '14px' }} /></div>
              <div><label style={{ fontSize: '13px', fontWeight: '600', color: '#374151' }}>Method</label><select value={paymentMethod} onChange={e => setPaymentMethod(e.target.value as any)} style={{ width: '100%', padding: '10px', border: '2px solid #d1d5db', borderRadius: '8px', fontSize: '14px' }}><option value="cash">Cash</option><option value="bank_transfer">Bank Transfer</option><option value="check">Check</option><option value="credit_card">Credit Card</option></select></div>
              <div><label style={{ fontSize: '13px', fontWeight: '600', color: '#374151' }}>Reference</label><input type="text" value={paymentRef} onChange={e => setPaymentRef(e.target.value)} placeholder="Check/Trans #" style={{ width: '100%', padding: '10px', border: '2px solid #d1d5db', borderRadius: '8px', fontSize: '14px' }} /></div>
              <button onClick={handleRecordPayment} style={{ padding: '10px 20px', background: '#059669', color: 'white', border: 'none', borderRadius: '8px', fontWeight: '600', fontSize: '14px', cursor: 'pointer' }}>Save</button>
            </div>
          </div>
        )}

        {payments.length === 0 ? (
          <p style={{ fontSize: '14px', color: '#94a3b8', textAlign: 'center', padding: '20px' }}>No payments recorded</p>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            {payments.map(p => (
              <div key={p.id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px 16px', background: '#f8fafc', borderRadius: '8px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <DollarSign style={{ width: '16px', height: '16px', color: '#059669' }} />
                  <div><span style={{ fontSize: '14px', fontWeight: '600', color: '#0f172a' }}>{p.paymentNumber}</span><span style={{ fontSize: '13px', color: '#6b7280', marginLeft: '8px' }}>{p.paymentMethod}</span></div>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <span style={{ fontSize: '15px', fontWeight: '700', color: '#059669' }}>SAR {p.amount.toFixed(2)}</span>
                  <span style={{ fontSize: '13px', color: '#94a3b8', marginLeft: '8px' }}>{p.paymentDate}</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default InvoiceDetails;
