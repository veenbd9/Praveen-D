import type { VercelRequest, VercelResponse } from '@vercel/node';
import { createClient } from '@supabase/supabase-js';
import {
  buildGoogleAuthUrl,
  buildRawGmailMessage,
  exchangeCodeForTokens,
  getGoogleEmail,
  refreshAccessToken,
  sendGmailMessage,
  verifyState,
} from '../lib/googleOAuth.js';

// Single consolidated endpoint for the "Connect Gmail for Job Applications"
// feature (routed by ?action=), so the whole feature only counts as one
// Vercel Serverless Function instead of five — the Hobby plan caps a
// deployment at 12 functions total. Actions:
//   POST /api/gmail?action=start      -> begin OAuth consent
//   GET  /api/gmail?action=callback   -> Google's OAuth redirect target
//   GET  /api/gmail?action=status     -> is Gmail connected? which address?
//   POST /api/gmail?action=disconnect -> remove the stored connection
//   POST /api/gmail?action=send       -> send an Auto Apply email via Gmail

const supabase = createClient(process.env.SUPABASE_URL || '', process.env.SUPABASE_ANON_KEY || '');
const supabaseAdmin = createClient(process.env.SUPABASE_URL || '', process.env.SUPABASE_SERVICE_ROLE_KEY || '');

const appOrigin = (req: VercelRequest): string => {
  const proto = (req.headers['x-forwarded-proto'] as string) || 'https';
  return `${proto}://${req.headers.host}`;
};

const getAuthedUser = async (req: VercelRequest) => {
  const authorization = req.headers.authorization;
  if (!authorization?.startsWith('Bearer ')) return null;
  const { data } = await supabase.auth.getUser(authorization.slice('Bearer '.length));
  return data.user ?? null;
};

const getAuthedUserId = async (req: VercelRequest): Promise<string | null> => {
  const user = await getAuthedUser(req);
  return user?.id ?? null;
};

const handleStart = async (req: VercelRequest, res: VercelResponse) => {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });
  if (!process.env.GOOGLE_OAUTH_CLIENT_ID || !process.env.GOOGLE_OAUTH_CLIENT_SECRET) {
    return res.status(500).json({ error: 'Gmail connect is not configured on the server yet.' });
  }
  const userId = await getAuthedUserId(req);
  if (!userId) return res.status(401).json({ error: 'Not authenticated.' });

  try {
    res.status(200).json({ url: buildGoogleAuthUrl(userId) });
  } catch (err: any) {
    res.status(500).json({ error: err.message || 'Failed to start Gmail connect.' });
  }
};

const handleCallback = async (req: VercelRequest, res: VercelResponse) => {
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
};

const handleStatus = async (req: VercelRequest, res: VercelResponse) => {
  const userId = await getAuthedUserId(req);
  if (!userId) return res.status(401).json({ error: 'Not authenticated.' });

  try {
    const { data, error } = await supabaseAdmin
      .from('email_connections')
      .select('email, connected_at')
      .eq('user_id', userId)
      .maybeSingle();
    if (error) throw error;

    res.status(200).json({ connected: !!data, email: data?.email ?? null, connectedAt: data?.connected_at ?? null });
  } catch (err: any) {
    res.status(500).json({ error: err.message || 'Failed to check Gmail connection status.' });
  }
};

const handleDisconnect = async (req: VercelRequest, res: VercelResponse) => {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });
  const userId = await getAuthedUserId(req);
  if (!userId) return res.status(401).json({ error: 'Not authenticated.' });

  try {
    const { error } = await supabaseAdmin.from('email_connections').delete().eq('user_id', userId);
    if (error) throw error;
    res.status(200).json({ disconnected: true });
  } catch (err: any) {
    res.status(500).json({ error: err.message || 'Failed to disconnect Gmail.' });
  }
};

const handleSend = async (req: VercelRequest, res: VercelResponse) => {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });
  const user = await getAuthedUser(req);
  if (!user) return res.status(401).json({ error: 'Not authenticated.' });

  const { to, toName, subject, htmlContent, attachments } = req.body ?? {};
  if (!to || !subject || !htmlContent) {
    return res.status(400).json({ error: 'Missing required fields (to, subject, htmlContent).' });
  }

  try {
    const { data: connection, error: connError } = await supabaseAdmin
      .from('email_connections')
      .select('email, refresh_token')
      .eq('user_id', user.id)
      .maybeSingle();
    if (connError) throw connError;

    if (!connection) {
      // Distinct status code so the frontend can prompt "Connect Gmail" rather
      // than showing a generic failure.
      return res.status(409).json({ error: 'gmail_not_connected' });
    }

    const { access_token: accessToken } = await refreshAccessToken(connection.refresh_token);

    const fromName = user.user_metadata?.name || connection.email;
    const raw = buildRawGmailMessage({
      fromEmail: connection.email,
      fromName,
      to,
      toName: toName || to,
      subject,
      htmlBody: htmlContent,
      attachments,
    });

    const result = await sendGmailMessage(accessToken, raw);
    res.status(200).json({ sent: true, messageId: result.id, from: connection.email });
  } catch (err: any) {
    res.status(500).json({ error: err.message || 'Failed to send email via Gmail.' });
  }
};

export default async function handler(req: VercelRequest, res: VercelResponse) {
  const action = (req.query.action as string) || '';
  switch (action) {
    case 'start':
      return handleStart(req, res);
    case 'callback':
      return handleCallback(req, res);
    case 'status':
      return handleStatus(req, res);
    case 'disconnect':
      return handleDisconnect(req, res);
    case 'send':
      return handleSend(req, res);
    default:
      return res.status(400).json({ error: 'Unknown or missing action.' });
  }
}
