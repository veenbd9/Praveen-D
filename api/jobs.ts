import type { VercelRequest, VercelResponse } from '@vercel/node';
import { createClient } from '@supabase/supabase-js';

// Vercel (Hobby/Pro) allows raising a function's execution time via this
// export. The Apify LinkedIn scraper run can take 30-90s, well past the
// platform default of 10s.
export const config = { maxDuration: 90 };

const supabase = createClient(process.env.SUPABASE_URL || '', process.env.SUPABASE_ANON_KEY || '');
const supabaseAdmin = createClient(process.env.SUPABASE_URL || '', process.env.SUPABASE_SERVICE_ROLE_KEY || '');

// Apify's free/starter plans carry a small monthly usage credit, and every
// LinkedIn scrape run costs real money, so unauthenticated/unmetered access
// isn't safe to expose. Non-admin users get a small daily quota; admins are
// unlimited. Usage is tracked inside the existing `subscription` JSONB
// column on `profiles` (no schema migration needed).
const FREE_DAILY_JOB_SEARCHES = 3;
const APIFY_ACTOR = 'curious_coder~linkedin-jobs-scraper';
const MAX_RESULTS = 15;

interface AdzunaJob {
  id?: string | number;
  title?: string;
  description?: string;
  redirect_url?: string;
  created?: string;
  company?: { display_name?: string };
  location?: { display_name?: string };
}

interface LinkedInJobItem {
  id?: string | number;
  link?: string;
  title?: string;
  companyName?: string;
  location?: string;
  postedAt?: string;
  descriptionText?: string;
  applyUrl?: string;
  jobPosterName?: string;
  jobPosterTitle?: string;
  jobPosterProfileUrl?: string;
}

const stripHtml = (value: string): string => value.replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim();

const todayKey = () => new Date().toISOString().slice(0, 10); // YYYY-MM-DD

const getAuthenticatedUser = async (req: VercelRequest) => {
  const authorization = req.headers.authorization;
  if (!authorization?.startsWith('Bearer ')) return null;
  const { data } = await supabase.auth.getUser(authorization.slice('Bearer '.length));
  return data.user ?? null;
};

const datePostedFilter = (value: string): 'anyTime' | 'past24Hours' | 'pastWeek' | 'pastMonth' => {
  if (value === 'past24Hours' || value === 'pastWeek' || value === 'pastMonth') return value;
  return 'pastWeek'; // Default: prioritize recently posted roles.
};

const searchLinkedInViaApify = async (opts: {
  query: string;
  location: string;
  experienceLevel: string;
  employmentType: string;
  datePosted: string;
}) => {
  const token = process.env.APIFY_API_TOKEN;
  if (!token) return null;

  // The actor's structured filters cover title/location/date; experience
  // level, employment type, and remote preference are folded into the
  // free-text keywords per the actor's own guidance, since it doesn't expose
  // dedicated fields for them.
  const keywordParts = [opts.query];
  if (opts.experienceLevel && opts.experienceLevel !== 'any') keywordParts.push(opts.experienceLevel);
  if (opts.employmentType && opts.employmentType !== 'any') keywordParts.push(opts.employmentType);
  const keywords = keywordParts.filter(Boolean).join(' ').trim();

  const input = {
    keywords,
    location: opts.location || undefined,
    datePosted: datePostedFilter(opts.datePosted),
    limitPerSource: MAX_RESULTS,
    scrapeCompany: false,
  };

  const response = await fetch(
    `https://api.apify.com/v2/acts/${APIFY_ACTOR}/run-sync-get-dataset-items?token=${encodeURIComponent(token)}&timeout=85`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(input),
    }
  );
  if (!response.ok) return null;

  const items = (await response.json()) as LinkedInJobItem[];
  return items
    .filter(job => job.title && job.companyName)
    .slice(0, MAX_RESULTS)
    .map((job, idx) => ({
      id: `linkedin_${job.id ?? idx}_${Date.now()}`,
      title: job.title!,
      company: job.companyName!,
      location: job.location || opts.location || 'Location not listed',
      description: stripHtml(job.descriptionText || 'No description provided.'),
      postedAt: job.postedAt || new Date().toISOString(),
      source: 'LinkedIn' as const,
      applyType: 'redirect' as const,
      applyUrl: job.applyUrl || job.link,
      recruiterName: job.jobPosterName || undefined,
      recruiterTitle: job.jobPosterTitle || undefined,
      recruiterProfileUrl: job.jobPosterProfileUrl || undefined,
    }));
};

const searchAdzuna = async (query: string, location: string) => {
  const appId = process.env.ADZUNA_APP_ID;
  const appKey = process.env.ADZUNA_APP_KEY;
  if (!appId || !appKey) return null;

  const params = new URLSearchParams({
    app_id: appId,
    app_key: appKey,
    results_per_page: String(MAX_RESULTS),
    'content-type': 'application/json',
  });
  if (query) params.set('what', query);
  if (location) params.set('where', location);

  const response = await fetch(`https://api.adzuna.com/v1/api/jobs/in/search/1?${params.toString()}`);
  if (!response.ok) return null;

  const payload = (await response.json()) as { results?: AdzunaJob[] };
  return (payload.results ?? [])
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
};

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'GET') {
    res.status(405).json({ error: 'Method not allowed' });
    return;
  }

  const authUser = await getAuthenticatedUser(req);
  if (!authUser) {
    res.status(401).json({ error: 'Please sign in to search jobs.' });
    return;
  }

  const query = typeof req.query.query === 'string' ? req.query.query.trim() : '';
  const location = typeof req.query.location === 'string' ? req.query.location.trim() : '';
  const experienceLevel = typeof req.query.experienceLevel === 'string' ? req.query.experienceLevel.trim() : 'any';
  const employmentType = typeof req.query.employmentType === 'string' ? req.query.employmentType.trim() : 'any';
  const datePosted = typeof req.query.datePosted === 'string' ? req.query.datePosted.trim() : 'pastWeek';
  if (!query && !location) {
    res.status(400).json({ error: 'Enter a job keyword or location.' });
    return;
  }

  try {
    const { data: profile, error: profileError } = await supabaseAdmin
      .from('profiles')
      .select('is_admin, subscription')
      .eq('id', authUser.id)
      .single();
    if (profileError) throw profileError;

    const subscription = profile.subscription || {};
    if (!profile.is_admin) {
      const today = todayKey();
      const usedToday = subscription.jobSearchDate === today ? (subscription.jobSearchCount || 0) : 0;
      if (usedToday >= FREE_DAILY_JOB_SEARCHES) {
        res.status(429).json({ error: `You've reached today's limit of ${FREE_DAILY_JOB_SEARCHES} job searches. Please try again tomorrow.` });
        return;
      }
      const { error: usageError } = await supabaseAdmin
        .from('profiles')
        .update({ subscription: { ...subscription, jobSearchDate: today, jobSearchCount: usedToday + 1 } })
        .eq('id', authUser.id);
      if (usageError) throw usageError;
    }

    const [linkedInJobs, adzunaJobs] = await Promise.all([
      searchLinkedInViaApify({ query, location, experienceLevel, employmentType, datePosted }).catch(() => null),
      searchAdzuna(query, location).catch(() => null),
    ]);

    if (linkedInJobs === null && adzunaJobs === null) {
      res.status(503).json({ error: 'Job search is not configured yet. Add APIFY_API_TOKEN (and/or ADZUNA_APP_ID/ADZUNA_APP_KEY).' });
      return;
    }

    const jobs = [...(linkedInJobs || []), ...(adzunaJobs || [])];
    res.status(200).json({ jobs });
  } catch {
    res.status(502).json({ error: 'Unable to reach the job provider right now.' });
  }
}
