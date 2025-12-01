
import React, { useState, useEffect, useCallback } from 'react';
import App from './App';
import LoginPage from './pages/LoginPage';
import SignupPage from './pages/SignupPage';
import { SubscriptionView } from './components/SubscriptionView';
import { User, SubscriptionDetails } from './types';

type View = 'login' | 'signup' | 'subscription';

const DEFAULT_TEST_ACCOUNTS: Record<string, string> = {
    'Test1': '123test',
    'Test2': '234test',
    'Test3': '345test'
};

const Auth: React.FC = () => {
  const [view, setView] = useState<View>('login');
  const [user, setUser] = useState<User | null>(null);
  const [loginError, setLoginError] = useState<string | null>(null);

  // Initialize Test Accounts in DB if not present
  useEffect(() => {
      if (!localStorage.getItem('test_accounts_db')) {
          localStorage.setItem('test_accounts_db', JSON.stringify(DEFAULT_TEST_ACCOUNTS));
      }
  }, []);

  // Load user from session storage if available to persist state on refresh
  useEffect(() => {
    const savedUser = sessionStorage.getItem('currentUser');
    if (savedUser) {
      const parsedUser = JSON.parse(savedUser);
      if (parsedUser.status === 'SUSPENDED') {
          sessionStorage.removeItem('currentUser');
          setUser(null);
          return;
      }
      
      setUser(parsedUser);
    }
  }, []);

  const checkSubscriptionValidity = (u: User): boolean => {
    if (u.isAdmin) return true; // Admin always valid
    if (u.subscription.planType === 'free') return true; // Free plan is always valid for login, limited by usage count in App
    
    // If any paid plan, check the expiry date.
    const now = Date.now();
    
    // If expired
    if (now > u.subscription.expiryDate) {
        // We do not auto-update the user object here to avoid render loops, 
        // but we return false to force the Subscription View.
        return false;
    }
    return true;
  };

  const updateUserSubscription = (u: User, newSub: SubscriptionDetails) => {
    const updatedUser = { ...u, subscription: newSub };
    setUser(updatedUser);
    sessionStorage.setItem('currentUser', JSON.stringify(updatedUser));
    
    // Update in "DB" (localStorage)
    const dbUsers = JSON.parse(localStorage.getItem('mock_users_db') || '{}');
    dbUsers[u.email] = updatedUser;
    localStorage.setItem('mock_users_db', JSON.stringify(dbUsers));
    
    return updatedUser;
  };

  const handleUpdateUser = useCallback((updatedUser: User) => {
      setUser(updatedUser);
      sessionStorage.setItem('currentUser', JSON.stringify(updatedUser));
      const dbUsers = JSON.parse(localStorage.getItem('mock_users_db') || '{}');
      dbUsers[updatedUser.email] = updatedUser;
      localStorage.setItem('mock_users_db', JSON.stringify(dbUsers));
  }, []);

  const isSuperUser = (email: string) => email.toLowerCase() === 'veenbd9@gmail.com';

  const getEndOfDayTimestamp = () => {
      const now = new Date();
      now.setHours(23, 59, 59, 999);
      return now.getTime();
  };

  const handleLogin = (email: string, password?: string) => {
    setLoginError(null);
    const dbUsers = JSON.parse(localStorage.getItem('mock_users_db') || '{}');
    const testAccounts = JSON.parse(localStorage.getItem('test_accounts_db') || '{}');
    
    // --- TEST USER LOGIC ---
    if (testAccounts[email]) {
        if (password !== testAccounts[email]) {
            setLoginError('Invalid password for Test User.');
            return;
        }

        // If credentials match, ensure test user exists in DB with full access
        if (!dbUsers[email]) {
            const newTestUser: User = {
                name: `Developer ${email}`,
                email: email, // Use Login ID as email for test users
                isAdmin: false,
                countryCode: '+91',
                phoneNumber: '0000000000',
                status: 'ACTIVE',
                resumeMismatchCount: 0,
                subscription: {
                    isActive: true,
                    planType: '1-month', // Give them active plan for testing
                    startDate: Date.now(),
                    expiryDate: Date.now() + (30 * 24 * 60 * 60 * 1000),
                    hasCompletedThreeMonthPlan: false,
                    usageCount: 0,
                    lastUsageReset: Date.now()
                }
            };
            dbUsers[email] = newTestUser;
            localStorage.setItem('mock_users_db', JSON.stringify(dbUsers));
            setUser(newTestUser);
            sessionStorage.setItem('currentUser', JSON.stringify(newTestUser));
            return; // Logged in immediately
        }
    }
    
    // --- STANDARD LOGIC ---
    let foundUser = dbUsers[email];

    // SUPER USER OVERRIDE: Ensure name is correct if it's the super user email
    if (isSuperUser(email)) {
        if (foundUser) {
            foundUser.name = "Praveen Dupaki"; // Force name update
            dbUsers[email] = foundUser;
            localStorage.setItem('mock_users_db', JSON.stringify(dbUsers));
        }
    }

    if (foundUser) {
        // Check if Suspended
        if (foundUser.status === 'SUSPENDED') {
            setLoginError("Your account has been suspended. This may happen if your verified phone number was registered to a new account.");
            return;
        }

        // Ensure mismatch count exists (migration for old data)
        if (foundUser.resumeMismatchCount === undefined) {
            foundUser.resumeMismatchCount = 0;
        }

        setUser(foundUser);
        sessionStorage.setItem('currentUser', JSON.stringify(foundUser));
        
        // If not valid subscription, force subscription view
        if (!checkSubscriptionValidity(foundUser)) {
            setView('subscription');
        } else {
             setView('login'); // Default view (App)
        }
    } else {
        // Create new user (Implied "signup" via login form for mock app convenience)
        let name = email.split('@')[0].replace(/[._-]/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
        const isAdmin = isSuperUser(email);
        
        if (isAdmin) {
            name = "Praveen Dupaki";
        }
        
        // NEW USER DEFAULTS: Free plan with lifetime validity (limited by 3 usage count)
        const newUser: User = {
            name,
            email,
            isAdmin,
            countryCode: '+91',
            phoneNumber: '',
            status: 'ACTIVE',
            resumeMismatchCount: 0,
            subscription: {
                isActive: true, 
                planType: isAdmin ? 'none' : 'free',
                startDate: Date.now(),
                expiryDate: 9999999999999, // Infinite
                hasCompletedThreeMonthPlan: false,
                usageCount: 0,
                lastUsageReset: Date.now()
            }
        };
        
        // Save to DB
        dbUsers[email] = newUser;
        localStorage.setItem('mock_users_db', JSON.stringify(dbUsers));

        setUser(newUser);
        sessionStorage.setItem('currentUser', JSON.stringify(newUser));

        setView('login');
    }
  };

  const handleSignup = (name: string, email: string, countryCode: string, phoneNumber: string, isVerified: boolean, isPhoneDuplicate: boolean) => {
    if (!isVerified) return;

    const dbUsers = JSON.parse(localStorage.getItem('mock_users_db') || '{}');
    
    if (isPhoneDuplicate) {
        Object.keys(dbUsers).forEach(key => {
            if (dbUsers[key].phoneNumber === phoneNumber) {
                dbUsers[key].status = 'SUSPENDED';
            }
        });
    }

    const isAdmin = isSuperUser(email);
    const finalName = isAdmin ? "Praveen Dupaki" : name;

    const newUser: User = { 
        name: finalName, 
        email, 
        isAdmin, 
        countryCode, 
        phoneNumber,
        status: 'ACTIVE',
        resumeMismatchCount: 0,
        subscription: {
            isActive: true,
            planType: isAdmin ? 'none' : 'free',
            startDate: Date.now(),
            expiryDate: 9999999999999, // Infinite
            hasCompletedThreeMonthPlan: false,
            usageCount: 0,
            lastUsageReset: Date.now()
        }
    };

    dbUsers[email] = newUser;
    localStorage.setItem('mock_users_db', JSON.stringify(dbUsers));

    setUser(newUser);
    sessionStorage.setItem('currentUser', JSON.stringify(newUser));

    setView('login');
  };
  
  const handleLogout = () => {
    setUser(null);
    sessionStorage.removeItem('currentUser');
    setView('login');
  };

  const handleSubscriptionComplete = (planType: 'free' | '1-month' | '3-month' | '6-month' | 'renewal') => {
    if (!user) return;

    const now = Date.now();
    let expiryDate = 0;

    if (planType === 'free') {
        expiryDate = 9999999999999; 
    } else {
        let durationDays = 0;
        if (planType === '1-month' || planType === 'renewal') durationDays = 30;
        if (planType === '3-month') durationDays = 90;
        if (planType === '6-month') durationDays = 180;
        expiryDate = now + (durationDays * 24 * 60 * 60 * 1000);
    }
    
    const completed3Month = planType === '3-month' || planType === '6-month' || (user.subscription.hasCompletedThreeMonthPlan && planType === 'renewal');

    const newSubscription: SubscriptionDetails = {
        isActive: true,
        planType: planType,
        startDate: now,
        expiryDate: expiryDate,
        hasCompletedThreeMonthPlan: completed3Month,
        usageCount: 0, // Reset usage on new plan
        lastUsageReset: now
    };

    updateUserSubscription(user, newSubscription);
    setView('login'); // Will render App
  };

  // Logic to determine what to render
  if (user) {
      // 1. If explicitly viewing subscriptions (e.g. from header link)
      // 2. OR if subscription is invalid/inactive (Expired or Suspended)
      const isValid = checkSubscriptionValidity(user);
      const shouldShowSubscription = view === 'subscription' || !isValid;

      if (shouldShowSubscription) {
          // If the user has a valid sub but just wants to check pricing, allow going back
          const canGoBack = isValid;
          
          return (
             <SubscriptionView 
                user={user} 
                onSubscribe={handleSubscriptionComplete} 
                onLogout={handleLogout}
                onBack={canGoBack ? () => setView('login') : undefined}
            />
          );
      }
      
      // Default: Show App Dashboard
      return (
        <App 
            user={user} 
            onLogout={handleLogout} 
            onManageSubscription={() => setView('subscription')} 
            onUpdateUser={handleUpdateUser}
        />
      );
  }

  if (view === 'signup') {
    return <SignupPage onSignup={handleSignup} onSwitchToLogin={() => setView('login')} />;
  }

  return (
    <>
        {loginError && (
            <div className="fixed top-4 left-1/2 transform -translate-x-1/2 z-50 w-full max-w-md px-4">
                <div className="bg-red-900/90 border border-red-500 text-red-100 px-4 py-3 rounded shadow-lg text-center">
                    <p className="font-bold text-sm">{loginError}</p>
                    <button onClick={() => setLoginError(null)} className="text-xs underline mt-2">Dismiss</button>
                </div>
            </div>
        )}
        <LoginPage onLogin={handleLogin} onSwitchToSignup={() => setView('signup')} />
    </>
  );
};

export default Auth;
