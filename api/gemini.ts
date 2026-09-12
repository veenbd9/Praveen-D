import type { VercelRequest, VercelResponse } from '@vercel/node';
import { createClient } from '@supabase/supabase-js';
import {
  analyzeAndOptimizeResume,
  analyzeMarketTrends,
  analyzeResumeGeneralHealth,
  analyzeResumeOnly,
  applyStructuralFixes,
  brainstormResumeContent,
  createSupportChatSession,
  detectCompanyConflict,
  fetchJdFromUrl,
  matchJobsToResume,
  regenerateCoverLetter,
  sendMessageToChat,
} from '../services/geminiService.js';
import { getPlanQuota } from '../lib/paymentPlans.js';

const supabase = createClient(process.env.SUPABASE_URL || '', process.env.SUPABASE_ANON_KEY || '');
const supabaseAdmin = createClient(process.env.SUPABASE_URL || '', process.env.SUPABASE_SERVICE_ROLE_KEY || '');
const MAX_BODY_BYTES = 250_000;

const getAuthenticatedUser = async (req: VercelRequest) => {
  const authorization = req.headers.authorization;
  if (!authorization?.startsWith('Bearer ')) return null;
  const { data } = await supabase.auth.getUser(authorization.slice('Bearer '.length));
  return data.user ?? null;
};

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') {
    res.status(405).json({ error: 'Method not allowed' });
    return;
  }

  const body = req.body ?? {};
  if (JSON.stringify(body).length > MAX_BODY_BYTES) {
    res.status(413).json({ error: 'Request is too large.' });
    return;
  }

  const authUser = await getAuthenticatedUser(req);
  if (!authUser) {
    res.status(401).json({ error: 'Authentication required.' });
    return;
  }

  const { action } = body;
  try {
    switch (action) {
      case 'fetchJdFromUrl':
        return res.status(200).json(await fetchJdFromUrl(String(body.url || '')));
      case 'analyzeAndOptimizeResume':
      case 'analyzeResumeOnly': {
        const { data: profile, error: profileError } = await supabaseAdmin
          .from('profiles')
          .select('is_admin, subscription')
          .eq('id', authUser.id)
          .single();
        if (profileError) throw profileError;
        const subscription = profile.subscription || {};
        const limit = subscription.planType === 'free' ? 1 : getPlanQuota(subscription.planType) ?? 0;
        if (!profile.is_admin && (!subscription.isActive || subscription.usageCount >= limit)) {
          return res.status(429).json({ error: 'Resume build limit reached. Please purchase a new plan to continue.' });
        }
        const result = action === 'analyzeAndOptimizeResume'
          ? await analyzeAndOptimizeResume(String(body.resume || ''), String(body.jobDescription || ''), String(body.metricContext || ''))
          : await analyzeResumeOnly(String(body.resume || ''), String(body.jobDescription || ''));
        if (!profile.is_admin) {
          const nextSubscription = { ...subscription, usageCount: (subscription.usageCount || 0) + 1 };
          const { error: usageError } = await supabaseAdmin
            .from('profiles')
            .update({ subscription: nextSubscription })
            .eq('id', authUser.id);
          if (usageError) throw usageError;
        }
        return res.status(200).json(result);
      }
      case 'analyzeResumeGeneralHealth':
        return res.status(200).json(await analyzeResumeGeneralHealth(String(body.resume || '')));
      case 'brainstormResumeContent':
        return res.status(200).json(await brainstormResumeContent(String(body.jobTitle || '')));
      case 'analyzeMarketTrends':
        return res.status(200).json(await analyzeMarketTrends(String(body.role || ''), String(body.location || '')));
      case 'applyStructuralFixes':
        return res.status(200).json(await applyStructuralFixes(String(body.resume || ''), Array.isArray(body.recommendations) ? body.recommendations.map(String) : []));
      case 'detectCompanyConflict':
        return res.status(200).json(await detectCompanyConflict(String(body.inputCompanyName || ''), Array.isArray(body.historyCompanies) ? body.historyCompanies.map(String) : []));
      case 'regenerateCoverLetter':
        return res.status(200).json(await regenerateCoverLetter(String(body.currentLetter || ''), String(body.jobDescription || ''), String(body.instructions || '')));
      case 'matchJobsToResume': {
        const resume = String(body.resume || '');
        const candidateName = String(body.candidateName || 'Candidate');
        const jobs = Array.isArray(body.jobs) ? body.jobs.slice(0, 15) : [];
        if (!resume || jobs.length === 0) return res.status(200).json({ results: [] });
        const results = await matchJobsToResume(resume, candidateName, jobs);
        return res.status(200).json({ results });
      }
      case 'supportChat': {
        const chat = createSupportChatSession({
          name: authUser.user_metadata?.name || authUser.email || 'User',
          email: authUser.email || '',
          isAdmin: false,
          countryCode: '+91',
          phoneNumber: '',
          status: 'ACTIVE',
          resumeMismatchCount: 0,
          subscription: { isActive: true, planType: 'free', startDate: 0, expiryDate: 9999999999999, hasCompletedThreeMonthPlan: false, usageCount: 0, resumeLimit: 1, lastUsageReset: 0 },
        });
        return res.status(200).json(await sendMessageToChat(chat, String(body.message || '')));
      }
      default:
        return res.status(400).json({ error: 'Unsupported AI action.' });
    }
  } catch (error) {
    console.error('[Gemini API]', error);
    if (error instanceof Error && error.message.includes('API_KEY_INVALID')) {
      return res.status(503).json({ error: 'Gemini is not configured for this environment. Add a valid GEMINI_API_KEY to the server environment.' });
    }
    return res.status(502).json({ error: 'The AI service is temporarily unavailable.' });
  }
}
