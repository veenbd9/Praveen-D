import { createClient } from '@supabase/supabase-js';

// These are populated at build time by Vite from .env.local (see vite.config.ts)
// and are safe to expose to the browser — Supabase's "anon" key is designed for
// client-side use and is protected by Row Level Security (RLS) policies on the DB.
const SUPABASE_URL = process.env.SUPABASE_URL as string;
const SUPABASE_ANON_KEY = process.env.SUPABASE_ANON_KEY as string;

if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
  // Do not throw at import-time (breaks the whole bundle in dev before .env.local
  // is configured); log a clear warning instead so the app still boots.
  // eslint-disable-next-line no-console
  console.warn(
    '[Supabase] SUPABASE_URL / SUPABASE_ANON_KEY are not set. ' +
      'Add them to .env.local — see README for setup instructions.'
  );
}

export const supabase = createClient(SUPABASE_URL || '', SUPABASE_ANON_KEY || '');
