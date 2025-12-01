import React, { useEffect, useState } from 'react';
import { User, Transaction } from '../types';
import { getUserTransactions } from '../services/cryptoService';

interface FinancialDashboardProps {
    user: User;
}

export const FinancialDashboard: React.FC<FinancialDashboardProps> = ({ user }) => {
    const [transactions, setTransactions] = useState<Transaction[]>([]);
    const [isOpen, setIsOpen] = useState(false);

    useEffect(() => {
        if (isOpen) {
            const txs = getUserTransactions(user.email);
            setTransactions(txs);
        }
    }, [isOpen, user.email]);

    if (!isOpen) {
        return (
            <div className="mt-8 text-center">
                <button 
                    onClick={() => setIsOpen(true)}
                    className="text-slate-400 hover:text-indigo-400 text-sm font-semibold flex items-center justify-center mx-auto transition-colors"
                >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                    View My Financial History
                </button>
            </div>
        );
    }

    return (
        <div className="mt-8 bg-slate-800/50 border border-slate-700 rounded-lg p-6 animate-fade-in">
            <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-bold text-slate-200">Financial Transaction History</h3>
                <button onClick={() => setIsOpen(false)} className="text-slate-500 hover:text-slate-300">Close</button>
            </div>
            <div className="overflow-x-auto">
                <table className="w-full text-left text-sm text-slate-400">
                    <thead className="text-xs text-slate-500 uppercase bg-slate-900/50">
                        <tr>
                            <th className="p-2">Date</th>
                            <th className="p-2">Description</th>
                            <th className="p-2">Method</th>
                            <th className="p-2 text-right">Amount</th>
                            <th className="p-2 text-center">Status</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-700">
                        {transactions.map(t => (
                            <tr key={t.id} className="hover:bg-slate-700/30">
                                <td className="p-2">{new Date(t.timestamp).toLocaleDateString()}</td>
                                <td className="p-2">{t.description}</td>
                                <td className="p-2 text-xs">{t.method}</td>
                                <td className="p-2 text-right font-mono text-indigo-300">{t.currency} {t.amount}</td>
                                <td className="p-2 text-center">
                                    <span className="px-2 py-0.5 rounded-full text-xs bg-green-900 text-green-300 font-bold">
                                        {t.status}
                                    </span>
                                </td>
                            </tr>
                        ))}
                        {transactions.length === 0 && (
                            <tr>
                                <td colSpan={5} className="p-4 text-center italic opacity-50">No transactions found.</td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>
            <p className="mt-4 text-xs text-slate-600 text-center flex items-center justify-center">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" /></svg>
                End-to-End Encrypted Data
            </p>
        </div>
    );
};
