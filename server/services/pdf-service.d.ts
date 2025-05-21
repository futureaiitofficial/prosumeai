export interface InvoiceSettings {
  id: number;
  logoUrl?: string;
  footerText?: string;
  termsAndConditions?: string;
  invoicePrefix: string;
  showTaxBreakdown: boolean;
  nextInvoiceNumber: number;
  defaultDueDays: number;
}

export interface TaxItem {
  name: string;
  type: string;
  percentage: number;
  amount: number;
}

export interface TaxDetails {
  taxType: string;
  taxAmount: number;
  taxPercentage: number;
  taxBreakdown: TaxItem[];
  subtotal: number;
  total: number;
}

export interface InvoiceItem {
  description: string;
  quantity: number;
  unitPrice: number;
  total: number;
}

export interface BillingDetails {
  fullName: string;
  companyName?: string;
  addressLine1: string;
  addressLine2?: string;
  city: string;
  state: string;
  postalCode: string;
  country: string;
  email?: string;
  phoneNumber?: string;
  taxId?: string;
}

export interface CompanyDetails {
  companyName: string;
  address: string;
  city?: string;
  state?: string;
  postalCode?: string;
  country?: string;
  phone?: string;
  email?: string;
  website?: string;
  gstin?: string;
  pan?: string;
}

export interface Invoice {
  id: number;
  invoiceNumber: string;
  userId: number;
  transactionId?: number | null;
  subscriptionId?: string | number | null;
  subscriptionPlan?: string | null;
  nextPaymentDate?: string | null;
  gatewayTransactionId?: string | null;
  razorpayPaymentId?: string | null;
  subtotal: string;
  taxAmount: string;
  total: string;
  currency: string;
  status: string;
  billingDetails: BillingDetails;
  companyDetails: CompanyDetails;
  taxDetails?: TaxDetails;
  items: InvoiceItem[];
  createdAt: string;
  paidAt?: string;
  dueDate?: string;
  notes?: string | null;
}

export function generateInvoicePDF(invoice: Invoice, settings: InvoiceSettings): Promise<Buffer>; 