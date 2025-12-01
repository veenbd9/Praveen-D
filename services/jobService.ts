import { JobPosting } from '../types';

/**
 * IMPLEMENTATION NOTE:
 * This service implements the "Green Light" architectural requirements:
 * 1. Aggregators (Adzuna/ZipRecruiter) -> Allowed via Public API
 * 2. ATS Providers (Greenhouse/Lever) -> Allowed via Job Board API
 * 
 * Currently, this returns MOCK data. To go live, you must:
 * 1. Register at developer.adzuna.com to get an APP_ID and APP_KEY.
 * 2. Use the Greenhouse Harvest API or Job Board API for specific companies.
 */

// Simulated delay to mimic network request
const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

export const searchJobs = async (query: string, location: string): Promise<JobPosting[]> => {
    await delay(800);

    // MOCK DATA - Replicating responses from Adzuna & Greenhouse
    const mockJobs: JobPosting[] = [
        {
            id: 'gh_101',
            title: 'Senior Frontend Engineer (React)',
            company: 'TechFlow Solutions',
            location: 'Bangalore, India',
            description: 'We are seeking a Senior Frontend Engineer to lead our React development team. Experience with Redux and TypeScript is required. This role involves direct collaboration with the product team.',
            postedAt: new Date().toISOString(),
            source: 'Greenhouse', // ATS Provider (Green Light)
            applyType: 'email', // Apply by Email fallback (Green Light)
            applyEmail: 'careers@techflow.example.com'
        },
        {
            id: 'adz_202',
            title: 'Full Stack Developer',
            company: 'InnovateX',
            location: 'Remote, India',
            description: 'Join a fast-paced startup building the next generation of fintech tools. Node.js and React expertise preferred.',
            postedAt: new Date(Date.now() - 86400000).toISOString(), // 1 day ago
            source: 'Adzuna', // Aggregator (Green Light)
            applyType: 'redirect', // Redirect Flow (Green Light)
            applyUrl: 'https://adzuna.in/jobs/details/mock-id-202'
        },
        {
            id: 'lev_303',
            title: 'Product Manager',
            company: 'CloudScale Systems',
            location: 'Hyderabad, Telangana',
            description: 'Looking for a PM with 5+ years of experience in SaaS. Must have a strong understanding of Agile methodologies.',
            postedAt: new Date(Date.now() - 172800000).toISOString(), // 2 days ago
            source: 'Lever', // ATS Provider (Green Light)
            applyType: 'redirect',
            applyUrl: 'https://jobs.lever.co/cloudscale/mock-id-303'
        },
        {
            id: 'zip_404',
            title: 'Data Scientist',
            company: 'DataMinds',
            location: 'Mumbai, Maharashtra',
            description: 'Analyze large datasets to derive actionable insights. Python, SQL, and ML experience required.',
            postedAt: new Date(Date.now() - 259200000).toISOString(), // 3 days ago
            source: 'ZipRecruiter', // Aggregator (Green Light)
            applyType: 'redirect',
            applyUrl: 'https://ziprecruiter.com/jobs/mock-id-404'
        }
    ];

    // Simple client-side filtering to mimic API search
    return mockJobs.filter(job => 
        job.title.toLowerCase().includes(query.toLowerCase()) || 
        job.description.toLowerCase().includes(query.toLowerCase()) ||
        job.location.toLowerCase().includes(location.toLowerCase())
    );
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
