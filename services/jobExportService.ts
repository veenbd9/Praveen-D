// Auto-exports Job Search results as an .xlsx file using SheetJS, which is
// already loaded globally via index.html (see the `xlsx.full.min.js` CDN
// script tag) — no extra dependency needed.
declare const XLSX: any;
import { JobPosting } from '../types';

// Row cap enforced across the Job Search results list, its Excel export,
// and the Tracker board so none of them grow unbounded.
export const MAX_JOB_ROWS = 30;

export const exportJobsToExcel = (jobs: JobPosting[], searchLabel: string): string => {
    const rows = jobs.slice(0, MAX_JOB_ROWS).map(j => ({
        Company: j.company,
        'Job Title': j.title,
        Location: j.location,
        'Date Posted': new Date(j.postedAt).toLocaleDateString(),
        Source: j.source,
        'Match Score (%)': j.matchScore !== undefined ? Math.round(j.matchScore) : '',
        'Match Summary': j.matchSummary ?? '',
        'Hiring Manager / Recruiter': j.recruiterName ?? '',
        'Recruiter Title': j.recruiterTitle ?? '',
        'Recruiter LinkedIn': j.recruiterProfileUrl ?? '',
        'Apply Type': j.applyType === 'email' ? 'Direct Email' : 'Company Website',
        'Apply Email': j.applyEmail ?? '',
        'Apply Link': j.applyUrl ?? '',
    }));

    const worksheet = XLSX.utils.json_to_sheet(rows);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Job Search');

    const safeLabel = (searchLabel || 'JobSearch').replace(/[^a-zA-Z0-9]/g, '_');
    const filename = `ScaleupResume_Jobs_${safeLabel}_${new Date().toISOString().slice(0, 10)}.xlsx`;
    XLSX.writeFile(workbook, filename);
    return filename;
};
