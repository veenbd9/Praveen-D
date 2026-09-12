import type { VercelRequest, VercelResponse } from '@vercel/node';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(process.env.SUPABASE_URL || '', process.env.SUPABASE_ANON_KEY || '');
const supabaseAdmin = createClient(process.env.SUPABASE_URL || '', process.env.SUPABASE_SERVICE_ROLE_KEY || '');

/** Disconnects the user's Gmail account from Auto Apply (deletes the stored refresh_token). */
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

  try {
    const { data: userData } = await supabase.auth.getUser(authorization.slice('Bearer '.length));
    if (!userData.user) {
      res.status(401).json({ error: 'Not authenticated.' });
      return;
    }

    const { error } = await supabaseAdmin.from('email_connections').delete().eq('user_id', userData.user.id);
    if (error) throw error;

    res.status(200).json({ disconnected: true });
  } catch (err: any) {
    res.status(500).json({ error: err.message || 'Failed to disconnect Gmail.' });
  }
}
