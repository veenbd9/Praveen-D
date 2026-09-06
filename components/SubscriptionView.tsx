import React, { useState, useEffect } from 'react';
import { User, AdminBankDetails } from '../types';
import { getAdminBankDetails } from '../services/cryptoService';
import { startStripeCheckout, startRazorpayCheckout, sendTransactionalEmail, getSupabaseUserId } from '../services/paymentService';

interface SubscriptionViewProps {
  user: User;
  onSubscribe: (planType: 'free' | '1-month' | '3-month' | '6-month' | 'renewal') => void;
  onLogout: () => void;
  onBack?: () => void;
}

export const SubscriptionView: React.FC<SubscriptionViewProps> = ({ user, onSubscribe, onLogout, onBack }) => {
  const [loading, setLoading] = useState(false);
  const [paymentError, setPaymentError] = useState<string | null>(null);
  const [adminBank, setAdminBank] = useState<AdminBankDetails | null>(null);
  const [selectedPlan, setSelectedPlan] = useState<{ type: 'free' | '1-month' | '3-month' | '6-month' | 'renewal'; price: number; currency: string } | null>(null);

  useEffect(() => {
      setAdminBank(getAdminBankDetails());
  }, []);

  const isIndia = user.countryCode === '+91';
  const canRenew = isIndia && user.subscription.hasCompletedThreeMonthPlan;

  const handleSelectPlan = (type: 'free' | '1-month' | '3-month' | '6-month' | 'renewal', priceStr: string) => {
      if (type === 'free') {
          onSubscribe('free');
          return;
      }
      const currency = priceStr.includes('₹') ? 'INR' : 'USD';
      const price = parseFloat(priceStr.replace(/[^0-9.]/g, ''));
      setSelectedPlan({ type, price, currency });
  };

  const confirmPayment = async () => {
      if (!selectedPlan || selectedPlan.type === 'free') return;
      setLoading(true);
      setPaymentError(null);

      const plan = {
          planType: selectedPlan.type as '1-month' | '3-month' | '6-month' | 'renewal',
          price: selectedPlan.price,
          currency: selectedPlan.currency as 'INR' | 'USD',
      };

      try {
          const userId = await getSupabaseUserId();
          if (!userId) throw new Error('You must be signed in to subscribe.');

          if (isIndia) {
              // Razorpay Checkout surfaces UPI apps (PhonePe, Google Pay, etc.), cards,
              // and netbanking automatically — no separate PhonePe/GPay integration needed.
              await startRazorpayCheckout(plan, userId, user.email, user.name);
              await sendTransactionalEmail(
                  user.email,
                  user.name,
                  'Payment Confirmed — ScaleupResume',
                  `<p>Hi ${user.name},</p><p>Your <strong>${plan.planType}</strong> plan payment of ₹${plan.price} was successful. Welcome to ScaleupResume!</p>`
              );
              setLoading(false);
              onSubscribe(selectedPlan.type as any);
          } else {
              // Stripe redirects the browser away; the webhook (api/stripe-webhook.ts)
              // finalizes the subscription and records the transaction server-side.
              await startStripeCheckout(plan, user.email, userId);
          }
      } catch (err: any) {
          setLoading(false);
          setPaymentError(err.message || 'Payment failed. Please try again.');
      }
  };

  const PlanCard = ({ title, price, duration, features, onSelect, recommended = false, type, isFree = false }: any) => (
    <div className={`relative flex flex-col p-6 rounded-xl shadow-lg border transition-transform transform hover:scale-105 ${recommended ? 'bg-indigo-900/90 border-indigo-500 z-10' : 'bg-slate-800/90 border-slate-700'} ${isFree ? 'bg-slate-800/80 border-slate-600' : ''} backdrop-blur-sm`}>
        {recommended && (
            <div className="absolute top-0 right-0 bg-indigo-500 text-white text-xs font-bold px-3 py-1 rounded-bl-lg rounded-tr-lg">
                BEST VALUE
            </div>
        )}
      <h3 className="text-xl font-bold text-slate-200 mb-2">{title}</h3>
      <div className="mb-4">
        <span className="text-3xl font-bold text-white">{price}</span>
        {duration && <span className="text-slate-400 text-sm"> / {duration}</span>}
      </div>
      <ul className="space-y-3 mb-6 flex-grow">
        {features.map((feature: string, idx: number) => (
          <li key={idx} className="flex items-start text-slate-300 text-sm">
            <svg className={`w-5 h-5 mr-2 flex-shrink-0 ${isFree ? 'text-slate-500' : 'text-green-400'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path>
            </svg>
            {feature}
          </li>
        ))}
      </ul>
      <button
        onClick={() => onSelect(type, price)}
        className={`w-full py-2 px-4 rounded-lg font-bold transition-colors ${
          recommended 
            ? 'bg-indigo-600 hover:bg-indigo-700 text-white' 
            : isFree
            ? 'bg-slate-600 hover:bg-slate-500 text-white'
            : 'bg-slate-700 hover:bg-slate-600 text-slate-200'
        }`}
      >
        {isFree ? 'Select Basic Plan' : 'Select Plan'}
      </button>
    </div>
  );

  if (selectedPlan) {
      return (
          <div className="min-h-screen bg-transparent flex items-center justify-center p-4">
              <div className="bg-slate-900/90 backdrop-blur-md p-8 rounded-lg shadow-2xl max-w-md w-full border border-slate-700">
                  <button onClick={() => setSelectedPlan(null)} className="text-sm text-slate-400 hover:text-white mb-4">&larr; Back to Plans</button>
                  <h2 className="text-2xl font-bold text-white mb-4">Complete Payment</h2>
                  <div className="bg-slate-900 p-4 rounded mb-6">
                      <p className="text-slate-400 text-sm">Total Amount (Inclusive of GST)</p>
                      <p className="text-3xl font-bold text-indigo-400">{selectedPlan.currency === 'INR' ? '₹' : '$'}{selectedPlan.price}</p>
                      {isIndia && (
                          <p className="text-xs text-slate-500 mt-1">*Includes 18% GST (approx ₹{Math.round((selectedPlan.price - (selectedPlan.price / 1.18))*100)/100})</p>
                      )}
                  </div>

                  {isIndia ? (
                      <div className="bg-slate-700/50 p-4 rounded text-center">
                          <p className="text-white font-bold">Pay via Razorpay Checkout</p>
                          <p className="text-slate-400 text-sm mt-2">UPI (PhonePe, Google Pay, Paytm), cards, and netbanking are all available in the next step.</p>
                      </div>
                  ) : (
                      <div className="bg-slate-700/50 p-4 rounded text-center">
                          <p className="text-white font-bold">Pay via Stripe Checkout</p>
                          <p className="text-slate-400 text-sm mt-2">You'll be redirected to Stripe's secure payment page.</p>
                      </div>
                  )}

                  {paymentError && (
                      <div className="mt-4 p-3 bg-red-900/30 border border-red-700 rounded text-red-300 text-sm text-center">
                          {paymentError}
                      </div>
                  )}

                  <button 
                    onClick={confirmPayment} 
                    disabled={loading}
                    className="w-full mt-6 bg-gradient-to-r from-indigo-600 to-cyan-600 text-white font-bold py-3 rounded shadow-lg hover:from-indigo-700 hover:to-cyan-700 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                      {loading ? 'Redirecting to payment...' : isIndia ? 'Pay with Razorpay' : 'Pay with Stripe'}
                  </button>
              </div>
          </div>
      )
  }

  return (
    <div className="min-h-screen bg-transparent font-sans flex flex-col items-center justify-center p-4">
      {onBack && (
          <div className="absolute top-4 left-4">
              <button 
                onClick={onBack}
                className="flex items-center text-slate-700 hover:text-indigo-600 transition-colors font-semibold"
              >
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-1" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M9.707 16.707a1 1 0 01-1.414 0l-6-6a1 1 0 010-1.414l6-6a1 1 0 011.414 1.414L5.414 9H17a1 1 0 110 2H5.414l4.293 4.293a1 1 0 010 1.414z" clipRule="evenodd" />
                  </svg>
                  Back to Dashboard
              </button>
          </div>
      )}

      {/* Early Bird Banner */}
      <div className="w-full max-w-4xl bg-gradient-to-r from-yellow-600 to-orange-600 rounded-lg shadow-lg mb-8 p-4 text-center transform hover:scale-[1.01] transition-transform">
          <p className="text-white font-bold text-lg md:text-xl animate-pulse">
              🎉 EARLY BIRD OFFER: Special Pricing for the First 1000 Customers!
          </p>
          <p className="text-yellow-100 text-sm mt-1">
              Limited time only. 9,421 spots remaining.
          </p>
      </div>

      <div className="text-center mb-8 max-w-2xl">
        <h1 className="text-3xl md:text-4xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-indigo-600 to-cyan-700 drop-shadow-sm mb-4">
          Unlock Full Access
        </h1>
        <p className="text-slate-700 font-medium text-lg">
          Hello, {user.name}. Choose a plan to start optimizing your resume.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 max-w-7xl w-full">
        
        {/* FREE TIER - UPDATED TO 3 SCANS */}
        <PlanCard
            title="Free Tier"
            price={isIndia ? "₹0" : "$0"}
            duration="Lifetime"
            type="free"
            isFree={true}
            features={[
                "3 ATS Match Scans",
                "Basic Formatting",
                "Watermarked PDF Downloads",
            ]}
            onSelect={handleSelectPlan}
        />

        {/* INDIA PLANS */}
        {isIndia && (
          <>
            <PlanCard
                title="Early Bird Monthly"
                price="₹299"
                duration="month"
                type="1-month"
                features={[
                    "Unlimited Optimizations",
                    "Unlimited Cover Letters",
                    "No Watermarks",
                    "Priority Support"
                ]}
                onSelect={handleSelectPlan}
            />
            <PlanCard
                title="Early Bird Quarterly"
                price="₹599"
                duration="3 months"
                type="3-month"
                recommended={true}
                features={[
                    "Save 33% vs Monthly",
                    "Unlimited Access",
                    "Advanced ATS Analysis",
                    "Priority Processing"
                ]}
                onSelect={handleSelectPlan}
            />
             <PlanCard
                title="Early Bird Half-Yearly"
                price="₹999"
                duration="6 months"
                type="6-month"
                features={[
                     "Best Long-Term Value",
                     "Equivalent to ₹166/mo",
                     "Career Coaching Chatbot",
                     "All Premium Features"
                ]}
                onSelect={handleSelectPlan}
            />
          </>
        )}

        {/* INTERNATIONAL PLANS */}
        {!isIndia && (
           <>
            <PlanCard
                title="Early Bird Monthly"
                price="$4.99"
                duration="month"
                type="1-month"
                features={[
                    "Unlimited Optimizations",
                    "Unlimited Cover Letters",
                    "No Watermarks",
                    "Priority Support"
                ]}
                onSelect={handleSelectPlan}
            />
            <PlanCard
                title="Early Bird Quarterly"
                price="$8.99"
                duration="3 months"
                type="3-month"
                recommended={true}
                features={[
                    "Save vs Monthly",
                    "Unlimited Access",
                    "Advanced Analysis",
                    "Priority Processing"
                ]}
                onSelect={handleSelectPlan}
            />
            <PlanCard
                title="Early Bird Half-Yearly"
                price="$12.99"
                duration="6 months"
                type="6-month"
                features={[
                    "Best Long-Term Value",
                    "Unlimited Access",
                    "All Premium Features",
                    "No Watermarks"
                ]}
                onSelect={handleSelectPlan}
            />
           </>
        )}
      </div>

      <div className="mt-8 text-center">
          {canRenew && (
              <button 
                onClick={() => handleSelectPlan('renewal', '₹399')}
                className="text-indigo-600 hover:text-indigo-800 underline text-sm font-bold"
              >
                Already a member? Renew Monthly for ₹399
              </button>
          )}
      </div>

      <button 
        onClick={onLogout}
        className="mt-12 text-slate-700 hover:text-indigo-600 underline text-sm font-semibold"
      >
        Log out and switch account
      </button>
    </div>
  );
};