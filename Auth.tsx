
import React, { useState, useEffect, useCallback } from 'react';
import App from './App';
import LoginPage from './pages/LoginPage';
import SignupPage from './pages/SignupPage';
import { SubscriptionView } from './components/SubscriptionView';
import { User } from './types';
import { isSupabaseConfigured, supabase } from './services/supabaseClient';
import { signIn, signUp, signOut, getCurrentUser, sendOtp, verifyOtp, fetchProfile } from './services/authService';
import { requestPasswordReset, updatePassword } from './services/authService';
import { TermsOfServicePage } from './pages/TermsOfServicePage';
import { PasswordResetPage } from './pages/PasswordResetPage';

type View = 'login' | 'signup' | 'subscription' | 'terms';
type AuthStep = 'credentials' | 'otp';

const SUPERUSER_EMAIL = 'veenbd9@gmail.com';

const Auth: React.FC = () => {
  const [view, setView] = useState<View>('login');
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [loginError, setLoginError] = useState<string | null>(null);

  // 2FA (email OTP via Supabase) — required for the superuser account only.
  const [authStep, setAuthStep] = useState<AuthStep>('credentials');
  const [isSuperuserFlow, setIsSuperuserFlow] = useState(false);
  const [pendingEmail, setPendingEmail] = useState<string | null>(null);
  const [passwordRecovery, setPasswordRecovery] = useState(false);

  useEffect(() => {
    if (!isSupabaseConfigured) {
      setLoading(false);
      return;
    }
    // Restore session on load, then keep it in sync with Supabase auth events
    // (token refresh, sign-out from another tab, etc).
    getCurrentUser().then((u) => {
      setUser(u);
      setLoading(false);
    });

    const { data: sub } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (event === 'PASSWORD_RECOVERY') {
        setPasswordRecovery(true);
        return;
      }
      if (!session) {
        setUser(null);
        return;
      }
      const profile = await fetchProfile(session.user.id);
      if (profile?.status === 'SUSPENDED') {
        await signOut();
        setUser(null);
        setLoginError('Account suspended.');
        return;
      }
    });

    return () => sub.subscription.unsubscribe();
  }, []);

  const generateAndSendOtp = useCallback(async () => {
    if (!pendingEmail) return;
    try {
      await sendOtp(pendingEmail);
      alert(`A one-time verification code has been emailed to ${pendingEmail}.`);
    } catch (err: any) {
      setLoginError(err.message || 'Failed to send verification code.');
    }
  }, [pendingEmail]);

  const handleLogin = async (email: string, password?: string) => {
    setLoginError(null);
    const lowerEmail = email.toLowerCase().trim();

    try {
      const loggedInUser = await signIn(lowerEmail, password || '');

      if (loggedInUser.status === 'SUSPENDED') {
        await signOut();
        setLoginError('Account suspended.');
        return;
      }

      // Superuser accounts require an additional email OTP step.
      if (lowerEmail === SUPERUSER_EMAIL) {
        setIsSuperuserFlow(true);
        setPendingEmail(lowerEmail);
        setAuthStep('otp');
        await sendOtp(lowerEmail);
        return;
      }

      completeLogin(loggedInUser);
    } catch (err: any) {
      setLoginError(err.message || 'Invalid credentials.');
    }
  };

  const handleVerifyOtp = async (otp: string) => {
    if (!pendingEmail) return;
    try {
      const verifiedUser = await verifyOtp(pendingEmail, otp);
      completeLogin(verifiedUser);
    } catch (err: any) {
      setLoginError(err.message || 'Incorrect or expired code.');
    }
  };

  const completeLogin = (u: User) => {
    setUser(u);
    const now = Date.now();
    if (!u.isAdmin && u.subscription.planType !== 'free' && now > u.subscription.expiryDate) {
      setView('subscription');
    } else {
      setView('login');
    }
    setAuthStep('credentials');
    setIsSuperuserFlow(false);
    setPendingEmail(null);
  };

  const handleSignup = async (
    name: string,
    email: string,
    countryCode: string,
    phoneNumber: string,
    isVerified: boolean,
    _isPhoneDuplicate: boolean,
    password?: string
  ) => {
    if (!isVerified) return;
    try {
      await signUp({ name, email, password: password || '', countryCode, phoneNumber });
      const normalizedEmail = email.toLowerCase().trim();
      setPendingEmail(normalizedEmail);
      setIsSuperuserFlow(false);
      setAuthStep('otp');
      await sendOtp(normalizedEmail);
    } catch (err: any) {
      setLoginError(err.message || 'Signup failed.');
      setView('login');
    }
  };

  const handleLogout = async () => {
    await signOut();
    setUser(null);
    setAuthStep('credentials');
    setIsSuperuserFlow(false);
    setPendingEmail(null);
    setView('login');
  };

  const handleSubscriptionComplete = async () => {
    const refreshedUser = await getCurrentUser();
    if (refreshedUser) setUser(refreshedUser);
    setView('login');
  };

  const handleForgotPassword = async (email: string) => {
    if (!email.trim()) {
      setLoginError('Enter your email address first.');
      return;
    }
    try {
      await requestPasswordReset(email.trim().toLowerCase());
      setLoginError(null);
    } catch (error: any) {
      setLoginError(error.message || 'Unable to send the password reset email.');
      throw error;
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center">
        <div className="animate-pulse text-emerald-400 font-black uppercase tracking-widest text-sm">Loading ScaleupResume…</div>
      </div>
    );
  }

  if (!isSupabaseConfigured) {
    return (
      <div className="min-h-screen bg-slate-950 text-slate-200 flex items-center justify-center p-6">
        <div className="max-w-xl rounded-xl border border-amber-500/40 bg-slate-900 p-8 shadow-2xl">
          <h1 className="text-2xl font-bold text-white mb-3">Local setup required</h1>
          <p className="text-slate-300 leading-relaxed">
            The app is running, but Supabase credentials are not configured for this local environment.
          </p>
          <ol className="list-decimal list-inside text-slate-400 text-sm space-y-2 mt-5">
            <li>Copy <code className="text-emerald-300">.env.local.example</code> to <code className="text-emerald-300">.env.local</code>.</li>
            <li>Set <code className="text-emerald-300">SUPABASE_URL</code> and <code className="text-emerald-300">SUPABASE_ANON_KEY</code> from Supabase Project Settings → API.</li>
            <li>Restart the local Vite server.</li>
          </ol>
          <p className="text-xs text-slate-500 mt-6">Do not commit .env.local or any service-role keys.</p>
        </div>
      </div>
    );
  }

  if (passwordRecovery) {
    return <PasswordResetPage onComplete={async () => { setPasswordRecovery(false); await signOut(); setView('login'); }} onUpdatePassword={updatePassword} />;
  }

  if (user) {
    if (view === 'terms') return <TermsOfServicePage onBack={() => setView('login')} />;
    if (view === 'subscription') {
      return <SubscriptionView user={user} onSubscribe={handleSubscriptionComplete} onLogout={handleLogout} />;
    }
    return <App user={user} onLogout={handleLogout} onManageSubscription={() => setView('subscription')} onUpdateUser={(u) => setUser(u)} />;
  }

  if (view === 'signup') return <SignupPage onSignup={handleSignup} onSwitchToLogin={() => setView('login')} onViewTerms={() => setView('terms')} />;

  return (
    <LoginPage
      onLogin={handleLogin}
      onVerifyOtp={handleVerifyOtp}
      onResendOtp={generateAndSendOtp}
      authStep={authStep}
      isSuperuserFlow={isSuperuserFlow}
      loginError={loginError}
      onSwitchToSignup={() => setView('signup')}
      onViewTerms={() => setView('terms')}
      onForgotPassword={handleForgotPassword}
    />
  );
};

export default Auth;
