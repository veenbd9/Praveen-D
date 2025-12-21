
import React from 'react';
import { Logo } from './Logo';

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
    <header className="bg-slate-900/70 backdrop-blur-md sticky top-0 z-30 border-b border-slate-800">
      <div className="container mx-auto px-4 py-3 flex flex-col sm:flex-row justify-between items-center">
        <div className="flex items-center space-x-3 group cursor-default">
            <Logo size={42} />
            <div className="text-center sm:text-left">
                <h1 className="text-2xl md:text-3xl font-black text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 to-cyan-400 tracking-tighter">
                ScaleupResume
                </h1>
                <p className="text-[10px] uppercase font-bold tracking-[0.2em] text-slate-500 group-hover:text-emerald-500 transition-colors">
                AI Career Accelerator
                </p>
            </div>
        </div>
        {userName && onLogout && (
           <div className="flex items-center space-x-4 mt-4 sm:mt-0">
                {onManageSubscription && (
                    <button
                        onClick={onManageSubscription}
                        className="text-emerald-400 hover:text-emerald-300 font-bold text-xs uppercase tracking-widest border border-emerald-500/30 px-4 py-2 rounded-full bg-emerald-500/5 transition-all hover:bg-emerald-500/10"
                    >
                        Pro Access
                    </button>
                )}
                {isAdmin && (
                    <div className="flex items-center space-x-2">
                        <span className="bg-red-600 text-white text-[10px] font-black px-2 py-0.5 rounded uppercase">
                            Admin
                        </span>
                        {onToggleViewMode && (
                             <button onClick={onToggleViewMode} className={`text-[10px] font-black px-3 py-1 rounded-full border transition-all ${viewMode === 'admin' ? 'bg-slate-800 border-slate-700 text-slate-400' : 'bg-emerald-600 border-emerald-500 text-white shadow-lg shadow-emerald-900/40'}`}>
                                {viewMode === 'admin' ? 'USER MODE' : 'ADMIN MODE'}
                             </button>
                        )}
                    </div>
                )}
                <div className="h-8 w-[1px] bg-slate-800 hidden md:block"></div>
                <span className="text-slate-400 font-medium text-sm hidden md:inline">{userName}</span>
                <button onClick={onLogout} className="text-slate-500 hover:text-white transition-colors">
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" /></svg>
                </button>
            </div>
        )}
      </div>
    </header>
  );
};
