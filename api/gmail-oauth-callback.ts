import type { VercelRequest, VercelResponse } from '@vercel/node';
import { createClient } from '@supabase/supabase-js';
import { exchangeCodeForTokens, getGoogleEmail, verifyState } from '../lib/googleOAuth.js';

const supabaseAdmin = createClient(process.env.SUPABASE_URL || '', process.env.SUPABASE_SERVICE_ROLE_KEY || '');

const appOrigin = (req: VercelRequest): string => {
  const proto = (req.headers['x-forwarded-proto'] as string) || 'https';
  return `${proto}://${req.headers.host}`;
};

/**
 * Google redirects here after the user approves (or denies) Gmail send
 * access. Exchanges the auth code for tokens, stores the refresh_token
 * (service-role only — never exposed to the browser), then bounces the
 * user back to the app with a ?gmail_connected=1/0 flag.
 */
export default async function handler(req: VercelRequest, res: VercelResponse) {
  const { code, state, error } = req.query as { code?: string; state?: string; error?: string };
  const origin = appOrigin(req);

  if (error || !code || !state) {
    res.redirect(302, `${origin}/?gmail_connected=0`);
    return;
  }

  const userId = verifyState(state);
  if (!userId) {
    res.redirect(302, `${origin}/?gmail_connected=0`);
    return;
  }

  try {
    const tokens = await exchangeCodeForTokens(code);
    if (!tokens.refresh_token) {
      // Happens if the user previously connected and Google didn't re-issue a
      // refresh_token (rare with prompt=consent, but guard anyway) — ask them
      // to disconnect in their Google Account's third-party access settings
      // and reconnect if this occurs repeatedly.
      res.redirect(302, `${origin}/?gmail_connected=0&reason=no_refresh_token`);
      return;
    }
    const email = await getGoogleEmail(tokens.access_token);

    const { error: upsertError } = await supabaseAdmin.from('email_connections').upsert({
      user_id: userId,
      provider: 'google',
      email,
      refresh_token: tokens.refresh_token,
      access_token: tokens.access_token,
      access_token_expires_at: new Date(Date.now() + tokens.expires_in * 1000).toISOString(),
      connected_at: new Date().toISOString(),
    });
    if (upsertError) throw upsertError;

    res.redirect(302, `${origin}/?gmail_connected=1`);
  } catch (err) {
    console.error('Gmail OAuth callback failed', err);
    res.redirect(302, `${origin}/?gmail_connected=0`);
  }
}
