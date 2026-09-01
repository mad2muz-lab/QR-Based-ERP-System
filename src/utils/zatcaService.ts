export interface ZATCASubmission {
  id: string;
  invoiceId: string;
  invoiceNumber: string;
  status: 'draft' | 'incomplete' | 'ready' | 'submitted' | 'approved' | 'rejected' | 'cleared';
  submissionDate?: string;
  clearanceDate?: string;
  zatcaReference?: string;
  zatcaUuid?: string;
  qrCode?: string;
  xmlHash?: string;
  complianceScore: number;
  errors?: string[];
  warnings?: string[];
  responseXml?: string;
  createdAt: string;
  updatedAt: string;
}

const ZATCA_KEY = 'erp_zatca_submissions';

export const getZATCASubmissions = (): ZATCASubmission[] => {
  const stored = localStorage.getItem(ZATCA_KEY);
  return stored ? JSON.parse(stored) : [];
};

export const getZATCASubmissionByInvoice = (invoiceId: string): ZATCASubmission | undefined => {
  return getZATCASubmissions().find(s => s.invoiceId === invoiceId);
};

export const createZATCASubmission = (invoice: any): ZATCASubmission => {
  const submission: ZATCASubmission = {
    id: `zatca-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
    invoiceId: invoice.id,
    invoiceNumber: invoice.invoiceNumber,
    status: 'draft',
    complianceScore: 0,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  };
  const submissions = getZATCASubmissions();
  submissions.push(submission);
  localStorage.setItem(ZATCA_KEY, JSON.stringify(submissions));
  return submission;
};

export const updateZATCASubmission = (id: string, updates: Partial<ZATCASubmission>): void => {
  const submissions = getZATCASubmissions();
  const index = submissions.findIndex(s => s.id === id);
  if (index >= 0) {
    submissions[index] = { ...submissions[index], ...updates, updatedAt: new Date().toISOString() };
    localStorage.setItem(ZATCA_KEY, JSON.stringify(submissions));
  }
};

export const submitToZATCA = (id: string): void => {
  updateZATCASubmission(id, {
    status: 'submitted',
    submissionDate: new Date().toISOString(),
    zatcaReference: `ZATCA-${Date.now()}`,
    zatcaUuid: crypto.randomUUID()
  });
};

export const approveZATCASubmission = (id: string): void => {
  updateZATCASubmission(id, {
    status: 'approved',
    clearanceDate: new Date().toISOString()
  });
};

export const rejectZATCASubmission = (id: string, errors: string[]): void => {
  updateZATCASubmission(id, {
    status: 'rejected',
    errors
  });
};

export const clearZATCASubmission = (id: string): void => {
  updateZATCASubmission(id, {
    status: 'cleared',
    clearanceDate: new Date().toISOString()
  });
};

export const getZATCAStatusColor = (status: string) => {
  switch (status) {
    case 'draft': return { bg: '#f1f5f9', color: '#475569' };
    case 'incomplete': return { bg: '#fff7ed', color: '#ea580c' };
    case 'ready': return { bg: '#eff6ff', color: '#2563eb' };
    case 'submitted': return { bg: '#f5f3ff', color: '#7c3aed' };
    case 'approved': return { bg: '#ecfdf5', color: '#059669' };
    case 'cleared': return { bg: '#ecfdf5', color: '#059669' };
    case 'rejected': return { bg: '#fef2f2', color: '#dc2626' };
    default: return { bg: '#f1f5f9', color: '#475569' };
  }
};
