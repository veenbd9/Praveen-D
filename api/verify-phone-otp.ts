import type { VercelRequest, VercelResponse } from '@vercel/node';

// Verifies a code sent by api/send-phone-otp.ts, via MSG91's OTP verify API.
const normalizeMobile = (countryCode: string, phoneNumber: string) =>
  `${countryCode.replace(/\D/g, '')}${phoneNumber.replace(/\D/g, '')}`;

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') {
    res.status(405).json({ error: 'Method not allowed' });
    return;
  }

  const authKey = process.env.MSG91_AUTH_KEY;
  if (!authKey) {
    res.status(200).json({ configured: false });
    return;
  }

  const { countryCode, phoneNumber, otp } = req.body ?? {};
  if (!countryCode || !phoneNumber || !otp) {
    res.status(400).json({ error: 'countryCode, phoneNumber and otp are required.' });
    return;
  }

  const mobile = normalizeMobile(countryCode, phoneNumber);

  try {
    const url = `https://control.msg91.com/api/v5/otp/verify?otp=${encodeURIComponent(otp)}&mobile=${encodeURIComponent(mobile)}`;
    const msgRes = await fetch(url, { method: 'GET', headers: { authkey: authKey } });
    const data = await msgRes.json();

    if (data.type !== 'success') {
      res.status(200).json({ configured: true, verified: false, error: data.message || 'Incorrect or expired code.' });
      return;
    }

    res.status(200).json({ configured: true, verified: true });
  } catch (err: any) {
    res.status(500).json({ error: err.message || 'Failed to verify code.' });
  }
}
