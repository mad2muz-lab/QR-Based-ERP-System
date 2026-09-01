// Legacy service - re-exports from comprehensive ERP invoice service
export { getQuotations as getProformas, getQuotationById as getProformaById, createQuotation as createProforma, updateQuotation as updateProforma, deleteQuotation as deleteProforma, updateQuotation as saveProforma, createInvoiceFromQuotation as createInvoiceFromProforma } from './erpInvoiceService';
