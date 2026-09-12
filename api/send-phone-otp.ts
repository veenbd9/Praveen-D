import type { VercelRequest, VercelResponse } from '@vercel/node';

// Sends a real SMS OTP to an Indian (or international) mobile number via
// MSG91 so we can verify the signer actually owns the phone number, not just
// that it's not a duplicate (see api/check-phone.ts for the dedup check).
//
// Requires MSG91_AUTH_KEY and MSG91_OTP_TEMPLATE_ID env vars. The template
// must be created (and, for Indian routes, DLT-approved) in the MSG91
// dashboard under OTP -> Templates before this will actually deliver SMS.
// Until both are set, this responds with `{ configured: false }` so the
// client can fall back gracefully instead of blocking signups.
const normalizeMobile = (countryCode: string, phoneNumber: string) =>
  `${countryCode.replace(/\D/g, '')}${phoneNumber.replace(/\D/g, '')}`;

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') {
    res.status(405).json({ error: 'Method not allowed' });
    return;
  }

  const authKey = process.env.MSG91_AUTH_KEY;
  const templateId = process.env.MSG91_OTP_TEMPLATE_ID;

  if (!authKey || !templateId) {
    res.status(200).json({ configured: false });
    return;
  }

  const { countryCode, phoneNumber } = req.body ?? {};
  if (!countryCode || !phoneNumber || typeof countryCode !== 'string' || typeof phoneNumber !== 'string') {
    res.status(400).json({ error: 'countryCode and phoneNumber are required.' });
    return;
  }

  const mobile = normalizeMobile(countryCode, phoneNumber);

  try {
    const url = `https://control.msg91.com/api/v5/otp?template_id=${encodeURIComponent(templateId)}&mobile=${encodeURIComponent(mobile)}&authkey=${encodeURIComponent(authKey)}`;
    const msgRes = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({}),
    });
    const data = await msgRes.json();

    if (data.type !== 'success') {
      res.status(502).json({ error: data.message || 'Failed to send verification code.' });
      return;
    }

    res.status(200).json({ configured: true, sent: true });
  } catch (err: any) {
    res.status(500).json({ error: err.message || 'Failed to send verification code.' });
  }
}
