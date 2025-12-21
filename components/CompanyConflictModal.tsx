
import React, { useEffect } from 'react';
import { CompanyConflictResult } from '../types';

interface CompanyConflictModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  conflictData: CompanyConflictResult | null;
}

export const CompanyConflictModal: React.FC<CompanyConflictModalProps> = ({
  isOpen,
  onClose,
  onConfirm,
  conflictData,
}) => {
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        onClose();
      }
    };

    if (isOpen) {
      window.addEventListener('keydown', handleKeyDown);
    }

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen, onClose]);

  if (!isOpen || !conflictData) {
    return null;
  }

  return (
    <div
      className="fixed inset-0 bg-black bg-opacity-80 z-[60] flex items-center justify-center p-4 animate-fade-in-fast"
      aria-labelledby="conflict-modal-title"
      role="dialog"
      aria-modal="true"
    >
      <div
        className="bg-slate-800 rounded-lg shadow-2xl w-full max-w-lg border-2 border-orange-500/50"
        role="document"
      >
        <div className="p-6">
          <div className="flex items-center space-x-3 mb-4">
               <div className="bg-orange-500/20 p-3 rounded-full">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-orange-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                    </svg>
               </div>
               <h2 id="conflict-modal-title" className="text-xl font-bold text-slate-200">
                    Duplicate Application Warning
               </h2>
          </div>
          
          <div className="bg-slate-900/50 p-4 rounded-lg border border-slate-700 mb-4">
               <p className="text-slate-300 mb-2">
                   You are about to optimize a resume for:
                   <br/>
                   <span className="text-white font-bold text-lg">"{conflictData.inputCompanyName}"</span>
               </p>
               
               <div className="flex items-center justify-center my-2">
                    <svg className="w-6 h-6 text-slate-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 14l-7 7m0 0l-7-7m7 7V3"></path></svg>
               </div>

               <p className="text-slate-300">
                   However, our system detected a match in your history:
                   <br/>
                   <span className="text-orange-400 font-bold text-lg">"{conflictData.conflictingCompanyName}"</span>
               </p>
          </div>

          <div className="text-sm text-slate-400 mb-2">
               <strong>Why this matters:</strong> Applying to the same company multiple times (even with slightly different names) can trigger spam filters in their ATS and hurt your chances.
          </div>
          
          <div className="text-xs text-slate-500 italic border-l-2 border-slate-600 pl-2">
               Reason detected: {conflictData.reason}
          </div>

        </div>
        <div className="bg-slate-900/50 px-6 py-4 flex justify-end space-x-3 rounded-b-lg">
          <button
            type="button"
            onClick={onClose}
            className="bg-slate-700 hover:bg-slate-600 text-slate-300 font-semibold py-2 px-4 rounded-md transition-colors duration-200"
          >
            Cancel & Edit Name
          </button>
          <button
            type="button"
            onClick={onConfirm}
            className="bg-orange-600 hover:bg-orange-700 text-white font-bold py-2 px-4 rounded-lg shadow-md transition-all duration-300 ease-in-out"
          >
            Ignore & Proceed
          </button>
        </div>
      </div>
    </div>
  );
};
