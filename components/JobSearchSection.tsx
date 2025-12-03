
import React, { useState } from 'react';
import { JobPosting, JobApplication } from '../types';
import { searchJobs, generateMailtoLink } from '../services/jobService';

interface JobSearchSectionProps {
    candidateName: string;
    onTrackJob?: (job: JobPosting) => void;
}

export const JobSearchSection: React.FC<JobSearchSectionProps> = ({ candidateName, onTrackJob }) => {
    const [query, setQuery] = useState('');
    const [location, setLocation] = useState('');
    const [jobs, setJobs] = useState<JobPosting[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [hasSearched, setHasSearched] = useState(false);
    const [trackedJobs, setTrackedJobs] = useState<Set<string>>(new Set());

    const handleSearch = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!query && !location) return;
        
        setIsLoading(true);
        setHasSearched(true);
        try {
            const results = await searchJobs(query, location);
            setJobs(results);
        } catch (error) {
            console.error("Search failed", error);
        } finally {
            setIsLoading(false);
        }
    };

    const handleApply = (job: JobPosting) => {
        if (job.applyType === 'email' && job.applyEmail) {
            // "Green Light" Method D: Apply via Email
            const mailto = generateMailtoLink(job, candidateName);
            window.location.href = mailto;
        } else if (job.applyType === 'redirect' && job.applyUrl) {
            // "Green Light" Method A: Redirect to Apply
            // Use _system target to force opening in external browser on mobile devices
            window.open(job.applyUrl, '_system', 'noopener,noreferrer');
        }
    };

    const handleTrack = (job: JobPosting) => {
        if (onTrackJob) {
            onTrackJob(job);
            setTrackedJobs(prev => new Set(prev).add(job.id));
        }
    };

    return (
        <div className="bg-slate-800/50 p-6 rounded-lg shadow-lg min-h-[500px] animate-fade-in">
            <div className="text-center mb-8">
                <h2 className="text-2xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 to-cyan-400 mb-2">
                    Find Jobs & Apply
                </h2>
                <p className="text-slate-400 text-sm">
                    Search verified listings from Aggregators and Official ATS Partners.
                </p>
            </div>

            {/* Search Form */}
            <form onSubmit={handleSearch} className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8 max-w-4xl mx-auto">
                <input 
                    type="text" 
                    placeholder="Job Title, Skills, or Keywords" 
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    className="bg-slate-900 border border-slate-700 rounded-md p-3 text-slate-200 focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 w-full"
                />
                <input 
                    type="text" 
                    placeholder="Location (e.g., Bangalore, Remote)" 
                    value={location}
                    onChange={(e) => setLocation(e.target.value)}
                    className="bg-slate-900 border border-slate-700 rounded-md p-3 text-slate-200 focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 w-full"
                />
                <button 
                    type="submit" 
                    disabled={isLoading}
                    className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-3 px-6 rounded-md transition-colors flex items-center justify-center"
                >
                    {isLoading ? (
                        <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>
                    ) : 'Search Jobs'}
                </button>
            </form>

            {/* Results */}
            <div className="space-y-4 max-w-4xl mx-auto">
                {jobs.map(job => (
                    <div key={job.id} className="bg-slate-900 border border-slate-700 p-5 rounded-lg hover:border-emerald-500/50 transition-all group">
                        <div className="flex justify-between items-start">
                            <div>
                                <h3 className="text-lg font-bold text-slate-200 group-hover:text-emerald-400 transition-colors">{job.title}</h3>
                                <p className="text-slate-300 font-medium">{job.company}</p>
                                <div className="flex items-center space-x-3 mt-1 text-sm text-slate-500">
                                    <span className="flex items-center">
                                        <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"></path><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"></path></svg>
                                        {job.location}
                                    </span>
                                    <span className="flex items-center">
                                        <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
                                        {new Date(job.postedAt).toLocaleDateString()}
                                    </span>
                                </div>
                            </div>
                            <div className="flex flex-col items-end space-y-2">
                                <span className={`text-xs font-bold px-2 py-1 rounded uppercase tracking-wide border ${
                                    job.source === 'Greenhouse' || job.source === 'Lever' 
                                    ? 'bg-green-900/30 text-green-400 border-green-800' 
                                    : 'bg-blue-900/30 text-blue-400 border-blue-800'
                                }`}>
                                    {job.source}
                                </span>
                            </div>
                        </div>
                        
                        <p className="mt-3 text-slate-400 text-sm line-clamp-2">
                            {job.description}
                        </p>

                        <div className="mt-4 pt-4 border-t border-slate-800 flex justify-between items-center">
                            <span className="text-xs text-slate-600">
                                {job.applyType === 'email' ? 'Application Method: Email' : 'Application Method: External Site'}
                            </span>
                            <div className="flex space-x-2">
                                {onTrackJob && (
                                    <button
                                        onClick={() => handleTrack(job)}
                                        disabled={trackedJobs.has(job.id)}
                                        className={`font-semibold py-2 px-4 rounded text-sm transition-colors flex items-center border ${
                                            trackedJobs.has(job.id) 
                                            ? 'bg-transparent text-slate-500 border-slate-700 cursor-not-allowed'
                                            : 'bg-slate-800 hover:bg-slate-700 text-slate-300 border-slate-600'
                                        }`}
                                    >
                                        {trackedJobs.has(job.id) ? (
                                            <>
                                                <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path></svg>
                                                Tracked
                                            </>
                                        ) : (
                                            <>
                                                <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z"></path></svg>
                                                Track
                                            </>
                                        )}
                                    </button>
                                )}
                                <button 
                                    onClick={() => handleApply(job)}
                                    className="bg-emerald-600 hover:bg-emerald-700 text-white font-semibold py-2 px-4 rounded text-sm transition-colors flex items-center"
                                >
                                    {job.applyType === 'email' ? (
                                        <>
                                            <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"></path></svg>
                                            Apply
                                        </>
                                    ) : (
                                        <>
                                            <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"></path></svg>
                                            Apply
                                        </>
                                    )}
                                </button>
                            </div>
                        </div>
                    </div>
                ))}

                {hasSearched && jobs.length === 0 && !isLoading && (
                    <div className="text-center py-12 text-slate-500">
                        <p>No jobs found matching your criteria.</p>
                        <p className="text-sm">Try broader keywords or a different location.</p>
                    </div>
                )}
            </div>
        </div>
    );
};
