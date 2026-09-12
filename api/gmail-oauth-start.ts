import type { VercelRequest, VercelResponse } from '@vercel/node';
import { createClient } from '@supabase/supabase-js';
import { buildGoogleAuthUrl } from '../lib/googleOAuth.js';

const supabase = createClient(process.env.SUPABASE_URL || '', process.env.SUPABASE_ANON_KEY || '');

/**
 * Starts the "Connect Gmail for Job Applications" OAuth flow. The frontend
 * calls this with the user's Supabase access token, then navigates the
 * browser to the returned Google consent URL.
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

  if (!process.env.GOOGLE_OAUTH_CLIENT_ID || !process.env.GOOGLE_OAUTH_CLIENT_SECRET) {
    res.status(500).json({ error: 'Gmail connect is not configured on the server yet.' });
    return;
  }

  try {
    const { data } = await supabase.auth.getUser(authorization.slice('Bearer '.length));
    if (!data.user) {
      res.status(401).json({ error: 'Not authenticated.' });
      return;
    }
    res.status(200).json({ url: buildGoogleAuthUrl(data.user.id) });
  } catch (err: any) {
    res.status(500).json({ error: err.message || 'Failed to start Gmail connect.' });
  }
}
