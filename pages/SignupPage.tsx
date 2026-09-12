
import React, { useState } from 'react';
import { checkPhoneDuplicate } from '../services/authService';

interface SignupPageProps {
  onSignup: (name: string, email: string, countryCode: string, phoneNumber: string, isVerified: boolean, isPhoneDuplicate: boolean, password?: string) => void;
  onSwitchToLogin: () => void;
  onViewTerms: () => void;
}

const countryCodes = [
    { code: '+91', country: 'India' },
    { code: '+1', country: 'USA/Canada' },
    { code: '+44', country: 'UK' },
    { code: '+61', country: 'Australia' },
    { code: '+971', country: 'UAE' },
    { code: '+other', country: 'Other' }
];

const SignupPage: React.FC<SignupPageProps> = ({ onSignup, onSwitchToLogin, onViewTerms }) => {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [countryCode, setCountryCode] = useState('+91');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [termsAccepted, setTermsAccepted] = useState(false);
  const [checkingPhone, setCheckingPhone] = useState(false);
  const [phoneError, setPhoneError] = useState<string | null>(null);

  const canSubmit = name && email && password && countryCode && phoneNumber && termsAccepted && !checkingPhone;

  // Phone numbers are still recorded and checked for duplicates (one account
  // per number, enforced here and at the DB level -- see
  // supabase/schema.sql), but we no longer require SMS/WhatsApp OTP
  // verification of the number itself. Account verification is done via
  // email OTP only (see Auth.tsx / services/authService.ts). Real-time SMS
  // and WhatsApp OTP for phone ownership are planned for later, once MSG91
  // DLT (SMS) / Meta Business (WhatsApp) approvals are in place.
  const handleInitialSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!canSubmit) return;
    setPhoneError(null);
    setCheckingPhone(true);
    try {
      const isDuplicate = await checkPhoneDuplicate(countryCode, phoneNumber);
      if (isDuplicate) {
        setPhoneError('This phone number is already registered to another account. Please sign in instead, or use a different number.');
        return;
      }
      onSignup(name, email, countryCode, phoneNumber, true, false, password);
    } finally {
      setCheckingPhone(false);
    }
  };

  return (
    <div className="min-h-screen bg-transparent text-slate-200 font-sans flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <h1 className="text-3xl md:text-4xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-emerald-500 to-cyan-700 drop-shadow-sm">
            ScaleupResume
          </h1>
          <p className="mt-2 text-md text-slate-700 font-medium">
            Create an account. We will send an email OTP to verify it.
          </p>
        </div>

        <div className="bg-slate-900/80 backdrop-blur-lg p-8 rounded-lg shadow-2xl border border-white/20">
          <form onSubmit={handleInitialSubmit} className="space-y-6">
            <div>
              <label htmlFor="name" className="block text-sm font-semibold text-slate-300 mb-2">
                Full Name
              </label>
              <input
                id="name"
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="John Doe"
                className="w-full bg-slate-900/50 border border-slate-600 rounded-md p-3 focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition-colors text-slate-200 placeholder-slate-500"
                required
              />
            </div>
            <div>
              <label htmlFor="email" className="block text-sm font-semibold text-slate-300 mb-2">
                Email Address
              </label>
              <input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
                className="w-full bg-slate-900/50 border border-slate-600 rounded-md p-3 focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition-colors text-slate-200 placeholder-slate-500"
                required
              />
            </div>
            
            <div className="grid grid-cols-3 gap-3">
                 <div className="col-span-1">
                    <label htmlFor="countryCode" className="block text-sm font-semibold text-slate-300 mb-2">
                        Code
                    </label>
                    <select
                        id="countryCode"
                        value={countryCode}
                        onChange={(e) => setCountryCode(e.target.value)}
                        className="w-full bg-slate-900/50 border border-slate-600 rounded-md p-3 focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition-colors text-slate-300 text-sm"
                    >
                        {countryCodes.map((c) => (
                            <option key={c.code} value={c.code}>{c.code}</option>
                        ))}
                    </select>
                 </div>
                 <div className="col-span-2">
                    <label htmlFor="phone" className="block text-sm font-semibold text-slate-300 mb-2">
                        Phone Number
                    </label>
                    <input
                        id="phone"
                        type="tel"
                        value={phoneNumber}
                        onChange={(e) => { setPhoneNumber(e.target.value); setPhoneError(null); }}
                        placeholder="9876543210"
                        className="w-full bg-slate-900/50 border border-slate-600 rounded-md p-3 focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition-colors text-slate-200 placeholder-slate-500"
                        required
                    />
                    <p className="text-slate-500 text-xs mt-1">Each phone number can only be used for one account.</p>
                    {phoneError && <p className="text-red-400 text-xs mt-1 font-semibold">{phoneError}</p>}
                 </div>
            </div>

            <div>
              <label htmlFor="password" className="block text-sm font-semibold text-slate-300 mb-2">
                Password
              </label>
              <input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full bg-slate-900/50 border border-slate-600 rounded-md p-3 focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition-colors text-slate-200 placeholder-slate-500"
                required
              />
            </div>

            {/* Prominent Legal Disclaimer Section */}
            <div className="bg-slate-900/80 border border-yellow-600/50 p-4 rounded-md space-y-3">
                <div className="flex items-start space-x-2">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-yellow-500 flex-shrink-0 mt-0.5" viewBox="0 0 20 20" fill="currentColor">
                        <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                    </svg>
                    <h4 className="text-yellow-400 text-xs font-bold uppercase">AI Service Disclaimer</h4>
                </div>
                
                <p className="text-xs text-slate-300 leading-relaxed">
                    This application uses <strong>Artificial Intelligence (AI)</strong> to optimize your resume. 
                    We <strong>do not guarantee</strong> that the optimized resume will achieve a match score of 85% or above, 
                    or lead to any job offer. This service is an informational tool only.
                </p>

                <div className="pt-2 border-t border-slate-700/50">
                    <label className="flex items-start space-x-2 cursor-pointer group">
                        <div className="relative flex items-center mt-0.5">
                            <input 
                                type="checkbox" 
                                checked={termsAccepted}
                                onChange={(e) => setTermsAccepted(e.target.checked)}
                                className="peer h-4 w-4 cursor-pointer appearance-none rounded border border-slate-600 bg-slate-800 transition-all checked:border-emerald-500 checked:bg-emerald-500 flex-shrink-0"
                            />
                            <svg className="pointer-events-none absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 text-white opacity-0 transition-opacity peer-checked:opacity-100" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round" width="10" height="10"><polyline points="20 6 9 17 4 12"></polyline></svg>
                        </div>
                        <span className="text-xs text-slate-400 group-hover:text-slate-300 transition-colors">
                            I have read and agree to the <button type="button" onClick={onViewTerms} className="text-emerald-400 hover:text-emerald-300 underline font-bold">Terms of Service</button> and acknowledge the disclaimer above.
                        </span>
                    </label>
                </div>
            </div>

            <button
              type="submit"
              disabled={!canSubmit}
              className="w-full bg-gradient-to-r from-emerald-600 to-cyan-600 hover:from-emerald-700 hover:to-cyan-700 text-white font-bold py-3 px-4 rounded-lg shadow-md transition-all duration-300 ease-in-out disabled:opacity-50 disabled:cursor-not-allowed disabled:saturate-50"
            >
              {checkingPhone ? 'Checking phone number…' : 'Create Account'}
            </button>
          </form>

          <p className="text-center text-slate-400 text-sm mt-6">
            Already have an account?{' '}
            <button onClick={onSwitchToLogin} className="font-semibold text-emerald-400 hover:text-emerald-300">
              Log In
            </button>
          </p>
        </div>
      </div>

    </div>
  );
};

export default SignupPage;
