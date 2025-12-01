import React, { useState, useCallback } from 'react';
import { brainstormResumeContent } from '../services/geminiService';
import { BrainstormResult } from '../types';

export const GuideSection: React.FC = () => {
    const [isExpanded, setIsExpanded] = useState(false);
    const [jobTitle, setJobTitle] = useState('');
    const [isBrainstorming, setIsBrainstorming] = useState(false);
    const [brainstormResult, setBrainstormResult] = useState<BrainstormResult | null>(null);
    const [brainstormError, setBrainstormError] = useState<string | null>(null);

    const handleBrainstorm = useCallback(async () => {
        if (!jobTitle) {
            setBrainstormError("Please enter a job title.");
            return;
        }
        setIsBrainstorming(true);
        setBrainstormError(null);
        setBrainstormResult(null);
        try {
            const result = await brainstormResumeContent(jobTitle);
            setBrainstormResult(result);
        } catch (error) {
            console.error("Brainstorming failed:", error);
            setBrainstormError("Failed to generate content. The model might be busy. Please try again.");
        } finally {
            setIsBrainstorming(false);
        }
    }, [jobTitle]);

    const GuideContent = () => (
        <div className="prose prose-slate prose-invert max-w-none text-slate-300 space-y-6">
            <p>
                Building a brand in your resume and achieving 95%+ ATS recognition are two different, but equally important, tasks that must be executed simultaneously. Here is a comprehensive guide on how to achieve both.
            </p>

            <h3 className="text-xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 to-cyan-400">🚀 Part 1: How to Build Your Personal Brand in Your Resume</h3>
            <p>Your personal brand is your <strong>Unique Value Proposition (UVP)</strong>—what makes you different and better than the other candidates. It should be the thread that ties your entire document together.</p>
            
            <h4 className="text-lg font-semibold text-slate-200">1. Define Your Brand's Core Message</h4>
            <p>Before you write, answer these questions:</p>
            <ul className="list-disc list-inside">
                <li><strong>What are you?</strong> (e.g., "A Data-Driven Marketing Strategist," "A Full-Stack Developer focused on scalability," "A Creative Team Leader specializing in culture transformation.")</li>
                <li><strong>What value do you deliver?</strong> (e.g., "Accelerated revenue growth," "Streamlined project delivery," "Improved user engagement.")</li>
            </ul>

            <h4 className="text-lg font-semibold text-slate-200">2. Implement the Brand in Key Sections</h4>
            <div className="overflow-x-auto">
                <table className="w-full text-sm">
                    <thead className="text-slate-300 bg-slate-800">
                        <tr>
                            <th className="p-3 text-left">Resume Section</th>
                            <th className="p-3 text-left">Action</th>
                            <th className="p-3 text-left">Example (for a Marketing Manager)</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-700">
                        <tr className="bg-slate-900/50">
                            <td className="p-3 font-semibold">Professional Title/Headline</td>
                            <td className="p-3"><strong>Do not</strong> just use your current job title. Use the <strong>target job title</strong> and your core differentiator.</td>
                            <td className="p-3"><strong>Data-Driven Marketing Manager | B2B SaaS Growth & SEO Expert</strong></td>
                        </tr>
                        <tr className="bg-slate-900/50">
                            <td className="p-3 font-semibold">Professional Summary</td>
                            <td className="p-3">This is your 3-4 sentence "elevator pitch." State your experience, your core skill, and your <strong>biggest career goal</strong> (as it aligns with the company's needs).</td>
                            <td className="p-3">Highly effective B2B Marketing Manager with 7+ years of experience scaling SaaS products. Specializes in <strong>full-funnel optimization</strong> and leveraging <strong>SEO strategy</strong> to generate high-quality leads. Seeking to drive market expansion for a disruptive FinTech platform.</td>
                        </tr>
                        <tr className="bg-slate-900/50">
                            <td className="p-3 font-semibold">Work Experience Bullets</td>
                            <td className="p-3"><strong>Focus 100% on achievements, not duties.</strong> Every bullet should reinforce your brand by quantifying the impact you made.</td>
                            <td className="p-3"><strong>NOT:</strong> Managed social media accounts.<br/><strong>INSTEAD:</strong> <strong>Spearheaded</strong> a new content strategy that resulted in a <strong>45% increase</strong> in qualified traffic and <strong>exceeded</strong> lead generation goals by <strong>$1.2M</strong> in Q3.</td>
                        </tr>
                    </tbody>
                </table>
            </div>

            <h3 className="text-xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 to-cyan-400">✅ Part 2: Highlights for 95%+ ATS Recognition</h3>
            <p>The Applicant Tracking System (ATS) is a software that scans, parses, and ranks your resume based on how well it matches the job description. To score high (95%+), you need flawless formatting and precise keyword optimization.</p>

            <h4 className="text-lg font-semibold text-slate-200">1. Keyword Optimization (The Content Match)</h4>
            <p>This is the single most important factor for a high ATS score. This app helps you tailor your resume for <strong>every single application.</strong> Integrate keywords from the job description naturally into your <strong>Professional Summary</strong>, <strong>Skills Section</strong>, and, most importantly, the <strong>Work Experience</strong> bullet points.</p>
            
            <h4 className="text-lg font-semibold text-slate-200">2. ATS-Friendly Formatting (The Readability Match)</h4>
            <p>The ATS must be able to read and categorize your information correctly. <strong>Keep it simple.</strong></p>
             <div className="overflow-x-auto">
                <table className="w-full text-sm">
                    <thead className="text-slate-300 bg-slate-800">
                        <tr>
                            <th className="p-3 text-left">ATS Requirement</th>
                            <th className="p-3 text-left">Best Practice for High Score</th>
                            <th className="p-3 text-left">Avoid This</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-700">
                        <tr className="bg-slate-900/50">
                            <td className="p-3 font-semibold">File Type</td>
                            <td className="p-3"><strong>.docx or .pdf</strong> are universally accepted. This app saves as .pdf.</td>
                            <td className="p-3"><code>.pages</code> files, complex PDFs with layered text.</td>
                        </tr>
                        <tr className="bg-slate-900/50">
                            <td className="p-3 font-semibold">Layout</td>
                            <td className="p-3"><strong>Simple, single-column layout.</strong></td>
                            <td className="p-3">Tables, text boxes, headers/footers, multi-column layouts.</td>
                        </tr>
                         <tr className="bg-slate-900/50">
                            <td className="p-3 font-semibold">Section Headings</td>
                            <td className="p-3">Use <strong>conventional titles</strong>: Work Experience, Skills, Education.</td>
                            <td className="p-3">Creative titles like "My Career Journey" or "Technical Toolbox".</td>
                        </tr>
                        <tr className="bg-slate-900/50">
                            <td className="p-3 font-semibold">Fonts</td>
                            <td className="p-3">Use standard, readable fonts: <strong>Arial, Calibri, Garamond, Times New Roman, Georgia.</strong> (Size 10-12pt)</td>
                            <td className="p-3">Fancy, decorative, or script fonts.</td>
                        </tr>
                        <tr className="bg-slate-900/50">
                            <td className="p-3 font-semibold">Visuals</td>
                            <td className="p-3"><strong>Do not use any graphics or images.</strong></td>
                            <td className="p-3">Headshots, logos, graphs, custom icons, stars/bars for skill ratings.</td>
                        </tr>
                    </tbody>
                </table>
            </div>
            
            <div className="border-t-2 border-slate-700 my-8 pt-6">
                <h3 className="text-xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 to-cyan-400">💡 Interactive Brainstorming Tool</h3>
                <p className="mt-2 mb-4">Need inspiration? Enter a job title you're targeting to generate a sample summary and achievement-based bullet points.</p>
                
                <div className="flex flex-col sm:flex-row space-y-2 sm:space-y-0 sm:space-x-2">
                     <input
                        type="text"
                        value={jobTitle}
                        onChange={(e) => setJobTitle(e.target.value)}
                        placeholder="e.g., Senior Product Manager"
                        className="flex-grow w-full bg-slate-900 border border-slate-700 rounded-md p-3 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-colors text-slate-300 placeholder-slate-500"
                        disabled={isBrainstorming}
                    />
                    <button onClick={handleBrainstorm} disabled={isBrainstorming || !jobTitle} className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-3 px-4 rounded-lg shadow-md transition-all duration-300 ease-in-out disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center">
                        {isBrainstorming ? (
                             <>
                                <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>
                                Generating...
                            </>
                        ) : "Brainstorm"}
                    </button>
                </div>
                {brainstormError && <p className="text-red-400 text-sm mt-2">{brainstormError}</p>}
                {brainstormResult && (
                    <div className="mt-6 p-4 bg-slate-900/70 border border-slate-700 rounded-lg animate-fade-in space-y-4">
                        <div>
                            <h4 className="font-semibold text-slate-200">Generated Professional Summary:</h4>
                            <p className="mt-1 text-slate-300 bg-slate-800 p-3 rounded-md">{brainstormResult.professionalSummary}</p>
                        </div>
                         <div>
                            <h4 className="font-semibold text-slate-200">Generated Achievement Bullets:</h4>
                            <ul className="list-disc list-inside space-y-2 mt-1 text-slate-300 bg-slate-800 p-3 rounded-md">
                                {brainstormResult.achievementBullets.map((bullet, index) => <li key={index}>{bullet}</li>)}
                            </ul>
                        </div>
                    </div>
                )}
            </div>

        </div>
    );

    return (
        <div className="bg-slate-800/50 p-6 rounded-lg shadow-lg">
            <button
                onClick={() => setIsExpanded(!isExpanded)}
                className="w-full flex justify-between items-center text-left text-2xl font-bold text-slate-200"
                aria-expanded={isExpanded}
            >
                <span>Resume Branding & ATS Guide</span>
                <svg
                    className={`w-6 h-6 transform transition-transform duration-300 ${isExpanded ? 'rotate-180' : ''}`}
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                    xmlns="http://www.w3.org/2000/svg"
                >
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
            </button>
            {isExpanded && (
                <div className="mt-6 border-t border-slate-700 pt-6 animate-fade-in-fast">
                    <GuideContent />
                </div>
            )}
        </div>
    );
};
