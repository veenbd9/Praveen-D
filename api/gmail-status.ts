import type { VercelRequest, VercelResponse } from '@vercel/node';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(process.env.SUPABASE_URL || '', process.env.SUPABASE_ANON_KEY || '');
const supabaseAdmin = createClient(process.env.SUPABASE_URL || '', process.env.SUPABASE_SERVICE_ROLE_KEY || '');

/**
 * Returns whether the current user has connected Gmail for Job Search Auto
 * Apply emails, and which address, without ever exposing the stored
 * refresh_token to the browser.
 */
export default async function handler(req: VercelRequest, res: VercelResponse) {
  const authorization = req.headers.authorization;
  if (!authorization?.startsWith('Bearer ')) {
    res.status(401).json({ error: 'Not authenticated.' });
    return;
  }

  try {
    const { data: userData } = await supabase.auth.getUser(authorization.slice('Bearer '.length));
    if (!userData.user) {
      res.status(401).json({ error: 'Not authenticated.' });
      return;
    }

    const { data, error } = await supabaseAdmin
      .from('email_connections')
      .select('email, connected_at')
      .eq('user_id', userData.user.id)
      .maybeSingle();
    if (error) throw error;

    res.status(200).json({ connected: !!data, email: data?.email ?? null, connectedAt: data?.connected_at ?? null });
  } catch (err: any) {
    res.status(500).json({ error: err.message || 'Failed to check Gmail connection status.' });
  }
}
