import type { VercelRequest, VercelResponse } from '@vercel/node';
import Stripe from 'stripe';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY as string, {
  apiVersion: '2025-02-24.acacia',
});

/**
 * Creates a Stripe Checkout Session for a subscription plan purchase.
 * Expects POST { planType, price, currency, userEmail, userId }.
 * Returns { url } — redirect the browser to it to complete payment.
 */
export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') {
    res.status(405).json({ error: 'Method not allowed' });
    return;
  }

  const { planType, price, currency, userEmail, userId } = req.body ?? {};

  if (!planType || !price || !currency || !userEmail || !userId) {
    res.status(400).json({ error: 'Missing required fields.' });
    return;
  }

  try {
    const session = await stripe.checkout.sessions.create({
      mode: 'payment',
      payment_method_types: ['card'],
      customer_email: userEmail,
      line_items: [
        {
          price_data: {
            currency: currency.toLowerCase(),
            product_data: { name: `ScaleupResume — ${planType} plan` },
            unit_amount: Math.round(price * 100), // Stripe expects the smallest currency unit
          },
          quantity: 1,
        },
      ],
      metadata: { userId, planType },
      success_url: `${process.env.PUBLIC_SITE_URL}/?payment=success&provider=stripe`,
      cancel_url: `${process.env.PUBLIC_SITE_URL}/?payment=cancelled`,
    });

    res.status(200).json({ url: session.url });
  } catch (err: any) {
    res.status(500).json({ error: err.message || 'Failed to create checkout session.' });
  }
}
