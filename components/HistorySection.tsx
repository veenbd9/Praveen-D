
import React from 'react';
import { GeneratedResume } from '../types';

interface HistorySectionProps {
  history: GeneratedResume[];
  currentUserEmail: string;
  onLoadHistory: (item: GeneratedResume) => void;
}

export const HistorySection: React.FC<HistorySectionProps> = ({ history, currentUserEmail, onLoadHistory }) => {
  // Filter history for current user
  const userHistory = history.filter(item => item.userId === currentUserEmail);

  if (userHistory.length === 0) {
    return null; 
  }

  return (
    <div className="bg-slate-800/50 p-6 rounded-lg shadow-lg animate-fade-in">
      <div className="flex justify-between items-center mb-4 border-b border-slate-700 pb-2">
        <h2 className="text-2xl font-bold text-slate-200">Application History</h2>
        <span className="text-sm text-slate-400 bg-slate-900 px-3 py-1 rounded-full">
            {userHistory.length} Saved Applications
        </span>
      </div>
      <p className="text-slate-400 mb-4 text-sm">
          Your generated resumes and cover letters are automatically saved here. Click "View" to restore them to the main workspace.
      </p>
      
      <div className="overflow-x-auto rounded-lg border border-slate-700">
        <table className="w-full text-left text-sm text-slate-400">
          <thead className="bg-slate-900 text-slate-300 uppercase font-bold text-xs">
            <tr>
              <th className="p-4 border-b border-slate-700">Date</th>
              <th className="p-4 border-b border-slate-700">Company</th>
              <th className="p-4 border-b border-slate-700">Job Title</th>
              <th className="p-4 border-b border-slate-700 text-center">ATS Score</th>
              <th className="p-4 border-b border-slate-700 text-right">Action</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-700 bg-slate-800/30">
            {userHistory.map((item) => (
              <tr key={item.id} className="hover:bg-slate-700/40 transition-colors">
                <td className="p-4 whitespace-nowrap">
                    {new Date(item.timestamp).toLocaleDateString()}{' '}
                    <span className="text-xs text-slate-500 ml-1">{new Date(item.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                </td>
                <td className="p-4 font-medium text-indigo-300">
                    {item.companyName || "Unknown Company"}
                </td>
                <td className="p-4">
                    {item.jobTitle || "-"}
                </td>
                <td className="p-4 text-center">
                     <span className={`font-bold ${item.analysisResult.optimizedScore >= 85 ? 'text-green-400' : 'text-yellow-400'}`}>
                         {item.analysisResult.optimizedScore}%
                     </span>
                </td>
                <td className="p-4 text-right">
                  <button
                    onClick={() => onLoadHistory(item)}
                    className="text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-700 px-3 py-1.5 rounded transition-colors shadow-sm"
                  >
                    View / Download
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};
