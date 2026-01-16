
import { ServiceItem, InvoiceFormData, ServiceType } from './types';

export const INITIAL_SERVICE_ITEMS: ServiceItem[] = Array.from({ length: 4 }, (_, i) => ({
  id: `item-${i}`,
  qty: 0,
  unitValue: 0,
  itemBilled: '',
}));

export const INITIAL_FORM_DATA: InvoiceFormData = {
  companyName: '',
  fullName: '',
  companyAddress: '',
  email: '',
  phone: '',
  date: new Date().toISOString().split('T')[0],
  serviceSite: '',
  invoiceTitle: '',
  pertainsTo: '',
  menuOption: '',
  directInquiries: '',
  employerName: '',
  employerPosition: '',
  totalHours: '',
  timeIn: '',
  timeOut: '',
  activity1: '',
  activity2: '',
  activity3: '',
  notes: '',
  serviceItems: INITIAL_SERVICE_ITEMS,
  gstInput: 0,
  enmaxInput: 0,
  permitCostInput: 0,
  webhookUrl: '',
};

export const SERVICE_TYPES: ServiceType[] = [
  { 
    label: 'Regular Service Fee - covers dispatch and includes 2 man-hours', 
    value: 295 
  },
  { 
    label: 'Master Elec. Rate - for Master Field Rate, Calculations, Consulting and Compliance', 
    value: 125 
  },
  { 
    label: 'Skilled Elec. Rate- Service Calls, and where extra time is required beyond scope', 
    value: 97 
  },
  { 
    label: 'Helper Elec. Rate - Service Calls, and where extra time is required beyond scope', 
    value: 59 
  },
];

export const MENU_OPTIONS = [
  'ACTIVITY LOG',
  'TIME SUMMARY',
];
