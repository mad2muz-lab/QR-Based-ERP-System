import { Invoice, InvoiceItem, Quotation, QuotationItem, Payment, ChartOfAccount, JournalEntry } from '../types';

// ==================== INVOICE SERVICE ====================

const INVOICE_KEY = 'erp_invoices';
const QUOTATION_KEY = 'erp_quotations';
const PAYMENT_KEY = 'erp_payments';
const COA_KEY = 'erp_chart_of_accounts';
const JOURNAL_KEY = 'erp_journal_entries';

const getStorageKey = (type: string) => {
  switch (type) {
    case 'invoice': return INVOICE_KEY;
    case 'quotation': return QUOTATION_KEY;
    case 'payment': return PAYMENT_KEY;
    case 'coa': return COA_KEY;
    case 'journal': return JOURNAL_KEY;
    default: return `erp_${type}`;
  }
};

const generateNumber = (type: string, prefix: string): string => {
  const date = new Date();
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const items = getItems(type);
  const count = items.filter((i: any) => i[`${type}Number`]?.startsWith(`${prefix}-${year}${month}`)).length + 1;
  return `${prefix}-${year}${month}-${String(count).padStart(4, '0')}`;
};

const getItems = (type: string): any[] => {
  const stored = localStorage.getItem(getStorageKey(type));
  return stored ? JSON.parse(stored) : [];
};

const saveItems = (type: string, items: any[]): void => {
  localStorage.setItem(getStorageKey(type), JSON.stringify(items));
};

// ==================== INVOICE OPERATIONS ====================

export const getInvoices = (): Invoice[] => getItems('invoice');
export const getInvoiceById = (id: string): Invoice | undefined => getInvoices().find(i => i.id === id);

export const createInvoice = (data: Omit<Invoice, 'id' | 'invoiceNumber' | 'createdAt' | 'updatedAt'>): Invoice => {
  const invoice: Invoice = {
    ...data,
    id: `inv-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
    invoiceNumber: generateNumber('invoice', data.invoiceType === 'credit_note' ? 'CN' : data.invoiceType === 'debit_note' ? 'DN' : data.invoiceType === 'simplified' ? 'SINV' : 'INV'),
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  };
  const invoices = getInvoices();
  invoices.push(invoice);
  saveItems('invoice', invoices);
  return invoice;
};

export const updateInvoice = (id: string, updates: Partial<Invoice>): void => {
  const invoices = getInvoices();
  const index = invoices.findIndex(i => i.id === id);
  if (index >= 0) {
    invoices[index] = { ...invoices[index], ...updates, updatedAt: new Date().toISOString() };
    saveItems('invoice', invoices);
  }
};

export const deleteInvoice = (id: string): void => {
  saveItems('invoice', getInvoices().filter(i => i.id !== id));
};

export const createInvoiceFromQuotation = (quotation: Quotation): Invoice => {
  const invoiceItems: InvoiceItem[] = quotation.items.map(item => ({
    ...item,
    id: `inv-item-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`,
    vatAmount: item.vatAmount || 0,
    taxableAmount: item.totalAmount - (item.vatAmount || 0),
    supplyType: 'taxable'
  }));

  return createInvoice({
    invoiceType: 'standard',
    quotationId: quotation.id,
    customerName: quotation.customerName,
    customerNameArabic: quotation.customerNameArabic,
    customerAddress: quotation.customerAddress,
    customerVatNumber: quotation.customerVatNumber,
    issueDate: new Date().toISOString().split('T')[0],
    dueDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    currency: quotation.currency || 'SAR',
    subtotal: quotation.subtotal,
    totalDiscount: quotation.totalDiscount,
    totalVat: quotation.totalVat,
    grandTotal: quotation.grandTotal,
    vatRate: quotation.vatRate || 15,
    status: 'draft',
    paymentStatus: 'unpaid',
    amountPaid: 0,
    items: invoiceItems,
    createdBy: 'System'
  });
};

// ==================== QUOTATION OPERATIONS ====================

export const getQuotations = (): Quotation[] => getItems('quotation');
export const getQuotationById = (id: string): Quotation | undefined => getQuotations().find(q => q.id === id);

export const createQuotation = (data: Omit<Quotation, 'id' | 'quotationNumber' | 'createdAt' | 'updatedAt'>): Quotation => {
  const quotation: Quotation = {
    ...data,
    id: `quo-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
    quotationNumber: generateNumber('quotation', 'QUO'),
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  };
  const quotations = getQuotations();
  quotations.push(quotation);
  saveItems('quotation', quotations);
  return quotation;
};

export const updateQuotation = (id: string, updates: Partial<Quotation>): void => {
  const quotations = getQuotations();
  const index = quotations.findIndex(q => q.id === id);
  if (index >= 0) {
    quotations[index] = { ...quotations[index], ...updates, updatedAt: new Date().toISOString() };
    saveItems('quotation', quotations);
  }
};

export const deleteQuotation = (id: string): void => {
  saveItems('quotation', getQuotations().filter(q => q.id !== id));
};

// ==================== PAYMENT OPERATIONS ====================

export const getPayments = (): Payment[] => getItems('payment');
export const getPaymentsByInvoice = (invoiceId: string): Payment[] => getPayments().filter(p => p.invoiceId === invoiceId);

export const createPayment = (data: Omit<Payment, 'id' | 'paymentNumber' | 'createdAt'>): Payment => {
  const payment: Payment = {
    ...data,
    id: `pay-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
    paymentNumber: generateNumber('payment', 'PAY'),
    createdAt: new Date().toISOString()
  };
  const payments = getPayments();
  payments.push(payment);
  saveItems('payment', payments);

  // Update invoice payment status
  const invoice = getInvoiceById(data.invoiceId);
  if (invoice) {
    const totalPaid = getPaymentsByInvoice(invoice.id).reduce((sum, p) => sum + p.amount, 0);
    invoice.amountPaid = totalPaid;
    if (totalPaid >= invoice.grandTotal) {
      invoice.paymentStatus = 'paid';
      invoice.status = 'paid';
    } else if (totalPaid > 0) {
      invoice.paymentStatus = 'partial';
    }
    updateInvoice(invoice.id, invoice);
  }

  return payment;
};

export const deletePayment = (id: string): void => {
  saveItems('payment', getPayments().filter(p => p.id !== id));
};

export const generatePaymentNumber = (): string => generateNumber('payment', 'PAY');

// ==================== CHART OF ACCOUNTS ====================

export const getChartOfAccounts = (): ChartOfAccount[] => {
  const stored = localStorage.getItem(COA_KEY);
  const accounts = stored ? JSON.parse(stored) : [];
  if (accounts.length === 0) {
    const defaults: ChartOfAccount[] = [
      { id: 'acc-1000', code: '1000', name: 'Cash', type: 'asset', isActive: true, createdAt: new Date().toISOString() },
      { id: 'acc-1200', code: '1200', name: 'Accounts Receivable', type: 'asset', isActive: true, createdAt: new Date().toISOString() },
      { id: 'acc-2000', code: '2000', name: 'Accounts Payable', type: 'liability', isActive: true, createdAt: new Date().toISOString() },
      { id: 'acc-2100', code: '2100', name: 'VAT Payable', type: 'liability', isActive: true, createdAt: new Date().toISOString() },
      { id: 'acc-3000', code: '3000', name: 'Owner Equity', type: 'equity', isActive: true, createdAt: new Date().toISOString() },
      { id: 'acc-4000', code: '4000', name: 'Sales Revenue', type: 'revenue', isActive: true, createdAt: new Date().toISOString() },
      { id: 'acc-5000', code: '5000', name: 'Cost of Goods Sold', type: 'expense', isActive: true, createdAt: new Date().toISOString() },
    ];
    saveItems('coa', defaults);
    return defaults;
  }
  return accounts;
};

// ==================== JOURNAL ENTRIES ====================

export const getJournalEntries = (): JournalEntry[] => getItems('journal');

export const createJournalEntry = (data: Omit<JournalEntry, 'id' | 'entryNumber' | 'createdAt'>): JournalEntry => {
  const entry: JournalEntry = {
    ...data,
    id: `je-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
    entryNumber: generateNumber('journal', 'JE'),
    createdAt: new Date().toISOString()
  };
  const entries = getJournalEntries();
  entries.push(entry);
  saveItems('journal', entries);
  return entry;
};

export const postInvoiceToLedger = (invoice: Invoice): void => {
  createJournalEntry({
    date: invoice.issueDate,
    reference: invoice.invoiceNumber,
    referenceType: 'invoice',
    referenceId: invoice.id,
    description: `Invoice ${invoice.invoiceNumber} - ${invoice.customerName}`,
    debitAccountId: 'acc-1200',
    creditAccountId: 'acc-4000',
    amount: invoice.subtotal,
    createdBy: invoice.createdBy
  });
  if (invoice.totalVat > 0) {
    createJournalEntry({
      date: invoice.issueDate,
      reference: invoice.invoiceNumber,
      referenceType: 'invoice',
      referenceId: invoice.id,
      description: `VAT on Invoice ${invoice.invoiceNumber}`,
      debitAccountId: 'acc-1200',
      creditAccountId: 'acc-2100',
      amount: invoice.totalVat,
      createdBy: invoice.createdBy
    });
  }
};

export const postPaymentToLedger = (payment: Payment, invoice: Invoice): void => {
  createJournalEntry({
    date: payment.paymentDate,
    reference: payment.paymentNumber,
    referenceType: 'payment',
    referenceId: payment.id,
    description: `Payment ${payment.paymentNumber} - ${invoice.invoiceNumber}`,
    debitAccountId: 'acc-1000',
    creditAccountId: 'acc-1200',
    amount: payment.amount,
    createdBy: payment.createdBy
  });
};

// ==================== ZATCA COMPLIANCE ====================

export const generateZATCAXML = (invoice: Invoice): string => {
  const company = JSON.parse(localStorage.getItem('company_details') || '{}');
  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<Invoice xmlns="urn:oasis:names:specification:ubl:schema:xsd:Invoice-2" xmlns:cac="urn:oasis:names:specification:ubl:schema:xsd:CommonAggregateComponents-2" xmlns:cbc="urn:oasis:names:specification:ubl:schema:xsd:CommonBasicComponents-2">
  <cbc:UBLVersionID>2.1</cbc:UBLVersionID>
  <cbc:ProfileID>reporting:1.0</cbc:ProfileID>
  <cbc:ID>${invoice.invoiceNumber}</cbc:ID>
  <cbc:UUID>${invoice.uuid || crypto.randomUUID()}</cbc:UUID>
  <cbc:IssueDate>${invoice.issueDate}</cbc:IssueDate>
  <cbc:InvoiceTypeCode listID="UN/ECE 20015 SubType">${invoice.invoiceType === 'simplified' ? '0200000' : '0100000'}</cbc:InvoiceTypeCode>
  <cbc:DocumentCurrencyCode>${invoice.currency}</cbc:DocumentCurrencyCode>
  <cac:AccountingCustomerParty>
    <cac:Party>
      <cac:PartyLegalEntity>
        <cbc:RegistrationName>${invoice.customerName}</cbc:RegistrationName>
      </cac:PartyLegalEntity>
    </cac:Party>
  </cac:AccountingCustomerParty>
  <cac:LegalMonetaryTotal>
    <cbc:LineExtensionAmount currencyID="${invoice.currency}">${invoice.subtotal.toFixed(2)}</cbc:LineExtensionAmount>
    <cbc:TaxExclusiveAmount currencyID="${invoice.currency}">${(invoice.subtotal - invoice.totalDiscount).toFixed(2)}</cbc:TaxExclusiveAmount>
    <cbc:TaxInclusiveAmount currencyID="${invoice.currency}">${invoice.grandTotal.toFixed(2)}</cbc:TaxInclusiveAmount>
    <cbc:PayableAmount currencyID="${invoice.currency}">${invoice.grandTotal.toFixed(2)}</cbc:PayableAmount>
  </cac:LegalMonetaryTotal>
  ${invoice.items.map(item => `<cac:InvoiceLine>
    <cbc:ID>${item.id}</cbc:ID>
    <cbc:InvoicedQuantity unitCode="${item.unit}">${item.quantity}</cbc:InvoicedQuantity>
    <cbc:LineExtensionAmount currencyID="${invoice.currency}">${item.totalAmount.toFixed(2)}</cbc:LineExtensionAmount>
    <cac:TaxTotal>
      <cbc:TaxAmount currencyID="${invoice.currency}">${item.vatAmount.toFixed(2)}</cbc:TaxAmount>
    </cac:TaxTotal>
    <cac:Item>
      <cbc:Name>${item.description}</cbc:Name>
    </cac:Item>
    <cac:Price>
      <cbc:PriceAmount currencyID="${invoice.currency}">${item.unitPrice.toFixed(2)}</cbc:PriceAmount>
    </cac:Price>
  </cac:InvoiceLine>`).join('\n')}
</Invoice>`;
  return xml;
};

export const getZATCAComplianceChecklist = (invoice: Invoice): { item: string; passed: boolean }[] => {
  const company = JSON.parse(localStorage.getItem('company_details') || '{}');
  return [
    { item: 'Invoice number sequential', passed: !!invoice.invoiceNumber },
    { item: 'Issue date present', passed: !!invoice.issueDate },
    { item: 'Seller name present', passed: !!company.name },
    { item: 'Seller VAT number present', passed: !!company.taxId },
    { item: 'Customer name present', passed: !!invoice.customerName },
    { item: 'Customer address present', passed: !!invoice.customerAddress },
    { item: 'Line items with descriptions', passed: invoice.items.every(i => !!i.description) },
    { item: 'VAT amounts calculated', passed: invoice.items.every(i => i.vatAmount >= 0) },
    { item: 'Total amounts correct', passed: invoice.grandTotal === invoice.subtotal - invoice.totalDiscount + invoice.totalVat },
    { item: 'Currency specified', passed: !!invoice.currency },
    { item: 'Tax type identified', passed: invoice.items.every(i => !!i.supplyType) },
    { item: 'UUID present', passed: !!invoice.uuid }
  ];
};

export const generateQRCodeData = (invoice: Invoice): string => {
  const company = JSON.parse(localStorage.getItem('company_details') || '{}');
  const sellerName = company.name || '';
  const vatNumber = company.taxId || '';
  const timestamp = invoice.issueDate;
  const total = invoice.grandTotal.toFixed(2);
  const vatTotal = invoice.totalVat.toFixed(2);

  const data = [
    sellerName.length, sellerName,
    vatNumber.length, vatNumber,
    timestamp.length, timestamp,
    total.length, total,
    vatTotal.length, vatTotal
  ].join('');

  return btoa(data);
};
