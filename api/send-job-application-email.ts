import type { VercelRequest, VercelResponse } from '@vercel/node';
import { createClient } from '@supabase/supabase-js';
import { buildRawGmailMessage, refreshAccessToken, sendGmailMessage } from '../lib/googleOAuth.js';

const supabase = createClient(process.env.SUPABASE_URL || '', process.env.SUPABASE_ANON_KEY || '');
const supabaseAdmin = createClient(process.env.SUPABASE_URL || '', process.env.SUPABASE_SERVICE_ROLE_KEY || '');

/**
 * Sends a Job Search "Auto Apply" email (tailored resume + cover letter)
 * through the user's own connected Gmail account via the Gmail API, so the
 * hiring manager sees a real, deliverable Gmail sender — not our domain.
 * Expects POST { to, toName, subject, htmlContent, attachments? } with an
 * Authorization: Bearer <supabase access token> header.
 */
export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') {
    res.status(405).json({ error: 'Method not allowed' });
    return;
  }

  const authorization = req.headers.authorization;
  if (!authorization?.startsWith('Bearer ')) {
    res.status(401).json({ error: 'Not authenticated.' });
    return;
  }

  const { to, toName, subject, htmlContent, attachments } = req.body ?? {};
  if (!to || !subject || !htmlContent) {
    res.status(400).json({ error: 'Missing required fields (to, subject, htmlContent).' });
    return;
  }

  try {
    const { data: userData } = await supabase.auth.getUser(authorization.slice('Bearer '.length));
    if (!userData.user) {
      res.status(401).json({ error: 'Not authenticated.' });
      return;
    }

    const { data: connection, error: connError } = await supabaseAdmin
      .from('email_connections')
      .select('email, refresh_token')
      .eq('user_id', userData.user.id)
      .maybeSingle();
    if (connError) throw connError;

    if (!connection) {
      // Distinct status code so the frontend can prompt "Connect Gmail" rather
      // than showing a generic failure.
      res.status(409).json({ error: 'gmail_not_connected' });
      return;
    }

    const { access_token: accessToken } = await refreshAccessToken(connection.refresh_token);

    const fromName = userData.user.user_metadata?.name || connection.email;
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
}
