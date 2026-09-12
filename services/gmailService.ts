import { supabase } from './supabaseClient';

// Client for the "Connect Gmail for Job Applications" feature: users
// authorize ScaleupResume to send Auto Apply emails through their own Gmail
// account (see api/gmail.ts, routed by ?action= to keep the feature as a
// single Vercel Serverless Function).

const getAccessToken = async (): Promise<string> => {
  const { data } = await supabase.auth.getSession();
  const token = data.session?.access_token;
  if (!token) throw new Error('You must be signed in.');
  return token;
};

export interface GmailStatus {
  connected: boolean;
  email: string | null;
  connectedAt: string | null;
}

export const getGmailStatus = async (): Promise<GmailStatus> => {
  const token = await getAccessToken();
  const res = await fetch('/api/gmail?action=status', { headers: { Authorization: `Bearer ${token}` } });
  if (!res.ok) throw new Error('Failed to check Gmail connection status.');
  return res.json();
};

// Kicks off the Google consent screen. Navigates the whole page (rather than
// a popup) so the OAuth redirect flow works reliably across browsers.
export const startGmailConnect = async (): Promise<void> => {
  const token = await getAccessToken();
  const res = await fetch('/api/gmail?action=start', {
    method: 'POST',
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!res.ok) {
    const body = await res.json().catch(() => null);
    throw new Error(body?.error || 'Failed to start Gmail connect.');
  }
  const { url } = await res.json();
  window.location.href = url;
};

export const disconnectGmail = async (): Promise<void> => {
  const token = await getAccessToken();
  const res = await fetch('/api/gmail?action=disconnect', {
    method: 'POST',
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!res.ok) throw new Error('Failed to disconnect Gmail.');
};

// Thrown when the user hasn't connected Gmail yet, so callers can prompt them
// to do so instead of treating it as a generic failure.
export class GmailNotConnectedError extends Error {
  constructor() {
    super('gmail_not_connected');
    this.name = 'GmailNotConnectedError';
  }
}

export const sendJobApplicationEmail = async (
  to: string,
  toName: string,
  subject: string,
  htmlContent: string,
  attachments?: { base64: string; filename: string }[]
): Promise<{ sent: true; messageId: string; from: string }> => {
  const token = await getAccessToken();
  const res = await fetch('/api/gmail?action=send', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
    body: JSON.stringify({ to, toName, subject, htmlContent, attachments }),
  });
  if (res.status === 409) throw new GmailNotConnectedError();
  if (!res.ok) {
    const body = await res.json().catch(() => null);
    throw new Error(body?.error || 'Failed to send email via Gmail.');
  }
  return res.json();
};
