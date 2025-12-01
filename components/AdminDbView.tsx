
import React, { useState, useEffect } from 'react';
import { SavedResume, User } from '../types';
import { PatentSpecGenerator } from './PatentSpecGenerator';

interface AdminDbViewProps {
  savedResumes: SavedResume[];
  onToggleStatus: (id: number) => void;
}

interface PlanStats {
    totalActive: number;
    expiringSoon: number; // Within 7 days
    users: User[];
}

export const AdminDbView: React.FC<AdminDbViewProps> = ({ savedResumes, onToggleStatus }) => {
  const [activeTab, setActiveTab] = useState<'resumes' | 'test_accounts' | 'subscriptions' | 'patents'>('resumes');
  const [testAccounts, setTestAccounts] = useState<Record<string, string>>({});
  const [editingId, setEditingId] = useState<string | null>(null);
  const [tempPassword, setTempPassword] = useState('');
  const [allUsers, setAllUsers] = useState<User[]>([]);

  useEffect(() => {
      // Load Test Accounts
      const storedTest = localStorage.getItem('test_accounts_db');
      if (storedTest) {
          setTestAccounts(JSON.parse(storedTest));
      }

      // Load All Users for Subscription Stats
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

  // Helper to calculate stats
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

  return (
    <div className="mt-12 bg-slate-800/80 border border-red-900/50 rounded-lg overflow-hidden animate-fade-in">
      <div className="bg-red-900/20 p-4 border-b border-red-900/30 flex flex-col sm:flex-row justify-between items-center gap-4">
        <h3 className="text-xl font-bold text-red-400 flex items-center">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 7v10c0 2.21 3.582 4 8 4s8-1.79 8-4V7M4 7c0 2.21 3.582 4 8 4s8-1.79 8-4M4 7c0-2.21 3.582-4 8-4s8 1.79 8 4m0 5c0 2.21-3.582 4-8 4s-8-1.79-8-4" />
            </svg>
            Database Administration (Super User)
        </h3>
        <div className="flex space-x-2 flex-wrap gap-2">
             <button 
                onClick={() => setActiveTab('resumes')} 
                className={`px-3 py-1 rounded text-xs font-bold transition-colors ${activeTab === 'resumes' ? 'bg-red-600 text-white' : 'bg-slate-700 text-slate-300 hover:bg-slate-600'}`}
             >
                Resumes
             </button>
             <button 
                onClick={() => setActiveTab('subscriptions')} 
                className={`px-3 py-1 rounded text-xs font-bold transition-colors ${activeTab === 'subscriptions' ? 'bg-red-600 text-white' : 'bg-slate-700 text-slate-300 hover:bg-slate-600'}`}
             >
                Subscriptions
             </button>
             <button 
                onClick={() => setActiveTab('test_accounts')} 
                className={`px-3 py-1 rounded text-xs font-bold transition-colors ${activeTab === 'test_accounts' ? 'bg-red-600 text-white' : 'bg-slate-700 text-slate-300 hover:bg-slate-600'}`}
             >
                Test Accounts
             </button>
             <button 
                onClick={() => setActiveTab('patents')} 
                className={`px-3 py-1 rounded text-xs font-bold transition-colors ${activeTab === 'patents' ? 'bg-red-600 text-white' : 'bg-slate-700 text-slate-300 hover:bg-slate-600'}`}
             >
                IP & Patents
             </button>
        </div>
      </div>
      
      {activeTab === 'resumes' && (
      <div className="p-4">
        <div className="flex justify-between items-end mb-4">
            <p className="text-slate-400 text-sm">Total Records: <span className="text-white font-mono font-bold">{savedResumes.length}</span></p>
            <div className="text-xs text-slate-400">
                <span className="font-bold text-red-300">LEGAL NOTICE:</span> No data can be erased. Records can only be suspended.
            </div>
        </div>
        
        <div className="overflow-x-auto border border-slate-700 rounded-lg">
            <table className="w-full text-left text-sm text-slate-400">
                <thead className="bg-slate-900 text-slate-300 uppercase font-bold text-xs">
                    <tr>
                        <th className="p-3 border-b border-slate-700">ID</th>
                        <th className="p-3 border-b border-slate-700">Name</th>
                        <th className="p-3 border-b border-slate-700">Status</th>
                        <th className="p-3 border-b border-slate-700">Content Preview</th>
                        <th className="p-3 border-b border-slate-700 text-right">Action</th>
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
                                <button 
                                    onClick={() => onToggleStatus(resume.id)}
                                    className={`px-3 py-1 rounded transition-colors text-xs font-semibold border ${
                                        resume.status === 'ACTIVE' 
                                        ? 'text-red-400 border-red-800 hover:bg-red-900/30' 
                                        : 'text-green-400 border-green-800 hover:bg-green-900/30'
                                    }`}
                                >
                                    {resume.status === 'ACTIVE' ? 'SUSPEND' : 'ENABLE'}
                                </button>
                            </td>
                        </tr>
                    ))}
                    {savedResumes.length === 0 && (
                        <tr>
                            <td colSpan={5} className="p-8 text-center italic opacity-50">
                                Database is empty.
                            </td>
                        </tr>
                    )}
                </tbody>
            </table>
        </div>
      </div>
      )}

      {activeTab === 'subscriptions' && (
          <div className="p-6 space-y-8">
              <div className="flex justify-between items-center">
                  <div>
                    <h4 className="text-xl font-bold text-slate-200">Subscription Analytics</h4>
                    <p className="text-sm text-slate-400">Real-time overview of active plans and expirations.</p>
                  </div>
                  <div className="bg-slate-700 px-4 py-2 rounded-lg">
                      <span className="text-slate-400 text-xs uppercase block">Total Users</span>
                      <span className="text-2xl font-bold text-white">{allUsers.length}</span>
                  </div>
              </div>

              {/* Plan Cards Summary */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                   {['1-month', '3-month', '6-month'].map(plan => (
                       <div key={plan} className="bg-slate-900/50 border border-slate-700 p-4 rounded-lg">
                           <h5 className="text-indigo-400 font-bold uppercase text-sm mb-2">{plan} Plan</h5>
                           <div className="flex justify-between items-end">
                               <div>
                                   <span className="text-3xl font-bold text-white">{subStats[plan].totalActive}</span>
                                   <span className="text-slate-500 text-xs ml-2">Active</span>
                               </div>
                               {subStats[plan].expiringSoon > 0 && (
                                   <div className="text-right">
                                       <span className="text-xl font-bold text-yellow-500">{subStats[plan].expiringSoon}</span>
                                       <p className="text-slate-500 text-[10px] uppercase">Expiring (7 Days)</p>
                                   </div>
                               )}
                           </div>
                       </div>
                   ))}
              </div>

              {/* Detailed Bifurcation Table */}
              <div className="bg-slate-900/30 rounded-lg border border-slate-700 overflow-hidden">
                  <div className="bg-slate-900 p-3 border-b border-slate-700">
                      <h5 className="text-sm font-bold text-slate-300 uppercase">Customer Bifurcation Details</h5>
                  </div>
                  <div className="overflow-x-auto">
                      <table className="w-full text-left text-sm text-slate-400">
                        <thead className="bg-slate-800 text-slate-300 text-xs uppercase">
                            <tr>
                                <th className="p-3">User Email</th>
                                <th className="p-3">Name</th>
                                <th className="p-3">Plan</th>
                                <th className="p-3">Expiry Date</th>
                                <th className="p-3 text-right">Status</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-700">
                            {['1-month', '3-month', '6-month'].map(planKey => 
                                subStats[planKey].users.map(user => {
                                    const daysLeft = Math.ceil((user.subscription.expiryDate - Date.now()) / (1000 * 60 * 60 * 24));
                                    const isExpiringSoon = daysLeft <= 7 && daysLeft > 0;
                                    
                                    return (
                                        <tr key={user.email} className="hover:bg-slate-800/50">
                                            <td className="p-3 font-medium text-slate-200">{user.email}</td>
                                            <td className="p-3">{user.name}</td>
                                            <td className="p-3"><span className="bg-indigo-900/50 text-indigo-300 px-2 py-0.5 rounded text-xs uppercase font-bold">{planKey}</span></td>
                                            <td className="p-3">
                                                {new Date(user.subscription.expiryDate).toLocaleDateString()}
                                                <span className="text-xs text-slate-500 ml-2">({daysLeft} days)</span>
                                            </td>
                                            <td className="p-3 text-right">
                                                {isExpiringSoon ? (
                                                    <span className="text-yellow-400 font-bold text-xs bg-yellow-900/20 px-2 py-1 rounded">Expiring Soon</span>
                                                ) : (
                                                    <span className="text-green-400 font-bold text-xs bg-green-900/20 px-2 py-1 rounded">Active</span>
                                                )}
                                            </td>
                                        </tr>
                                    );
                                })
                            )}
                            {Object.keys(subStats).every(k => k === 'free' || subStats[k].users.length === 0) && (
                                <tr>
                                    <td colSpan={5} className="p-6 text-center italic opacity-50">No active paid subscriptions found.</td>
                                </tr>
                            )}
                        </tbody>
                      </table>
                  </div>
              </div>
          </div>
      )}

      {activeTab === 'test_accounts' && (
          <div className="p-6">
              <div className="mb-4">
                  <h4 className="text-lg font-bold text-slate-200">Manage Test Credentials</h4>
                  <p className="text-sm text-slate-400">View and reset passwords for development/test accounts.</p>
              </div>
              <div className="bg-slate-900/50 rounded-lg border border-slate-700 overflow-hidden max-w-2xl">
                   <table className="w-full text-left text-sm text-slate-400">
                       <thead className="bg-slate-900 text-slate-300 uppercase font-bold text-xs">
                           <tr>
                               <th className="p-3 border-b border-slate-700">Login ID</th>
                               <th className="p-3 border-b border-slate-700">Current Password</th>
                               <th className="p-3 border-b border-slate-700 text-right">Action</th>
                           </tr>
                       </thead>
                       <tbody className="divide-y divide-slate-700">
                           {Object.entries(testAccounts).map(([id, password]) => (
                               <tr key={id} className="hover:bg-slate-800/50">
                                   <td className="p-3 font-bold text-indigo-300">{id}</td>
                                   <td className="p-3 font-mono">
                                       {editingId === id ? (
                                           <input 
                                             type="text" 
                                             value={tempPassword}
                                             onChange={(e) => setTempPassword(e.target.value)}
                                             className="bg-slate-800 border border-indigo-500 rounded px-2 py-1 text-white text-xs w-full"
                                           />
                                       ) : (
                                           password
                                       )}
                                   </td>
                                   <td className="p-3 text-right">
                                       {editingId === id ? (
                                           <div className="flex justify-end space-x-2">
                                                <button 
                                                    onClick={() => setEditingId(null)}
                                                    className="text-slate-500 hover:text-slate-300 text-xs font-bold"
                                                >
                                                    Cancel
                                                </button>
                                                <button 
                                                    onClick={() => handleSavePassword(id)}
                                                    className="text-green-400 hover:text-green-300 text-xs font-bold border border-green-700 px-2 py-1 rounded bg-green-900/20"
                                                >
                                                    Save
                                                </button>
                                           </div>
                                       ) : (
                                           <button 
                                            onClick={() => handleEditClick(id, password)}
                                            className="text-indigo-400 hover:text-indigo-300 text-xs font-bold border border-indigo-700 px-2 py-1 rounded bg-indigo-900/20"
                                           >
                                               Edit Password
                                           </button>
                                       )}
                                   </td>
                               </tr>
                           ))}
                       </tbody>
                   </table>
              </div>
          </div>
      )}
      
      {activeTab === 'patents' && (
          <PatentSpecGenerator />
      )}
    </div>
  );
};
