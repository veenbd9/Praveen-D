import { JobPosting } from '../types';

interface JobSearchResponse {
    jobs?: JobPosting[];
    error?: string;
}

export const searchJobs = async (query: string, location: string): Promise<JobPosting[]> => {
    const params = new URLSearchParams();
    if (query.trim()) params.set('query', query.trim());
    if (location.trim()) params.set('location', location.trim());

    const response = await fetch(`/api/jobs?${params.toString()}`);
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
