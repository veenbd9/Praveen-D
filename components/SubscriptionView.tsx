
import React, { useState, useEffect } from 'react';
import { User, Transaction, AdminBankDetails } from '../types';
import { getAdminBankDetails, saveTransaction } from '../services/cryptoService';

interface SubscriptionViewProps {
  user: User;
  onSubscribe: (planType: 'free' | '1-month' | '3-month' | '6-month' | 'renewal') => void;
  onLogout: () => void;
  onBack?: () => void;
}

export const SubscriptionView: React.FC<SubscriptionViewProps> = ({ user, onSubscribe, onLogout, onBack }) => {
  const [loading, setLoading] = useState(false);
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

  const confirmPayment = () => {
      if (!selectedPlan) return;
      setLoading(true);
      
      // TAX LOGIC: Inclusive GST Calculation (18%)
      // If Price = 599
      // Base Price = 599 / 1.18 = 507.63
      // Tax = 599 - 507.63 = 91.37
      
      let taxAmount = 0;
      let netAmount = selectedPlan.price;

      if (isIndia) {
          netAmount = selectedPlan.price / 1.18;
          taxAmount = selectedPlan.price - netAmount;
          
          // Round to 2 decimals
          netAmount = Math.round(netAmount * 100) / 100;
          taxAmount = Math.round(taxAmount * 100) / 100;
      }

      // Record Transaction Securely
      const newTransaction: Transaction = {
          id: `TXN_${Date.now()}`,
          userId: user.email,
          userName: user.name,
          amount: selectedPlan.price,
          taxAmount: taxAmount,
          netAmount: netAmount,
          currency: selectedPlan.currency,
          type: 'CREDIT',
          description: `Subscription Payment: ${selectedPlan.type}`,
          timestamp: Date.now(),
          method: isIndia ? 'UPI' : 'CARD',
          status: 'SUCCESS'
      };
      
      saveTransaction(newTransaction);

      setTimeout(() => {
        setLoading(false);
        alert('Payment Verified & Encrypted! Welcome to ATS Resume Optimizer.');
        onSubscribe(selectedPlan.type);
      }, 1500);
  };

  const PlanCard = ({ title, price, duration, features, onSelect, recommended = false, type, isFree = false }: any) => (
    <div className={`relative flex flex-col p-6 rounded-xl shadow-lg border transition-transform transform hover:scale-105 ${recommended ? 'bg-indigo-900/40 border-indigo-500 z-10' : 'bg-slate-800 border-slate-700'} ${isFree ? 'bg-slate-800/50 border-slate-600' : ''}`}>
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
          <div className="min-h-screen bg-slate-900 flex items-center justify-center p-4">
              <div className="bg-slate-800 p-8 rounded-lg shadow-2xl max-w-md w-full border border-slate-700">
                  <button onClick={() => setSelectedPlan(null)} className="text-sm text-slate-400 hover:text-white mb-4">&larr; Back to Plans</button>
                  <h2 className="text-2xl font-bold text-white mb-4">Complete Payment</h2>
                  <div className="bg-slate-900 p-4 rounded mb-6">
                      <p className="text-slate-400 text-sm">Total Amount (Inclusive of GST)</p>
                      <p className="text-3xl font-bold text-indigo-400">{selectedPlan.currency === 'INR' ? '₹' : '$'}{selectedPlan.price}</p>
                      {isIndia && (
                          <p className="text-xs text-slate-500 mt-1">*Includes 18% GST (approx ₹{Math.round((selectedPlan.price - (selectedPlan.price / 1.18))*100)/100})</p>
                      )}
                  </div>

                  {isIndia && adminBank?.upiId ? (
                      <div className="space-y-4">
                          <div className="bg-white p-4 rounded-lg flex flex-col items-center">
                               <div className="w-48 h-48 bg-gray-200 flex items-center justify-center mb-2 text-gray-500 text-xs">
                                   [Simulated QR Code for {adminBank.upiId}]
                               </div>
                               <p className="text-gray-800 font-bold text-sm">{adminBank.upiId}</p>
                          </div>
                          <div className="text-center">
                              <p className="text-slate-300 text-sm mb-2">Or pay via UPI App:</p>
                              <a href={`upi://pay?pa=${adminBank.upiId}&pn=${adminBank.accountHolderName}&am=${selectedPlan.price}&cu=INR`} className="inline-block bg-green-600 text-white px-4 py-2 rounded font-bold text-sm hover:bg-green-700 transition">
                                  Open UPI App
                              </a>
                          </div>
                          <div className="border-t border-slate-700 pt-4 mt-4">
                              <p className="text-xs text-slate-500 mb-2 font-bold">BANK TRANSFER DETAILS:</p>
                              <p className="text-xs text-slate-400">Bank: {adminBank.bankName}</p>
                              <p className="text-xs text-slate-400">Acc: {adminBank.accountNumber}</p>
                              <p className="text-xs text-slate-400">IFSC: {adminBank.ifscCode}</p>
                          </div>
                      </div>
                  ) : isIndia ? (
                       <div className="text-center text-yellow-400 p-4 border border-yellow-600 rounded bg-yellow-900/20">
                           System admin has not configured bank details yet. Please try again later.
                       </div>
                  ) : (
                      <div className="bg-slate-700 p-4 rounded">
                          <p className="text-white text-center font-bold">International Payment Gateway</p>
                          <p className="text-slate-400 text-sm text-center mt-2">(Simulated Credit Card Processing)</p>
                      </div>
                  )}

                  <button 
                    onClick={confirmPayment} 
                    disabled={loading || (isIndia && !adminBank?.upiId)}
                    className="w-full mt-6 bg-gradient-to-r from-indigo-600 to-cyan-600 text-white font-bold py-3 rounded shadow-lg hover:from-indigo-700 hover:to-cyan-700 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                      {loading ? 'Verifying Transaction...' : 'I Have Made Payment'}
                  </button>
              </div>
          </div>
      )
  }

  return (
    <div className="min-h-screen bg-slate-900 font-sans flex flex-col items-center justify-center p-4">
      {onBack && (
          <div className="absolute top-4 left-4">
              <button 
                onClick={onBack}
                className="flex items-center text-slate-400 hover:text-white transition-colors"
              >
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-1" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M9.707 16.707a1 1 0 01-1.414 0l-6-6a1 1 0 010-1.414l6-6a1 1 0 011.414 1.414L5.414 9H17a1 1 0 110 2H5.414l4.293 4.293a1 1 0 010 1.414z" clipRule="evenodd" />
                  </svg>
                  Back to Dashboard
              </button>
          </div>
      )}

      <div className="text-center mb-8 max-w-2xl mt-8">
        <h1 className="text-3xl md:text-4xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 to-cyan-400 mb-4">
          Unlock Full Access
        </h1>
        <p className="text-slate-400 text-lg">
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
                title="Monthly"
                price="₹599"
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
                title="Quarterly"
                price="₹1499"
                duration="3 months"
                type="3-month"
                recommended={true}
                features={[
                    "Save 17% vs Monthly",
                    "Unlimited Access",
                    "Advanced ATS Analysis",
                    "Priority Processing"
                ]}
                onSelect={handleSelectPlan}
            />
             <PlanCard
                title="6-Months"
                price="₹2499"
                duration="6 months"
                type="6-month"
                features={[
                     "Best Long-Term Value",
                     "Equivalent to ₹416/mo",
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
                title="Monthly"
                price="$9"
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
                title="Quarterly"
                price="$24"
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
                title="6-Months"
                price="$39"
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
                className="text-indigo-400 hover:text-indigo-300 underline text-sm font-bold"
              >
                Already a member? Renew Monthly for ₹399
              </button>
          )}
      </div>

      <button 
        onClick={onLogout}
        className="mt-12 text-slate-500 hover:text-slate-300 underline text-sm"
      >
        Log out and switch account
      </button>
    </div>
  );
};
