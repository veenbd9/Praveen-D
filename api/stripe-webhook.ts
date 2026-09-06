import type { VercelRequest, VercelResponse } from '@vercel/node';
import Stripe from 'stripe';
import { createClient } from '@supabase/supabase-js';

// Vercel needs the raw request body to verify the Stripe signature, so this
// route disables the default JSON body parser.
export const config = { api: { bodyParser: false } };

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY as string, {
  apiVersion: '2025-02-24.acacia',
});

// Uses the service_role key (server-side only!) to bypass RLS and record payments.
const supabaseAdmin = createClient(
  process.env.SUPABASE_URL as string,
  process.env.SUPABASE_SERVICE_ROLE_KEY as string
);

const buffer = (req: VercelRequest): Promise<Buffer> =>
  new Promise((resolve, reject) => {
    const chunks: Buffer[] = [];
    req.on('data', (chunk) => chunks.push(chunk));
    req.on('end', () => resolve(Buffer.concat(chunks)));
    req.on('error', reject);
  });

const planDurationDays: Record<string, number> = {
  '1-month': 30,
  '3-month': 90,
  '6-month': 180,
  renewal: 30,
};

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') {
    res.status(405).json({ error: 'Method not allowed' });
    return;
  }

  const sig = req.headers['stripe-signature'] as string;
  let event: Stripe.Event;

  try {
    const rawBody = await buffer(req);
    event = stripe.webhooks.constructEvent(rawBody, sig, process.env.STRIPE_WEBHOOK_SECRET as string);
  } catch (err: any) {
    res.status(400).send(`Webhook signature verification failed: ${err.message}`);
    return;
  }

  if (event.type === 'checkout.session.completed') {
    const session = event.data.object as Stripe.Checkout.Session;
    const userId = session.metadata?.userId;
    const planType = session.metadata?.planType;
    const amount = (session.amount_total ?? 0) / 100;
    const currency = (session.currency ?? 'usd').toUpperCase();

    if (userId && planType) {
      await supabaseAdmin.from('transactions').insert({
        id: session.id,
        user_id: userId,
        amount,
        currency,
        type: 'CREDIT',
        description: `Subscription Payment: ${planType}`,
        method: 'CARD',
        status: 'SUCCESS',
        provider: 'stripe',
        provider_ref: session.payment_intent as string,
      });

      const days = planDurationDays[planType] ?? 30;
      const { data: profile } = await supabaseAdmin.from('profiles').select('subscription').eq('id', userId).single();
      const newSubscription = {
        ...(profile?.subscription ?? {}),
        isActive: true,
        planType,
        startDate: Date.now(),
        expiryDate: Date.now() + days * 24 * 60 * 60 * 1000,
        hasCompletedThreeMonthPlan: planType === '3-month' ? true : profile?.subscription?.hasCompletedThreeMonthPlan,
      };
      await supabaseAdmin.from('profiles').update({ subscription: newSubscription }).eq('id', userId);
    }
  }

  res.status(200).json({ received: true });
}
