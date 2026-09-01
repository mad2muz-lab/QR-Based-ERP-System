import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, Plus, Trash2, Save, FileText } from 'lucide-react';
import { Invoice, InvoiceItem, createInvoiceFromProforma, getInvoiceById, saveInvoice } from '../../../utils/invoiceService';
import { getProformaById } from '../../../utils/proformaService';
import { InventoryStorageService } from '../utils/inventoryStorage';

const InvoiceForm: React.FC = () => {
  const navigate = useNavigate();
  const { proformaId } = useParams();
  const inventoryStorage = InventoryStorageService.getInstance();
  const materials = inventoryStorage.getItems();

  const [customerName, setCustomerName] = useState('');
  const [customerAddress, setCustomerAddress] = useState('');
  const [customerVatNumber, setCustomerVatNumber] = useState('');
  const [dueDate, setDueDate] = useState('');
  const [notes, setNotes] = useState('');
  const [items, setItems] = useState<Partial<InvoiceItem>[]>([
    { description: '', quantity: 1, unit: 'pcs', unitPrice: 0, discount: 0, vatRate: 15 }
  ]);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    if (proformaId) {
      const proforma = getProformaById(proformaId);
      if (proforma) {
        setCustomerName(proforma.customerName);
        setCustomerAddress(proforma.customerAddress || '');
        setCustomerVatNumber(proforma.customerVatNumber || '');
        setDueDate(new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]);
        setNotes(proforma.notes || '');
        setItems(proforma.items);
      }
    }
  }, [proformaId]);

  const addItem = () => {
    setItems([...items, { description: '', quantity: 1, unit: 'pcs', unitPrice: 0, discount: 0, vatRate: 15 }]);
  };

  const removeItem = (index: number) => {
    setItems(items.filter((_, i) => i !== index));
  };

  const updateItem = (index: number, field: string, value: any) => {
    const updated = [...items];
    updated[index] = { ...updated[index], [field]: value };
    setItems(updated);
  };

  const selectMaterial = (index: number, materialId: string) => {
    const material = materials.find(m => m.id === materialId);
    if (material) {
      const updated = [...items];
      updated[index] = {
        ...updated[index],
        description: material.name,
        sku: material.sku,
        unit: material.unit,
        unitPrice: material.unitCost,
        materialId: material.id
      };
      setItems(updated);
    }
  };

  const calculateItem = (item: Partial<InvoiceItem>) => {
    const qty = item.quantity || 0;
    const price = item.unitPrice || 0;
    const disc = item.discount || 0;
    const vatRate = item.vatRate || 0;
    const subtotal = qty * price;
    const afterDisc = subtotal - disc;
    const vatAmount = afterDisc * (vatRate / 100);
    return { subtotal, vatAmount, total: afterDisc + vatAmount };
  };

  const totals = items.reduce((acc, item) => {
    const calc = calculateItem(item);
    return {
      subtotal: acc.subtotal + calc.subtotal,
      discount: acc.discount + (item.discount || 0),
      vat: acc.vat + calc.vatAmount,
      grand: acc.grand + calc.total
    };
  }, { subtotal: 0, discount: 0, vat: 0, grand: 0 });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!customerName.trim()) { alert('Customer name is required'); return; }
    if (items.length === 0) { alert('Add at least one item'); return; }

    const invoiceItems: InvoiceItem[] = items.map((item, idx) => {
      const calc = calculateItem(item);
      return {
        id: `inv-item-${idx}`,
        description: item.description || '',
        quantity: item.quantity || 0,
        unit: item.unit || 'pcs',
        unitPrice: item.unitPrice || 0,
        discount: item.discount || 0,
        vatRate: item.vatRate || 15,
        vatAmount: calc.vatAmount,
        totalAmount: calc.total,
        materialId: item.materialId,
        sku: item.sku
      };
    });

    const invoiceData = {
      invoiceType: 'standard' as const,
      proformaId: proformaId || undefined,
      customerName,
      customerAddress,
      customerVatNumber,
      issueDate: new Date().toISOString().split('T')[0],
      dueDate: dueDate || new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      currency: 'SAR',
      subtotal: totals.subtotal,
      totalDiscount: totals.discount,
      totalVat: totals.vat,
      grandTotal: totals.grand,
      status: 'draft' as const,
      paymentStatus: 'unpaid' as const,
      amountPaid: 0,
      notes,
      items: invoiceItems,
      createdBy: 'System'
    };

    const invoice = createInvoiceFromProforma(invoiceData);
    setSaved(true);
    setTimeout(() => navigate(`/inventory/invoice/${invoice.id}`), 1500);
  };

  return (
    <div style={{ background: 'white', borderRadius: '16px', border: '2px solid #e2e8f0', padding: '28px' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '24px' }}>
        <button onClick={() => navigate('/inventory/invoices')} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: '8px' }}>
          <ArrowLeft style={{ width: '20px', height: '20px', color: '#475569' }} />
        </button>
        <div>
          <h2 style={{ fontSize: '22px', fontWeight: '700', color: '#0f172a', margin: 0 }}>New Invoice</h2>
          <p style={{ fontSize: '14px', color: '#6b7280', margin: '2px 0 0 0' }}>{proformaId ? 'Created from proforma' : 'Create a new invoice'}</p>
        </div>
      </div>

      {saved && (
        <div style={{ padding: '14px 18px', borderRadius: '12px', marginBottom: '20px', fontSize: '15px', fontWeight: '600', background: '#d1fae5', color: '#065f46', border: '2px solid #6ee7b7' }}>
          Invoice created successfully! Redirecting...
        </div>
      )}

      <form onSubmit={handleSubmit}>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '24px' }}>
          <div>
            <label style={{ display: 'block', fontSize: '14px', fontWeight: '600', color: '#374151', marginBottom: '6px' }}>Customer Name *</label>
            <input type="text" value={customerName} onChange={e => setCustomerName(e.target.value)} placeholder="Enter customer name" style={{ width: '100%', padding: '12px 16px', border: '2px solid #d1d5db', borderRadius: '10px', fontSize: '15px', outline: 'none', boxSizing: 'border-box' }} required />
          </div>
          <div>
            <label style={{ display: 'block', fontSize: '14px', fontWeight: '600', color: '#374151', marginBottom: '6px' }}>VAT Number</label>
            <input type="text" value={customerVatNumber} onChange={e => setCustomerVatNumber(e.target.value)} placeholder="300000000000003" style={{ width: '100%', padding: '12px 16px', border: '2px solid #d1d5db', borderRadius: '10px', fontSize: '15px', outline: 'none', boxSizing: 'border-box' }} />
          </div>
          <div style={{ gridColumn: '1 / -1' }}>
            <label style={{ display: 'block', fontSize: '14px', fontWeight: '600', color: '#374151', marginBottom: '6px' }}>Address</label>
            <input type="text" value={customerAddress} onChange={e => setCustomerAddress(e.target.value)} placeholder="Customer address" style={{ width: '100%', padding: '12px 16px', border: '2px solid #d1d5db', borderRadius: '10px', fontSize: '15px', outline: 'none', boxSizing: 'border-box' }} />
          </div>
          <div>
            <label style={{ display: 'block', fontSize: '14px', fontWeight: '600', color: '#374151', marginBottom: '6px' }}>Due Date</label>
            <input type="date" value={dueDate} onChange={e => setDueDate(e.target.value)} style={{ width: '100%', padding: '12px 16px', border: '2px solid #d1d5db', borderRadius: '10px', fontSize: '15px', outline: 'none', boxSizing: 'border-box' }} />
          </div>
          <div>
            <label style={{ display: 'block', fontSize: '14px', fontWeight: '600', color: '#374151', marginBottom: '6px' }}>Notes</label>
            <input type="text" value={notes} onChange={e => setNotes(e.target.value)} placeholder="Optional notes" style={{ width: '100%', padding: '12px 16px', border: '2px solid #d1d5db', borderRadius: '10px', fontSize: '15px', outline: 'none', boxSizing: 'border-box' }} />
          </div>
        </div>

        <div style={{ marginBottom: '24px' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '12px' }}>
            <h3 style={{ fontSize: '18px', fontWeight: '700', color: '#0f172a', margin: 0 }}>Items</h3>
            <button type="button" onClick={addItem} style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '8px 16px', background: '#eff6ff', color: '#2563eb', border: 'none', borderRadius: '8px', fontWeight: '600', fontSize: '14px', cursor: 'pointer' }}>
              <Plus style={{ width: '16px', height: '16px' }} /> Add Item
            </button>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {items.map((item, idx) => (
              <div key={idx} style={{ padding: '16px', background: '#f8fafc', borderRadius: '12px', border: '2px solid #e2e8f0' }}>
                <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr 1fr 1fr 1fr 1fr auto', gap: '8px', alignItems: 'end' }}>
                  <div>
                    <label style={{ fontSize: '12px', fontWeight: '600', color: '#6b7280' }}>Material</label>
                    <select onChange={e => selectMaterial(idx, e.target.value)} style={{ width: '100%', padding: '10px', border: '1px solid #d1d5db', borderRadius: '6px', fontSize: '14px' }}>
                      <option value="">Select material</option>
                      {materials.map(m => <option key={m.id} value={m.id}>{m.name}</option>)}
                    </select>
                  </div>
                  <div>
                    <label style={{ fontSize: '12px', fontWeight: '600', color: '#6b7280' }}>Description</label>
                    <input type="text" value={item.description || ''} onChange={e => updateItem(idx, 'description', e.target.value)} style={{ width: '100%', padding: '10px', border: '1px solid #d1d5db', borderRadius: '6px', fontSize: '14px' }} />
                  </div>
                  <div>
                    <label style={{ fontSize: '12px', fontWeight: '600', color: '#6b7280' }}>Qty</label>
                    <input type="number" min="1" value={item.quantity || 1} onChange={e => updateItem(idx, 'quantity', Number(e.target.value) || 1)} style={{ width: '100%', padding: '10px', border: '1px solid #d1d5db', borderRadius: '6px', fontSize: '14px' }} />
                  </div>
                  <div>
                    <label style={{ fontSize: '12px', fontWeight: '600', color: '#6b7280' }}>Price</label>
                    <input type="number" min="0" step="0.01" value={item.unitPrice || 0} onChange={e => updateItem(idx, 'unitPrice', Number(e.target.value) || 0)} style={{ width: '100%', padding: '10px', border: '1px solid #d1d5db', borderRadius: '6px', fontSize: '14px' }} />
                  </div>
                  <div>
                    <label style={{ fontSize: '12px', fontWeight: '600', color: '#6b7280' }}>Discount</label>
                    <input type="number" min="0" step="0.01" value={item.discount || 0} onChange={e => updateItem(idx, 'discount', Number(e.target.value) || 0)} style={{ width: '100%', padding: '10px', border: '1px solid #d1d5db', borderRadius: '6px', fontSize: '14px' }} />
                  </div>
                  <div>
                    <label style={{ fontSize: '12px', fontWeight: '600', color: '#6b7280' }}>VAT %</label>
                    <input type="number" min="0" max="100" value={item.vatRate || 15} onChange={e => updateItem(idx, 'vatRate', Number(e.target.value) || 0)} style={{ width: '100%', padding: '10px', border: '1px solid #d1d5db', borderRadius: '6px', fontSize: '14px' }} />
                  </div>
                  <button type="button" onClick={() => removeItem(idx)} style={{ padding: '10px', background: '#fef2f2', color: '#dc2626', border: 'none', borderRadius: '6px', cursor: 'pointer' }}>
                    <Trash2 style={{ width: '16px', height: '16px' }} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div style={{ padding: '20px', background: '#f8fafc', borderRadius: '12px', border: '2px solid #e2e8f0', marginBottom: '24px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
            <span style={{ fontSize: '15px', color: '#475569' }}>Subtotal:</span>
            <span style={{ fontSize: '15px', fontWeight: '600', color: '#0f172a' }}>SAR {totals.subtotal.toFixed(2)}</span>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
            <span style={{ fontSize: '15px', color: '#475569' }}>Discount:</span>
            <span style={{ fontSize: '15px', fontWeight: '600', color: '#dc2626' }}>- SAR {totals.discount.toFixed(2)}</span>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
            <span style={{ fontSize: '15px', color: '#475569' }}>VAT (15%):</span>
            <span style={{ fontSize: '15px', fontWeight: '600', color: '#0f172a' }}>SAR {totals.vat.toFixed(2)}</span>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', paddingTop: '12px', borderTop: '2px solid #e2e8f0' }}>
            <span style={{ fontSize: '18px', fontWeight: '700', color: '#0f172a' }}>Grand Total:</span>
            <span style={{ fontSize: '18px', fontWeight: '800', color: '#002e17' }}>SAR {totals.grand.toFixed(2)}</span>
          </div>
        </div>

        <button type="submit" style={{ width: '100%', padding: '14px', background: '#002e17', color: 'white', border: 'none', borderRadius: '12px', fontSize: '16px', fontWeight: '700', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px' }}>
          <Save style={{ width: '18px', height: '18px' }} /> Save Invoice
        </button>
      </form>
    </div>
  );
};

export default InvoiceForm;
