import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Plus, FileText, RotateCcw } from 'lucide-react';
import { Invoice, getInvoices, getInvoiceById, createInvoice } from '../../../utils/erpInvoiceService';

const CreditDebitNoteForm: React.FC = () => {
  const navigate = useNavigate();
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [selectedInvoice, setSelectedInvoice] = useState<Invoice | null>(null);
  const [noteType, setNoteType] = useState<'credit_note' | 'debit_note'>('credit_note');
  const [reason, setReason] = useState('');
  const [items, setItems] = useState<any[]>([]);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    setInvoices(getInvoices().filter(i => i.status === 'paid' || i.status === 'sent'));
  }, []);

  const handleSelectInvoice = (invoiceId: string) => {
    const inv = getInvoiceById(invoiceId);
    if (inv) {
      setSelectedInvoice(inv);
      setItems(inv.items.map((item: any) => ({ ...item, quantity: 0, reason: '' })));
    }
  };

  const updateItem = (index: number, field: string, value: any) => {
    const updated = [...items];
    updated[index] = { ...updated[index], [field]: value };
    setItems(updated);
  };

  const calculateTotal = () => {
    return items.reduce((sum, item) => {
      const qty = item.quantity || 0;
      const price = item.unitPrice || 0;
      const disc = item.discount || 0;
      const vatRate = item.vatRate || 15;
      const subtotal = qty * price;
      const afterDisc = subtotal - disc;
      const vatAmount = afterDisc * (vatRate / 100);
      return sum + afterDisc + vatAmount;
    }, 0);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedInvoice) { alert('Select an invoice'); return; }
    if (!reason.trim()) { alert('Reason is required'); return; }

    const noteItems = items.filter(item => (item.quantity || 0) > 0).map((item, idx) => {
      const qty = item.quantity || 0;
      const price = item.unitPrice || 0;
      const disc = item.discount || 0;
      const vatRate = item.vatRate || 15;
      const subtotal = qty * price;
      const afterDisc = subtotal - disc;
      const vatAmount = afterDisc * (vatRate / 100);
      return {
        id: `note-item-${idx}`,
        description: item.description,
        quantity: qty,
        unit: item.unit || 'pcs',
        unitPrice: price,
        discount: disc,
        vatRate,
        vatAmount,
        totalAmount: afterDisc + vatAmount,
        supplyType: 'taxable' as const,
      };
    });

    if (noteItems.length === 0) { alert('Add at least one item'); return; }

    const subtotal = noteItems.reduce((sum, i) => sum + (i.quantity * i.unitPrice), 0);
    const totalDiscount = noteItems.reduce((sum, i) => sum + (i.discount || 0), 0);
    const totalVat = noteItems.reduce((sum, i) => sum + i.vatAmount, 0);

    createInvoice({
      invoiceType: noteType,
      customerName: selectedInvoice.customerName,
      customerAddress: selectedInvoice.customerAddress,
      customerVatNumber: selectedInvoice.customerVatNumber,
      issueDate: new Date().toISOString().split('T')[0],
      dueDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      currency: selectedInvoice.currency || 'SAR',
      subtotal,
      totalDiscount,
      totalVat,
      grandTotal: subtotal - totalDiscount + totalVat,
      vatRate: 15,
      status: 'draft',
      paymentStatus: 'unpaid',
      amountPaid: 0,
      notes: `Note for Invoice ${selectedInvoice.invoiceNumber}. Reason: ${reason}`,
      items: noteItems,
      createdBy: 'System'
    });

    setSaved(true);
    setTimeout(() => navigate('/inventory/invoices'), 1500);
  };

  return (
    <div style={{ background: 'white', borderRadius: '16px', border: '2px solid #e2e8f0', padding: '28px' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '24px' }}>
        <button onClick={() => navigate('/inventory/invoices')} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: '8px' }}>
          <ArrowLeft style={{ width: '20px', height: '20px', color: '#475569' }} />
        </button>
        <div>
          <h2 style={{ fontSize: '22px', fontWeight: '700', color: '#0f172a', margin: 0 }}>Create {noteType === 'credit_note' ? 'Credit' : 'Debit'} Note</h2>
          <p style={{ fontSize: '14px', color: '#6b7280', margin: '2px 0 0 0' }}>Create a note against an existing invoice</p>
        </div>
      </div>

      {saved && (
        <div style={{ padding: '14px 18px', borderRadius: '12px', marginBottom: '20px', fontSize: '15px', fontWeight: '600', background: '#d1fae5', color: '#065f46', border: '2px solid #6ee7b7' }}>
          Note created successfully! Redirecting...
        </div>
      )}

      <form onSubmit={handleSubmit}>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '24px' }}>
          <div>
            <label style={{ display: 'block', fontSize: '14px', fontWeight: '600', color: '#374151', marginBottom: '6px' }}>Note Type</label>
            <select value={noteType} onChange={e => setNoteType(e.target.value as any)} style={{ width: '100%', padding: '12px 16px', border: '2px solid #d1d5db', borderRadius: '10px', fontSize: '15px', outline: 'none', boxSizing: 'border-box' }}>
              <option value="credit_note">Credit Note</option>
              <option value="debit_note">Debit Note</option>
            </select>
          </div>
          <div>
            <label style={{ display: 'block', fontSize: '14px', fontWeight: '600', color: '#374151', marginBottom: '6px' }}>Original Invoice</label>
            <select onChange={e => handleSelectInvoice(e.target.value)} style={{ width: '100%', padding: '12px 16px', border: '2px solid #d1d5db', borderRadius: '10px', fontSize: '15px', outline: 'none', boxSizing: 'border-box' }}>
              <option value="">Select invoice</option>
              {invoices.map(inv => (<option key={inv.id} value={inv.id}>{inv.invoiceNumber} - {inv.customerName}</option>))}
            </select>
          </div>
          <div style={{ gridColumn: '1 / -1' }}>
            <label style={{ display: 'block', fontSize: '14px', fontWeight: '600', color: '#374151', marginBottom: '6px' }}>Reason *</label>
            <textarea value={reason} onChange={e => setReason(e.target.value)} placeholder="Reason for this note..." rows={3} style={{ width: '100%', padding: '12px 16px', border: '2px solid #d1d5db', borderRadius: '10px', fontSize: '15px', outline: 'none', boxSizing: 'border-box' }} />
          </div>
        </div>

        {selectedInvoice && (
          <div style={{ marginBottom: '24px' }}>
            <h3 style={{ fontSize: '18px', fontWeight: '700', color: '#0f172a', margin: '0 0 16px 0' }}>Items from Original Invoice</h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              {items.map((item, idx) => (
                <div key={idx} style={{ display: 'grid', gridTemplateColumns: '2fr 1fr 1fr auto', gap: '12px', alignItems: 'center', padding: '12px', background: '#f8fafc', borderRadius: '10px' }}>
                  <div><span style={{ fontSize: '14px', fontWeight: '600', color: '#0f172a' }}>{item.description}</span><br /><span style={{ fontSize: '13px', color: '#6b7280' }}>Original: {item.quantity} {item.unit} @ SAR {item.unitPrice}</span></div>
                  <div>
                    <label style={{ fontSize: '12px', fontWeight: '600', color: '#6b7280' }}>Qty to Return</label>
                    <input type="number" min="0" max={item.quantity} value={item.quantity || 0} onChange={e => updateItem(idx, 'quantity', Number(e.target.value) || 0)} style={{ width: '100%', padding: '8px', border: '1px solid #d1d5db', borderRadius: '6px', fontSize: '14px' }} />
                  </div>
                  <div>
                    <label style={{ fontSize: '12px', fontWeight: '600', color: '#6b7280' }}>Reason</label>
                    <input type="text" value={item.reason || ''} onChange={e => updateItem(idx, 'reason', e.target.value)} placeholder="Reason" style={{ width: '100%', padding: '8px', border: '1px solid #d1d5db', borderRadius: '6px', fontSize: '14px' }} />
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <span style={{ fontSize: '15px', fontWeight: '700', color: '#0f172a' }}>SAR {((item.quantity || 0) * (item.unitPrice || 0) * 1.15).toFixed(2)}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {selectedInvoice && (
          <div style={{ padding: '20px', background: '#f8fafc', borderRadius: '12px', marginBottom: '24px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '18px', fontWeight: '700' }}>
              <span>Total Note Amount:</span>
              <span>SAR {calculateTotal().toFixed(2)}</span>
            </div>
          </div>
        )}

        <button type="submit" disabled={!selectedInvoice} style={{ width: '100%', padding: '14px', background: selectedInvoice ? '#002e17' : '#9ca3af', color: 'white', border: 'none', borderRadius: '12px', fontSize: '16px', fontWeight: '700', cursor: selectedInvoice ? 'pointer' : 'not-allowed' }}>
          Create {noteType === 'credit_note' ? 'Credit' : 'Debit'} Note
        </button>
      </form>
    </div>
  );
};

export default CreditDebitNoteForm;
