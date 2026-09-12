import React, { useState } from 'react';
import { JobPosting } from '../types';
import { searchJobs, generateMailtoLink, JobSearchFilters } from '../services/jobService';
import { matchJobsToResume } from '../services/geminiClient';

interface JobSearchSectionProps {
    candidateName: string;
    resumeText: string;
    onTrackJob?: (job: JobPosting) => void;
    onApplyToJob: (job: JobPosting) => void;
}

const EXPERIENCE_LEVELS = [
    { value: 'any', label: 'Any Experience' },
    { value: 'internship', label: 'Internship' },
    { value: 'entry level', label: 'Entry Level' },
    { value: 'associate', label: 'Associate' },
    { value: 'mid-senior level', label: 'Mid-Senior Level' },
    { value: 'director', label: 'Director' },
    { value: 'executive', label: 'Executive' },
];

const EMPLOYMENT_TYPES = [
    { value: 'any', label: 'Any Type' },
    { value: 'full time', label: 'Full Time' },
    { value: 'part time', label: 'Part Time' },
    { value: 'remote', label: 'Remote' },
    { value: 'hybrid', label: 'Hybrid' },
    { value: 'internship', label: 'Internship' },
];

const DATE_POSTED_OPTIONS = [
    { value: 'pastWeek', label: 'Past 7 Days' },
    { value: 'past24Hours', label: 'Past 24 Hours' },
    { value: 'pastMonth', label: 'Past Month' },
    { value: 'anyTime', label: 'Any Time' },
];

export const JobSearchSection: React.FC<JobSearchSectionProps> = ({ candidateName, resumeText, onTrackJob, onApplyToJob }) => {
    const [query, setQuery] = useState('');
    const [location, setLocation] = useState('');
    const [experienceLevel, setExperienceLevel] = useState('any');
    const [employmentType, setEmploymentType] = useState('any');
    const [datePosted, setDatePosted] = useState('pastWeek');
    const [jobs, setJobs] = useState<JobPosting[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [isMatching, setIsMatching] = useState(false);
    const [hasSearched, setHasSearched] = useState(false);
    const [searchError, setSearchError] = useState<string | null>(null);
    const [trackedJobs, setTrackedJobs] = useState<Set<string>>(new Set());
    const [copiedJobId, setCopiedJobId] = useState<string | null>(null);
    const [expandedJobId, setExpandedJobId] = useState<string | null>(null);

    const runMatching = async (results: JobPosting[]) => {
        if (!resumeText.trim() || results.length === 0) return;
        setIsMatching(true);
        try {
            const matches = await matchJobsToResume(
                resumeText,
                candidateName,
                results.map(j => ({ id: j.id, title: j.title, company: j.company, description: j.description, postedAt: j.postedAt, recruiterName: j.recruiterName, recruiterTitle: j.recruiterTitle }))
            );
            const byId = new Map(matches.map(m => [m.id, m]));
            setJobs(prev => prev.map(job => {
                const m = byId.get(job.id);
                return m ? { ...job, matchScore: m.matchScore, matchSummary: m.matchSummary, outreachMessage: m.outreachMessage } : job;
            }));
        } catch {
            // Non-fatal: jobs still display without a match score.
        } finally {
            setIsMatching(false);
        }
    };

    const handleSearch = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!query && !location) return;

        setIsLoading(true);
        setHasSearched(true);
        setSearchError(null);
        setExpandedJobId(null);
        try {
            const filters: JobSearchFilters = { query, location, experienceLevel, employmentType, datePosted };
            const results = await searchJobs(filters);
            setJobs(results);
            runMatching(results);
        } catch (error) {
            setJobs([]);
            setSearchError(error instanceof Error ? error.message : 'Unable to search jobs right now.');
        } finally {
            setIsLoading(false);
        }
    };

    const sortedJobs = [...jobs].sort((a, b) => {
        const scoreDiff = (b.matchScore ?? -1) - (a.matchScore ?? -1);
        if (scoreDiff !== 0) return scoreDiff;
        return new Date(b.postedAt).getTime() - new Date(a.postedAt).getTime();
    });

    const handleApply = (job: JobPosting) => {
        // Kick off the ATS Optimizer with this job's description pre-loaded so
        // the user can generate a tailored resume + cover letter for it.
        onApplyToJob(job);
    };

    const handleEmailApply = (job: JobPosting) => {
        const mailto = generateMailtoLink(job, candidateName);
        window.location.href = mailto;
    };

    const handleTrack = (job: JobPosting) => {
        if (onTrackJob) {
            onTrackJob(job);
            setTrackedJobs(prev => new Set(prev).add(job.id));
        }
    };

    const handleCopyOutreach = (job: JobPosting) => {
        if (!job.outreachMessage) return;
        navigator.clipboard?.writeText(job.outreachMessage).then(() => {
            setCopiedJobId(job.id);
            setTimeout(() => setCopiedJobId(null), 2000);
        });
    };

    const scoreColor = (score?: number) => {
        if (score === undefined) return 'text-slate-500 border-slate-700 bg-slate-800/60';
        if (score >= 80) return 'text-emerald-300 border-emerald-700 bg-emerald-900/40';
        if (score >= 60) return 'text-amber-300 border-amber-700 bg-amber-900/40';
        return 'text-red-300 border-red-700 bg-red-900/40';
    };

    return (
        <div className="bg-slate-800/50 p-6 rounded-lg shadow-lg min-h-[500px] animate-fade-in">
            <div className="text-center mb-8">
                <h2 className="text-2xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 to-cyan-400 mb-2">
                    Find Jobs & Apply
                </h2>
                <p className="text-slate-400 text-sm">
                    Search live LinkedIn listings, surface the hiring contact, and get a ranked match score against your resume.
                </p>
                {!resumeText.trim() && (
                    <p className="text-amber-300 text-xs mt-2">Tip: Run a Health Check or paste your resume in the Optimizer first so we can score and rank these jobs for you.</p>
                )}
            </div>

            {/* Search Form */}
            <form onSubmit={handleSearch} className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-3 mb-6 max-w-6xl mx-auto">
                <input
                    type="text"
                    placeholder="Job Title, Skills, or Keywords"
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    className="bg-slate-900 border border-slate-700 rounded-md p-3 text-slate-200 focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 w-full lg:col-span-1"
                />
                <input
                    type="text"
                    placeholder="Location (e.g., Bangalore, Remote)"
                    value={location}
                    onChange={(e) => setLocation(e.target.value)}
                    className="bg-slate-900 border border-slate-700 rounded-md p-3 text-slate-200 focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 w-full"
                />
                <select value={experienceLevel} onChange={(e) => setExperienceLevel(e.target.value)} className="bg-slate-900 border border-slate-700 rounded-md p-3 text-slate-200 focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 w-full">
                    {EXPERIENCE_LEVELS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
                </select>
                <select value={employmentType} onChange={(e) => setEmploymentType(e.target.value)} className="bg-slate-900 border border-slate-700 rounded-md p-3 text-slate-200 focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 w-full">
                    {EMPLOYMENT_TYPES.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
                </select>
                <div className="flex gap-2">
                    <select value={datePosted} onChange={(e) => setDatePosted(e.target.value)} className="bg-slate-900 border border-slate-700 rounded-md p-3 text-slate-200 focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 w-full">
                        {DATE_POSTED_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
                    </select>
                </div>
                <button
                    type="submit"
                    disabled={isLoading}
                    className="lg:col-span-5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-3 px-6 rounded-md transition-colors flex items-center justify-center"
                >
                    {isLoading ? (
                        <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>
                    ) : 'Search Jobs'}
                </button>
            </form>

            {isMatching && (
                <p className="text-center text-sm text-emerald-300 mb-4 animate-pulse">Scoring jobs against your resume…</p>
            )}

            {/* Results */}
            <div className="max-w-6xl mx-auto">
                {searchError && (
                    <div className="text-center py-8 px-4 bg-amber-950/30 border border-amber-800/60 rounded-lg text-amber-200">
                        <p>{searchError}</p>
                        <p className="text-sm text-amber-300/70 mt-2">Try again after the job search service has been configured.</p>
                    </div>
                )}

                {sortedJobs.length > 0 && (
                    <div className="overflow-x-auto rounded-lg border border-slate-700">
                        <table className="w-full text-sm text-left">
                            <thead className="bg-slate-900 text-slate-400 uppercase text-xs">
                                <tr>
                                    <th className="p-3">Company</th>
                                    <th className="p-3">Job Title</th>
                                    <th className="p-3">Match</th>
                                    <th className="p-3">Recruiter</th>
                                    <th className="p-3">Outreach Message</th>
                                    <th className="p-3">Apply</th>
                                </tr>
                            </thead>
                            <tbody>
                                {sortedJobs.map(job => (
                                    <tr key={job.id} className="border-t border-slate-800 hover:bg-slate-900/60 align-top">
                                        <td className="p-3 font-semibold text-slate-200 min-w-[140px]">
                                            {job.company}
                                            <div className="text-xs text-slate-500 font-normal mt-1">{job.location}</div>
                                            <div className="text-xs text-slate-600 font-normal">{new Date(job.postedAt).toLocaleDateString()}</div>
                                        </td>
                                        <td className="p-3 text-slate-300 min-w-[160px]">
                                            {job.title}
                                            <div className="mt-1">
                                                <span className={`text-[10px] font-bold px-2 py-0.5 rounded uppercase tracking-wide border ${job.source === 'LinkedIn' ? 'bg-blue-900/30 text-blue-400 border-blue-800' : 'bg-green-900/30 text-green-400 border-green-800'}`}>{job.source}</span>
                                            </div>
                                        </td>
                                        <td className="p-3 min-w-[110px]">
                                            <span className={`inline-block text-sm font-bold px-2 py-1 rounded border ${scoreColor(job.matchScore)}`}>
                                                {job.matchScore !== undefined ? `${Math.round(job.matchScore)}%` : '—'}
                                            </span>
                                            {job.matchSummary && <p className="text-xs text-slate-500 mt-1 max-w-[180px]">{job.matchSummary}</p>}
                                        </td>
                                        <td className="p-3 min-w-[140px]">
                                            {job.recruiterName ? (
                                                <>
                                                    <div className="text-slate-200 font-medium">{job.recruiterName}</div>
                                                    {job.recruiterTitle && <div className="text-xs text-slate-500">{job.recruiterTitle}</div>}
                                                    {job.recruiterProfileUrl && (
                                                        <a href={job.recruiterProfileUrl} target="_blank" rel="noopener noreferrer" className="text-xs text-cyan-400 hover:underline">View LinkedIn</a>
                                                    )}
                                                </>
                                            ) : (
                                                <span className="text-slate-600 text-xs italic">Not found</span>
                                            )}
                                        </td>
                                        <td className="p-3 min-w-[220px] max-w-[320px]">
                                            {job.outreachMessage ? (
                                                <div>
                                                    <p className={`text-xs text-slate-400 whitespace-pre-wrap ${expandedJobId === job.id ? '' : 'line-clamp-3'}`}>{job.outreachMessage}</p>
                                                    <div className="flex gap-3 mt-1">
                                                        <button type="button" onClick={() => setExpandedJobId(expandedJobId === job.id ? null : job.id)} className="text-xs text-emerald-400 hover:underline">
                                                            {expandedJobId === job.id ? 'Show less' : 'Show more'}
                                                        </button>
                                                        <button type="button" onClick={() => handleCopyOutreach(job)} className="text-xs text-cyan-400 hover:underline">
                                                            {copiedJobId === job.id ? 'Copied!' : 'Copy'}
                                                        </button>
                                                    </div>
                                                </div>
                                            ) : (
                                                <span className="text-slate-600 text-xs italic">Add your resume to generate a draft</span>
                                            )}
                                        </td>
                                        <td className="p-3 min-w-[140px]">
                                            <div className="flex flex-col gap-2">
                                                <button
                                                    onClick={() => handleApply(job)}
                                                    className="bg-emerald-600 hover:bg-emerald-700 text-white font-semibold py-1.5 px-3 rounded text-xs transition-colors"
                                                >
                                                    Apply with Optimizer
                                                </button>
                                                {job.applyType === 'email' && job.applyEmail ? (
                                                    <button onClick={() => handleEmailApply(job)} className="bg-slate-700 hover:bg-slate-600 text-slate-200 font-semibold py-1.5 px-3 rounded text-xs transition-colors">Email Apply</button>
                                                ) : job.applyUrl && (
                                                    <a href={job.applyUrl} target="_blank" rel="noopener noreferrer" className="bg-slate-700 hover:bg-slate-600 text-slate-200 font-semibold py-1.5 px-3 rounded text-xs text-center transition-colors">View Listing</a>
                                                )}
                                                {onTrackJob && (
                                                    <button
                                                        onClick={() => handleTrack(job)}
                                                        disabled={trackedJobs.has(job.id)}
                                                        className={`font-semibold py-1.5 px-3 rounded text-xs transition-colors border ${trackedJobs.has(job.id) ? 'bg-transparent text-slate-500 border-slate-700 cursor-not-allowed' : 'bg-slate-800 hover:bg-slate-700 text-slate-300 border-slate-600'}`}
                                                    >
                                                        {trackedJobs.has(job.id) ? 'Tracked' : 'Track'}
                                                    </button>
                                                )}
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}

                {hasSearched && !searchError && jobs.length === 0 && !isLoading && (
                    <div className="text-center py-12 text-slate-500">
                        <p>No jobs found matching your criteria.</p>
                        <p className="text-sm">Try broader keywords or a different location.</p>
                    </div>
                )}
            </div>
        </div>
    );
};
