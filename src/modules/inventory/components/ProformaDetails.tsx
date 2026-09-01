import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, Printer, Download, FileText, CheckCircle } from 'lucide-react';
import { ProformaInvoice, getProformaById, saveProforma } from '../../../utils/proformaService';
import { createInvoiceFromProforma } from '../../../utils/invoiceService';

const ProformaDetails: React.FC = () => {
  const navigate = useNavigate();
  const { id } = useParams();
  const [proforma, setProforma] = useState<ProformaInvoice | null>(null);

  useEffect(() => {
    if (id) {
      const found = getProformaById(id);
      if (found) setProforma(found);
    }
  }, [id]);

  if (!proforma) {
    return (
      <div style={{ padding: '40px', textAlign: 'center' }}>
        <p style={{ fontSize: '16px', color: '#6b7280' }}>Proforma not found</p>
      </div>
    );
  }

  const handlePrint = () => {
    const printWindow = window.open('', '_blank');
    if (!printWindow) return;

    const html = `
      <html>
        <head>
          <title>Proforma ${proforma.proformaNumber}</title>
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
            .footer { margin-top: 40px; padding-top: 20px; border-top: 1px solid #e2e8f0; font-size: 13px; color: #6b7280; }
          </style>
        </head>
        <body>
          <div class="header">
            <div>
              <div class="company">${localStorage.getItem('company_details') ? JSON.parse(localStorage.getItem('company_details') || '{}').name : 'Company Name'}</div>
              <div style="color: #6b7280; margin-top: 4px;">Tax ID: ${JSON.parse(localStorage.getItem('company_details') || '{}').taxId || 'N/A'}</div>
            </div>
            <div style="text-align: right;">
              <div class="title">PROFORMA INVOICE</div>
              <div style="color: #6b7280; margin-top: 4px;">${proforma.proformaNumber}</div>
            </div>
          </div>
          <div class="info-grid">
            <div>
              <div class="info-label">Bill To</div>
              <div class="info-value">${proforma.customerName}</div>
              ${proforma.customerAddress ? `<div style="color: #6b7280; margin-top: 4px;">${proforma.customerAddress}</div>` : ''}
              ${proforma.customerVatNumber ? `<div style="color: #6b7280; margin-top: 4px;">VAT: ${proforma.customerVatNumber}</div>` : ''}
            </div>
            <div style="text-align: right;">
              <div class="info-label">Issue Date</div>
              <div class="info-value">${proforma.issueDate}</div>
              <div class="info-label" style="margin-top: 12px;">Expiry Date</div>
              <div class="info-value">${proforma.expiryDate}</div>
              <div class="info-label" style="margin-top: 12px;">Status</div>
              <span class="status" style="background: #ecfdf5; color: #059669;">${proforma.status.toUpperCase()}</span>
            </div>
          </div>
          <table>
            <thead>
              <tr>
                <th>#</th>
                <th>Description</th>
                <th>Qty</th>
                <th>Unit Price</th>
                <th>Discount</th>
                <th>VAT</th>
                <th style="text-align: right;">Total</th>
              </tr>
            </thead>
            <tbody>
              ${proforma.items.map((item, idx) => `
                <tr>
                  <td>${idx + 1}</td>
                  <td>${item.description}</td>
                  <td>${item.quantity} ${item.unit}</td>
                  <td>SAR ${item.unitPrice.toFixed(2)}</td>
                  <td>SAR ${item.discount.toFixed(2)}</td>
                  <td>SAR ${item.vatAmount.toFixed(2)}</td>
                  <td style="text-align: right; font-weight: 600;">SAR ${item.totalAmount.toFixed(2)}</td>
                </tr>
              `).join('')}
            </tbody>
          </table>
          <div class="totals">
            <div class="total-row"><span>Subtotal:</span><span>SAR ${proforma.subtotal.toFixed(2)}</span></div>
            <div class="total-row"><span>Discount:</span><span style="color: #dc2626;">- SAR ${proforma.totalDiscount.toFixed(2)}</span></div>
            <div class="total-row"><span>VAT (15%):</span><span>SAR ${proforma.totalVat.toFixed(2)}</span></div>
            <div class="total-row grand-total"><span>Grand Total:</span><span>SAR ${proforma.grandTotal.toFixed(2)}</span></div>
          </div>
          ${proforma.notes ? `<div class="footer"><strong>Notes:</strong> ${proforma.notes}</div>` : ''}
          <div class="footer" style="text-align: center; margin-top: 20px;">This is a proforma invoice and not a tax invoice.</div>
          <script>window.onload = () => { window.print(); };</script>
        </body>
      </html>
    `;
    printWindow.document.write(html);
    printWindow.document.close();
  };

  const handleConvertToInvoice = () => {
    if (confirm('Convert this proforma to a final invoice? This will mark it as converted.')) {
      const invoice = createInvoiceFromProforma(proforma);
      saveProforma({ ...proforma, status: 'converted', convertedToInvoiceId: invoice.id });
      setProforma({ ...proforma, status: 'converted', convertedToInvoiceId: invoice.id });
      alert(`Invoice ${invoice.invoiceNumber} created successfully!`);
      navigate(`/inventory/invoice/${invoice.id}`);
    }
  };

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

  const statusColor = getStatusColor(proforma.status);

  return (
    <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '32px', background: 'white', borderRadius: '16px', border: '2px solid #e2e8f0', padding: '28px' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '24px', flexWrap: 'wrap', gap: '12px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <button onClick={() => navigate('/inventory/proforma')} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: '8px' }}>
            <ArrowLeft style={{ width: '20px', height: '20px', color: '#475569' }} />
          </button>
          <div>
            <h2 style={{ fontSize: '22px', fontWeight: '700', color: '#0f172a', margin: 0 }}>{proforma.proformaNumber}</h2>
            <p style={{ fontSize: '14px', color: '#6b7280', margin: '2px 0 0 0' }}>Proforma Invoice</p>
          </div>
        </div>
        <div style={{ display: 'flex', gap: '10px' }}>
          <button onClick={handlePrint} style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '10px 20px', background: '#4b5563', color: 'white', border: 'none', borderRadius: '10px', fontWeight: '600', fontSize: '14px', cursor: 'pointer' }}>
            <Printer style={{ width: '16px', height: '16px' }} /> Print
          </button>
          {proforma.status !== 'converted' && (
            <button onClick={handleConvertToInvoice} style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '10px 20px', background: '#059669', color: 'white', border: 'none', borderRadius: '10px', fontWeight: '600', fontSize: '14px', cursor: 'pointer' }}>
              <CheckCircle style={{ width: '16px', height: '16px' }} /> Convert to Invoice
            </button>
          )}
        </div>
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '24px' }}>
        <span style={{ padding: '6px 16px', borderRadius: '20px', fontSize: '14px', fontWeight: '700', background: statusColor.bg, color: statusColor.color, textTransform: 'capitalize' }}>
          {proforma.status}
        </span>
        <span style={{ fontSize: '14px', color: '#6b7280' }}>Created: {new Date(proforma.createdAt).toLocaleDateString()}</span>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px', marginBottom: '24px', padding: '20px', background: '#f8fafc', borderRadius: '12px' }}>
        <div>
          <h4 style={{ fontSize: '13px', fontWeight: '700', color: '#6b7280', textTransform: 'uppercase', margin: '0 0 8px 0' }}>Bill To</h4>
          <p style={{ fontSize: '16px', fontWeight: '700', color: '#0f172a', margin: '0 0 4px 0' }}>{proforma.customerName}</p>
          {proforma.customerAddress && <p style={{ fontSize: '14px', color: '#6b7280', margin: '0 0 4px 0' }}>{proforma.customerAddress}</p>}
          {proforma.customerVatNumber && <p style={{ fontSize: '14px', color: '#6b7280', margin: 0 }}>VAT: {proforma.customerVatNumber}</p>}
        </div>
        <div style={{ textAlign: 'right' }}>
          <div style={{ marginBottom: '12px' }}>
            <span style={{ fontSize: '13px', fontWeight: '700', color: '#6b7280', textTransform: 'uppercase' }}>Issue Date</span>
            <p style={{ fontSize: '16px', fontWeight: '600', color: '#0f172a', margin: '4px 0 0 0' }}>{proforma.issueDate}</p>
          </div>
          <div>
            <span style={{ fontSize: '13px', fontWeight: '700', color: '#6b7280', textTransform: 'uppercase' }}>Expiry Date</span>
            <p style={{ fontSize: '16px', fontWeight: '600', color: '#0f172a', margin: '4px 0 0 0' }}>{proforma.expiryDate}</p>
          </div>
        </div>
      </div>

      <table style={{ width: '100%', borderCollapse: 'collapse', marginBottom: '24px' }}>
        <thead>
          <tr style={{ borderBottom: '2px solid #e2e8f0' }}>
            <th style={{ padding: '12px', textAlign: 'left', fontSize: '13px', fontWeight: '700', color: '#475569' }}>#</th>
            <th style={{ padding: '12px', textAlign: 'left', fontSize: '13px', fontWeight: '700', color: '#475569' }}>Description</th>
            <th style={{ padding: '12px', textAlign: 'center', fontSize: '13px', fontWeight: '700', color: '#475569' }}>Qty</th>
            <th style={{ padding: '12px', textAlign: 'right', fontSize: '13px', fontWeight: '700', color: '#475569' }}>Price</th>
            <th style={{ padding: '12px', textAlign: 'right', fontSize: '13px', fontWeight: '700', color: '#475569' }}>Discount</th>
            <th style={{ padding: '12px', textAlign: 'right', fontSize: '13px', fontWeight: '700', color: '#475569' }}>VAT</th>
            <th style={{ padding: '12px', textAlign: 'right', fontSize: '13px', fontWeight: '700', color: '#475569' }}>Total</th>
          </tr>
        </thead>
        <tbody>
          {proforma.items.map((item, idx) => (
            <tr key={item.id} style={{ borderBottom: '1px solid #f1f5f9' }}>
              <td style={{ padding: '12px', fontSize: '14px', color: '#6b7280' }}>{idx + 1}</td>
              <td style={{ padding: '12px', fontSize: '14px', fontWeight: '600', color: '#0f172a' }}>{item.description}</td>
              <td style={{ padding: '12px', fontSize: '14px', color: '#475569', textAlign: 'center' }}>{item.quantity} {item.unit}</td>
              <td style={{ padding: '12px', fontSize: '14px', color: '#475569', textAlign: 'right' }}>{item.unitPrice.toFixed(2)}</td>
              <td style={{ padding: '12px', fontSize: '14px', color: '#dc2626', textAlign: 'right' }}>{item.discount.toFixed(2)}</td>
              <td style={{ padding: '12px', fontSize: '14px', color: '#475569', textAlign: 'right' }}>{item.vatAmount.toFixed(2)}</td>
              <td style={{ padding: '12px', fontSize: '14px', fontWeight: '700', color: '#0f172a', textAlign: 'right' }}>{item.totalAmount.toFixed(2)}</td>
            </tr>
          ))}
        </tbody>
      </table>

      <div style={{ width: '300px', marginLeft: 'auto', padding: '20px', background: '#f8fafc', borderRadius: '12px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
          <span style={{ fontSize: '14px', color: '#6b7280' }}>Subtotal:</span>
          <span style={{ fontSize: '14px', fontWeight: '600', color: '#0f172a' }}>SAR {proforma.subtotal.toFixed(2)}</span>
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
          <span style={{ fontSize: '14px', color: '#6b7280' }}>Discount:</span>
          <span style={{ fontSize: '14px', fontWeight: '600', color: '#dc2626' }}>- SAR {proforma.totalDiscount.toFixed(2)}</span>
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
          <span style={{ fontSize: '14px', color: '#6b7280' }}>VAT (15%):</span>
          <span style={{ fontSize: '14px', fontWeight: '600', color: '#0f172a' }}>SAR {proforma.totalVat.toFixed(2)}</span>
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between', paddingTop: '12px', borderTop: '2px solid #002e17' }}>
          <span style={{ fontSize: '18px', fontWeight: '700', color: '#0f172a' }}>Grand Total:</span>
          <span style={{ fontSize: '18px', fontWeight: '800', color: '#002e17' }}>SAR {proforma.grandTotal.toFixed(2)}</span>
        </div>
      </div>

      {proforma.notes && (
        <div style={{ marginTop: '24px', padding: '16px', background: '#fffbeb', borderRadius: '12px', border: '2px solid #fde68a' }}>
          <p style={{ fontSize: '14px', fontWeight: '600', color: '#92400e', margin: '0 0 4px 0' }}>Notes:</p>
          <p style={{ fontSize: '14px', color: '#92400e', margin: 0 }}>{proforma.notes}</p>
        </div>
      )}
    </div>
  );
};

export default ProformaDetails;
