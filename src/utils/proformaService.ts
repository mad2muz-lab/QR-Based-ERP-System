import { Quotation, QuotationItem } from '../types';
import { updateQuotation } from './erpInvoiceService';

export type ProformaInvoice = Quotation & {
  proformaNumber?: string;
};
export type ProformaItem = QuotationItem & {
  subtotal?: number;
  vat?: number;
  grand?: number;
};

export const saveProforma = (proformaOrId: Quotation | string, updates?: Partial<Quotation>) => {
  if (typeof proformaOrId === 'string') {
    return updateQuotation(proformaOrId, updates || {});
  }
  return updateQuotation(proformaOrId.id, proformaOrId);
};

export { getQuotations as getProformas, getQuotationById as getProformaById, createQuotation as createProforma, updateQuotation as updateProforma, deleteQuotation as deleteProforma, createInvoiceFromQuotation as createInvoiceFromProforma } from './erpInvoiceService';
