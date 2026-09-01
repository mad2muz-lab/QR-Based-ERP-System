import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, Eye, Trash2, FileText, Search, AlertCircle } from 'lucide-react';
import { Quotation, getQuotations, deleteQuotation, createQuotation } from '../../../utils/erpInvoiceService';
import { InventoryStorageService } from '../utils/inventoryStorage';

const QuotationForm: React.FC = () => {
  const navigate = useNavigate();
  const inventoryStorage = InventoryStorageService.getInstance();
  const materials = inventoryStorage.getItems();

  const [customerName, setCustomerName] = useState('');
  const [customerAddress, setCustomerAddress] = useState('');
  const [customerVatNumber, setCustomerVatNumber] = useState('');
  const [expiryDate, setExpiryDate] = useState('');
  const [notes, setNotes] = useState('');
  const [items, setItems] = useState<any[]>([{ description: '', quantity: 1, unit: 'pcs', unitPrice: 0, discount: 0, vatRate: 15 }]);
  const [saved, setSaved] = useState(false);

  const addItem = () => setItems([...items, { description: '', quantity: 1, unit: 'pcs', unitPrice: 0, discount: 0, vatRate: 15 }]);
  const removeItem = (idx: number) => setItems(items.filter((_, i) => i !== idx));
  const updateItem = (idx: number, field: string, value: any) => { const u = [...items]; u[idx] = { ...u[idx], [field]: value }; setItems(u); };
  const selectMaterial = (idx: number, materialId: string) => {
    const m = materials.find(mat => mat.id === materialId);
    if (m) { const u = [...items]; u[idx] = { ...u[idx], description: m.name, sku: m.sku, unit: m.unit, unitPrice: m.unitCost, materialId: m.id }; setItems(u); }
  };

  const calcItem = (item: any) => { const sub = (item.quantity || 0) * (item.unitPrice || 0); const afterDisc = sub - (item.discount || 0); const vat = afterDisc * ((item.vatRate || 0) / 100); return { sub, vat, total: afterDisc + vat }; };
  const totals = items.reduce((acc, item) => { const c = calcItem(item); return { sub: acc.sub + c.sub, disc: acc.disc + (item.discount || 0), vat: acc.vat + c.vat, grand: acc.grand + c.total }; }, { sub: 0, disc: 0, vat: 0, grand: 0 });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!customerName.trim()) { alert('Customer name required'); return; }
    const quotationItems = items.map((item, idx) => { const c = calcItem(item); return { id: `qitem-${idx}`, description: item.description || '', quantity: item.quantity || 0, unit: item.unit || 'pcs', unitPrice: item.unitPrice || 0, discount: item.discount || 0, vatRate: item.vatRate || 15, vatAmount: c.vat, totalAmount: c.total, materialId: item.materialId, sku: item.sku }; });
    createQuotation({ customerName, customerAddress, customerVatNumber, issueDate: new Date().toISOString().split('T')[0], expiryDate: expiryDate || new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0], currency: 'SAR', subtotal: totals.sub, totalDiscount: totals.disc, totalVat: totals.vat, grandTotal: totals.grand, vatRate: 15, status: 'draft', notes, items: quotationItems, createdBy: 'System' });
    setSaved(true);
    setTimeout(() => navigate('/inventory/quotations'), 1500);
  };

  return (
    <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '32px', background: 'white', borderRadius: '16px', border: '2px solid #e2e8f0', padding: '28px' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '24px' }}>
        <button onClick={() => navigate('/inventory/quotations')} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: '8px' }}><FileText style={{ width: '20px', height: '20px', color: '#475569' }} /></button>
        <div><h2 style={{ fontSize: '22px', fontWeight: '700', color: '#0f172a', margin: 0 }}>New Quotation</h2></div>
      </div>
      {saved && <div style={{ padding: '14px', borderRadius: '12px', marginBottom: '20px', background: '#d1fae5', color: '#065f46', fontWeight: '600' }}>Quotation created!</div>}
      <form onSubmit={handleSubmit}>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '24px' }}>
          <div><label style={{ display: 'block', fontSize: '14px', fontWeight: '600', color: '#374151', marginBottom: '6px' }}>Customer Name *</label><input type="text" value={customerName} onChange={e => setCustomerName(e.target.value)} style={{ width: '100%', padding: '12px 16px', border: '2px solid #d1d5db', borderRadius: '10px', fontSize: '15px', outline: 'none', boxSizing: 'border-box' }} required /></div>
          <div><label style={{ display: 'block', fontSize: '14px', fontWeight: '600', color: '#374151', marginBottom: '6px' }}>VAT Number</label><input type="text" value={customerVatNumber} onChange={e => setCustomerVatNumber(e.target.value)} style={{ width: '100%', padding: '12px 16px', border: '2px solid #d1d5db', borderRadius: '10px', fontSize: '15px', outline: 'none', boxSizing: 'border-box' }} /></div>
          <div style={{ gridColumn: '1 / -1' }}><label style={{ display: 'block', fontSize: '14px', fontWeight: '600', color: '#374151', marginBottom: '6px' }}>Address</label><input type="text" value={customerAddress} onChange={e => setCustomerAddress(e.target.value)} style={{ width: '100%', padding: '12px 16px', border: '2px solid #d1d5db', borderRadius: '10px', fontSize: '15px', outline: 'none', boxSizing: 'border-box' }} /></div>
          <div><label style={{ display: 'block', fontSize: '14px', fontWeight: '600', color: '#374151', marginBottom: '6px' }}>Expiry Date</label><input type="date" value={expiryDate} onChange={e => setExpiryDate(e.target.value)} style={{ width: '100%', padding: '12px 16px', border: '2px solid #d1d5db', borderRadius: '10px', fontSize: '15px', outline: 'none', boxSizing: 'border-box' }} /></div>
          <div><label style={{ display: 'block', fontSize: '14px', fontWeight: '600', color: '#374151', marginBottom: '6px' }}>Notes</label><input type="text" value={notes} onChange={e => setNotes(e.target.value)} style={{ width: '100%', padding: '12px 16px', border: '2px solid #d1d5db', borderRadius: '10px', fontSize: '15px', outline: 'none', boxSizing: 'border-box' }} /></div>
        </div>
        <div style={{ marginBottom: '24px' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '12px' }}><h3 style={{ fontSize: '18px', fontWeight: '700', color: '#0f172a', margin: 0 }}>Items</h3><button type="button" onClick={addItem} style={{ padding: '8px 16px', background: '#eff6ff', color: '#2563eb', border: 'none', borderRadius: '8px', fontWeight: '600', fontSize: '14px', cursor: 'pointer' }}>+ Add</button></div>
          {items.map((item, idx) => (
            <div key={idx} style={{ padding: '12px', background: '#f8fafc', borderRadius: '10px', marginBottom: '8px', display: 'grid', gridTemplateColumns: '2fr 1fr 1fr 1fr 1fr auto', gap: '8px', alignItems: 'center' }}>
              <select onChange={e => selectMaterial(idx, e.target.value)} style={{ padding: '8px', border: '1px solid #d1d5db', borderRadius: '6px', fontSize: '13px' }}><option value="">Select</option>{materials.map(m => <option key={m.id} value={m.id}>{m.name}</option>)}</select>
              <input type="text" value={item.description || ''} onChange={e => updateItem(idx, 'description', e.target.value)} placeholder="Description" style={{ padding: '8px', border: '1px solid #d1d5db', borderRadius: '6px', fontSize: '13px' }} />
              <input type="number" min="1" value={item.quantity || 1} onChange={e => updateItem(idx, 'quantity', Number(e.target.value) || 1)} style={{ padding: '8px', border: '1px solid #d1d5db', borderRadius: '6px', fontSize: '13px' }} />
              <input type="number" min="0" step="0.01" value={item.unitPrice || 0} onChange={e => updateItem(idx, 'unitPrice', Number(e.target.value) || 0)} style={{ padding: '8px', border: '1px solid #d1d5db', borderRadius: '6px', fontSize: '13px' }} />
              <input type="number" min="0" value={item.discount || 0} onChange={e => updateItem(idx, 'discount', Number(e.target.value) || 0)} style={{ padding: '8px', border: '1px solid #d1d5db', borderRadius: '6px', fontSize: '13px' }} />
              <button type="button" onClick={() => removeItem(idx)} style={{ padding: '8px', background: '#fef2f2', color: '#dc2626', border: 'none', borderRadius: '6px', cursor: 'pointer' }}><Trash2 style={{ width: '14px', height: '14px' }} /></button>
            </div>
          ))}
        </div>
        <div style={{ padding: '16px', background: '#f8fafc', borderRadius: '12px', marginBottom: '24px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between' }}><span>Subtotal:</span><span>SAR {totals.sub.toFixed(2)}</span></div>
          <div style={{ display: 'flex', justifyContent: 'space-between' }}><span>VAT:</span><span>SAR {totals.vat.toFixed(2)}</span></div>
          <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: '700', fontSize: '18px', borderTop: '2px solid #e2e8f0', paddingTop: '8px' }}><span>Total:</span><span>SAR {totals.grand.toFixed(2)}</span></div>
        </div>
        <button type="submit" style={{ width: '100%', padding: '14px', background: '#002e17', color: 'white', border: 'none', borderRadius: '12px', fontSize: '16px', fontWeight: '700', cursor: 'pointer' }}>Save Quotation</button>
      </form>
    </div>
  );
};

export default QuotationForm;
