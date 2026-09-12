import { JobPosting } from '../types';
import { supabase } from './supabaseClient';

interface JobSearchResponse {
    jobs?: JobPosting[];
    error?: string;
}

export interface JobSearchFilters {
    query: string;
    location: string;
    experienceLevel?: string; // 'any' | 'internship' | 'entry level' | 'associate' | 'mid-senior level' | 'director' | 'executive'
    employmentType?: string; // 'any' | 'full time' | 'part time' | 'remote' | 'hybrid' | 'internship'
    datePosted?: string; // 'anyTime' | 'past24Hours' | 'pastWeek' | 'pastMonth'
}

export const searchJobs = async (filters: JobSearchFilters): Promise<JobPosting[]> => {
    const params = new URLSearchParams();
    if (filters.query.trim()) params.set('query', filters.query.trim());
    if (filters.location.trim()) params.set('location', filters.location.trim());
    if (filters.experienceLevel) params.set('experienceLevel', filters.experienceLevel);
    if (filters.employmentType) params.set('employmentType', filters.employmentType);
    if (filters.datePosted) params.set('datePosted', filters.datePosted);

    const { data } = await supabase.auth.getSession();
    const response = await fetch(`/api/jobs?${params.toString()}`, {
        headers: data.session?.access_token ? { Authorization: `Bearer ${data.session.access_token}` } : {},
    });
    const payload = await response.json() as JobSearchResponse;
    if (!response.ok) throw new Error(payload.error || 'Unable to search jobs right now.');
    return payload.jobs ?? [];
};

export const generateMailtoLink = (job: JobPosting, candidateName: string): string => {
    const subject = encodeURIComponent(`Application for ${job.title} - ${candidateName}`);
    const body = encodeURIComponent(`Dear Hiring Team at ${job.company},

I am writing to express my strong interest in the ${job.title} position listed on your careers page.

Please find my optimized resume attached to this email. With my background in the relevant technologies, I am confident I can contribute effectively to your team.

Thank you for your time and consideration.

Sincerely,
${candidateName}`);

    return `mailto:${job.applyEmail}?subject=${subject}&body=${body}`;
};
