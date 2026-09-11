import { supabase } from './supabaseClient';

export interface PlanSelection {
  planType: '1-month' | '3-month' | '6-month' | 'renewal';
  price: number;
  currency: 'INR' | 'USD';
}

/** Redirects the browser to a Stripe Checkout page for international card payments. */
export const startStripeCheckout = async (plan: PlanSelection, userEmail: string, userId: string) => {
  const res = await fetch('/api/create-stripe-session', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ ...plan, userEmail, userId }),
  });
  if (!res.ok) throw new Error((await res.json()).error || 'Failed to start Stripe checkout.');
  const { url } = await res.json();
  window.location.href = url;
};

/**
 * Opens Razorpay Checkout for Indian payment methods (UPI / PhonePe / Google Pay / cards).
 * Loads the Razorpay script on demand and resolves once the order is verified server-side.
 */
export const startRazorpayCheckout = async (
  plan: PlanSelection,
  userId: string,
  userEmail: string,
  userName: string
): Promise<void> => {
  await loadRazorpayScript();

  const orderRes = await fetch('/api/create-razorpay-order', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ amount: plan.price, currency: plan.currency, planType: plan.planType, userId }),
  });
  if (!orderRes.ok) throw new Error((await orderRes.json()).error || 'Failed to create Razorpay order.');
  const order = await orderRes.json();

  return new Promise((resolve, reject) => {
    const rzp = new (window as any).Razorpay({
      key: order.keyId,
      amount: order.amount,
      currency: order.currency,
      order_id: order.orderId,
      name: 'ScaleupResume',
      description: `${plan.planType} subscription`,
      prefill: { email: userEmail, name: userName },
      // Razorpay Checkout automatically surfaces UPI apps (PhonePe, Google Pay, etc.),
      // cards, and netbanking based on the customer's device — no separate integration
      // is needed per app.
      handler: async (response: any) => {
        try {
          const verifyRes = await fetch('/api/verify-razorpay-payment', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              ...response,
              userId,
              planType: plan.planType,
              amount: plan.price,
              currency: plan.currency,
            }),
          });
          if (!verifyRes.ok) throw new Error((await verifyRes.json()).error || 'Payment verification failed.');
          resolve();
        } catch (err) {
          reject(err);
        }
      },
      modal: { ondismiss: () => reject(new Error('Payment cancelled.')) },
      theme: { color: '#10b981' },
    });
    rzp.open();
  });
};

const loadRazorpayScript = (): Promise<void> =>
  new Promise((resolve, reject) => {
    if ((window as any).Razorpay) {
      resolve();
      return;
    }
    const script = document.createElement('script');
    script.src = 'https://checkout.razorpay.com/v1/checkout.js';
    script.onload = () => resolve();
    script.onerror = () => reject(new Error('Failed to load Razorpay checkout script.'));
    document.body.appendChild(script);
  });

export const sendTransactionalEmail = async (
  to: string,
  toName: string,
  subject: string,
  htmlContent: string
) => {
  const response = await fetch('/api/send-email', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ to, toName, subject, htmlContent }),
  });
  if (!response.ok) {
    const body = await response.json().catch(() => null);
    throw new Error(body?.error || 'Failed to send transactional email.');
  }
};

export const getSupabaseUserId = async (): Promise<string | null> => {
  const { data } = await supabase.auth.getSession();
  return data.session?.user?.id ?? null;
};
