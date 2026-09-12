import type { VercelRequest, VercelResponse } from '@vercel/node';

/**
 * Sends transactional email via Brevo (formerly Sendinblue).
 * Expects POST { to, toName, subject, htmlContent, templateId? }.
 * Requires BREVO_API_KEY and BREVO_SENDER_EMAIL env vars.
 */
export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') {
    res.status(405).json({ error: 'Method not allowed' });
    return;
  }

  const apiKey = process.env.BREVO_API_KEY;
  const senderEmail = process.env.BREVO_SENDER_EMAIL;

  if (!apiKey || !senderEmail) {
    res.status(500).json({ error: 'Brevo is not configured on the server.' });
    return;
  }

  const { to, toName, subject, htmlContent, templateId, params, attachments } = req.body ?? {};

  if (!to || (!subject && !templateId)) {
    res.status(400).json({ error: 'Missing required fields (to, subject/templateId).' });
    return;
  }

  try {
    const payload: Record<string, unknown> = {
      sender: { name: 'ScaleupResume', email: senderEmail },
      to: [{ email: to, name: toName || to }],
    };

    if (templateId) {
      payload.templateId = templateId;
      payload.params = params ?? {};
    } else {
      payload.subject = subject;
      payload.htmlContent = htmlContent;
    }

    // Optional array of { content: base64, name: filename } used for
    // auto-apply emails carrying the generated resume + cover letter.
    if (Array.isArray(attachments) && attachments.length > 0) {
      payload.attachment = attachments.map((a: { base64: string; filename: string }) => ({
        content: a.base64,
        name: a.filename,
      }));
    }

    const brevoRes = await fetch('https://api.brevo.com/v3/smtp/email', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Accept: 'application/json',
        'api-key': apiKey,
      },
      body: JSON.stringify(payload),
    });

    if (!brevoRes.ok) {
      const errText = await brevoRes.text();
      res.status(502).json({ error: `Brevo error: ${errText}` });
      return;
    }

    const data = await brevoRes.json();
    res.status(200).json({ sent: true, messageId: data.messageId });
  } catch (err: any) {
    res.status(500).json({ error: err.message || 'Failed to send email.' });
  }
}
