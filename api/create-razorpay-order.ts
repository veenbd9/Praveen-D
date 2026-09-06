import type { VercelRequest, VercelResponse } from '@vercel/node';
import Razorpay from 'razorpay';

const razorpay = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID as string,
  key_secret: process.env.RAZORPAY_KEY_SECRET as string,
});

/**
 * Creates a Razorpay order for Indian payment methods (UPI / PhonePe / Google Pay /
 * cards / netbanking — all surfaced automatically by Razorpay Checkout).
 * Expects POST { amount, currency, planType, userId }. Amount is in the major
 * currency unit (e.g. rupees); Razorpay wants paise.
 */
export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') {
    res.status(405).json({ error: 'Method not allowed' });
    return;
  }

  const { amount, currency = 'INR', planType, userId } = req.body ?? {};

  if (!amount || !planType || !userId) {
    res.status(400).json({ error: 'Missing required fields.' });
    return;
  }

  try {
    const order = await razorpay.orders.create({
      amount: Math.round(amount * 100), // paise
      currency,
      receipt: `scaleup_${userId}_${Date.now()}`,
      notes: { userId, planType },
    });

    res.status(200).json({
      orderId: order.id,
      amount: order.amount,
      currency: order.currency,
      keyId: process.env.RAZORPAY_KEY_ID,
    });
  } catch (err: any) {
    res.status(500).json({ error: err.message || 'Failed to create Razorpay order.' });
  }
}
