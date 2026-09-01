import React, { useState, useEffect } from 'react';
import { CheckCircle, XCircle, AlertTriangle, QrCode, FileText, Shield } from 'lucide-react';
import { Invoice, getInvoices, generateZATCAXML, getZATCAComplianceChecklist, generateQRCodeData } from '../../../utils/erpInvoiceService';

const ZATCADashboard: React.FC = () => {
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [selectedInvoice, setSelectedInvoice] = useState<Invoice | null>(null);
  const [checklist, setChecklist] = useState<{ item: string; passed: boolean }[]>([]);
  const [showXML, setShowXML] = useState(false);

  useEffect(() => { setInvoices(getInvoices()); }, []);

  const handleSelectInvoice = (inv: Invoice) => {
    setSelectedInvoice(inv);
    setChecklist(getZATCAComplianceChecklist(inv));
  };

  const compliantCount = invoices.filter(i => i.isCompliant).length;
  const nonCompliantCount = invoices.length - compliantCount;

  return (
    <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '32px', display: 'flex', flexDirection: 'column', gap: '20px' }}>
      {/* Stats */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px' }}>
        <div style={{ background: 'white', borderRadius: '16px', border: '2px solid #e2e8f0', padding: '20px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div style={{ width: '40px', height: '40px', borderRadius: '10px', background: '#ecfdf5', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><CheckCircle style={{ width: '20px', height: '20px', color: '#059669' }} /></div>
            <div><p style={{ fontSize: '13px', color: '#6b7280', margin: 0 }}>Compliant</p><p style={{ fontSize: '24px', fontWeight: '800', color: '#059669', margin: 0 }}>{compliantCount}</p></div>
          </div>
        </div>
        <div style={{ background: 'white', borderRadius: '16px', border: '2px solid #e2e8f0', padding: '20px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div style={{ width: '40px', height: '40px', borderRadius: '10px', background: '#fef2f2', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><XCircle style={{ width: '20px', height: '20px', color: '#dc2626' }} /></div>
            <div><p style={{ fontSize: '13px', color: '#6b7280', margin: 0 }}>Non-Compliant</p><p style={{ fontSize: '24px', fontWeight: '800', color: '#dc2626', margin: 0 }}>{nonCompliantCount}</p></div>
          </div>
        </div>
        <div style={{ background: 'white', borderRadius: '16px', border: '2px solid #e2e8f0', padding: '20px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div style={{ width: '40px', height: '40px', borderRadius: '10px', background: '#eff6ff', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><FileText style={{ width: '20px', height: '20px', color: '#2563eb' }} /></div>
            <div><p style={{ fontSize: '13px', color: '#6b7280', margin: 0 }}>Total Invoices</p><p style={{ fontSize: '24px', fontWeight: '800', color: '#0f172a', margin: 0 }}>{invoices.length}</p></div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
        {/* Invoice List */}
        <div style={{ background: 'white', borderRadius: '16px', border: '2px solid #e2e8f0', overflow: 'hidden' }}>
          <div style={{ padding: '20px 24px', borderBottom: '2px solid #e2e8f0', display: 'flex', alignItems: 'center', gap: '12px' }}>
            <Shield style={{ width: '22px', height: '22px', color: '#002e17' }} /><h3 style={{ fontSize: '18px', fontWeight: '700', color: '#0f172a', margin: 0 }}>Invoices</h3>
          </div>
          <div style={{ maxHeight: '400px', overflowY: 'auto' }}>
            {invoices.length === 0 ? (
              <div style={{ padding: '30px', textAlign: 'center' }}><p style={{ fontSize: '14px', color: '#94a3b8' }}>No invoices</p></div>
            ) : (
              invoices.map(inv => (
                <div key={inv.id} onClick={() => handleSelectInvoice(inv)} style={{ padding: '14px 24px', borderBottom: '1px solid #f1f5f9', cursor: 'pointer', background: selectedInvoice?.id === inv.id ? '#f8fafc' : 'transparent' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div><p style={{ fontSize: '14px', fontWeight: '600', color: '#0f172a', margin: 0 }}>{inv.invoiceNumber}</p><p style={{ fontSize: '13px', color: '#6b7280', margin: 0 }}>{inv.customerName}</p></div>
                    <span style={{ padding: '4px 12px', borderRadius: '20px', fontSize: '12px', fontWeight: '700', background: inv.isCompliant ? '#ecfdf5' : '#fef2f2', color: inv.isCompliant ? '#059669' : '#dc2626' }}>{inv.isCompliant ? 'Compliant' : 'Non-Compliant'}</span>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Compliance Details */}
        <div style={{ background: 'white', borderRadius: '16px', border: '2px solid #e2e8f0', overflow: 'hidden' }}>
          <div style={{ padding: '20px 24px', borderBottom: '2px solid #e2e8f0', display: 'flex', alignItems: 'center', gap: '12px' }}>
            <CheckCircle style={{ width: '22px', height: '22px', color: '#059669' }} /><h3 style={{ fontSize: '18px', fontWeight: '700', color: '#0f172a', margin: 0 }}>Compliance Check</h3>
          </div>
          {selectedInvoice ? (
            <div style={{ padding: '20px 24px' }}>
              <p style={{ fontSize: '14px', fontWeight: '600', color: '#0f172a', marginBottom: '16px' }}>{selectedInvoice.invoiceNumber}</p>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                {checklist.map((item, idx) => (
                  <div key={idx} style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '8px 12px', borderRadius: '8px', background: item.passed ? '#f0fdf4' : '#fef2f2' }}>
                    {item.passed ? <CheckCircle style={{ width: '16px', height: '16px', color: '#059669' }} /> : <AlertTriangle style={{ width: '16px', height: '16px', color: '#d97706' }} />}
                    <span style={{ fontSize: '13px', color: item.passed ? '#065f46' : '#92400e' }}>{item.item}</span>
                  </div>
                ))}
              </div>
              <div style={{ marginTop: '16px', display: 'flex', gap: '8px' }}>
                <button onClick={() => setShowXML(true)} style={{ padding: '8px 16px', background: '#4b5563', color: 'white', border: 'none', borderRadius: '8px', fontWeight: '600', fontSize: '13px', cursor: 'pointer' }}>View XML</button>
                <button onClick={() => { const qr = generateQRCodeData(selectedInvoice); alert(`QR Data: ${qr}`); }} style={{ padding: '8px 16px', background: '#2563eb', color: 'white', border: 'none', borderRadius: '8px', fontWeight: '600', fontSize: '13px', cursor: 'pointer' }}>Generate QR</button>
              </div>
            </div>
          ) : (
            <div style={{ padding: '30px', textAlign: 'center' }}><p style={{ fontSize: '14px', color: '#94a3b8' }}>Select an invoice</p></div>
          )}
        </div>
      </div>

      {/* XML Modal */}
      {showXML && selectedInvoice && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 100 }}>
          <div style={{ background: 'white', borderRadius: '16px', padding: '28px', maxWidth: '700px', width: '90%', maxHeight: '80vh', overflow: 'auto' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}><h3 style={{ fontSize: '18px', fontWeight: '700', color: '#0f172a', margin: 0 }}>ZATCA XML</h3><button onClick={() => setShowXML(false)} style={{ background: 'none', border: 'none', fontSize: '18px', cursor: 'pointer', color: '#6b7280' }}>✕</button></div>
            <pre style={{ background: '#f8fafc', padding: '16px', borderRadius: '8px', fontSize: '12px', overflow: 'auto', maxHeight: '50vh', whiteSpace: 'pre-wrap' }}>{generateZATCAXML(selectedInvoice)}</pre>
          </div>
        </div>
      )}
    </div>
  );
};

export default ZATCADashboard;
