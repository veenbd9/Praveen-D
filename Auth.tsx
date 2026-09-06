
import React, { useState, useEffect, useCallback } from 'react';
import App from './App';
import LoginPage from './pages/LoginPage';
import SignupPage from './pages/SignupPage';
import { SubscriptionView } from './components/SubscriptionView';
import { User } from './types';
import { supabase } from './services/supabaseClient';
import { signIn, signUp, signOut, getCurrentUser, sendOtp, verifyOtp, fetchProfile } from './services/authService';

type View = 'login' | 'signup' | 'subscription';
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

  useEffect(() => {
    // Restore session on load, then keep it in sync with Supabase auth events
    // (token refresh, sign-out from another tab, etc).
    getCurrentUser().then((u) => {
      setUser(u);
      setLoading(false);
    });

    const { data: sub } = supabase.auth.onAuthStateChange(async (_event, session) => {
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
      const loggedInUser = await signIn(email, password || '');
      completeLogin(loggedInUser);
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

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center">
        <div className="animate-pulse text-emerald-400 font-black uppercase tracking-widest text-sm">Loading ScaleupResume…</div>
      </div>
    );
  }

  if (user) {
    if (view === 'subscription') {
      return <SubscriptionView user={user} onSubscribe={() => setView('login')} onLogout={handleLogout} />;
    }
    return <App user={user} onLogout={handleLogout} onManageSubscription={() => setView('subscription')} onUpdateUser={(u) => setUser(u)} />;
  }

  if (view === 'signup') return <SignupPage onSignup={handleSignup} onSwitchToLogin={() => setView('login')} />;

  return (
    <LoginPage
      onLogin={handleLogin}
      onVerifyOtp={handleVerifyOtp}
      onResendOtp={generateAndSendOtp}
      authStep={authStep}
      isSuperuserFlow={isSuperuserFlow}
      loginError={loginError}
      onSwitchToSignup={() => setView('signup')}
    />
  );
};

export default Auth;
