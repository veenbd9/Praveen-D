import { AnalysisResult, BrainstormResult, CompanyConflictResult, JobMatchResult, MarketTrendAnalysis, User } from '../types';
import { supabase } from './supabaseClient';

export interface ChatSession {
  user: User;
}

interface ChatResponse {
  text: string;
  sources?: { title?: string; uri: string }[];
}

const request = async <T>(action: string, payload: Record<string, unknown>): Promise<T> => {
  const { data } = await supabase.auth.getSession();
  const response = await fetch('/api/gemini', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...(data.session?.access_token ? { Authorization: `Bearer ${data.session.access_token}` } : {}),
    },
    body: JSON.stringify({ action, ...payload }),
  });
  const result = await response.json().catch(() => null);
  if (!response.ok) throw new Error(result?.error || 'AI service request failed.');
  return result as T;
};

export const fetchJdFromUrl = (url: string) => request<string>('fetchJdFromUrl', { url });
export const analyzeAndOptimizeResume = (resume: string, jobDescription: string, metricContext = '') =>
  request<AnalysisResult>('analyzeAndOptimizeResume', { resume, jobDescription, metricContext });
export const analyzeResumeOnly = (resume: string, jobDescription: string) =>
  request<AnalysisResult>('analyzeResumeOnly', { resume, jobDescription });
export const analyzeResumeGeneralHealth = (resume: string) =>
  request<AnalysisResult>('analyzeResumeGeneralHealth', { resume });
export const brainstormResumeContent = (jobTitle: string) =>
  request<BrainstormResult>('brainstormResumeContent', { jobTitle });
export const analyzeMarketTrends = (role: string, location: string) =>
  request<MarketTrendAnalysis>('analyzeMarketTrends', { role, location });
export const applyStructuralFixes = (resume: string, recommendations: string[]) =>
  request<string>('applyStructuralFixes', { resume, recommendations });
export const detectCompanyConflict = (inputCompanyName: string, historyCompanies: string[]) =>
  request<CompanyConflictResult>('detectCompanyConflict', { inputCompanyName, historyCompanies });
export const regenerateCoverLetter = (currentLetter: string, jobDescription: string, instructions: string) =>
  request<string>('regenerateCoverLetter', { currentLetter, jobDescription, instructions });
export const matchJobsToResume = (
  resume: string,
  candidateName: string,
  jobs: { id: string; title: string; company: string; description: string; postedAt: string; recruiterName?: string; recruiterTitle?: string }[]
) => request<{ results: JobMatchResult[] }>('matchJobsToResume', { resume, candidateName, jobs }).then(r => r.results);

export const createSupportChatSession = (user: User): ChatSession => ({ user });

export const sendMessageToChat = (chat: ChatSession, message: string): Promise<ChatResponse> =>
  request<ChatResponse>('supportChat', { user: chat.user, message });
