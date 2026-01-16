
import React, { useState, useMemo, useEffect } from 'react';
import { 
  LogOut, 
  Send, 
  Settings, 
  CheckCircle2, 
  Loader2, 
  Info,
  Lock,
  User as UserIcon,
  Key,
  History,
  Users,
  ShieldCheck,
  Download,
  Trash2,
  ChevronRight,
  Database,
  ExternalLink,
  Plus,
  X,
  Code
} from 'lucide-react';
import { InvoiceFormData, ServiceItem, CalculatedValues, InvoiceHistoryItem, AuditLog, User } from './types';
import { INITIAL_FORM_DATA, SERVICE_TYPES, MENU_OPTIONS } from './constants';

const ScalerunsLogo = () => (
  <div className="flex items-center justify-center gap-3 select-none">
    <div className="flex items-baseline">
      <span className="text-4xl md:text-5xl font-bold tracking-tight text-[#5DA9DD]">Scale</span>
      <span className="text-4xl md:text-5xl font-bold tracking-tight text-[#0B4E7B]">runs</span>
    </div>
    <div className="w-12 h-12 md:w-14 md:h-14 relative">
      <svg viewBox="0 0 100 100" className="w-full h-full drop-shadow-sm">
        <defs>
          <linearGradient id="orbGradient" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#5DA9DD" />
            <stop offset="100%" stopColor="#0B4E7B" />
          </linearGradient>
        </defs>
        <circle cx="50" cy="50" r="48" fill="url(#orbGradient)" />
        <path d="M15 65 C 35 65, 55 55, 80 50" stroke="white" strokeWidth="4" fill="none" strokeLinecap="round" opacity="0.9" />
        <circle cx="82" cy="50" r="3" fill="white" />
        <path d="M12 52 C 40 52, 60 52, 85 62" stroke="white" strokeWidth="4.5" fill="none" strokeLinecap="round" />
        <circle cx="88" cy="62" r="3.5" fill="white" />
        <path d="M15 38 C 30 42, 50 50, 75 75" stroke="white" strokeWidth="3.5" fill="none" strokeLinecap="round" opacity="0.8" />
        <circle cx="77" cy="75" r="3" fill="white" />
      </svg>
    </div>
  </div>
);

const App: React.FC = () => {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [loginUsername, setLoginUsername] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  const [loginError, setLoginError] = useState('');

  // App State with Robust Initialization
  const [formData, setFormData] = useState<InvoiceFormData>(() => {
    try {
      const saved = localStorage.getItem('invoice-config');
      return saved ? { ...INITIAL_FORM_DATA, ...JSON.parse(saved) } : INITIAL_FORM_DATA;
    } catch (e) {
      console.error("Failed to parse invoice-config", e);
      return INITIAL_FORM_DATA;
    }
  });

  const [history, setHistory] = useState<InvoiceHistoryItem[]>(() => {
    try {
      const saved = localStorage.getItem('invoice-history');
      return saved ? JSON.parse(saved) : [];
    } catch (e) {
      console.error("Failed to parse invoice-history", e);
      return [];
    }
  });

  const [auditLogs, setAuditLogs] = useState<AuditLog[]>(() => {
    try {
      const saved = localStorage.getItem('invoice-audit');
      return saved ? JSON.parse(saved) : [];
    } catch (e) {
      console.error("Failed to parse invoice-audit", e);
      return [];
    }
  });

  const [users, setUsers] = useState<User[]>(() => {
    const defaultAdmin: User = { 
      id: 'admin-1', 
      username: 'admin', 
      password: 'admin', 
      displayName: 'System Admin', 
      role: 'Admin', 
      isDefault: true 
    };
    try {
      const saved = localStorage.getItem('invoice-users');
      return saved ? JSON.parse(saved) : [defaultAdmin];
    } catch (e) {
      console.error("Failed to parse invoice-users", e);
      return [defaultAdmin];
    }
  });

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showAdminPanel, setShowAdminPanel] = useState(false);
  const [adminTab, setAdminTab] = useState<'general' | 'history' | 'users' | 'tools'>('general');
  const [submissionStatus, setSubmissionStatus] = useState<'idle' | 'success' | 'error'>('idle');

  // New User Form State
  const [showAddUser, setShowAddUser] = useState(false);
  const [newUser, setNewUser] = useState({ username: '', password: '', displayName: '', role: 'Viewer' as const });

  // Persistence
  useEffect(() => {
    localStorage.setItem('invoice-config', JSON.stringify(formData));
    localStorage.setItem('invoice-history', JSON.stringify(history));
    localStorage.setItem('invoice-audit', JSON.stringify(auditLogs));
    localStorage.setItem('invoice-users', JSON.stringify(users));
  }, [formData, history, auditLogs, users]);

  const addAuditLog = (action: string) => {
    const newLog: AuditLog = {
      id: Math.random().toString(36).substr(2, 9),
      timestamp: new Date().toLocaleString(),
      action,
      user: currentUser?.username || 'System'
    };
    setAuditLogs(prev => [newLog, ...prev].slice(0, 50));
  };

  const calculated: CalculatedValues = useMemo(() => {
    const subtotal = formData.serviceItems.reduce((acc, item) => acc + (item.qty * item.unitValue), 0);
    const gst = formData.gstInput || 0;
    const enmax = formData.enmaxInput || 0;
    const permitCost = formData.permitCostInput || 0;
    const total = subtotal + gst + enmax + permitCost;
    return { subtotal, gst, enmax, permitCost, total };
  }, [formData]);

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    const foundUser = users.find(u => u.username === loginUsername && u.password === loginPassword);
    if (foundUser) {
      setIsLoggedIn(true);
      setCurrentUser(foundUser);
      setLoginError('');
      addAuditLog('User Login');
    } else {
      setLoginError('Invalid username or password');
    }
  };

  const handleLogout = () => {
    addAuditLog('User Logout');
    setIsLoggedIn(false);
    setCurrentUser(null);
  };

  const handleAddUser = (e: React.FormEvent) => {
    e.preventDefault();
    e.stopPropagation();
    
    if (!newUser.username || !newUser.password || !newUser.displayName) {
      alert("Please fill in all fields");
      return;
    }
    
    if (users.find(u => u.username === newUser.username)) {
      alert("Username already exists");
      return;
    }

    const createdUser: User = {
      id: Math.random().toString(36).substr(2, 9),
      username: newUser.username,
      password: newUser.password,
      displayName: newUser.displayName,
      role: newUser.role
    };

    setUsers(prev => [...prev, createdUser]);
    addAuditLog(`Added Team Member: ${createdUser.username}`);
    setShowAddUser(false);
    setNewUser({ username: '', password: '', displayName: '', role: 'Viewer' });
  };

  const handleDeleteUser = (userId: string) => {
    const userToDelete = users.find(u => u.id === userId);
    if (userToDelete?.isDefault) return;
    
    if (confirm(`Delete team member ${userToDelete?.username}?`)) {
      setUsers(prev => prev.filter(u => u.id !== userId));
      addAuditLog(`Deleted Team Member: ${userToDelete?.username}`);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'number' ? parseFloat(value) || 0 : value
    }));
  };

  const handleServiceItemChange = (index: number, field: keyof ServiceItem, value: any) => {
    const newItems = [...formData.serviceItems];
    if (field === 'itemBilled') {
      const selectedService = SERVICE_TYPES.find(s => s.label === value);
      newItems[index] = { 
        ...newItems[index], 
        itemBilled: value,
        unitValue: selectedService ? selectedService.value : 0
      };
    } else {
      newItems[index] = { ...newItems[index], [field]: value };
    }
    setFormData(prev => ({ ...prev, serviceItems: newItems }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.webhookUrl) {
      alert("Webhook URL not configured. Access Admin Settings to set it.");
      return;
    }

    setIsSubmitting(true);
    setSubmissionStatus('idle');

    try {
      const payload = { ...formData, calculated, timestamp: new Date().toISOString(), submittedBy: currentUser?.username };
      const response = await fetch(formData.webhookUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      if (response.ok) {
        setSubmissionStatus('success');
        const historyItem: InvoiceHistoryItem = {
          id: `INV-${Date.now()}`,
          date: new Date().toLocaleString(),
          clientName: formData.fullName || 'Unknown',
          total: calculated.total,
          status: 'sent',
          payload
        };
        setHistory(prev => [historyItem, ...prev]);
        addAuditLog(`Invoice Sent: ${historyItem.id}`);
      } else {
        throw new Error('Submission failed');
      }
    } catch (err) {
      console.error(err);
      setSubmissionStatus('error');
      addAuditLog('Invoice Submission Failed');
    } finally {
      setIsSubmitting(false);
      setTimeout(() => setSubmissionStatus('idle'), 5000);
    }
  };

  const clearData = () => {
    if (confirm("Are you sure you want to clear all local data? This cannot be undone.")) {
      setHistory([]);
      setAuditLogs([]);
      setFormData(INITIAL_FORM_DATA);
      localStorage.clear();
      setIsLoggedIn(false);
      window.location.reload();
    }
  };

  if (!isLoggedIn) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50 p-4">
        <div className="bg-white rounded-3xl shadow-xl p-8 w-full max-w-md border border-slate-200">
          <div className="mb-8 flex flex-col items-center">
            <ScalerunsLogo />
            <h2 className="text-xl font-bold text-slate-800 mt-6">Internal Access Only</h2>
            <p className="text-slate-500 text-sm mt-1">Authorized personnel login</p>
          </div>
          <form onSubmit={handleLogin} className="space-y-4">
            <div className="space-y-2">
              <label className="text-xs font-bold text-slate-500 uppercase ml-1">Username</label>
              <div className="relative">
                <UserIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <input 
                  type="text" value={loginUsername} onChange={(e) => setLoginUsername(e.target.value)}
                  className="w-full pl-10 pr-4 py-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-[#5DA9DD] outline-none transition-all"
                  placeholder="admin" required
                />
              </div>
            </div>
            <div className="space-y-2">
              <label className="text-xs font-bold text-slate-500 uppercase ml-1">Password</label>
              <div className="relative">
                <Key className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <input 
                  type="password" value={loginPassword} onChange={(e) => setLoginPassword(e.target.value)}
                  className="w-full pl-10 pr-4 py-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-[#5DA9DD] outline-none transition-all"
                  placeholder="••••••••" required
                />
              </div>
            </div>
            {loginError && <p className="text-red-500 text-xs font-medium ml-1">{loginError}</p>}
            <button type="submit" className="w-full py-4 bg-[#0B4E7B] text-white font-bold rounded-xl shadow-lg hover:bg-[#083c5e] transition-all flex items-center justify-center gap-2">
              <Lock className="w-4 h-4" />
              Access System
            </button>
          </form>
        </div>
      </div>
    );
  }

  const isLogMode = formData.menuOption === 'ACTIVITY LOG' || formData.menuOption === 'TIME SUMMARY';

  return (
    <div className="min-h-screen pb-20 px-4 md:px-8 max-w-5xl mx-auto">
      <header className="py-12 text-center relative">
        <div className="mb-6"><ScalerunsLogo /></div>
        <h1 className="text-xl md:text-2xl font-semibold text-slate-700 leading-tight max-w-2xl mx-auto border-t border-slate-200 pt-6 mt-6">
          Blue Electrical Services and Technology Invoice Generator Form
        </h1>
        <button onClick={handleLogout} className="absolute top-12 right-0 hidden lg:flex items-center gap-2 px-4 py-2 text-sm font-medium text-slate-500 border border-slate-200 rounded-lg hover:bg-white hover:shadow-sm transition-all hover:text-[#0B4E7B]">
          <LogOut className="w-4 h-4" /> Logout
        </button>
      </header>

      <form onSubmit={handleSubmit} className="space-y-8">
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="px-6 py-4 border-b border-slate-100 bg-slate-50/50">
            <h2 className="text-lg font-semibold text-[#0B4E7B]">Company & Project Details</h2>
          </div>
          <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-6">
            <FormField label="Invoice Company Name"><input type="text" name="companyName" value={formData.companyName} onChange={handleInputChange} className="w-full px-4 py-2 rounded-lg border border-slate-200 focus:ring-2 focus:ring-[#5DA9DD] outline-none" /></FormField>
            <FormField label="Full Name" required><input required type="text" name="fullName" value={formData.fullName} onChange={handleInputChange} className="w-full px-4 py-2 rounded-lg border border-slate-200 focus:ring-2 focus:ring-[#5DA9DD] outline-none" /></FormField>
            <FormField label="Invoice Company Address"><input type="text" name="companyAddress" value={formData.companyAddress} onChange={handleInputChange} className="w-full px-4 py-2 rounded-lg border border-slate-200 focus:ring-2 focus:ring-[#5DA9DD] outline-none" /></FormField>
            <FormField label="Email" required><input required type="email" name="email" value={formData.email} onChange={handleInputChange} className="w-full px-4 py-2 rounded-lg border border-slate-200 focus:ring-2 focus:ring-[#5DA9DD] outline-none" /></FormField>
            <FormField label="Phone" required><input required type="tel" name="phone" value={formData.phone} onChange={handleInputChange} className="w-full px-4 py-2 rounded-lg border border-slate-200 focus:ring-2 focus:ring-[#5DA9DD] outline-none" /></FormField>
            <FormField label="Date"><input type="date" name="date" value={formData.date} onChange={handleInputChange} className="w-full px-4 py-2 rounded-lg border border-slate-200 focus:ring-2 focus:ring-[#5DA9DD] outline-none" /></FormField>
            <FormField label="Service Site"><input type="text" name="serviceSite" value={formData.serviceSite} onChange={handleInputChange} className="w-full px-4 py-2 rounded-lg border border-slate-200 focus:ring-2 focus:ring-[#5DA9DD] outline-none" /></FormField>
            <FormField label="Invoice Title"><input type="text" name="invoiceTitle" value={formData.invoiceTitle} onChange={handleInputChange} className="w-full px-4 py-2 rounded-lg border border-slate-200 focus:ring-2 focus:ring-[#5DA9DD] outline-none" /></FormField>
            <FormField label="The Invoice Pertains to:" className="md:col-span-2"><textarea name="pertainsTo" value={formData.pertainsTo} onChange={handleInputChange} rows={3} className="w-full px-4 py-2 rounded-lg border border-slate-200 focus:ring-2 focus:ring-[#5DA9DD] outline-none resize-none" /></FormField>
          </div>
        </div>

        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="px-6 py-4 border-b border-slate-100 bg-slate-50/50">
            <h2 className="text-lg font-semibold text-[#0B4E7B]">{isLogMode ? 'Activity Log & Time Details' : 'Invoice Settings'}</h2>
          </div>
          <div className="p-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-6">
              <FormField label="Menu Option">
                <select name="menuOption" value={formData.menuOption} onChange={handleInputChange} className="w-full px-4 py-2.5 rounded-lg border border-slate-200 focus:ring-2 focus:ring-[#5DA9DD] outline-none appearance-none bg-slate-50/50 cursor-pointer">
                  <option value="">Select an option</option>
                  {MENU_OPTIONS.map(opt => <option key={opt} value={opt}>{opt}</option>)}
                </select>
              </FormField>
              {isLogMode && <FormField label="Employer Name"><input type="text" name="employerName" value={formData.employerName} onChange={handleInputChange} className="w-full px-4 py-2.5 rounded-lg border border-slate-200 focus:ring-2 focus:ring-[#5DA9DD] outline-none bg-slate-50/50" /></FormField>}
              {isLogMode && (
                <>
                  <FormField label="Employer Position"><input type="text" name="employerPosition" value={formData.employerPosition} onChange={handleInputChange} className="w-full px-4 py-2.5 rounded-lg border border-slate-200 focus:ring-2 focus:ring-[#5DA9DD] outline-none bg-slate-50/50" /></FormField>
                  <FormField label="Total Hours"><input type="text" name="totalHours" value={formData.totalHours} onChange={handleInputChange} className="w-full px-4 py-2.5 rounded-lg border border-slate-200 focus:ring-2 focus:ring-[#5DA9DD] outline-none bg-slate-50/50" /></FormField>
                  <FormField label="Time In"><input type="time" name="timeIn" value={formData.timeIn} onChange={handleInputChange} className="w-full px-4 py-2.5 rounded-lg border border-slate-200 focus:ring-2 focus:ring-[#5DA9DD] outline-none bg-slate-50/50" /></FormField>
                  <FormField label="Time Out"><input type="time" name="timeOut" value={formData.timeOut} onChange={handleInputChange} className="w-full px-4 py-2.5 rounded-lg border border-slate-200 focus:ring-2 focus:ring-[#5DA9DD] outline-none bg-slate-50/50" /></FormField>
                </>
              )}
              <FormField label="Direct Scope or Project Information Inquiries" className="md:col-span-1"><input type="text" name="directInquiries" value={formData.directInquiries} onChange={handleInputChange} className="w-full px-4 py-2.5 rounded-lg border border-slate-200 focus:ring-2 focus:ring-[#5DA9DD] outline-none bg-slate-50/50" /></FormField>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="px-6 py-4 border-b border-slate-100 bg-slate-50/50">
            <h2 className="text-lg font-semibold text-[#0B4E7B]">Activities</h2>
          </div>
          <div className="p-6 space-y-4">
            <FormField label="Activity 1"><textarea name="activity1" value={formData.activity1} onChange={handleInputChange} rows={2} className="w-full px-4 py-2 rounded-lg border border-slate-200 focus:ring-2 focus:ring-[#5DA9DD] outline-none resize-none" /></FormField>
            <FormField label="Activity 2"><textarea name="activity2" value={formData.activity2} onChange={handleInputChange} rows={2} className="w-full px-4 py-2 rounded-lg border border-slate-200 focus:ring-2 focus:ring-[#5DA9DD] outline-none resize-none" /></FormField>
            <FormField label="Activity 3"><textarea name="activity3" value={formData.activity3} onChange={handleInputChange} rows={2} className="w-full px-4 py-2 rounded-lg border border-slate-200 focus:ring-2 focus:ring-[#5DA9DD] outline-none resize-none" /></FormField>
            <FormField label="Notes"><textarea name="notes" value={formData.notes} onChange={handleInputChange} rows={3} className="w-full px-4 py-2 rounded-lg border border-slate-200 focus:ring-2 focus:ring-[#5DA9DD] outline-none resize-none" /></FormField>
          </div>
        </div>

        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="px-6 py-4 border-b border-slate-100 bg-slate-50/50 flex justify-between items-center">
            <h2 className="text-lg font-semibold text-[#0B4E7B]">Service Rates</h2>
          </div>
          <div className="p-6">
            <div className="hidden md:grid grid-cols-12 gap-4 mb-4 text-xs font-bold text-slate-400 uppercase tracking-wider px-2">
              <div className="col-span-2">Qty</div>
              <div className="col-span-2">Unit Value</div>
              <div className="col-span-6">Item Billed</div>
              <div className="col-span-2 text-right">Amount</div>
            </div>
            <div className="space-y-0 border border-slate-100 rounded-xl overflow-hidden">
              {formData.serviceItems.map((item, idx) => (
                <div key={item.id} className={`grid grid-cols-1 md:grid-cols-12 gap-4 items-center p-4 ${idx % 2 === 0 ? 'bg-white' : 'bg-slate-50/50'}`}>
                  <div className="md:col-span-2"><input type="number" value={item.qty} onChange={(e) => handleServiceItemChange(idx, 'qty', parseFloat(e.target.value) || 0)} className="w-full px-3 py-2 rounded-lg border border-slate-200 focus:ring-2 focus:ring-[#5DA9DD] outline-none bg-white/50" /></div>
                  <div className="md:col-span-2"><input type="number" value={item.unitValue} onChange={(e) => handleServiceItemChange(idx, 'unitValue', parseFloat(e.target.value) || 0)} className="w-full px-3 py-2 rounded-lg border border-slate-200 focus:ring-2 focus:ring-[#5DA9DD] outline-none bg-white/50" /></div>
                  <div className="md:col-span-6">
                    <select value={item.itemBilled} onChange={(e) => handleServiceItemChange(idx, 'itemBilled', e.target.value)} className="w-full px-3 py-2 rounded-lg border border-slate-200 focus:ring-2 focus:ring-[#5DA9DD] outline-none bg-white">
                      <option value="">Select service type</option>
                      {SERVICE_TYPES.map(s => <option key={s.label} value={s.label}>{s.label}</option>)}
                    </select>
                  </div>
                  <div className="md:col-span-2 text-right font-semibold text-slate-700">${(item.qty * item.unitValue).toFixed(2)}</div>
                </div>
              ))}
            </div>
            <div className="mt-8 grid grid-cols-1 md:grid-cols-3 gap-6">
              <FormField label="GST 5%"><input type="number" name="gstInput" value={formData.gstInput} onChange={handleInputChange} className="w-full px-4 py-2 rounded-lg border border-slate-200 focus:ring-2 focus:ring-[#5DA9DD] outline-none" /></FormField>
              <FormField label="ENMAX"><input type="number" name="enmaxInput" value={formData.enmaxInput} onChange={handleInputChange} className="w-full px-4 py-2 rounded-lg border border-slate-200 focus:ring-2 focus:ring-[#5DA9DD] outline-none" /></FormField>
              <FormField label="Permit Cost"><input type="number" name="permitCostInput" value={formData.permitCostInput} onChange={handleInputChange} className="w-full px-4 py-2 rounded-lg border border-slate-200 focus:ring-2 focus:ring-[#5DA9DD] outline-none" /></FormField>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 space-y-4">
          <div className="flex justify-between items-center text-xl font-bold">
            <span className="text-slate-500">Total:</span>
            <span className="text-[#0B4E7B]">${calculated.total.toFixed(2)}</span>
          </div>
          <div className="flex flex-col md:flex-row gap-4 pt-4 border-t border-slate-100">
            <button type="submit" disabled={isSubmitting} className="flex-1 py-4 bg-[#0B4E7B] text-white font-bold rounded-xl shadow-lg hover:bg-[#083c5e] transition-all flex items-center justify-center gap-2">
              {isSubmitting ? <Loader2 className="w-5 h-5 animate-spin" /> : <Send className="w-5 h-5" />}
              {isSubmitting ? 'Sending...' : 'Submit Invoice'}
            </button>
            {currentUser?.role === 'Admin' && (
              <button type="button" onClick={() => setShowAdminPanel(true)} className="px-8 py-4 border border-slate-200 text-slate-500 font-bold rounded-xl hover:bg-white hover:text-[#0B4E7B] transition-all flex items-center gap-2">
                <ShieldCheck className="w-5 h-5" /> Admin Settings
              </button>
            )}
          </div>
        </div>

        {submissionStatus !== 'idle' && (
          <div className={`fixed bottom-8 left-1/2 -translate-x-1/2 px-6 py-3 rounded-full shadow-2xl flex items-center gap-3 z-[60] ${submissionStatus === 'success' ? 'bg-emerald-500 text-white' : 'bg-red-500 text-white'}`}>
            {submissionStatus === 'success' ? <CheckCircle2 className="w-5 h-5" /> : <Info className="w-5 h-5" />}
            <span>{submissionStatus === 'success' ? 'Success! Invoice logged and sent.' : 'Error sending invoice.'}</span>
          </div>
        )}
      </form>

      {showAdminPanel && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white rounded-3xl w-full max-w-4xl max-h-[90vh] overflow-hidden flex flex-col shadow-2xl">
            <div className="px-8 py-6 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-[#0B4E7B] rounded-lg text-white"><ShieldCheck className="w-6 h-6" /></div>
                <h3 className="text-xl font-bold text-slate-800">Admin Dashboard</h3>
              </div>
              <button onClick={() => setShowAdminPanel(false)} className="text-slate-400 hover:text-slate-600 font-bold text-lg p-2">&times;</button>
            </div>

            <div className="flex flex-1 overflow-hidden">
              <div className="w-64 border-r border-slate-100 p-6 flex flex-col gap-2">
                <AdminNavItem icon={<Settings />} label="General" active={adminTab === 'general'} onClick={() => setAdminTab('general')} />
                <AdminNavItem icon={<History />} label="Invoice History" active={adminTab === 'history'} onClick={() => setAdminTab('history')} />
                <AdminNavItem icon={<Users />} label="User Management" active={adminTab === 'users'} onClick={() => setAdminTab('users')} />
                <AdminNavItem icon={<Database />} label="System Tools" active={adminTab === 'tools'} onClick={() => setAdminTab('tools')} />
              </div>

              <div className="flex-1 p-8 overflow-y-auto bg-white">
                {adminTab === 'general' && (
                  <div className="space-y-8 animate-in slide-in-from-right-4 duration-300">
                    <div>
                      <h4 className="text-sm font-bold text-slate-400 uppercase tracking-widest mb-4">Automation Endpoints</h4>
                      <div className="space-y-2">
                        <label className="text-sm font-medium text-slate-600 ml-1">Make.com Webhook URL</label>
                        <input type="url" value={formData.webhookUrl} onChange={(e) => setFormData(p => ({ ...p, webhookUrl: e.target.value }))} className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-[#5DA9DD] outline-none" placeholder="https://hook.make.com/..." />
                      </div>
                    </div>
                    <div>
                      <h4 className="text-sm font-bold text-slate-400 uppercase tracking-widest mb-4">Recent Audit Activity</h4>
                      <div className="space-y-3">
                        {auditLogs.slice(0, 5).map(log => (
                          <div key={log.id} className="flex items-center gap-3 text-xs text-slate-500 border-l-2 border-slate-100 pl-4 py-1">
                            <span className="font-mono text-slate-300">{log.timestamp}</span>
                            <span className="font-semibold text-slate-600">{log.action}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                )}

                {adminTab === 'history' && (
                  <div className="space-y-4 animate-in slide-in-from-right-4 duration-300">
                    <div className="flex items-center justify-between mb-2">
                      <h4 className="text-sm font-bold text-slate-400 uppercase tracking-widest">Sent Invoices</h4>
                      <button onClick={() => {}} className="text-[#0B4E7B] hover:underline text-xs flex items-center gap-1 font-bold"><Download className="w-3 h-3" /> Export JSON</button>
                    </div>
                    <div className="border border-slate-100 rounded-2xl overflow-hidden">
                      <table className="w-full text-left text-sm">
                        <thead className="bg-slate-50 text-slate-500 uppercase text-[10px] font-bold">
                          <tr>
                            <th className="px-4 py-3">ID</th>
                            <th className="px-4 py-3">Client</th>
                            <th className="px-4 py-3">Total</th>
                            <th className="px-4 py-3">Date</th>
                            <th className="px-4 py-3"></th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                          {history.length === 0 ? (
                            <tr><td colSpan={5} className="px-4 py-8 text-center text-slate-400">No history found</td></tr>
                          ) : history.map(item => (
                            <tr key={item.id} className="hover:bg-slate-50/50 group">
                              <td className="px-4 py-3 font-mono text-[11px] text-[#0B4E7B]">{item.id}</td>
                              <td className="px-4 py-3 font-medium text-slate-700">{item.clientName}</td>
                              <td className="px-4 py-3 font-bold text-slate-800">${item.total.toFixed(2)}</td>
                              <td className="px-4 py-3 text-slate-500 text-[11px]">{item.date}</td>
                              <td className="px-4 py-3 text-right"><button className="opacity-0 group-hover:opacity-100 text-[#5DA9DD] transition-all"><ExternalLink className="w-4 h-4" /></button></td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}

                {adminTab === 'users' && (
                  <div className="space-y-6 animate-in slide-in-from-right-4 duration-300">
                    <div className="flex items-center justify-between">
                      <h4 className="text-sm font-bold text-slate-400 uppercase tracking-widest">Team Members</h4>
                      <button 
                        onClick={() => setShowAddUser(true)}
                        className="px-4 py-2 bg-[#0B4E7B] text-white text-xs font-bold rounded-lg hover:bg-[#083c5e] flex items-center gap-1"
                      >
                        <Plus className="w-3 h-3" /> New Member
                      </button>
                    </div>

                    <div className="space-y-3">
                      {users.map(u => (
                        <div key={u.id} className="p-4 border border-slate-100 rounded-2xl flex items-center justify-between hover:bg-slate-50 transition-colors">
                          <div className="flex items-center gap-4">
                            <div className="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center text-[#0B4E7B] font-bold">
                              {u.displayName.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)}
                            </div>
                            <div>
                              <p className="font-bold text-slate-800">{u.displayName}</p>
                              <p className="text-xs text-slate-400">{u.username} • {u.role}</p>
                            </div>
                          </div>
                          <div className="flex items-center gap-3">
                            {u.isDefault ? (
                              <span className="px-2 py-1 bg-emerald-50 text-emerald-600 text-[10px] font-bold rounded uppercase">System</span>
                            ) : (
                              <button onClick={() => handleDeleteUser(u.id)} className="p-2 text-red-300 hover:text-red-500 hover:bg-red-50 rounded-lg transition-all">
                                <Trash2 className="w-4 h-4" />
                              </button>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>

                    {showAddUser && (
                      <div className="fixed inset-0 z-[70] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
                        <div className="bg-white rounded-2xl w-full max-w-md p-8 shadow-2xl relative">
                          <button onClick={() => setShowAddUser(false)} className="absolute top-6 right-6 text-slate-400 hover:text-slate-600"><X className="w-5 h-5" /></button>
                          <h3 className="text-xl font-bold text-slate-800 mb-6 flex items-center gap-2">
                            <Users className="w-5 h-5 text-[#5DA9DD]" />
                            Add Team Member
                          </h3>
                          <form onSubmit={handleAddUser} className="space-y-4">
                            <div className="space-y-2">
                              <label className="text-sm font-medium text-slate-600 ml-1">Display Name</label>
                              <input required type="text" value={newUser.displayName} onChange={e => setNewUser({...newUser, displayName: e.target.value})} className="w-full px-4 py-2.5 rounded-xl border border-slate-200 focus:ring-2 focus:ring-[#5DA9DD] outline-none" placeholder="e.g. John Doe" />
                            </div>
                            <div className="space-y-2">
                              <label className="text-sm font-medium text-slate-600 ml-1">Username</label>
                              <input required type="text" value={newUser.username} onChange={e => setNewUser({...newUser, username: e.target.value})} className="w-full px-4 py-2.5 rounded-xl border border-slate-200 focus:ring-2 focus:ring-[#5DA9DD] outline-none" placeholder="jdoe" />
                            </div>
                            <div className="space-y-2">
                              <label className="text-sm font-medium text-slate-600 ml-1">Password</label>
                              <input required type="password" value={newUser.password} onChange={e => setNewUser({...newUser, password: e.target.value})} className="w-full px-4 py-2.5 rounded-xl border border-slate-200 focus:ring-2 focus:ring-[#5DA9DD] outline-none" placeholder="••••••••" />
                            </div>
                            <div className="space-y-2">
                              <label className="text-sm font-medium text-slate-600 ml-1">Role</label>
                              <select value={newUser.role} onChange={e => setNewUser({...newUser, role: e.target.value as 'Admin' | 'Viewer'})} className="w-full px-4 py-2.5 rounded-xl border border-slate-200 focus:ring-2 focus:ring-[#5DA9DD] outline-none bg-white">
                                <option value="Viewer">Viewer (Cannot Access Admin)</option>
                                <option value="Admin">Admin (Full Access)</option>
                              </select>
                            </div>
                            <div className="pt-4 flex gap-3">
                              <button type="submit" className="flex-1 py-3 bg-[#0B4E7B] text-white font-bold rounded-xl hover:bg-[#083c5e] transition-all">Create Member</button>
                              <button type="button" onClick={() => setShowAddUser(false)} className="px-6 py-3 border border-slate-200 text-slate-600 font-bold rounded-xl hover:bg-slate-50">Cancel</button>
                            </div>
                          </form>
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {adminTab === 'tools' && (
                  <div className="space-y-8 animate-in slide-in-from-right-4 duration-300">
                    <div className="space-y-4">
                      <h4 className="text-sm font-bold text-slate-400 uppercase tracking-widest flex items-center gap-2">
                        <Code className="w-4 h-4" /> Embed Tool
                      </h4>
                      <div className="p-6 border border-slate-100 rounded-2xl bg-slate-50/50">
                        <p className="text-sm text-slate-600 mb-4 font-medium">Use this iframe code to embed the generator into your internal portal:</p>
                        <div className="relative group">
                          <pre className="bg-slate-900 text-slate-300 p-4 rounded-xl text-xs overflow-x-auto font-mono leading-relaxed">
                            {`<iframe 
  src="${window.location.href}" 
  style="width:100%; height:900px; border:none; border-radius:16px;" 
  title="Invoice Generator"
></iframe>`}
                          </pre>
                          <button 
                            onClick={() => {
                              navigator.clipboard.writeText(`<iframe src="${window.location.href}" style="width:100%; height:900px; border:none; border-radius:16px;" title="Invoice Generator"></iframe>`);
                              alert("Copied to clipboard!");
                            }}
                            className="absolute top-2 right-2 px-3 py-1.5 bg-[#5DA9DD] text-white text-[10px] font-bold rounded hover:bg-[#4a8bb8] transition-all opacity-0 group-hover:opacity-100"
                          >
                            Copy Code
                          </button>
                        </div>
                      </div>
                    </div>

                    <div className="space-y-4">
                      <h4 className="text-sm font-bold text-slate-400 uppercase tracking-widest flex items-center gap-2">
                        <Trash2 className="w-4 h-4" /> Danger Zone
                      </h4>
                      <div className="p-6 border-2 border-red-50 rounded-2xl bg-red-50/30">
                        <h5 className="font-bold text-red-800 mb-2">Delete Local Cache</h5>
                        <p className="text-sm text-red-600/70 mb-4 leading-relaxed">Clearing data will remove all invoice history, audit logs, and settings stored in this browser's localStorage.</p>
                        <button onClick={clearData} className="flex items-center gap-2 px-6 py-2.5 bg-red-600 text-white font-bold rounded-xl hover:bg-red-700 transition-all shadow-lg shadow-red-100">
                          <Trash2 className="w-4 h-4" /> Hard Reset
                        </button>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>

            <div className="px-8 py-4 border-t border-slate-100 bg-slate-50/30 flex justify-between items-center">
              <p className="text-[10px] text-slate-400 font-mono tracking-tight">V2.7.0-STABLE • BLUE ELECTRICAL ADMIN ENGINE</p>
              <button onClick={() => setShowAdminPanel(false)} className="px-6 py-2 bg-[#0B4E7B] text-white text-sm font-bold rounded-lg hover:bg-[#083c5e] transition-all">Close Dashboard</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

const AdminNavItem: React.FC<{ icon: React.ReactNode; label: string; active: boolean; onClick: () => void }> = ({ icon, label, active, onClick }) => (
  <button 
    onClick={onClick}
    className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all text-sm font-bold ${active ? 'bg-[#0B4E7B] text-white shadow-lg shadow-blue-100' : 'text-slate-500 hover:bg-slate-50 hover:text-slate-700'}`}
  >
    {React.cloneElement(icon as React.ReactElement, { className: 'w-4 h-4' })}
    {label}
    {active && <ChevronRight className="w-3 h-3 ml-auto opacity-60" />}
  </button>
);

const FormField: React.FC<{ label: string; required?: boolean; children: React.ReactNode; className?: string }> = ({ label, required, children, className = "" }) => (
  <div className={`space-y-2 ${className}`}>
    <label className="text-sm font-medium text-slate-600 ml-1">{label}{required && <span className="text-red-500 ml-1">*</span>}</label>
    {children}
  </div>
);

export default App;
