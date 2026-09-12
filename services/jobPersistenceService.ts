// Retention & persistence rules for the Job Search feature:
//  - The current search result list survives tab switches and page
//    reloads for as long as the user stays logged in; it's cleared on
//    logout (see clearSearchState, called from Auth.tsx's handleLogout).
//  - Every populated result list is auto-exported to an .xlsx file. We keep
//    an internal log of each export so we can tell whether the user acted
//    on it (tracked/applied to a job from that batch). If 3 business days
//    pass with no action, we drop our internal reference to it — note we
//    cannot reach into the user's downloads folder to delete the file
//    itself; browsers intentionally don't allow that.
//  - No more than MAX_JOB_ROWS (30) rows are kept in memory/storage at once.
import { JobPosting } from '../types';
import { MAX_JOB_ROWS } from './jobExportService';

const RESULTS_PREFIX = 'scaleupresume_job_search_results_';
const EXPORT_LOG_PREFIX = 'scaleupresume_job_export_log_';
const BUSINESS_DAY_SHELF_LIFE = 3;

export interface StoredSearchState {
    query: string;
    location: string;
    experienceLevel: string;
    employmentType: string;
    datePosted: string;
    jobs: JobPosting[];
    hasSearched: boolean;
    savedAt: number;
}

interface ExportLogEntry {
    id: string;
    generatedAt: number;
    jobIds: string[];
    filename: string;
}

export const saveSearchState = (email: string, state: StoredSearchState): void => {
    try {
        const capped = { ...state, jobs: state.jobs.slice(0, MAX_JOB_ROWS) };
        localStorage.setItem(RESULTS_PREFIX + email, JSON.stringify(capped));
    } catch {
        // Storage can fail (quota, private mode); non-fatal for the search UI.
    }
};

export const loadSearchState = (email: string): StoredSearchState | null => {
    try {
        const raw = localStorage.getItem(RESULTS_PREFIX + email);
        return raw ? (JSON.parse(raw) as StoredSearchState) : null;
    } catch {
        return null;
    }
};

// Called on logout so the next login starts with a clean Job Search tab.
export const clearSearchState = (email: string): void => {
    try {
        localStorage.removeItem(RESULTS_PREFIX + email);
        localStorage.removeItem(EXPORT_LOG_PREFIX + email);
    } catch {
        // Ignore.
    }
};

const addBusinessDays = (fromMs: number, days: number): number => {
    const date = new Date(fromMs);
    let added = 0;
    while (added < days) {
        date.setDate(date.getDate() + 1);
        const day = date.getDay();
        if (day !== 0 && day !== 6) added++;
    }
    return date.getTime();
};

export const recordExport = (email: string, jobIds: string[], filename: string): void => {
    try {
        const raw = localStorage.getItem(EXPORT_LOG_PREFIX + email);
        const log: ExportLogEntry[] = raw ? JSON.parse(raw) : [];
        log.push({ id: `EXP_${Date.now()}`, generatedAt: Date.now(), jobIds, filename });
        localStorage.setItem(EXPORT_LOG_PREFIX + email, JSON.stringify(log));
    } catch {
        // Ignore.
    }
};

// Drops our internal record of any export whose 3-business-day shelf life
// has passed with no job from that batch having been tracked/applied to.
export const pruneExpiredExports = (email: string, actedOnJobIds: Set<string>): void => {
    try {
        const raw = localStorage.getItem(EXPORT_LOG_PREFIX + email);
        if (!raw) return;
        const log: ExportLogEntry[] = JSON.parse(raw);
        const now = Date.now();
        const kept = log.filter(entry => {
            const expiresAt = addBusinessDays(entry.generatedAt, BUSINESS_DAY_SHELF_LIFE);
            const wasActedOn = entry.jobIds.some(id => actedOnJobIds.has(id));
            return wasActedOn || now < expiresAt;
        });
        localStorage.setItem(EXPORT_LOG_PREFIX + email, JSON.stringify(kept));
    } catch {
        // Ignore.
    }
};
