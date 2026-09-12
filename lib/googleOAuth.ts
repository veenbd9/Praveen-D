import crypto from 'crypto';

// Shared helpers for the "Connect Gmail" flow used by the Job Search Auto
// Apply feature: users authorize ScaleupResume (via Google OAuth, scope
// gmail.send) to send application emails through their *own* Gmail account,
// so hiring managers see a real, deliverable Gmail sender instead of our
// domain. Requires GOOGLE_OAUTH_CLIENT_ID/SECRET/REDIRECT_URI env vars.

const GOOGLE_AUTH_URL = 'https://accounts.google.com/o/oauth2/v2/auth';
const GOOGLE_TOKEN_URL = 'https://oauth2.googleapis.com/token';
const GMAIL_SEND_SCOPE = 'https://www.googleapis.com/auth/gmail.send';
const STATE_TTL_MS = 10 * 60 * 1000; // 10 minutes to complete the consent screen

export const getRedirectUri = (): string =>
  process.env.GOOGLE_OAUTH_REDIRECT_URI || 'http://localhost:3000/api/gmail?action=callback';

// The OAuth "state" param round-trips through Google unmodified, so we use it
// to carry (and authenticate) which ScaleupResume user initiated the consent
// flow. It's signed with the Supabase service-role key (server-only secret)
// so it can't be forged into connecting Gmail to someone else's account.
export const signState = (userId: string): string => {
  const payload = JSON.stringify({ uid: userId, ts: Date.now() });
  const payloadB64 = Buffer.from(payload).toString('base64url');
  const signature = crypto
    .createHmac('sha256', process.env.SUPABASE_SERVICE_ROLE_KEY || '')
    .update(payloadB64)
    .digest('base64url');
  return `${payloadB64}.${signature}`;
};

export const verifyState = (state: string): string | null => {
  try {
    const [payloadB64, signature] = state.split('.');
    if (!payloadB64 || !signature) return null;
    const expectedSignature = crypto
      .createHmac('sha256', process.env.SUPABASE_SERVICE_ROLE_KEY || '')
      .update(payloadB64)
      .digest('base64url');
    if (!crypto.timingSafeEqual(Buffer.from(signature), Buffer.from(expectedSignature))) return null;
    const { uid, ts } = JSON.parse(Buffer.from(payloadB64, 'base64url').toString('utf8'));
    if (!uid || typeof ts !== 'number' || Date.now() - ts > STATE_TTL_MS) return null;
    return uid as string;
  } catch {
    return null;
  }
};

export const buildGoogleAuthUrl = (userId: string): string => {
  const params = new URLSearchParams({
    client_id: process.env.GOOGLE_OAUTH_CLIENT_ID || '',
    redirect_uri: getRedirectUri(),
    response_type: 'code',
    scope: `${GMAIL_SEND_SCOPE} https://www.googleapis.com/auth/userinfo.email`,
    access_type: 'offline', // required to receive a refresh_token
    prompt: 'consent', // force a refresh_token even on repeat connections
    state: signState(userId),
  });
  return `${GOOGLE_AUTH_URL}?${params.toString()}`;
};

export const exchangeCodeForTokens = async (code: string) => {
  const res = await fetch(GOOGLE_TOKEN_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      code,
      client_id: process.env.GOOGLE_OAUTH_CLIENT_ID || '',
      client_secret: process.env.GOOGLE_OAUTH_CLIENT_SECRET || '',
      redirect_uri: getRedirectUri(),
      grant_type: 'authorization_code',
    }),
  });
  if (!res.ok) throw new Error(`Google token exchange failed: ${await res.text()}`);
  return res.json() as Promise<{ access_token: string; refresh_token?: string; expires_in: number; scope: string }>;
};

export const refreshAccessToken = async (refreshToken: string) => {
  const res = await fetch(GOOGLE_TOKEN_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      refresh_token: refreshToken,
      client_id: process.env.GOOGLE_OAUTH_CLIENT_ID || '',
      client_secret: process.env.GOOGLE_OAUTH_CLIENT_SECRET || '',
      grant_type: 'refresh_token',
    }),
  });
  if (!res.ok) throw new Error(`Google token refresh failed: ${await res.text()}`);
  return res.json() as Promise<{ access_token: string; expires_in: number }>;
};

export const getGoogleEmail = async (accessToken: string): Promise<string> => {
  const res = await fetch('https://www.googleapis.com/oauth2/v2/userinfo', {
    headers: { Authorization: `Bearer ${accessToken}` },
  });
  if (!res.ok) throw new Error(`Failed to fetch Google profile: ${await res.text()}`);
  const data = await res.json();
  return data.email;
};

const encodeSubject = (subject: string): string =>
  /^[\x00-\x7F]*$/.test(subject) ? subject : `=?UTF-8?B?${Buffer.from(subject).toString('base64')}?=`;

interface EmailAttachment {
  base64: string;
  filename: string;
  mimeType?: string;
}

// Hand-rolls an RFC 2822 multipart/mixed MIME message (HTML body + PDF
// attachments) and base64url-encodes it, as required by Gmail API's
// users.messages.send `raw` field.
export const buildRawGmailMessage = (opts: {
  fromEmail: string;
  fromName: string;
  to: string;
  toName: string;
  subject: string;
  htmlBody: string;
  attachments?: EmailAttachment[];
}): string => {
  const boundary = `scaleupresume_${crypto.randomBytes(12).toString('hex')}`;
  const lines: string[] = [
    `From: "${opts.fromName.replace(/"/g, '')}" <${opts.fromEmail}>`,
    `To: "${opts.toName.replace(/"/g, '')}" <${opts.to}>`,
    `Subject: ${encodeSubject(opts.subject)}`,
    'MIME-Version: 1.0',
    `Content-Type: multipart/mixed; boundary="${boundary}"`,
    '',
    `--${boundary}`,
    'Content-Type: text/html; charset="UTF-8"',
    'Content-Transfer-Encoding: 7bit',
    '',
    opts.htmlBody,
    '',
  ];
  for (const att of opts.attachments || []) {
    lines.push(
      `--${boundary}`,
      `Content-Type: ${att.mimeType || 'application/pdf'}; name="${att.filename}"`,
      `Content-Disposition: attachment; filename="${att.filename}"`,
      'Content-Transfer-Encoding: base64',
      '',
      att.base64,
      ''
    );
  }
  lines.push(`--${boundary}--`);
  return Buffer.from(lines.join('\r\n')).toString('base64url');
};

export const sendGmailMessage = async (accessToken: string, raw: string) => {
  const res = await fetch('https://gmail.googleapis.com/gmail/v1/users/me/messages/send', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ raw }),
  });
  if (!res.ok) throw new Error(`Gmail send failed: ${await res.text()}`);
  return res.json() as Promise<{ id: string; threadId: string }>;
};
