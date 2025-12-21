
import React, { useState, useEffect, useMemo } from 'react';
import { Logo } from '../components/Logo';

interface LoginPageProps {
  onLogin: (email: string, password?: string) => void;
  onVerifyOtp: (otp: string) => void;
  onResendOtp: () => void;
  authStep: 'credentials' | 'otp';
  isSuperuserFlow: boolean;
  loginError?: string | null;
  onSwitchToSignup: () => void;
}

const LoginPage: React.FC<LoginPageProps> = ({ 
  onLogin, 
  onVerifyOtp, 
  onResendOtp, 
  authStep, 
  isSuperuserFlow,
  loginError,
  onSwitchToSignup 
}) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [otp, setOtp] = useState('');
  
  // Timers
  const [otpExpirySeconds, setOtpExpirySeconds] = useState(60);
  const [resendTimerSeconds, setResendTimerSeconds] = useState(120);

  // Check if user is registered
  const registeredUser = useMemo(() => {
    if (!email || email.length < 3) return null;
    const dbUsers = JSON.parse(localStorage.getItem('mock_users_db') || '{}');
    // Simple normalize check
    const normalizedEmail = email.toLowerCase().trim();
    if (dbUsers[normalizedEmail]) return dbUsers[normalizedEmail];
    
    // Check if it's the superuser
    if (normalizedEmail === 'veenbd9@gmail.com') {
        return { name: "Praveen Babu Dupaki" };
    }

    // Recognition for Test accounts
    if (normalizedEmail.startsWith('test')) {
        return { name: "Test User" };
    }

    return null;
  }, [email]);

  useEffect(() => {
    let timer: number;
    if (authStep === 'otp') {
      timer = window.setInterval(() => {
        setOtpExpirySeconds((prev) => (prev > 0 ? prev - 1 : 0));
        setResendTimerSeconds((prev) => (prev > 0 ? prev - 1 : 0));
      }, 1000);
    } else {
        setOtpExpirySeconds(60);
        setResendTimerSeconds(120);
    }
    return () => clearInterval(timer);
  }, [authStep]);

  const handleSubmitCredentials = (e: React.FormEvent) => {
    e.preventDefault();
    onLogin(email, password);
  };

  const handleSubmitOtp = (e: React.FormEvent) => {
    e.preventDefault();
    onVerifyOtp(otp);
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-200 font-sans flex items-center justify-center p-4 relative overflow-hidden">
      {/* Atmospheric Background Elements */}
      <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-emerald-900/20 rounded-full blur-[120px]"></div>
      <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-cyan-900/20 rounded-full blur-[120px]"></div>
      
      <div className="w-full max-w-md relative z-10">
        <div className="text-center mb-10 flex flex-col items-center">
          <div className="mb-4 transform hover:scale-110 transition-transform duration-500">
             <Logo size={80} />
          </div>
          <h1 className="text-4xl md:text-5xl font-black text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 to-cyan-400 drop-shadow-2xl tracking-tighter">
            ScaleupResume
          </h1>
          <p className="mt-3 text-xs font-black uppercase tracking-[0.4em] text-slate-500">
            {registeredUser ? `Welcome Back, ${registeredUser.name.split(' ')[0]}` : 'Secure Your Future'}
          </p>
        </div>

        <div className="bg-slate-900/50 backdrop-blur-2xl p-8 rounded-[2rem] shadow-2xl border border-white/5 relative overflow-hidden">
          {authStep === 'credentials' && (
            <form onSubmit={handleSubmitCredentials} className="space-y-6 relative z-10">
              <div className="space-y-1">
                <div className="flex justify-between items-end ml-1">
                    <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest">Identity / Email</label>
                    {registeredUser && (
                        <span className="text-[10px] font-bold text-emerald-500 uppercase tracking-tighter animate-pulse">
                            Account Detected
                        </span>
                    )}
                </div>
                <input
                  type="text"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="name@domain.com"
                  className={`w-full bg-slate-950 border rounded-2xl p-4 focus:ring-2 focus:ring-emerald-500/50 text-white outline-none transition-all placeholder-slate-700 ${registeredUser ? 'border-emerald-500/50 shadow-[0_0_15px_rgba(16,185,129,0.1)]' : 'border-slate-800'}`}
                  required
                />
              </div>
              <div className="space-y-1">
                <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Security Key / Password</label>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full bg-slate-950 border border-slate-800 rounded-2xl p-4 focus:ring-2 focus:ring-emerald-500/50 text-white outline-none transition-all placeholder-slate-700"
                  required
                />
              </div>
              <button
                type="submit"
                className="w-full bg-gradient-to-r from-emerald-500 to-cyan-500 hover:from-emerald-400 hover:to-cyan-400 text-slate-950 font-black py-4 rounded-2xl shadow-xl transition-all uppercase tracking-widest transform hover:scale-[1.02] active:scale-95 shadow-emerald-500/10"
              >
                {registeredUser ? 'Secure Login' : 'Launch App'}
              </button>
              <div className="text-center pt-2">
                  <p className="text-slate-500 text-xs font-bold uppercase tracking-tighter">
                    {registeredUser ? 'Not your account?' : 'New here?'}
                    {' '}
                    <button type="button" onClick={onSwitchToSignup} className="text-emerald-400 hover:text-emerald-300 underline underline-offset-4">
                      {registeredUser ? 'Switch Identity' : 'Create Identity'}
                    </button>
                  </p>
              </div>
            </form>
          )}

          {authStep === 'otp' && (
            <form onSubmit={handleSubmitOtp} className="space-y-6 relative z-10 animate-fade-in">
              <div className="text-center mb-4">
                <div className="bg-emerald-500/10 p-4 rounded-full inline-block mb-3 border border-emerald-500/20">
                  <svg className="w-8 h-8 text-emerald-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" /></svg>
                </div>
                <h2 className="text-xl font-black text-white uppercase tracking-tight">Verify Secure Session</h2>
                <p className="text-slate-500 text-[10px] font-bold uppercase mt-1 tracking-widest">Code dispatched to registered device</p>
              </div>

              <div>
                <input
                  type="text"
                  value={otp}
                  onChange={(e) => setOtp(e.target.value.replace(/\D/g, '').substring(0, 6))}
                  placeholder="000000"
                  className="w-full bg-slate-950 border border-slate-800 rounded-2xl p-5 text-center text-4xl font-mono font-black tracking-[0.3em] focus:ring-2 focus:ring-emerald-500/50 text-emerald-400 outline-none"
                  required
                />
                <div className="flex justify-between items-center mt-6 px-1">
                   <div className="flex items-center space-x-2">
                        <div className={`w-2 h-2 rounded-full ${otpExpirySeconds > 0 ? 'bg-emerald-500 animate-pulse' : 'bg-red-500'}`}></div>
                        <span className={`text-[10px] font-black uppercase tracking-widest ${otpExpirySeconds > 10 ? 'text-slate-500' : 'text-red-500'}`}>
                            {otpExpirySeconds > 0 ? `${otpExpirySeconds}s left` : 'Expired'}
                        </span>
                   </div>
                   {resendTimerSeconds > 0 ? (
                     <span className="text-[10px] text-slate-700 font-black uppercase tracking-widest">Resend in {resendTimerSeconds}s</span>
                   ) : (
                     <button 
                        type="button" 
                        onClick={() => {
                           setOtpExpirySeconds(60);
                           setResendTimerSeconds(120);
                           onResendOtp();
                        }} 
                        className="text-[10px] font-black text-emerald-500 uppercase tracking-widest hover:text-emerald-400"
                      >
                        Request New Code
                      </button>
                   )}
                </div>
              </div>

              <button
                type="submit"
                disabled={otp.length < 6 || otpExpirySeconds === 0}
                className="w-full bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black py-4 rounded-2xl shadow-xl transition-all uppercase tracking-widest disabled:opacity-20 disabled:cursor-not-allowed"
              >
                Validate Identity
              </button>
            </form>
          )}

          {loginError && (
             <div className="mt-6 p-4 bg-red-500/10 border border-red-500/20 rounded-2xl text-center animate-shake">
                <p className="text-red-400 text-[10px] font-black uppercase tracking-widest">{loginError}</p>
             </div>
          )}
        </div>
        
        <p className="mt-8 text-center text-slate-600 text-[10px] font-bold uppercase tracking-[0.2em]">
            &copy; 2024 SCALEUPRESUME AI &bull; DEPLOYMENT V4.0
        </p>
      </div>
    </div>
  );
};

export default LoginPage;
