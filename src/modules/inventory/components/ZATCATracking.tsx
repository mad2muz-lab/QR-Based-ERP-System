import React, { useState, useEffect } from 'react';
import { CheckCircle, Clock, XCircle, AlertTriangle, Send, RotateCcw, Eye, FileText, Shield, RefreshCw } from 'lucide-react';
import { getInvoices } from '../../../utils/erpInvoiceService';
import { getZATCASubmissions, getZATCASubmissionByInvoice, createZATCASubmission, updateZATCASubmission, submitToZATCA, approveZATCASubmission, rejectZATCASubmission, clearZATCASubmission, getZATCAStatusColor } from '../../../utils/zatcaService';

const ZATCATracking: React.FC = () => {
  const [invoices, setInvoices] = useState<any[]>([]);
  const [submissions, setSubmissions] = useState<any[]>([]);
  const [statusFilter, setStatusFilter] = useState('all');
  const [selectedSubmission, setSelectedSubmission] = useState<any>(null);

  useEffect(() => {
    const invs = getInvoices();
    setInvoices(invs);
    setSubmissions(getZATCASubmissions());
  }, []);

  const getOrCreateSubmission = (invoice: any) => {
    let submission = getZATCASubmissionByInvoice(invoice.id);
    if (!submission) {
      submission = createZATCASubmission(invoice);
      setSubmissions(getZATCASubmissions());
    }
    return submission;
  };

  const handleSubmit = (submission: any) => {
    submitToZATCA(submission.id);
    setSubmissions(getZATCASubmissions());
  };

  const handleApprove = (submission: any) => {
    approveZATCASubmission(submission.id);
    setSubmissions(getZATCASubmissions());
  };

  const handleReject = (submission: any) => {
    rejectZATCASubmission(submission.id, ['ZATCA validation failed']);
    setSubmissions(getZATCASubmissions());
  };

  const handleClear = (submission: any) => {
    clearZATCASubmission(submission.id);
    setSubmissions(getZATCASubmissions());
  };

  const filteredSubmissions = submissions.filter(s => statusFilter === 'all' || s.status === statusFilter);

  const statusCounts = {
    all: submissions.length,
    draft: submissions.filter(s => s.status === 'draft').length,
    ready: submissions.filter(s => s.status === 'ready').length,
    submitted: submissions.filter(s => s.status === 'submitted').length,
    approved: submissions.filter(s => s.status === 'approved').length,
    rejected: submissions.filter(s => s.status === 'rejected').length,
    cleared: submissions.filter(s => s.status === 'cleared').length,
  };

  const statusIcon = (status: string) => {
    switch (status) {
      case 'approved':
      case 'cleared': return <CheckCircle style={{ width: '18px', height: '18px' }} />;
      case 'rejected': return <XCircle style={{ width: '18px', height: '18px' }} />;
      case 'submitted': return <Send style={{ width: '18px', height: '18px' }} />;
      case 'ready': return <Shield style={{ width: '18px', height: '18px' }} />;
      default: return <Clock style={{ width: '18px', height: '18px' }} />;
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      {/* Stats */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: '12px' }}>
        {[
          { key: 'all', label: 'All', color: '#475569' },
          { key: 'draft', label: 'Draft', color: '#475569' },
          { key: 'ready', label: 'Ready', color: '#2563eb' },
          { key: 'submitted', label: 'Submitted', color: '#7c3aed' },
          { key: 'approved', label: 'Approved', color: '#059669' },
          { key: 'rejected', label: 'Rejected', color: '#dc2626' },
        ].map(item => (
          <button
            key={item.key}
            onClick={() => setStatusFilter(item.key)}
            style={{ padding: '16px', borderRadius: '12px', border: `2px solid ${statusFilter === item.key ? item.color : '#e2e8f0'}`, background: statusFilter === item.key ? '#f8fafc' : 'white', cursor: 'pointer', textAlign: 'left' }}
          >
            <div style={{ fontSize: '13px', color: '#6b7280', marginBottom: '4px' }}>{item.label}</div>
            <div style={{ fontSize: '28px', fontWeight: '800', color: item.color }}>{statusCounts[item.key as keyof typeof statusCounts]}</div>
          </button>
        ))}
      </div>

      {/* Submission List */}
      <div style={{ background: 'white', borderRadius: '16px', border: '2px solid #e2e8f0', overflow: 'hidden' }}>
        <div style={{ padding: '20px 24px', borderBottom: '2px solid #e2e8f0', display: 'flex', alignItems: 'center', gap: '12px' }}>
          <RefreshCw style={{ width: '22px', height: '22px', color: '#002e17' }} />
          <h3 style={{ fontSize: '18px', fontWeight: '700', color: '#0f172a', margin: 0 }}>ZATCA Submission Tracking</h3>
        </div>

        <div style={{ maxHeight: '500px', overflowY: 'auto' }}>
          {filteredSubmissions.length === 0 ? (
            <div style={{ padding: '40px', textAlign: 'center' }}>
              <FileText style={{ width: '40px', height: '40px', color: '#cbd5e1', margin: '0 auto 12px' }} />
              <p style={{ fontSize: '16px', color: '#64748b' }}>No submissions found</p>
              <p style={{ fontSize: '14px', color: '#94a3b8' }}>Invoices will appear here when created</p>
            </div>
          ) : (
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ borderBottom: '2px solid #e2e8f0' }}>
                  <th style={{ padding: '14px 16px', textAlign: 'left', fontSize: '13px', fontWeight: '700', color: '#475569' }}>Invoice</th>
                  <th style={{ padding: '14px 16px', textAlign: 'left', fontSize: '13px', fontWeight: '700', color: '#475569' }}>Status</th>
                  <th style={{ padding: '14px 16px', textAlign: 'left', fontSize: '13px', fontWeight: '700', color: '#475569' }}>Submitted</th>
                  <th style={{ padding: '14px 16px', textAlign: 'left', fontSize: '13px', fontWeight: '700', color: '#475569' }}>Reference</th>
                  <th style={{ padding: '14px 16px', textAlign: 'center', fontSize: '13px', fontWeight: '700', color: '#475569' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredSubmissions.map(sub => {
                  const sc = getZATCAStatusColor(sub.status);
                  return (
                    <tr key={sub.id} style={{ borderBottom: '1px solid #f1f5f9' }}>
                      <td style={{ padding: '14px 16px', fontSize: '14px', fontWeight: '600', color: '#0f172a' }}>{sub.invoiceNumber}</td>
                      <td style={{ padding: '14px 16px' }}>
                        <span style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', padding: '6px 14px', borderRadius: '20px', fontSize: '13px', fontWeight: '700', background: sc.bg, color: sc.color }}>
                          {statusIcon(sub.status)}
                          {sub.status}
                        </span>
                      </td>
                      <td style={{ padding: '14px 16px', fontSize: '14px', color: '#6b7280' }}>{sub.submissionDate ? new Date(sub.submissionDate).toLocaleDateString() : '-'}</td>
                      <td style={{ padding: '14px 16px', fontSize: '14px', color: '#6b7280' }}>{sub.zatcaReference || '-'}</td>
                      <td style={{ padding: '14px 16px', textAlign: 'center' }}>
                        <div style={{ display: 'flex', gap: '6px', justifyContent: 'center' }}>
                          {(sub.status === 'draft' || sub.status === 'ready') && (
                            <button onClick={() => handleSubmit(sub)} title="Submit to ZATCA" style={{ padding: '8px', background: '#eff6ff', color: '#2563eb', border: 'none', borderRadius: '6px', cursor: 'pointer' }}>
                              <Send style={{ width: '16px', height: '16px' }} />
                            </button>
                          )}
                          {sub.status === 'submitted' && (
                            <>
                              <button onClick={() => handleApprove(sub)} title="Approve" style={{ padding: '8px', background: '#ecfdf5', color: '#059669', border: 'none', borderRadius: '6px', cursor: 'pointer' }}>
                                <CheckCircle style={{ width: '16px', height: '16px' }} />
                              </button>
                              <button onClick={() => handleReject(sub)} title="Reject" style={{ padding: '8px', background: '#fef2f2', color: '#dc2626', border: 'none', borderRadius: '6px', cursor: 'pointer' }}>
                                <XCircle style={{ width: '16px', height: '16px' }} />
                              </button>
                            </>
                          )}
                          {sub.status === 'approved' && (
                            <button onClick={() => handleClear(sub)} title="Clear" style={{ padding: '8px', background: '#f5f3ff', color: '#7c3aed', border: 'none', borderRadius: '6px', cursor: 'pointer' }}>
                              <RotateCcw style={{ width: '16px', height: '16px' }} />
                            </button>
                          )}
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
    </div>
  );
};

export default ZATCATracking;
