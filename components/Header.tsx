import React from 'react';

interface HeaderProps {
  userName?: string;
  isAdmin?: boolean;
  onLogout?: () => void;
  viewMode?: 'admin' | 'user';
  onToggleViewMode?: () => void;
  onManageSubscription?: () => void;
}

export const Header: React.FC<HeaderProps> = ({ userName, isAdmin, onLogout, viewMode, onToggleViewMode, onManageSubscription }) => {
  return (
    <header className="bg-slate-900/70 backdrop-blur-sm sticky top-0 z-10 border-b border-slate-800">
      <div className="container mx-auto px-4 py-4 flex flex-col sm:flex-row justify-between items-center">
        <div className="text-center sm:text-left">
            <h1 className="text-3xl md:text-4xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 to-cyan-400">
            Resume Rocket
            </h1>
            <p className="mt-1 text-md text-slate-400">
            Elevate your resume to pass any Applicant Tracking System.
            </p>
        </div>
        {userName && onLogout && (
           <div className="flex items-center space-x-4 mt-4 sm:mt-0">
                {onManageSubscription && (
                    <button
                        onClick={onManageSubscription}
                        className="text-indigo-400 hover:text-indigo-300 font-semibold text-sm border border-indigo-500/50 px-3 py-1.5 rounded transition-colors hover:bg-indigo-900/20"
                    >
                        Pricing & Plans
                    </button>
                )}

                {isAdmin && (
                    <div className="flex items-center space-x-2">
                        <span className="bg-red-600 text-white text-xs font-bold px-2 py-1 rounded uppercase tracking-wider shadow-sm">
                            Super Admin
                        </span>
                        {onToggleViewMode && (
                             <button 
                                onClick={onToggleViewMode}
                                className={`text-xs font-bold px-2 py-1 rounded border transition-colors ${viewMode === 'admin' ? 'bg-slate-700 border-slate-500 text-white' : 'bg-green-700 border-green-500 text-white'}`}
                                title="Switch between Admin DB view and regular Test User view"
                             >
                                {viewMode === 'admin' ? 'View as User' : 'View as Admin'}
                             </button>
                        )}
                    </div>
                )}
                <span className="text-slate-300 hidden md:inline">Welcome, {userName}</span>
                <button 
                    onClick={onLogout}
                    className="bg-slate-700 hover:bg-slate-600 text-slate-300 font-semibold py-2 px-4 rounded-md transition-colors duration-200 text-sm"
                >
                    Logout
                </button>
            </div>
        )}
      </div>
    </header>
  );
};