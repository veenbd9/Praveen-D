
import React, { useState, useEffect } from 'react';
import { Transaction, AdminBankDetails } from '../types';
import { getAllTransactions, saveTransaction, getAdminBankDetails, saveAdminBankDetails } from '../services/cryptoService';

export const AdminFinanceView: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'ledger' | 'pay' | 'settings'>('ledger');
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [bankDetails, setBankDetails] = useState<AdminBankDetails>({
      accountHolderName: '',
      accountNumber: '',
      ifscCode: '',
      bankName: '',
      upiId: ''
  });

  // Time Filter State
  const [timeFilter, setTimeFilter] = useState<'all' | 'weekly' | 'biweekly' | 'monthly' | 'quarterly' | 'yearly'>('all');
  const [filteredTransactions, setFilteredTransactions] = useState<Transaction[]>([]);

  // Payment Form State
  const [payeeName, setPayeeName] = useState('');
  const [payeeEmail, setPayeeEmail] = useState('');
  const [amount, setAmount] = useState('');
  const [paymentDescription, setPaymentDescription] = useState('');

  useEffect(() => {
    refreshData();
  }, []);

  useEffect(() => {
    filterTransactions();
  }, [transactions, timeFilter]);

  const refreshData = () => {
    setTransactions(getAllTransactions());
    const savedBank = getAdminBankDetails();
    if (savedBank) setBankDetails(savedBank);
  };

  const filterTransactions = () => {
      const now = Date.now();
      let startTime = 0;

      switch (timeFilter) {
          case 'weekly':
              startTime = now - (7 * 24 * 60 * 60 * 1000);
              break;
          case 'biweekly':
              startTime = now - (14 * 24 * 60 * 60 * 1000);
              break;
          case 'monthly':
              startTime = now - (30 * 24 * 60 * 60 * 1000);
              break;
          case 'quarterly':
              startTime = now - (90 * 24 * 60 * 60 * 1000);
              break;
          case 'yearly':
              startTime = now - (365 * 24 * 60 * 60 * 1000);
              break;
          default:
              startTime = 0; // All time
      }

      const filtered = transactions.filter(t => t.timestamp >= startTime);
      setFilteredTransactions(filtered.sort((a,b) => b.timestamp - a.timestamp));
  };

  const handleSaveSettings = () => {
    saveAdminBankDetails(bankDetails);
    alert('Banking details encrypted and saved securely.');
  };

  const handlePayEmployee = (e: React.FormEvent) => {
      e.preventDefault();
      const newTransaction: Transaction = {
          id: `TRX_${Date.now()}`,
          userId: payeeEmail, // Using email as ID for external employees
          userName: payeeName,
          amount: parseFloat(amount),
          currency: 'INR', // Defaulting to INR for this context
          type: 'DEBIT',
          description: `Salary/Payment: ${paymentDescription}`,
          timestamp: Date.now(),
          method: 'BANK_TRANSFER',
          status: 'SUCCESS'
      };
      saveTransaction(newTransaction);
      setPayeeName('');
      setPayeeEmail('');
      setAmount('');
      setPaymentDescription('');
      refreshData();
      alert('Payment recorded and funds deducted from ledger.');
  };

  const downloadCSV = () => {
    const headers = ["Transaction ID", "Date", "User", "Description", "Type", "Total Amount", "Net Revenue", "GST Tax (18%)", "Status"];
    const rows = filteredTransactions.map(t => [
        t.id,
        new Date(t.timestamp).toLocaleDateString(),
        t.userName,
        t.description,
        t.type,
        t.amount.toString(),
        t.type === 'CREDIT' ? (t.netAmount || t.amount).toString() : '-',
        t.type === 'CREDIT' ? (t.taxAmount || 0).toString() : '-',
        t.status
    ]);

    const csvContent = [
        headers.join(","),
        ...rows.map(e => e.join(","))
    ].join("\n");

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement("a");
    const url = URL.createObjectURL(blob);
    link.setAttribute("href", url);
    link.setAttribute("download", `financial_report_${timeFilter}_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Calculations based on FILTERED data
  const totalInflow = filteredTransactions.filter(t => t.type === 'CREDIT').reduce((acc, curr) => acc + curr.amount, 0);
  const totalTaxCollected = filteredTransactions.filter(t => t.type === 'CREDIT').reduce((acc, curr) => acc + (curr.taxAmount || 0), 0);
  const totalNetRevenue = totalInflow - totalTaxCollected;
  
  const totalOutflow = filteredTransactions.filter(t => t.type === 'DEBIT').reduce((acc, curr) => acc + curr.amount, 0);
  const netBalance = totalNetRevenue - totalOutflow;

  return (
    <div className="bg-slate-800/90 rounded-lg shadow-xl overflow-hidden border border-indigo-500/30 mt-8">
      <div className="bg-slate-900 p-4 flex justify-between items-center border-b border-slate-700">
         <h2 className="text-xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-green-400 to-emerald-600 flex items-center">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
            Secure Financial Admin
         </h2>
         <div className="flex space-x-2">
            <button onClick={() => setActiveTab('ledger')} className={`px-3 py-1 rounded text-sm font-medium transition-colors ${activeTab === 'ledger' ? 'bg-indigo-600 text-white' : 'text-slate-400 hover:text-white'}`}>Ledger & Tax</button>
            <button onClick={() => setActiveTab('pay')} className={`px-3 py-1 rounded text-sm font-medium transition-colors ${activeTab === 'pay' ? 'bg-indigo-600 text-white' : 'text-slate-400 hover:text-white'}`}>Pay Employees</button>
            <button onClick={() => setActiveTab('settings')} className={`px-3 py-1 rounded text-sm font-medium transition-colors ${activeTab === 'settings' ? 'bg-indigo-600 text-white' : 'text-slate-400 hover:text-white'}`}>Bank Settings</button>
         </div>
      </div>

      <div className="p-6">
        {activeTab === 'ledger' && (
            <div className="animate-fade-in">
                
                {/* Controls: Filter & Export */}
                <div className="flex justify-between items-center mb-6 bg-slate-700/30 p-3 rounded">
                    <div className="flex items-center space-x-2">
                        <label className="text-sm text-slate-400">Time Period:</label>
                        <select 
                            value={timeFilter} 
                            onChange={(e) => setTimeFilter(e.target.value as any)}
                            className="bg-slate-900 border border-slate-600 text-white text-sm rounded px-3 py-1 focus:ring-indigo-500 focus:border-indigo-500"
                        >
                            <option value="all">All Time</option>
                            <option value="weekly">Last 7 Days</option>
                            <option value="biweekly">Last 14 Days</option>
                            <option value="monthly">Last 30 Days</option>
                            <option value="quarterly">Last 90 Days</option>
                            <option value="yearly">Last 365 Days</option>
                        </select>
                    </div>
                    <button 
                        onClick={downloadCSV}
                        className="flex items-center space-x-2 bg-green-700 hover:bg-green-600 text-white px-3 py-1.5 rounded text-sm font-semibold transition-colors"
                    >
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" /></svg>
                        <span>Download Report (CSV)</span>
                    </button>
                </div>

                <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
                    <div className="bg-slate-700/50 p-4 rounded border border-green-500/20">
                        <p className="text-slate-400 text-xs uppercase">Gross Inflow</p>
                        <p className="text-xl font-bold text-green-300">₹{totalInflow.toLocaleString()}</p>
                    </div>
                     <div className="bg-slate-700/50 p-4 rounded border border-yellow-500/30">
                        <p className="text-yellow-400 text-xs uppercase font-bold">GST Bucket (18%)</p>
                        <p className="text-xl font-bold text-yellow-400">₹{totalTaxCollected.toLocaleString()}</p>
                        <p className="text-[10px] text-slate-400 mt-1">Payable to Govt.</p>
                    </div>
                    <div className="bg-slate-700/50 p-4 rounded border border-red-500/20">
                        <p className="text-slate-400 text-xs uppercase">Total Outflow</p>
                        <p className="text-xl font-bold text-red-400">₹{totalOutflow.toLocaleString()}</p>
                    </div>
                     <div className="bg-slate-700/50 p-4 rounded border border-indigo-500/20">
                        <p className="text-slate-400 text-xs uppercase">Net Revenue</p>
                        <p className={`text-xl font-bold ${netBalance >= 0 ? 'text-indigo-400' : 'text-red-500'}`}>₹{netBalance.toLocaleString()}</p>
                    </div>
                </div>

                <div className="overflow-x-auto">
                    <table className="w-full text-left text-sm text-slate-400">
                        <thead className="bg-slate-900/50 text-slate-300">
                            <tr>
                                <th className="p-2">Date</th>
                                <th className="p-2">User / Entity</th>
                                <th className="p-2">Description</th>
                                <th className="p-2">Type</th>
                                <th className="p-2 text-right">Amount</th>
                                <th className="p-2 text-right text-yellow-500">Tax (18%)</th>
                                <th className="p-2 text-right text-indigo-400">Net</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-700">
                            {filteredTransactions.map(t => (
                                <tr key={t.id} className="hover:bg-slate-700/30">
                                    <td className="p-2">{new Date(t.timestamp).toLocaleDateString()}</td>
                                    <td className="p-2 text-slate-200">{t.userName}</td>
                                    <td className="p-2">{t.description}</td>
                                    <td className="p-2">
                                        <span className={`px-2 py-0.5 rounded text-xs font-bold ${t.type === 'CREDIT' ? 'bg-green-900 text-green-300' : 'bg-red-900 text-red-300'}`}>
                                            {t.type}
                                        </span>
                                    </td>
                                    <td className="p-2 text-right font-mono">
                                        {t.type === 'CREDIT' ? '+' : '-'} {t.amount}
                                    </td>
                                    <td className="p-2 text-right font-mono text-yellow-500">
                                        {t.type === 'CREDIT' ? (t.taxAmount || 0).toFixed(2) : '-'}
                                    </td>
                                     <td className="p-2 text-right font-mono text-indigo-300">
                                        {t.type === 'CREDIT' ? (t.netAmount || t.amount).toFixed(2) : '-'}
                                    </td>
                                </tr>
                            ))}
                            {filteredTransactions.length === 0 && (
                                <tr>
                                    <td colSpan={7} className="p-8 text-center italic opacity-50">No transactions found for the selected period.</td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        )}

        {activeTab === 'pay' && (
            <div className="animate-fade-in max-w-lg mx-auto">
                <h3 className="text-lg font-semibold text-slate-200 mb-4">Employee / Vendor Payment</h3>
                <form onSubmit={handlePayEmployee} className="space-y-4">
                    <div>
                        <label className="block text-sm text-slate-400 mb-1">Payee Name</label>
                        <input required type="text" value={payeeName} onChange={e => setPayeeName(e.target.value)} className="w-full bg-slate-900 border border-slate-600 rounded p-2 text-slate-200 focus:border-indigo-500" />
                    </div>
                    <div>
                        <label className="block text-sm text-slate-400 mb-1">Payee Email / ID</label>
                        <input required type="email" value={payeeEmail} onChange={e => setPayeeEmail(e.target.value)} className="w-full bg-slate-900 border border-slate-600 rounded p-2 text-slate-200 focus:border-indigo-500" />
                    </div>
                    <div>
                        <label className="block text-sm text-slate-400 mb-1">Amount (INR)</label>
                        <input required type="number" value={amount} onChange={e => setAmount(e.target.value)} className="w-full bg-slate-900 border border-slate-600 rounded p-2 text-slate-200 focus:border-indigo-500" />
                    </div>
                    <div>
                        <label className="block text-sm text-slate-400 mb-1">Description</label>
                        <textarea required value={paymentDescription} onChange={e => setPaymentDescription(e.target.value)} className="w-full bg-slate-900 border border-slate-600 rounded p-2 text-slate-200 focus:border-indigo-500" rows={3} />
                    </div>
                    <button type="submit" className="w-full bg-red-600 hover:bg-red-700 text-white font-bold py-2 px-4 rounded transition-colors">
                        Authorize Payment
                    </button>
                </form>
            </div>
        )}

        {activeTab === 'settings' && (
            <div className="animate-fade-in max-w-lg mx-auto">
                <h3 className="text-lg font-semibold text-slate-200 mb-4">Receiving Account Configuration</h3>
                <p className="text-sm text-slate-400 mb-6">These details will be shown to users (especially in India) to make payments via UPI or Bank Transfer.</p>
                <div className="space-y-4">
                     <div>
                        <label className="block text-sm text-slate-400 mb-1">UPI ID (VPA)</label>
                        <input type="text" value={bankDetails.upiId} onChange={e => setBankDetails({...bankDetails, upiId: e.target.value})} placeholder="example@okaxis" className="w-full bg-slate-900 border border-slate-600 rounded p-2 text-slate-200 focus:border-indigo-500" />
                    </div>
                    <div>
                        <label className="block text-sm text-slate-400 mb-1">Bank Name</label>
                        <input type="text" value={bankDetails.bankName} onChange={e => setBankDetails({...bankDetails, bankName: e.target.value})} className="w-full bg-slate-900 border border-slate-600 rounded p-2 text-slate-200 focus:border-indigo-500" />
                    </div>
                    <div>
                        <label className="block text-sm text-slate-400 mb-1">Account Number</label>
                        <input type="text" value={bankDetails.accountNumber} onChange={e => setBankDetails({...bankDetails, accountNumber: e.target.value})} className="w-full bg-slate-900 border border-slate-600 rounded p-2 text-slate-200 focus:border-indigo-500" />
                    </div>
                     <div>
                        <label className="block text-sm text-slate-400 mb-1">IFSC Code</label>
                        <input type="text" value={bankDetails.ifscCode} onChange={e => setBankDetails({...bankDetails, ifscCode: e.target.value})} className="w-full bg-slate-900 border border-slate-600 rounded p-2 text-slate-200 focus:border-indigo-500" />
                    </div>
                     <div>
                        <label className="block text-sm text-slate-400 mb-1">Account Holder Name</label>
                        <input type="text" value={bankDetails.accountHolderName} onChange={e => setBankDetails({...bankDetails, accountHolderName: e.target.value})} className="w-full bg-slate-900 border border-slate-600 rounded p-2 text-slate-200 focus:border-indigo-500" />
                    </div>
                    <button onClick={handleSaveSettings} className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-2 px-4 rounded transition-colors">
                        Save Securely
                    </button>
                </div>
            </div>
        )}
      </div>
    </div>
  );
};
