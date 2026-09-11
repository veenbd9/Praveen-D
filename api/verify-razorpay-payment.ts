import type { VercelRequest, VercelResponse } from '@vercel/node';
import crypto from 'crypto';
import { createClient } from '@supabase/supabase-js';
import { getPlanDurationDays, getPlanQuota } from '../lib/paymentPlans';

const supabaseAdmin = createClient(
  process.env.SUPABASE_URL as string,
  process.env.SUPABASE_SERVICE_ROLE_KEY as string
);

/**
 * Verifies the HMAC signature returned by Razorpay Checkout after a successful
 * payment (UPI/PhonePe/GPay/card), then records the transaction and extends
 * the user's subscription. Expects POST:
 * { razorpay_order_id, razorpay_payment_id, razorpay_signature, userId, planType, amount, currency }
 */
export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') {
    res.status(405).json({ error: 'Method not allowed' });
    return;
  }

  const {
    razorpay_order_id,
    razorpay_payment_id,
    razorpay_signature,
    userId,
    planType,
    amount,
    currency,
  } = req.body ?? {};

  if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature || !userId || !planType) {
    res.status(400).json({ error: 'Missing required fields.' });
    return;
  }

  const expectedSignature = crypto
    .createHmac('sha256', process.env.RAZORPAY_KEY_SECRET as string)
    .update(`${razorpay_order_id}|${razorpay_payment_id}`)
    .digest('hex');

  if (expectedSignature !== razorpay_signature) {
    res.status(400).json({ error: 'Payment verification failed — signature mismatch.' });
    return;
  }

  await supabaseAdmin.from('transactions').insert({
    id: razorpay_payment_id,
    user_id: userId,
    amount,
    currency: currency || 'INR',
    type: 'CREDIT',
    description: `Subscription Payment: ${planType}`,
    method: 'UPI',
    status: 'SUCCESS',
    provider: 'razorpay',
    provider_ref: razorpay_order_id,
  });

  const days = getPlanDurationDays(planType) ?? 30;
  const resumeLimit = getPlanQuota(planType) ?? 99;
  const { data: profile } = await supabaseAdmin.from('profiles').select('subscription').eq('id', userId).single();
  const newSubscription = {
    ...(profile?.subscription ?? {}),
    isActive: true,
    planType,
    startDate: Date.now(),
    expiryDate: Date.now() + days * 24 * 60 * 60 * 1000,
    usageCount: 0,
    resumeLimit,
    hasCompletedThreeMonthPlan: planType === '3-month' ? true : profile?.subscription?.hasCompletedThreeMonthPlan,
  };
  await supabaseAdmin.from('profiles').update({ subscription: newSubscription }).eq('id', userId);

  res.status(200).json({ verified: true });
}
