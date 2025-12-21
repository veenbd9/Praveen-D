
import React, { useState, useEffect, useCallback } from 'react';
import App from './App';
import LoginPage from './pages/LoginPage';
import SignupPage from './pages/SignupPage';
import { SubscriptionView } from './components/SubscriptionView';
import { User, SubscriptionDetails } from './types';
import { getCompanySettings } from './services/cryptoService';

type View = 'login' | 'signup' | 'subscription';
type AuthStep = 'credentials' | 'otp';

const SUPERUSER_EMAIL = 'veenbd9@gmail.com';
const INITIAL_SUPERUSER_PASS = 'Hello@123';
const DEFAULT_SUPERUSER_PHONE = '+91 9849734395';
const TEST_ENV_OTP = '123456';

const Auth: React.FC = () => {
  const [view, setView] = useState<View>('login');
  const [user, setUser] = useState<User | null>(null);
  const [loginError, setLoginError] = useState<string | null>(null);
  
  // 2FA States
  const [authStep, setAuthStep] = useState<AuthStep>('credentials');
  const [isSuperuserFlow, setIsSuperuserFlow] = useState(false);
  const [generatedOtp, setGeneratedOtp] = useState<string | null>(null);
  const [otpExpiry, setOtpExpiry] = useState<number>(0);
  const [pendingUser, setPendingUser] = useState<User | null>(null);

  useEffect(() => {
    const savedUser = sessionStorage.getItem('currentUser');
    if (savedUser) {
      const parsedUser = JSON.parse(savedUser);
      if (parsedUser.status !== 'SUSPENDED') {
          setUser(parsedUser);
      }
    }
  }, []);

  const generateAndSendOtp = useCallback(() => {
      const settings = getCompanySettings();
      const targetPhone = settings.personalMobileNumber ? `+91 ${settings.personalMobileNumber}` : DEFAULT_SUPERUSER_PHONE;
      
      // In test environment, we prioritize the default '123456'
      const code = TEST_ENV_OTP;
      setGeneratedOtp(code);
      // Valid for exactly 1 minute (60 seconds)
      setOtpExpiry(Date.now() + 60000); 
      
      console.warn(`[SECURITY] 2FA OTP for ${targetPhone}: ${code} (Expires in 60s)`);
      alert(`[TEST ENVIRONMENT] Superuser OTP sent to ${targetPhone}: ${code}. Valid for 1 minute.`);
      return code;
  }, []);

  const handleLogin = (email: string, password?: string) => {
    setLoginError(null);
    const dbUsers = JSON.parse(localStorage.getItem('mock_users_db') || '{}');
    const lowerEmail = email.toLowerCase().trim();
    
    // Superuser Flow
    if (lowerEmail === SUPERUSER_EMAIL) {
        const storedPass = localStorage.getItem('superuser_custom_password') || INITIAL_SUPERUSER_PASS;
        if (password !== storedPass) {
            setLoginError('Invalid credentials for Superuser.');
            return;
        }
        
        // Credentials valid, trigger 2FA step
        setIsSuperuserFlow(true);
        generateAndSendOtp();
        setAuthStep('otp');
        
        const superuserObj: User = dbUsers[SUPERUSER_EMAIL] || {
            name: "Praveen Babu Dupaki",
            email: SUPERUSER_EMAIL,
            isAdmin: true,
            countryCode: '+91',
            phoneNumber: '9849734395',
            status: 'ACTIVE',
            resumeMismatchCount: 0,
            subscription: { isActive: true, planType: 'none', startDate: Date.now(), expiryDate: 9999999999999, hasCompletedThreeMonthPlan: false, usageCount: 0, lastUsageReset: Date.now() }
        };
        setPendingUser(superuserObj);
        return;
    }

    // Test Account Flow (Backdoor)
    if (lowerEmail.startsWith('test')) {
        const testUser: User = dbUsers[lowerEmail] || {
            name: "Test User",
            email: lowerEmail,
            isAdmin: false,
            countryCode: '+1',
            phoneNumber: '0000000000',
            status: 'ACTIVE',
            resumeMismatchCount: 0,
            subscription: { isActive: true, planType: 'free', startDate: Date.now(), expiryDate: 9999999999999, hasCompletedThreeMonthPlan: false, usageCount: 0, lastUsageReset: Date.now() }
        };
        completeLogin(testUser);
        return;
    }

    // Regular User Flow
    let foundUser = dbUsers[lowerEmail];
    if (foundUser) {
        if (foundUser.status === 'SUSPENDED') {
            setLoginError("Account suspended.");
            return;
        }
        completeLogin(foundUser);
    } else {
        setLoginError("User record not found. Please sign up.");
    }
  };

  const handleVerifyOtp = (otp: string) => {
      if (!generatedOtp || Date.now() > otpExpiry) {
          setLoginError("OTP Expired. Please request a new one after the 2-minute cooldown.");
          return;
      }
      // Check against test default or generated code
      if (otp !== generatedOtp && otp !== TEST_ENV_OTP) {
          setLoginError("Incorrect OTP. Access denied.");
          return;
      }

      if (pendingUser) completeLogin(pendingUser);
  };

  const completeLogin = (u: User) => {
      setUser(u);
      sessionStorage.setItem('currentUser', JSON.stringify(u));
      const dbUsers = JSON.parse(localStorage.getItem('mock_users_db') || '{}');
      dbUsers[u.email] = u;
      localStorage.setItem('mock_users_db', JSON.stringify(dbUsers));
      
      const now = Date.now();
      if (!u.isAdmin && u.subscription.planType !== 'free' && now > u.subscription.expiryDate) {
          setView('subscription');
      } else {
          setView('login');
      }
      // Reset auth state for next session
      setAuthStep('credentials');
      setIsSuperuserFlow(false);
  };

  const handleSignup = (name: string, email: string, countryCode: string, phoneNumber: string, isVerified: boolean, isPhoneDuplicate: boolean) => {
    if (!isVerified) return;
    const dbUsers = JSON.parse(localStorage.getItem('mock_users_db') || '{}');
    if (isPhoneDuplicate) {
        Object.keys(dbUsers).forEach(key => {
            if (dbUsers[key].phoneNumber === phoneNumber) dbUsers[key].status = 'SUSPENDED';
        });
    }
    const newUser: User = { 
        name, email, isAdmin: false, countryCode, phoneNumber, status: 'ACTIVE', resumeMismatchCount: 0,
        subscription: { isActive: true, planType: 'free', startDate: Date.now(), expiryDate: 9999999999999, hasCompletedThreeMonthPlan: false, usageCount: 0, lastUsageReset: Date.now() }
    };
    dbUsers[email] = newUser;
    localStorage.setItem('mock_users_db', JSON.stringify(dbUsers));
    completeLogin(newUser);
  };
  
  const handleLogout = () => {
    setUser(null);
    setPendingUser(null);
    setAuthStep('credentials');
    setIsSuperuserFlow(false);
    sessionStorage.removeItem('currentUser');
    setView('login');
  };

  if (user) {
      if (view === 'subscription') {
          return <SubscriptionView user={user} onSubscribe={(plan) => setView('login')} onLogout={handleLogout} />;
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
