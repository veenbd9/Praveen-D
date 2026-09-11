import type { VercelRequest, VercelResponse } from '@vercel/node';

interface AdzunaJob {
  id?: string | number;
  title?: string;
  description?: string;
  redirect_url?: string;
  created?: string;
  company?: { display_name?: string };
  location?: { display_name?: string };
}

const stripHtml = (value: string): string => value.replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim();

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'GET') {
    res.status(405).json({ error: 'Method not allowed' });
    return;
  }

  const appId = process.env.ADZUNA_APP_ID;
  const appKey = process.env.ADZUNA_APP_KEY;
  if (!appId || !appKey) {
    res.status(503).json({ error: 'Job search is not configured yet. Add ADZUNA_APP_ID and ADZUNA_APP_KEY.' });
    return;
  }

  const query = typeof req.query.query === 'string' ? req.query.query.trim() : '';
  const location = typeof req.query.location === 'string' ? req.query.location.trim() : '';
  if (!query && !location) {
    res.status(400).json({ error: 'Enter a job keyword or location.' });
    return;
  }

  const params = new URLSearchParams({
    app_id: appId,
    app_key: appKey,
    results_per_page: '20',
    'content-type': 'application/json',
  });
  if (query) params.set('what', query);
  if (location) params.set('where', location);

  try {
    const response = await fetch(`https://api.adzuna.com/v1/api/jobs/in/search/1?${params.toString()}`);
    if (!response.ok) {
      res.status(502).json({ error: 'The job provider is temporarily unavailable.' });
      return;
    }

    const payload = await response.json() as { results?: AdzunaJob[] };
    const jobs = (payload.results ?? [])
      .filter(job => job.id && job.title && job.redirect_url)
      .map(job => ({
        id: `adzuna_${job.id}`,
        title: job.title!,
        company: job.company?.display_name || 'Company not listed',
        location: job.location?.display_name || location || 'Location not listed',
        description: stripHtml(job.description || 'No description provided.'),
        postedAt: job.created || new Date().toISOString(),
        source: 'Adzuna' as const,
        applyType: 'redirect' as const,
        applyUrl: job.redirect_url!,
      }));

    res.status(200).json({ jobs });
  } catch {
    res.status(502).json({ error: 'Unable to reach the job provider right now.' });
  }
}