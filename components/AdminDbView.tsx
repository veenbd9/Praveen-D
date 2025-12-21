
import React, { useState, useEffect } from 'react';
import { SavedResume, User, CompanySettings } from '../types';
import { PatentSpecGenerator } from './PatentSpecGenerator';
import { getCompanySettings, saveCompanySettings } from '../services/cryptoService';

interface AdminDbViewProps {
  savedResumes: SavedResume[];
  onToggleStatus: (id: number) => void;
}

interface PlanStats {
    totalActive: number;
    expiringSoon: number;
    users: User[];
}

export const AdminDbView: React.FC<AdminDbViewProps> = ({ savedResumes, onToggleStatus }) => {
  const [activeTab, setActiveTab] = useState<'resumes' | 'test_accounts' | 'subscriptions' | 'patents' | 'whatsapp'>('resumes');
  const [testAccounts, setTestAccounts] = useState<Record<string, string>>({});
  const [editingId, setEditingId] = useState<string | null>(null);
  const [tempPassword, setTempPassword] = useState('');
  const [allUsers, setAllUsers] = useState<User[]>([]);
  
  // WhatsApp & Profile State
  const [whatsappSettings, setWhatsappSettings] = useState<CompanySettings>(getCompanySettings());
  const [isSavingWA, setIsSavingWA] = useState(false);

  useEffect(() => {
      const storedTest = localStorage.getItem('test_accounts_db');
      if (storedTest) {
          setTestAccounts(JSON.parse(storedTest));
      }
      const storedUsers = localStorage.getItem('mock_users_db');
      if (storedUsers) {
          const parsed = JSON.parse(storedUsers);
          setAllUsers(Object.values(parsed));
      }
  }, []);

  const handleEditClick = (id: string, currentPass: string) => {
      setEditingId(id);
      setTempPassword(currentPass);
  };

  const handleSavePassword = (id: string) => {
      const updated = { ...testAccounts, [id]: tempPassword };
      setTestAccounts(updated);
      localStorage.setItem('test_accounts_db', JSON.stringify(updated));
      setEditingId(null);
      setTempPassword('');
  };

  const handleSaveWASettings = () => {
      setIsSavingWA(true);
      setTimeout(() => {
          saveCompanySettings(whatsappSettings);
          setIsSavingWA(false);
          alert('Profile & Security Configuration Commited Successfully.');
      }, 800);
  };

  const getSubscriptionStats = () => {
      const now = Date.now();
      const sevenDays = 7 * 24 * 60 * 60 * 1000;
      const stats: Record<string, PlanStats> = {
          '1-month': { totalActive: 0, expiringSoon: 0, users: [] },
          '3-month': { totalActive: 0, expiringSoon: 0, users: [] },
          '6-month': { totalActive: 0, expiringSoon: 0, users: [] },
          'free': { totalActive: 0, expiringSoon: 0, users: [] }
      };
      allUsers.forEach(user => {
          const plan = user.subscription.planType;
          if (stats[plan]) {
              const isActive = user.subscription.isActive || plan === 'free';
              if (isActive) {
                  stats[plan].totalActive++;
                  stats[plan].users.push(user);
                  if (plan !== 'free' && user.subscription.expiryDate - now < sevenDays && user.subscription.expiryDate > now) {
                      stats[plan].expiringSoon++;
                  }
              }
          }
      });
      return stats;
  };

  const subStats = getSubscriptionStats();

  const maskNumber = (num: string) => {
      if (!num) return 'Not Configured';
      // Clean non-digits for length check
      const clean = num.replace(/\D/g, '');
      if (clean.length < 4) return '**********';
      // Returns format like ******4395
      return '******' + clean.slice(-4);
  };

  return (
    <div className="mt-12 bg-slate-800/80 border border-red-900/50 rounded-lg overflow-hidden animate-fade-in">
      <div className="bg-red-900/20 p-4 border-b border-red-900/30 flex flex-col sm:flex-row justify-between items-center gap-4">
        <h3 className="text-xl font-bold text-red-400 flex items-center">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 7v10c0 2.21 3.582 4 8 4s8 4 8-4V7M4 7c0 2.21 3.582 4 8 4s8-1.79 8-4M4 7c0-2.21 3.582-4 8-4s8 1.79 8 4m0 5c0 2.21-3.582 4-8 4s-8-1.79-8-4" />
            </svg>
            System Administration
        </h3>
        <div className="flex space-x-2 flex-wrap gap-2">
             <button onClick={() => setActiveTab('resumes')} className={`px-3 py-1 rounded text-xs font-bold transition-colors ${activeTab === 'resumes' ? 'bg-red-600 text-white' : 'bg-slate-700 text-slate-300 hover:bg-slate-600'}`}>Resumes</button>
             <button onClick={() => setActiveTab('subscriptions')} className={`px-3 py-1 rounded text-xs font-bold transition-colors ${activeTab === 'subscriptions' ? 'bg-red-600 text-white' : 'bg-slate-700 text-slate-300 hover:bg-slate-600'}`}>Subscriptions</button>
             <button onClick={() => setActiveTab('test_accounts')} className={`px-3 py-1 rounded text-xs font-bold transition-colors ${activeTab === 'test_accounts' ? 'bg-red-600 text-white' : 'bg-slate-700 text-slate-300 hover:bg-slate-600'}`}>Test Accounts</button>
             <button onClick={() => setActiveTab('whatsapp')} className={`px-3 py-1 rounded text-xs font-bold transition-colors ${activeTab === 'whatsapp' ? 'bg-green-600 text-white' : 'bg-slate-700 text-slate-300 hover:bg-slate-600'}`}>Profile & Communication</button>
             <button onClick={() => setActiveTab('patents')} className={`px-3 py-1 rounded text-xs font-bold transition-colors ${activeTab === 'patents' ? 'bg-red-600 text-white' : 'bg-slate-700 text-slate-300 hover:bg-slate-600'}`}>Intellectual Property</button>
        </div>
      </div>
      
      {activeTab === 'resumes' && (
      <div className="p-4">
        <div className="flex justify-between items-end mb-4">
            <p className="text-slate-400 text-sm">Total Records: <span className="text-white font-mono font-bold">{savedResumes.length}</span></p>
            <div className="text-xs text-slate-400">
                <span className="font-bold text-red-300 italic">SYSTEM RULE:</span> Permanent Data Persistence.
            </div>
        </div>
        <div className="overflow-x-auto border border-slate-700 rounded-lg">
            <table className="w-full text-left text-sm text-slate-400">
                <thead className="bg-slate-900 text-slate-300 uppercase font-bold text-xs">
                    <tr>
                        <th className="p-3 border-b border-slate-700">ID</th>
                        <th className="p-3 border-b border-slate-700">Subject</th>
                        <th className="p-3 border-b border-slate-700">Status</th>
                        <th className="p-3 border-b border-slate-700">Data Sample</th>
                        <th className="p-3 border-b border-slate-700 text-right">Administrative Action</th>
                    </tr>
                </thead>
                <tbody className="divide-y divide-slate-700 bg-slate-800/30">
                    {savedResumes.map(resume => (
                        <tr key={resume.id} className={`hover:bg-slate-700/40 transition-colors ${resume.status === 'SUSPENDED' ? 'opacity-50 bg-red-900/10' : ''}`}>
                            <td className="p-3 font-mono text-xs text-slate-500">{resume.id}</td>
                            <td className="p-3 text-indigo-300 font-medium">{resume.name}</td>
                            <td className="p-3">
                                <span className={`px-2 py-1 rounded text-xs font-bold ${resume.status === 'ACTIVE' ? 'bg-green-900 text-green-300' : 'bg-red-900 text-red-300'}`}>
                                    {resume.status}
                                </span>
                            </td>
                            <td className="p-3 text-slate-400 max-w-xs truncate font-mono text-xs opacity-80">
                                {resume.content.substring(0, 60).replace(/\n/g, ' ')}...
                            </td>
                            <td className="p-3 text-right">
                                <button onClick={() => onToggleStatus(resume.id)} className={`px-3 py-1 rounded transition-colors text-xs font-semibold border ${resume.status === 'ACTIVE' ? 'text-red-400 border-red-800 hover:bg-red-900/30' : 'text-green-400 border-green-800 hover:bg-green-900/30'}`}>
                                    {resume.status === 'ACTIVE' ? 'DEACTIVATE' : 'REACTIVATE'}
                                </button>
                            </td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
      </div>
      )}

      {activeTab === 'subscriptions' && (
          <div className="p-6 space-y-8">
              <div className="flex justify-between items-center">
                  <div>
                    <h4 className="text-xl font-bold text-slate-200">User Retention Insights</h4>
                    <p className="text-sm text-slate-400">Monitoring subscription cycles and renewals.</p>
                  </div>
                  <div className="bg-slate-700 px-4 py-2 rounded-lg text-center">
                      <span className="text-slate-400 text-xs uppercase block">Inflow Index</span>
                      <span className="text-2xl font-bold text-white">{allUsers.length}</span>
                  </div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                   {['1-month', '3-month', '6-month'].map(plan => (
                       <div key={plan} className="bg-slate-900/50 border border-slate-700 p-4 rounded-lg">
                           <h5 className="text-indigo-400 font-bold uppercase text-sm mb-2">{plan} License</h5>
                           <div className="flex justify-between items-end">
                               <div>
                                   <span className="text-3xl font-bold text-white">{subStats[plan].totalActive}</span>
                                   <span className="text-slate-500 text-xs ml-2">Active</span>
                               </div>
                               {subStats[plan].expiringSoon > 0 && (
                                   <div className="text-right">
                                       <span className="text-xl font-bold text-yellow-500">{subStats[plan].expiringSoon}</span>
                                       <p className="text-slate-500 text-[10px] uppercase">Renewals Due</p>
                                   </div>
                               )}
                           </div>
                       </div>
                   ))}
              </div>
          </div>
      )}

      {activeTab === 'test_accounts' && (
          <div className="p-6">
              <div className="mb-4">
                  <h4 className="text-lg font-bold text-slate-200">Sandbox Passphrases</h4>
              </div>
              <div className="bg-slate-900/50 rounded-lg border border-slate-700 overflow-hidden max-w-2xl">
                   <table className="w-full text-left text-sm text-slate-400">
                       <thead className="bg-slate-900 text-slate-300 uppercase font-bold text-xs">
                           <tr>
                               <th className="p-3 border-b border-slate-700">Account Ref</th>
                               <th className="p-3 border-b border-slate-700">Passphrase</th>
                               <th className="p-3 border-b border-slate-700 text-right">Action</th>
                           </tr>
                       </thead>
                       <tbody className="divide-y divide-slate-700">
                           {(Object.entries(testAccounts) as [string, string][]).map(([id, password]) => (
                               <tr key={id} className="hover:bg-slate-800/50">
                                   <td className="p-3 font-bold text-indigo-300">{id}</td>
                                   <td className="p-3 font-mono">
                                       {editingId === id ? <input type="text" value={tempPassword} onChange={(e) => setTempPassword(e.target.value)} className="bg-slate-900 border border-indigo-500 rounded px-2 py-1 text-white text-xs w-full outline-none" /> : password}
                                   </td>
                                   <td className="p-3 text-right">
                                       {editingId === id ? (
                                           <div className="flex justify-end space-x-2">
                                                <button onClick={() => setEditingId(null)} className="text-slate-500 text-xs font-bold hover:text-white transition-colors">Cancel</button>
                                                <button onClick={() => handleSavePassword(id)} className="text-green-400 text-xs font-bold border border-green-700 px-2 py-1 rounded bg-green-900/20 hover:bg-green-900/40 transition-all">Save</button>
                                           </div>
                                       ) : <button onClick={() => handleEditClick(id, password)} className="text-indigo-400 text-xs font-bold border border-indigo-700 px-2 py-1 rounded bg-indigo-900/20 hover:bg-indigo-900/40 transition-all">Update</button>}
                                   </td>
                               </tr>
                           ))}
                       </tbody>
                   </table>
              </div>
          </div>
      )}

      {activeTab === 'whatsapp' && (
          <div className="p-6">
              <div className="flex justify-between items-start mb-6 border-b border-slate-700 pb-6">
                  <div>
                      <h4 className="text-xl font-bold text-green-400 flex items-center">
                          <svg className="w-6 h-6 mr-2" fill="currentColor" viewBox="0 0 24 24"><path d="M12.011 2.005c-5.518 0-9.998 4.456-9.998 9.971 0 1.916.541 3.702 1.477 5.228l-1.477 5.4 5.539-1.453c1.45.8 3.097 1.259 4.846 1.259 5.518 0 9.997-4.456 9.997-9.971 0-5.515-4.479-9.971-9.997-9.971zm5.556 14.12c-.24.673-1.185 1.229-1.896 1.306-.519.057-1.192.083-1.926-.211-.476-.192-1.076-.43-1.854-.766-3.322-1.436-5.462-4.81-5.628-5.033-.166-.223-1.348-1.79-1.348-3.414s.847-2.422 1.15-2.754c.302-.331.658-.414.877-.414.218 0 .436.002.625.01.196.008.461-.074.721.558.261.632.894 2.181.97 2.336.077.155.128.337.026.541-.102.204-.153.332-.306.51-.153.178-.322.397-.459.534-.153.153-.313.32-.134.627.179.307.795 1.31 1.706 2.12.167.148.318.27.464.385.146.115.281.2.404.282.358.243.568.193.778-.051.21-.243.914-1.065 1.159-1.432.246-.367.491-.307.828-.184.337.123 2.135 1.008 2.503 1.192.368.184.614.276.705.431.091.155.091.899-.149 1.572z"/></svg>
                          Superuser Profile & Communication Configuration
                      </h4>
                      <p className="text-sm text-slate-400 mt-1">Setup authentication targets and official business communication nodes.</p>
                  </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
                  <div className="space-y-8">
                      {/* Personal Mobile - For 2FA */}
                      <div className="bg-slate-900/50 p-6 rounded-2xl border border-slate-700 shadow-xl">
                          <label className="block text-[10px] font-black text-slate-500 uppercase mb-4 tracking-[0.2em]">Primary Authentication Mobile (2FA)</label>
                          <div className="flex gap-2 group">
                              <span className="bg-slate-800 border border-slate-700 rounded-xl px-4 py-3 text-slate-500 font-mono text-lg transition-colors group-focus-within:border-emerald-500/50">+91</span>
                              <input 
                                type="text" 
                                value={whatsappSettings.personalMobileNumber}
                                onChange={(e) => setWhatsappSettings({...whatsappSettings, personalMobileNumber: e.target.value.replace(/[^0-9]/g, '')})}
                                placeholder="9849734395"
                                className="flex-grow bg-slate-950 border border-slate-700 rounded-xl px-4 py-3 text-white font-mono text-lg focus:border-emerald-500 outline-none transition-all placeholder-slate-800 shadow-inner"
                              />
                          </div>
                          <div className="mt-4 flex items-start space-x-2">
                               <div className="bg-emerald-500/10 p-1 rounded-full mt-0.5">
                                    <svg className="w-3 h-3 text-emerald-400" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M2.166 4.999A11.954 11.954 0 0010 1.944 11.954 11.954 0 0017.834 5c.11.65.166 1.32.166 2.001 0 5.225-3.34 9.67-8 11.317C5.34 16.67 2 12.225 2 7c0-.682.057-1.35.166-2.001zm11.541 3.708a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" /></svg>
                               </div>
                               <p className="text-[10px] text-emerald-400/80 font-bold uppercase tracking-wider">
                                   Secured OTP Delivery Target
                               </p>
                          </div>
                      </div>

                      {/* Business WhatsApp */}
                      <div className="bg-slate-900/50 p-6 rounded-2xl border border-green-900/30 shadow-xl overflow-hidden relative">
                          <div className="absolute -top-10 -right-10 w-32 h-32 bg-green-500/5 rounded-full blur-2xl"></div>
                          
                          <label className="block text-[10px] font-black text-green-600/80 uppercase mb-4 tracking-[0.2em]">Official Business WhatsApp Node</label>
                          <div className="flex gap-2 mb-6 group">
                              <span className="bg-slate-800 border border-slate-700 rounded-xl px-4 py-3 text-slate-500 font-mono text-lg group-focus-within:border-green-500/50">+91</span>
                              <input 
                                type="text" 
                                value={whatsappSettings.businessWhatsAppNumber}
                                onChange={(e) => setWhatsappSettings({...whatsappSettings, businessWhatsAppNumber: e.target.value.replace(/[^0-9]/g, '')})}
                                placeholder="Enter Business Number"
                                className="flex-grow bg-slate-950 border border-slate-700 rounded-xl px-4 py-3 text-white font-mono text-lg focus:border-green-500 outline-none transition-all placeholder-slate-800 shadow-inner"
                              />
                          </div>
                          
                          {/* MASKED PREVIEW - For Privacy during Screen Share */}
                          <div className="bg-slate-950/80 p-5 rounded-2xl border border-slate-800 backdrop-blur-sm relative group">
                               <div className="flex justify-between items-center mb-4">
                                   <p className="text-[10px] text-slate-600 uppercase font-black tracking-widest flex items-center">
                                       <svg className="w-3 h-3 mr-2 text-slate-700" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l18 18" /></svg>
                                       Privacy Masked Dashboard Display
                                   </p>
                                   <span className="text-[9px] bg-slate-800 text-slate-400 px-2 py-0.5 rounded-full font-bold">LIVE PREVIEW</span>
                               </div>
                               <div className="flex items-center space-x-4">
                                   <div className="p-2 bg-green-500/10 rounded-lg">
                                       <svg className="w-5 h-5 text-green-500" fill="currentColor" viewBox="0 0 24 24"><path d="M12.011 2.005c-5.518 0-9.998 4.456-9.998 9.971 0 1.916.541 3.702 1.477 5.228l-1.477 5.4 5.539-1.453c1.45.8 3.097 1.259 4.846 1.259 5.518 0 9.997-4.456 9.997-9.971 0-5.515-4.479-9.971-9.997-9.971zm5.556 14.12c-.24.673-1.185 1.229-1.896 1.306-.519.057-1.192.083-1.926-.211-.476-.192-1.076-.43-1.854-.766-3.322-1.436-5.462-4.81-5.628-5.033-.166-.223-1.348-1.79-1.348-3.414s.847-2.422 1.15-2.754c.302-.331.658-.414.877-.414.218 0 .436.002.625.01.196.008.461-.074.721.558.261.632.894 2.181.97 2.336.077.155.128.337.026.541-.102.204-.153.332-.306.51-.153.178-.322.397-.459.534-.153.153-.313.32-.134.627.179.307.795 1.31 1.706 2.12.167.148.318.27.464.385.146.115.281.2.404.282.358.243.568.193.778-.051.21-.243.914-1.065 1.159-1.432.246-.367.491-.307.828-.184.337.123 2.135 1.008 2.503 1.192.368.184.614.276.705.431.091.155.091.899-.149 1.572z"/></svg>
                                   </div>
                                   <span className="text-2xl font-mono font-black text-slate-100 tracking-tighter sm:tracking-normal">
                                       +91 {maskNumber(whatsappSettings.businessWhatsAppNumber)}
                                   </span>
                               </div>
                               <p className="text-[9px] text-slate-600 mt-4 leading-relaxed font-medium">Internal Privacy Rule: Original number is encrypted. The above masking applies to all non-administrative and shared application views to prevent PII exposure.</p>
                          </div>
                      </div>
                  </div>

                  <div className="space-y-6">
                      <div className="bg-slate-900/50 p-8 rounded-2xl border border-slate-700 h-full flex flex-col shadow-xl">
                          <label className="block text-[10px] font-black text-slate-500 uppercase mb-4 tracking-[0.2em]">User Onboarding Transmission</label>
                          <textarea 
                            value={whatsappSettings.whatsAppWelcomeMessage}
                            onChange={(e) => setWhatsappSettings({...whatsappSettings, whatsAppWelcomeMessage: e.target.value})}
                            placeholder="Construct the welcome message for newly registered candidates..."
                            className="w-full flex-grow bg-slate-950 border border-slate-700 rounded-2xl p-6 text-slate-200 text-sm focus:border-green-500 outline-none transition-all resize-none mb-8 shadow-inner leading-relaxed"
                          />
                          <div className="space-y-4">
                              <label className="flex items-center justify-between cursor-pointer p-5 bg-slate-800/30 rounded-2xl hover:bg-slate-800/60 transition-all border border-transparent hover:border-slate-700 shadow-sm group">
                                  <div>
                                      <span className="text-sm font-bold text-slate-200 block group-hover:text-white transition-colors">Meta API Bridge</span>
                                      <span className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">Gateway Synchronization</span>
                                  </div>
                                  <input 
                                    type="checkbox" 
                                    checked={whatsappSettings.isWhatsAppIntegrated}
                                    onChange={(e) => setWhatsappSettings({...whatsappSettings, isWhatsAppIntegrated: e.target.checked})}
                                    className="w-6 h-6 accent-green-500 cursor-pointer rounded-lg border-none"
                                  />
                              </label>
                              <label className="flex items-center justify-between cursor-pointer p-5 bg-slate-800/30 rounded-2xl hover:bg-slate-800/60 transition-all border border-transparent hover:border-slate-700 shadow-sm group">
                                  <div>
                                      <span className="text-sm font-bold text-slate-200 block group-hover:text-white transition-colors">Candidate Nurturing</span>
                                      <span className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">Automated Lifecycle Triggers</span>
                                  </div>
                                  <input 
                                    type="checkbox" 
                                    checked={whatsappSettings.whatsAppEncouragementCycle}
                                    onChange={(e) => setWhatsappSettings({...whatsappSettings, whatsAppEncouragementCycle: e.target.checked})}
                                    className="w-6 h-6 accent-green-500 cursor-pointer rounded-lg border-none"
                                  />
                              </label>
                          </div>
                      </div>
                  </div>
              </div>

              <div className="mt-12 flex justify-end">
                  <button 
                    onClick={handleSaveWASettings}
                    disabled={isSavingWA}
                    className="bg-green-600 hover:bg-green-500 text-white font-black py-5 px-12 rounded-2xl shadow-2xl shadow-green-900/40 transition-all flex items-center transform active:scale-[0.98] disabled:opacity-50 uppercase tracking-[0.15em] text-xs border border-white/10"
                  >
                      {isSavingWA ? (
                          <>
                              <svg className="animate-spin -ml-1 mr-4 h-4 w-4 text-white" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>
                              Commiting Changes...
                          </>
                      ) : 'Secure & Synchronize Profile'}
                  </button>
              </div>
          </div>
      )}
      
      {activeTab === 'patents' && <PatentSpecGenerator />}
    </div>
  );
};
