
export interface ServiceItem {
  id: string;
  qty: number;
  unitValue: number;
  itemBilled: string;
}

export interface ServiceType {
  label: string;
  value: number;
}

export interface InvoiceHistoryItem {
  id: string;
  date: string;
  clientName: string;
  total: number;
  status: 'sent' | 'failed';
  payload: any;
}

export interface AuditLog {
  id: string;
  timestamp: string;
  action: string;
  user: string;
}

export interface User {
  id: string;
  username: string;
  password?: string; // Only stored locally for this demo
  displayName: string;
  role: 'Admin' | 'Viewer';
  isDefault?: boolean;
}

export interface InvoiceFormData {
  // Company Info
  companyName: string;
  fullName: string;
  companyAddress: string;
  email: string;
  phone: string;
  date: string;
  serviceSite: string;
  invoiceTitle: string;
  pertainsTo: string;
  menuOption: string;
  directInquiries: string;

  // Conditional Fields (Activity Log / Time Summary)
  employerName: string;
  employerPosition: string;
  totalHours: string;
  timeIn: string;
  timeOut: string;

  // Activities
  activity1: string;
  activity2: string;
  activity3: string;
  notes: string;

  // Rates
  serviceItems: ServiceItem[];
  gstInput: number;
  enmaxInput: number;
  permitCostInput: number;

  // Webhook Configuration
  webhookUrl: string;
}

export interface CalculatedValues {
  subtotal: number;
  gst: number;
  enmax: number;
  permitCost: number;
  total: number;
}
