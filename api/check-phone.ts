import type { VercelRequest, VercelResponse } from '@vercel/node';
import { createClient } from '@supabase/supabase-js';

// Uses the service-role key so it can look across all profiles (RLS on
// `profiles` normally restricts reads to the owner's own row). This endpoint
// is intentionally public/unauthenticated since it must run *before* a user
// has an account -- it only ever returns a boolean, never any profile data.
const supabaseAdmin = createClient(process.env.SUPABASE_URL || '', process.env.SUPABASE_SERVICE_ROLE_KEY || '');

const normalizePhone = (countryCode: string, phoneNumber: string) =>
  `${countryCode.trim()}${phoneNumber.replace(/\D/g, '')}`;

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') {
    res.status(405).json({ error: 'Method not allowed' });
    return;
  }

  const { countryCode, phoneNumber } = req.body ?? {};
  if (!countryCode || !phoneNumber || typeof countryCode !== 'string' || typeof phoneNumber !== 'string') {
    res.status(400).json({ error: 'countryCode and phoneNumber are required.' });
    return;
  }

  try {
    // Compare on a normalized (country code + digits-only) basis so formatting
    // differences (spaces, dashes) can't be used to slip past the check.
    const normalizedTarget = normalizePhone(countryCode, phoneNumber);
    const { data, error } = await supabaseAdmin
      .from('profiles')
      .select('country_code, phone_number')
      .eq('phone_number', phoneNumber.trim());
    if (error) throw error;

    const isDuplicate = (data || []).some(
      (row) => normalizePhone(row.country_code || '', row.phone_number || '') === normalizedTarget
    );

    res.status(200).json({ isDuplicate });
  } catch (error: any) {
    res.status(500).json({ error: 'Could not verify phone number right now. Please try again.' });
  }
}
