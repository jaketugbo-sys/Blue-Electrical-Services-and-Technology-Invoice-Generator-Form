
import React, { useState, useMemo, useEffect } from 'react';
import { 
  LogOut, 
  Send, 
  Settings, 
  CheckCircle2, 
  Loader2, 
  Info,
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
  Code,
  LayoutDashboard,
  Bell,
  Search,
  ArrowUpRight,
  FileText,
  Clock,
  Briefcase
} from 'lucide-react';
import { InvoiceFormData, ServiceItem, CalculatedValues, InvoiceHistoryItem, AuditLog, User } from './types';
import { INITIAL_FORM_DATA, SERVICE_TYPES, MENU_OPTIONS } from './constants';

const ScalerunsLogo = ({ size = "normal" }: { size?: "small" | "normal" | "large" }) => {
  const scale = size === "small" ? "scale-75" : size === "large" ? "scale-110" : "scale-100";
  return (
    <div className={`flex items-center justify-center gap-3 select-none ${scale} transition-transform`}>
      <div className="flex items-baseline">
        <span className="text-3xl md:text-4xl font-bold tracking-tight text-[#5DA9DD]">Scale</span>
        <span className="text-3xl md:text-4xl font-bold tracking-tight text-[#0B4E7B]">runs</span>
      </div>
      <div className="w-10 h-10 md:w-12 md:h-12 relative group">
        <div className="absolute inset-0 bg-blue-400/20 rounded-full blur-xl group-hover:bg-blue-400/40 transition-all duration-700"></div>
        <svg viewBox="0 0 100 100" className="w-full h-full relative z-10 drop-shadow-md">
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
};

const App: React.FC = () => {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [loginUsername, setLoginUsername] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  const [loginError, setLoginError] = useState('');

  const [formData, setFormData] = useState<InvoiceFormData>(() => {
    try {
      const saved = localStorage.getItem('invoice-config');
      return saved ? { ...INITIAL_FORM_DATA, ...JSON.parse(saved) } : INITIAL_FORM_DATA;
    } catch (e) {
      return INITIAL_FORM_DATA;
    }
  });

  const [history, setHistory] = useState<InvoiceHistoryItem[]>(() => {
    try {
      const saved = localStorage.getItem('invoice-history');
      return saved ? JSON.parse(saved) : [];
    } catch (e) {
      return [];
    }
  });

  const [auditLogs, setAuditLogs] = useState<AuditLog[]>(() => {
    try {
      const saved = localStorage.getItem('invoice-audit');
      return saved ? JSON.parse(saved) : [];
    } catch (e) {
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
      return [defaultAdmin];
    }
  });

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showAdminPanel, setShowAdminPanel] = useState(false);
  const [adminTab, setAdminTab] = useState<'general' | 'history' | 'users' | 'tools'>('general');
  const [submissionStatus, setSubmissionStatus] = useState<'idle' | 'success' | 'error'>('idle');

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
      setLoginError('Invalid access credentials');
    }
  };

  const handleLogout = () => {
    addAuditLog('User Logout');
    setIsLoggedIn(false);
    setCurrentUser(null);
  };

  // Fixed error: Added missing clearData function to handle the system purge logic.
  const clearData = () => {
    if (window.confirm("CRITICAL: This will permanently delete all history, configurations, and user data. This action cannot be undone. Proceed?")) {
      localStorage.removeItem('invoice-config');
      localStorage.removeItem('invoice-history');
      localStorage.removeItem('invoice-audit');
      localStorage.removeItem('invoice-users');
      window.location.reload();
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
      alert("Pipeline connectivity not established. Access Admin Settings to configure webhook.");
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
        addAuditLog(`Invoice Dispatched: ${historyItem.id}`);
      } else {
        throw new Error('Sync failed');
      }
    } catch (err) {
      setSubmissionStatus('error');
    } finally {
      setIsSubmitting(false);
      setTimeout(() => setSubmissionStatus('idle'), 5000);
    }
  };

  if (!isLoggedIn) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#f8fafc] p-6 selection:bg-blue-100">
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] bg-blue-50/50 rounded-full blur-[120px]"></div>
          <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-indigo-50/50 rounded-full blur-[100px]"></div>
        </div>

        <div className="bg-white rounded-[40px] shadow-[0_40px_80px_-20px_rgba(0,0,0,0.1)] p-12 w-full max-w-lg border border-white relative z-10 animate-in fade-in zoom-in duration-700">
          <div className="mb-12 flex flex-col items-center">
            <ScalerunsLogo size="large" />
            <div className="h-px w-16 bg-gradient-to-r from-transparent via-slate-200 to-transparent mt-10 mb-8"></div>
            <h2 className="text-2xl font-bold text-slate-800 tracking-tight">System Portal</h2>
            <p className="text-slate-400 text-sm font-medium mt-2">Enter authorized credentials to proceed</p>
          </div>
          
          <form onSubmit={handleLogin} className="space-y-6">
            <div className="space-y-2">
              <label className="text-[11px] font-bold text-slate-400 uppercase tracking-[0.2em] ml-1">Identity ID</label>
              <div className="relative group">
                <UserIcon className="absolute left-5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-300 group-focus-within:text-[#0B4E7B] transition-colors" />
                <input 
                  type="text" value={loginUsername} onChange={(e) => setLoginUsername(e.target.value)}
                  className="w-full pl-12 pr-5 py-4 rounded-2xl bg-slate-50 border border-transparent focus:bg-white focus:border-slate-200 focus:ring-8 focus:ring-blue-500/5 outline-none transition-all placeholder:text-slate-300 font-medium"
                  placeholder="Username" required
                />
              </div>
            </div>
            <div className="space-y-2">
              <label className="text-[11px] font-bold text-slate-400 uppercase tracking-[0.2em] ml-1">Access Key</label>
              <div className="relative group">
                <Key className="absolute left-5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-300 group-focus-within:text-[#0B4E7B] transition-colors" />
                <input 
                  type="password" value={loginPassword} onChange={(e) => setLoginPassword(e.target.value)}
                  className="w-full pl-12 pr-5 py-4 rounded-2xl bg-slate-50 border border-transparent focus:bg-white focus:border-slate-200 focus:ring-8 focus:ring-blue-500/5 outline-none transition-all placeholder:text-slate-300 font-medium"
                  placeholder="••••••••" required
                />
              </div>
            </div>
            {loginError && (
              <div className="flex items-center gap-3 text-red-600 text-[13px] font-semibold bg-red-50/50 p-4 rounded-2xl animate-in slide-in-from-top-2 border border-red-100">
                <div className="w-1.5 h-1.5 rounded-full bg-red-500"></div> {loginError}
              </div>
            )}
            <button type="submit" className="w-full py-5 mt-6 bg-[#0B4E7B] text-white font-bold rounded-2xl shadow-[0_20px_40px_-10px_rgba(11,78,123,0.3)] hover:shadow-[0_25px_50px_-10px_rgba(11,78,123,0.4)] hover:-translate-y-1 active:translate-y-0 transition-all flex items-center justify-center gap-3 group">
              <span>Authorize Access</span>
              <ChevronRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
            </button>
          </form>
          
          <div className="mt-12 pt-8 border-t border-slate-50 flex justify-center gap-8">
            <span className="text-[10px] font-bold text-slate-300 uppercase tracking-widest">v2.9 Stable</span>
            <span className="text-[10px] font-bold text-slate-300 uppercase tracking-widest">Encrypted</span>
            <span className="text-[10px] font-bold text-slate-300 uppercase tracking-widest">Internal Only</span>
          </div>
        </div>
      </div>
    );
  }

  const isLogMode = formData.menuOption === 'ACTIVITY LOG' || formData.menuOption === 'TIME SUMMARY';

  return (
    <div className="min-h-screen bg-[#fcfcfd] selection:bg-blue-100">
      {/* Premium Navigation Utility */}
      <nav className="fixed top-0 left-0 right-0 z-50 px-8 py-6 flex justify-between items-center pointer-events-none">
        <div className="pointer-events-auto flex items-center gap-4 premium-glass border border-white/50 rounded-full px-6 py-3 premium-shadow">
          <ScalerunsLogo size="small" />
          <div className="h-4 w-px bg-slate-200"></div>
          <div className="flex flex-col">
            <span className="text-[10px] font-bold text-slate-800 uppercase tracking-widest leading-none">Global Console</span>
            <span className="text-[9px] font-bold text-slate-400 mt-0.5 uppercase tracking-tighter">Live Session</span>
          </div>
        </div>
        <div className="pointer-events-auto flex items-center gap-4">
          {currentUser?.role === 'Admin' && (
            <button onClick={() => setShowAdminPanel(true)} className="p-3.5 bg-white hover:bg-slate-50 text-slate-500 hover:text-[#0B4E7B] rounded-full premium-shadow border border-white transition-all group active:scale-95">
              <Settings className="w-5 h-5 group-hover:rotate-90 transition-transform duration-700" />
            </button>
          )}
          <button onClick={handleLogout} className="flex items-center gap-3 px-6 py-3.5 bg-white hover:bg-slate-50 text-slate-600 font-bold rounded-full premium-shadow border border-white transition-all text-sm group active:scale-95">
            <LogOut className="w-4 h-4 group-hover:-translate-x-1 transition-transform" /> 
            <span>Sign Out</span>
          </button>
        </div>
      </nav>

      <div className="max-w-5xl mx-auto px-8 pt-36 pb-40 space-y-16">
        <header className="space-y-6 animate-in fade-in slide-in-from-top-6 duration-1000">
          <div className="flex items-center gap-4">
            <span className="px-4 py-1.5 bg-blue-50/80 text-[#0B4E7B] text-[11px] font-bold rounded-full uppercase tracking-[0.2em] border border-blue-100/50 backdrop-blur-sm">Certified Pipeline Tool</span>
            <div className="h-px flex-1 bg-gradient-to-r from-slate-200 via-slate-100 to-transparent"></div>
          </div>
          <div className="space-y-4">
            <h1 className="text-5xl md:text-7xl font-bold text-slate-900 tracking-tight leading-[1.05]">
              Blue Electrical <br />
              <span className="text-transparent bg-clip-text bg-gradient-to-br from-[#0B4E7B] via-[#0B4E7B] to-[#5DA9DD]">Generator Console</span>
            </h1>
            <p className="text-slate-500 text-xl font-medium max-w-2xl leading-relaxed">
              Precision billing and automated activity logging for elite electrical infrastructure services.
            </p>
          </div>
        </header>

        <form onSubmit={handleSubmit} className="space-y-10">
          {/* Phase 01: Context */}
          <Section icon={<Briefcase />} title="Project Context" phase="Phase 01">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-x-10 gap-y-8">
              <FormField label="Target Entity Name">
                <Input name="companyName" value={formData.companyName} onChange={handleInputChange} placeholder="Legal company identifier" />
              </FormField>
              <FormField label="Client Authorized Signatory" required>
                <Input name="fullName" value={formData.fullName} onChange={handleInputChange} placeholder="Full legal name" required />
              </FormField>
              <FormField label="Infrastructure Address">
                <Input name="companyAddress" value={formData.companyAddress} onChange={handleInputChange} placeholder="Site physical location" />
              </FormField>
              <FormField label="Notification Email" required>
                <Input type="email" name="email" value={formData.email} onChange={handleInputChange} placeholder="billing@client.com" required />
              </FormField>
              <FormField label="Direct Contact Line" required>
                <Input type="tel" name="phone" value={formData.phone} onChange={handleInputChange} placeholder="+1 000 000-0000" required />
              </FormField>
              <FormField label="Operational Date">
                <Input type="date" name="date" value={formData.date} onChange={handleInputChange} />
              </FormField>
              <FormField label="Site Zone Designation">
                <Input name="serviceSite" value={formData.serviceSite} onChange={handleInputChange} placeholder="Level / Area / Room" />
              </FormField>
              <FormField label="Invoice Header Title">
                <Input name="invoiceTitle" value={formData.invoiceTitle} onChange={handleInputChange} placeholder="Descriptive project tag" />
              </FormField>
              <FormField label="Strategic Scope Summary" className="md:col-span-2">
                <Textarea name="pertainsTo" value={formData.pertainsTo} onChange={handleInputChange} rows={3} placeholder="Comprehensive overview of primary works..." />
              </FormField>
            </div>
          </Section>

          {/* Phase 02: Metadata */}
          <Section icon={<Database />} title="Operational Metadata" phase="Phase 02">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-x-10 gap-y-8">
              <FormField label="Workflow Category">
                <Select name="menuOption" value={formData.menuOption} onChange={handleInputChange}>
                  <option value="">Select Protocol</option>
                  {MENU_OPTIONS.map(opt => <option key={opt} value={opt}>{opt}</option>)}
                </Select>
              </FormField>
              <FormField label="Technical Inquiry Lead">
                <Input name="directInquiries" value={formData.directInquiries} onChange={handleInputChange} placeholder="Primary project engineer" />
              </FormField>

              {isLogMode && (
                <div className="md:col-span-2 grid grid-cols-1 md:grid-cols-2 gap-x-10 gap-y-8 pt-10 border-t border-slate-100 mt-4 animate-in fade-in slide-in-from-top-4 duration-500">
                  <FormField label="On-Site Employer">
                    <Input name="employerName" value={formData.employerName} onChange={handleInputChange} />
                  </FormField>
                  <FormField label="Signatory Title">
                    <Input name="employerPosition" value={formData.employerPosition} onChange={handleInputChange} />
                  </FormField>
                  <FormField label="Cumulative Work Duration">
                    <Input name="totalHours" value={formData.totalHours} onChange={handleInputChange} placeholder="Hours (e.g. 8.25)" />
                  </FormField>
                  <div className="grid grid-cols-2 gap-6">
                    <FormField label="Clock In">
                      <Input type="time" name="timeIn" value={formData.timeIn} onChange={handleInputChange} />
                    </FormField>
                    <FormField label="Clock Out">
                      <Input type="time" name="timeOut" value={formData.timeOut} onChange={handleInputChange} />
                    </FormField>
                  </div>
                </div>
              )}
            </div>
          </Section>

          {/* Phase 03: Service Trail */}
          <Section icon={<Clock />} title="Service Trail" phase="Phase 03">
            <div className="space-y-8">
              <FormField label="Primary Sequence 01">
                <Textarea name="activity1" value={formData.activity1} onChange={handleInputChange} rows={2} placeholder="Initial implementation details..." />
              </FormField>
              <FormField label="Secondary Sequence 02">
                <Textarea name="activity2" value={formData.activity2} onChange={handleInputChange} rows={2} placeholder="Execution phase details..." />
              </FormField>
              <FormField label="Finalization Sequence 03">
                <Textarea name="activity3" value={formData.activity3} onChange={handleInputChange} rows={2} placeholder="Closure and testing details..." />
              </FormField>
              <FormField label="Internal Dispatch Manifest">
                <Textarea name="notes" value={formData.notes} onChange={handleInputChange} rows={3} placeholder="Encrypted notes for office verification only..." />
              </FormField>
            </div>
          </Section>

          {/* Phase 04: Financials */}
          <Section icon={<FileText />} title="Financial Line Items" phase="Phase 04">
            <div className="space-y-4">
              <div className="hidden md:grid grid-cols-12 gap-6 mb-6 px-6 py-3 bg-slate-50 rounded-xl text-[10px] font-bold text-slate-400 uppercase tracking-[0.2em]">
                <div className="col-span-2">Quantity</div>
                <div className="col-span-2 text-center">Unit ($)</div>
                <div className="col-span-6">Resource Classification</div>
                <div className="col-span-2 text-right">Extended</div>
              </div>
              <div className="space-y-4">
                {formData.serviceItems.map((item, idx) => (
                  <div key={item.id} className="grid grid-cols-1 md:grid-cols-12 gap-6 items-center p-6 bg-white border border-slate-100 rounded-3xl premium-shadow hover:border-blue-100 transition-all group duration-300">
                    <div className="md:col-span-2">
                      <Input type="number" value={item.qty} onChange={(e) => handleServiceItemChange(idx, 'qty', parseFloat(e.target.value) || 0)} className="text-center font-bold text-lg" />
                    </div>
                    <div className="md:col-span-2">
                      <div className="relative">
                        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-300 text-xs font-bold">$</span>
                        <Input type="number" value={item.unitValue} onChange={(e) => handleServiceItemChange(idx, 'unitValue', parseFloat(e.target.value) || 0)} className="pl-7 text-center font-medium" />
                      </div>
                    </div>
                    <div className="md:col-span-6">
                      <Select value={item.itemBilled} onChange={(e) => handleServiceItemChange(idx, 'itemBilled', e.target.value)} className="font-bold text-slate-800">
                        <option value="">Ad-hoc Resource</option>
                        {SERVICE_TYPES.map(s => <option key={s.label} value={s.label}>{s.label}</option>)}
                      </Select>
                    </div>
                    <div className="md:col-span-2 text-right font-bold text-slate-900 tabular-nums text-xl">
                      ${(item.qty * item.unitValue).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                    </div>
                  </div>
                ))}
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-10 pt-16 mt-10 border-t border-slate-100">
                <FormField label="VAT / GST (5%)">
                  <div className="relative">
                    <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300 text-xs font-bold">$</span>
                    <Input type="number" name="gstInput" value={formData.gstInput} onChange={handleInputChange} className="pl-8" />
                  </div>
                </FormField>
                <FormField label="Grid Service Levy">
                  <div className="relative">
                    <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300 text-xs font-bold">$</span>
                    <Input type="number" name="enmaxInput" value={formData.enmaxInput} onChange={handleInputChange} className="pl-8" />
                  </div>
                </FormField>
                <FormField label="Permit & Regulatory">
                  <div className="relative">
                    <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300 text-xs font-bold">$</span>
                    <Input type="number" name="permitCostInput" value={formData.permitCostInput} onChange={handleInputChange} className="pl-8" />
                  </div>
                </FormField>
              </div>
            </div>
          </Section>

          {/* Global Action Terminal */}
          <div className="fixed bottom-12 left-0 right-0 z-40 pointer-events-none px-8">
            <div className="max-w-5xl mx-auto">
              <div className="pointer-events-auto bg-slate-900 rounded-[32px] p-8 shadow-[0_32px_64px_-16px_rgba(0,0,0,0.3)] flex flex-col md:flex-row items-center justify-between gap-8 border border-white/10 premium-glass backdrop-blur-3xl animate-in slide-in-from-bottom-12 duration-1000">
                <div className="flex flex-col items-start gap-1">
                  <span className="text-blue-400 text-[10px] font-bold uppercase tracking-[0.3em]">Aggregate Settlement Total</span>
                  <div className="flex items-baseline gap-2">
                    <span className="text-white/40 text-xl font-medium tracking-tight">$</span>
                    <span className="text-white text-4xl md:text-5xl font-bold tracking-tighter tabular-nums">
                      {calculated.total.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </span>
                  </div>
                </div>
                <div className="flex items-center gap-5 w-full md:w-auto">
                  <div className="hidden lg:flex flex-col items-end gap-1 px-6 border-r border-white/10">
                    <span className="text-white/30 text-[9px] font-bold uppercase tracking-widest">System Readiness</span>
                    <span className="text-emerald-400 text-xs font-bold flex items-center gap-2">
                      <div className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></div>
                      Validated
                    </span>
                  </div>
                  <button 
                    type="submit" 
                    disabled={isSubmitting} 
                    className="flex-1 md:flex-none px-14 py-5 bg-white text-[#0B4E7B] font-bold rounded-2xl shadow-xl hover:shadow-white/20 hover:-translate-y-1.5 active:translate-y-0 transition-all flex items-center justify-center gap-4 disabled:opacity-50 group"
                  >
                    {isSubmitting ? <Loader2 className="w-6 h-6 animate-spin" /> : <Send className="w-6 h-6 group-hover:rotate-12 transition-transform" />}
                    <span className="text-lg">{isSubmitting ? 'Syncing Pipeline...' : 'Commit & Dispatch'}</span>
                  </button>
                </div>
              </div>
            </div>
          </div>
        </form>
      </div>

      {/* Modern Admin Overlay */}
      {showAdminPanel && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 bg-slate-900/60 backdrop-blur-2xl animate-in fade-in duration-700">
          <div className="bg-white rounded-[48px] w-full max-w-6xl h-full max-h-[900px] overflow-hidden flex flex-col shadow-[0_64px_128px_-32px_rgba(0,0,0,0.3)] border border-white/50">
            {/* Header */}
            <div className="px-12 py-10 flex items-center justify-between border-b border-slate-50 bg-slate-50/20">
              <div className="flex items-center gap-6">
                <div className="p-4 bg-blue-600 rounded-[24px] text-white shadow-xl shadow-blue-500/20">
                  <ShieldCheck className="w-8 h-8" />
                </div>
                <div>
                  <h3 className="text-3xl font-bold text-slate-900 tracking-tight">Command Center</h3>
                  <div className="flex items-center gap-3 mt-1">
                    <span className="text-slate-400 text-[11px] font-bold uppercase tracking-[0.2em]">Global Management</span>
                    <div className="w-1 h-1 rounded-full bg-slate-200"></div>
                    <span className="text-blue-500 text-[11px] font-bold uppercase tracking-widest">Super Admin Level</span>
                  </div>
                </div>
              </div>
              <button 
                onClick={() => setShowAdminPanel(false)} 
                className="w-14 h-14 flex items-center justify-center bg-slate-50 hover:bg-slate-100 text-slate-400 hover:text-slate-900 rounded-full transition-all group"
              >
                <X className="w-7 h-7 group-hover:rotate-90 transition-transform duration-500" />
              </button>
            </div>

            <div className="flex flex-1 overflow-hidden">
              {/* Sidebar Nav */}
              <aside className="w-80 border-r border-slate-50 p-10 flex flex-col gap-4 bg-slate-50/10">
                <AdminNavItem icon={<LayoutDashboard />} label="Dashboard Overview" active={adminTab === 'general'} onClick={() => setAdminTab('general')} />
                <AdminNavItem icon={<History />} label="Invoice Registry" active={adminTab === 'history'} onClick={() => setAdminTab('history')} />
                <AdminNavItem icon={<Users />} label="Team Roster" active={adminTab === 'users'} onClick={() => setAdminTab('users')} />
                <div className="mt-auto space-y-4">
                  <div className="h-px w-full bg-slate-100"></div>
                  <AdminNavItem icon={<Database />} label="System Assets" active={adminTab === 'tools'} onClick={() => setAdminTab('tools')} />
                </div>
              </aside>

              {/* Viewport */}
              <main className="flex-1 p-14 overflow-y-auto bg-white">
                {adminTab === 'general' && (
                  <div className="space-y-12 animate-in slide-in-from-right-10 duration-700">
                    <div className="grid grid-cols-1 gap-10">
                      <div className="space-y-6">
                        <div className="flex items-center justify-between">
                          <h4 className="text-lg font-bold text-slate-900 tracking-tight">Automation Webhook</h4>
                          <span className="text-[10px] font-bold text-blue-500 px-3 py-1 bg-blue-50 rounded-full uppercase tracking-widest">Direct Link</span>
                        </div>
                        <div className="bg-slate-50 p-10 rounded-[40px] border border-slate-100 relative group">
                          <div className="absolute -top-3 -right-3 p-3 bg-white rounded-2xl shadow-lg border border-slate-50 opacity-0 group-hover:opacity-100 transition-all duration-500">
                            <ArrowUpRight className="w-5 h-5 text-blue-500" />
                          </div>
                          <label className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.2em] block mb-4 ml-1">Make.com Endpoint Integration</label>
                          <Input 
                            type="url" 
                            value={formData.webhookUrl} 
                            onChange={(e) => setFormData(p => ({ ...p, webhookUrl: e.target.value }))} 
                            placeholder="https://hook.us1.make.com/..." 
                            className="bg-white py-5 text-lg"
                          />
                          <p className="text-xs text-slate-400 mt-6 leading-relaxed flex items-start gap-3 italic">
                            <Info className="w-4 h-4 mt-0.5 shrink-0" />
                            Synchronizes payload directly with the enterprise financial pipeline. Ensure endpoint is validated before committing live data.
                          </p>
                        </div>
                      </div>
                      
                      <div className="space-y-6">
                        <h4 className="text-lg font-bold text-slate-900 tracking-tight">Recent Security Events</h4>
                        <div className="space-y-4">
                          {auditLogs.slice(0, 5).map(log => (
                            <div key={log.id} className="flex items-center gap-6 bg-slate-50/50 p-6 rounded-3xl border border-slate-50 hover:bg-slate-50 transition-colors">
                              <div className="w-12 h-12 rounded-2xl bg-white shadow-sm flex items-center justify-center">
                                <ShieldCheck className="w-5 h-5 text-slate-400" />
                              </div>
                              <div className="flex-1">
                                <span className="text-sm font-bold text-slate-800">{log.action}</span>
                                <div className="flex items-center gap-3 mt-1">
                                  <span className="text-[11px] font-bold text-slate-400 uppercase tracking-widest">{log.timestamp}</span>
                                  <div className="w-1 h-1 rounded-full bg-slate-200"></div>
                                  <span className="text-[11px] font-bold text-[#0B4E7B] uppercase tracking-widest">@{log.user}</span>
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {adminTab === 'history' && (
                  <div className="space-y-8 animate-in slide-in-from-right-10 duration-700">
                    <div className="flex items-center justify-between">
                       <h4 className="text-2xl font-bold text-slate-900 tracking-tight">Settlement Registry</h4>
                       <button className="px-6 py-3 bg-white hover:bg-slate-50 text-slate-600 font-bold text-xs rounded-xl border border-slate-100 transition-all flex items-center gap-2 premium-shadow">
                         <Download className="w-4 h-4" /> Full Export (CSV)
                       </button>
                    </div>
                    <div className="bg-white rounded-[40px] overflow-hidden border border-slate-100 premium-shadow">
                      <table className="w-full text-left">
                        <thead className="bg-slate-50/50 text-[10px] font-bold text-slate-400 uppercase tracking-[0.2em] border-b border-slate-100">
                          <tr>
                            <th className="px-10 py-6">Trace ID</th>
                            <th className="px-10 py-6">Beneficiary</th>
                            <th className="px-10 py-6">Value (USD)</th>
                            <th className="px-10 py-6">Timestamp</th>
                            <th className="px-10 py-6"></th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                          {history.length === 0 ? (
                            <tr><td colSpan={5} className="px-10 py-20 text-center text-slate-400 font-medium">No encrypted records found in local cache.</td></tr>
                          ) : history.map(item => (
                            <tr key={item.id} className="hover:bg-slate-50/30 group transition-colors">
                              <td className="px-10 py-7 font-mono text-[11px] text-[#0B4E7B] font-bold uppercase">{item.id.split('-')[0]}</td>
                              <td className="px-10 py-7 font-bold text-slate-800 text-sm">{item.clientName}</td>
                              <td className="px-10 py-7 font-bold text-slate-900 text-lg tabular-nums">${item.total.toLocaleString(undefined, { minimumFractionDigits: 2 })}</td>
                              <td className="px-10 py-7 text-slate-400 text-xs font-medium">{item.date}</td>
                              <td className="px-10 py-7 text-right">
                                <button className="p-3 bg-slate-50 opacity-0 group-hover:opacity-100 transition-all rounded-xl hover:bg-[#0B4E7B] hover:text-white">
                                  <ExternalLink className="w-4 h-4" />
                                </button>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}

                {adminTab === 'users' && (
                  <div className="space-y-10 animate-in slide-in-from-right-10 duration-700">
                    <div className="flex items-center justify-between">
                       <h4 className="text-2xl font-bold text-slate-900 tracking-tight">Authorized Personnel</h4>
                       <button className="px-8 py-4 bg-[#0B4E7B] text-white text-sm font-bold rounded-2xl hover:-translate-y-1 transition-all shadow-xl shadow-blue-900/10 flex items-center gap-3">
                         <Plus className="w-5 h-5" /> Provision Key
                       </button>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                      {users.map(u => (
                        <div key={u.id} className="bg-white p-10 rounded-[40px] border border-slate-100 premium-shadow flex flex-col items-center gap-6 hover:border-blue-200 transition-all group">
                          <div className="w-24 h-24 rounded-[32px] bg-gradient-to-br from-slate-50 to-white border border-slate-100 flex items-center justify-center text-[#0B4E7B] font-bold text-3xl shadow-sm group-hover:scale-110 transition-transform">
                            {u.displayName[0]}
                          </div>
                          <div className="text-center">
                            <h5 className="text-xl font-bold text-slate-900">{u.displayName}</h5>
                            <p className="text-[11px] text-slate-400 font-bold uppercase tracking-[0.2em] mt-2">@{u.username} • {u.role}</p>
                          </div>
                          {!u.isDefault ? (
                            <button className="mt-4 p-4 text-red-300 hover:text-red-500 hover:bg-red-50 rounded-2xl transition-all">
                              <Trash2 className="w-5 h-5" />
                            </button>
                          ) : (
                            <div className="mt-4 px-5 py-2 bg-slate-50 rounded-full text-[10px] font-bold text-slate-400 uppercase tracking-widest">Permanent Entity</div>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {adminTab === 'tools' && (
                  <div className="space-y-14 animate-in slide-in-from-right-10 duration-700">
                    <div className="space-y-6">
                      <h4 className="text-xl font-bold text-slate-900 flex items-center gap-4">
                        <Code className="w-6 h-6 text-blue-500" /> 
                        Integration Sandbox
                      </h4>
                      <div className="bg-slate-50 p-12 rounded-[48px] border border-slate-100 relative group">
                        <p className="text-base text-slate-600 font-medium mb-8 leading-relaxed max-w-xl">
                          Incorporate this generator console into authorized external workspaces via secure iframe embedding.
                        </p>
                        <div className="bg-slate-950 rounded-3xl p-8 relative group overflow-hidden">
                          <div className="absolute top-0 right-0 w-32 h-32 bg-blue-500/10 rounded-full blur-3xl"></div>
                          <code className="text-[12px] text-blue-400 font-mono block whitespace-pre overflow-x-auto leading-loose">
{`<iframe 
  src="${window.location.origin}" 
  style="width:100%; height:1000px; border:none; border-radius:48px;" 
  title="Enterprise Invoice Generator"
></iframe>`}
                          </code>
                          <button 
                            onClick={() => {
                              navigator.clipboard.writeText(`<iframe src="${window.location.origin}" style="width:100%; height:1000px; border:none; border-radius:48px;" title="Enterprise Invoice Generator"></iframe>`);
                              alert("Payload copied to clipboard.");
                            }}
                            className="absolute top-6 right-6 bg-white/10 hover:bg-white/20 text-white text-[11px] font-bold px-5 py-2.5 rounded-xl border border-white/5 opacity-0 group-hover:opacity-100 transition-all backdrop-blur-md"
                          >
                            Copy Source
                          </button>
                        </div>
                      </div>
                    </div>

                    <div className="p-12 bg-red-50/40 rounded-[48px] border-2 border-red-50 space-y-6">
                      <div className="flex items-center gap-4">
                        <div className="p-3 bg-red-100 rounded-2xl text-red-600">
                          <Trash2 className="w-6 h-6" />
                        </div>
                        <h5 className="text-xl font-bold text-red-900">Cold Start System Purge</h5>
                      </div>
                      <p className="text-base text-red-800/60 leading-relaxed max-w-2xl font-medium">
                        This operation wipes all locally cached data objects including history, identities, and encrypted configurations. This protocol is non-reversible.
                      </p>
                      <button onClick={clearData} className="px-10 py-4 bg-red-600 text-white font-bold rounded-2xl hover:bg-red-700 transition-all shadow-xl shadow-red-200 active:scale-95">
                        Perform Global Wipe
                      </button>
                    </div>
                  </div>
                )}
              </main>
            </div>
          </div>
        </div>
      )}

      {/* Persistence Notification Center */}
      {submissionStatus !== 'idle' && (
        <div className={`fixed bottom-40 left-1/2 -translate-x-1/2 px-10 py-5 rounded-[24px] shadow-2xl flex items-center gap-5 z-[150] premium-glass animate-in slide-in-from-bottom-12 border-2 backdrop-blur-3xl ${submissionStatus === 'success' ? 'border-emerald-100 text-emerald-900' : 'border-red-100 text-red-900'}`}>
          <div className={`p-3 rounded-2xl ${submissionStatus === 'success' ? 'bg-emerald-100 text-emerald-600 shadow-inner' : 'bg-red-100 text-red-600 shadow-inner'}`}>
            {submissionStatus === 'success' ? <CheckCircle2 className="w-6 h-6" /> : <Info className="w-6 h-6" />}
          </div>
          <div>
            <span className="font-bold text-base tracking-tight block">
              {submissionStatus === 'success' ? 'Pipeline Synchronization Successful' : 'Data Transmission Halted'}
            </span>
            <span className="text-xs font-medium opacity-60">
              {submissionStatus === 'success' ? 'The settlement record has been moved to history.' : 'Check your webhook connectivity and try again.'}
            </span>
          </div>
        </div>
      )}
    </div>
  );
};

// --- World-Class UI Component Suite ---

const Section = ({ icon, title, phase, children, className = "" }: { icon: React.ReactNode; title: string; phase?: string; children?: React.ReactNode; className?: string }) => (
  <div className={`bg-white rounded-[48px] p-12 premium-shadow border border-white relative overflow-hidden group hover:border-blue-100/50 transition-all duration-700 ${className}`}>
    <div className="absolute top-0 left-0 w-3 h-full bg-slate-50 group-hover:bg-[#0B4E7B]/10 transition-colors"></div>
    <div className="flex items-center justify-between mb-12">
      <div className="flex items-center gap-5">
        <div className="p-4 bg-slate-50 rounded-[24px] text-slate-400 group-hover:text-[#0B4E7B] group-hover:bg-blue-50 group-hover:shadow-lg group-hover:shadow-blue-500/10 transition-all duration-500">
          {React.cloneElement(icon as React.ReactElement, { className: 'w-7 h-7' })}
        </div>
        <h2 className="text-3xl font-bold text-slate-800 tracking-tight">{title}</h2>
      </div>
      {phase && <span className="text-[10px] font-bold text-slate-300 uppercase tracking-[0.4em]">{phase}</span>}
    </div>
    <div className="animate-in fade-in duration-1000">
      {children}
    </div>
  </div>
);

const FormField = ({ label, required, children, className = "" }: { label: string; required?: boolean; children?: React.ReactNode; className?: string }) => (
  <div className={`flex flex-col gap-3 ${className}`}>
    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.2em] ml-2 flex items-center gap-2">
      <div className={`w-1 h-1 rounded-full ${required ? 'bg-blue-500' : 'bg-slate-200'}`}></div>
      {label}
    </label>
    {children}
  </div>
);

const Input = (props: React.InputHTMLAttributes<HTMLInputElement>) => (
  <input 
    {...props} 
    className={`w-full px-6 py-4.5 rounded-2xl bg-slate-50/50 border border-slate-100/50 focus:bg-white focus:border-[#0B4E7B] focus:ring-8 focus:ring-[#0B4E7B]/5 outline-none transition-all placeholder:text-slate-300 font-semibold text-slate-700 ${props.className || ''}`} 
  />
);

const Textarea = (props: React.TextareaHTMLAttributes<HTMLTextAreaElement>) => (
  <textarea 
    {...props} 
    className={`w-full px-6 py-5 rounded-[28px] bg-slate-50/50 border border-slate-100/50 focus:bg-white focus:border-[#0B4E7B] focus:ring-8 focus:ring-[#0B4E7B]/5 outline-none transition-all placeholder:text-slate-300 font-semibold text-slate-700 resize-none ${props.className || ''}`} 
  />
);

const Select = (props: React.SelectHTMLAttributes<HTMLSelectElement>) => (
  <div className="relative group">
    <select 
      {...props} 
      className={`w-full px-6 py-4.5 rounded-2xl bg-slate-50/50 border border-slate-100/50 focus:bg-white focus:border-[#0B4E7B] focus:ring-8 focus:ring-[#0B4E7B]/5 outline-none transition-all appearance-none cursor-pointer font-bold text-slate-800 ${props.className || ''}`} 
    />
    <ChevronRight className="absolute right-5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-300 pointer-events-none group-focus-within:rotate-90 transition-transform" />
  </div>
);

const AdminNavItem = ({ icon, label, active, onClick }: { icon: React.ReactNode; label: string; active: boolean; onClick: () => void }) => (
  <button 
    onClick={onClick}
    className={`flex items-center gap-5 px-8 py-5 rounded-[24px] transition-all group ${active ? 'bg-[#0B4E7B] text-white shadow-2xl shadow-blue-900/20' : 'text-slate-400 hover:text-slate-900 hover:bg-white hover:premium-shadow'}`}
  >
    <div className={`p-2 rounded-xl transition-colors ${active ? 'bg-white/10' : 'bg-slate-50 group-hover:bg-blue-50 group-hover:text-[#0B4E7B]'}`}>
      {React.cloneElement(icon as React.ReactElement, { className: 'w-5 h-5' })}
    </div>
    <span className="text-base font-bold tracking-tight">{label}</span>
    {active && <ArrowUpRight className="w-5 h-5 ml-auto opacity-50 animate-in slide-in-from-left-2" />}
  </button>
);

export default App;
