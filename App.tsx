
import React, { useState, useCallback, useEffect, useRef } from 'react';
import { Header } from './components/Header';
import { InputSection } from './components/InputSection';
import { ResultsSection } from './components/ResultsSection';
import { Loader } from './components/Loader';
import { AnalysisResult, SavedResume, User, GeneratedResume, JobApplication, JobPosting, CompanyConflictResult } from './types';
import { analyzeAndOptimizeResume, fetchJdFromUrl, analyzeResumeOnly, analyzeResumeGeneralHealth, detectCompanyConflict } from './services/geminiClient';
import { getPlanQuota } from './lib/paymentPlans';
import { GuideSection } from './components/GuideSection';
import { ReviewsSection } from './components/ReviewsSection';
import { ConfirmationModal } from './components/ConfirmationModal';
import { AdminDbView } from './components/AdminDbView';
import { AdminFinanceView } from './components/AdminFinanceView';
import { FinancialDashboard } from './components/FinancialDashboard';
import { ChatBot } from './components/ChatBot';
import { HistorySection } from './components/HistorySection';
import { LegalModal } from './components/LegalModals';
import { JobSearchSection } from './components/JobSearchSection';
import { MarketAnalysisSection } from './components/MarketAnalysisSection';
import { JobTrackerBoard } from './components/JobTrackerBoard';
import { HealthCheckView } from './components/HealthCheckView';
import { CompanyConflictModal } from './components/CompanyConflictModal';
import { getCompanySettings } from './services/cryptoService';
import { buildCoverLetterAttachment, buildResumeAttachment } from './services/documentService';
import { sendTransactionalEmail } from './services/paymentService';
import { MAX_JOB_ROWS } from './services/jobExportService';
import { updatePassword } from './services/authService';

interface AppProps {
  user: User;
  onLogout: () => void;
  onManageSubscription: () => void;
  onUpdateUser: (user: User) => void;
}

const DEFAULT_RESUME_CONTENT = `Praveen Babu Dupaki +91 9849734395
Supply Chain/Procurement Manager | Strategic Leader veenbd9@gmail.com
| Operations | Driving Process Excellence Hyderabad, TS, 500050`;

const App: React.FC<AppProps> = ({ user, onLogout, onManageSubscription, onUpdateUser }) => {
  const [activeView, setActiveView] = useState<'health-check' | 'jobs' | 'optimizer' | 'tracker' | 'trends'>('health-check');
  const [resumeText, setResumeText] = useState<string>('');
  const [jobDescriptionText, setJobDescriptionText] = useState<string>('');
  const [metricContext, setMetricContext] = useState<string>('');
  const [companyName, setCompanyName] = useState<string>('');
  const [analyzedCompanyName, setAnalyzedCompanyName] = useState<string>('');
  const [jobTitle, setJobTitle] = useState<string>('');
  const [analysisResult, setAnalysisResult] = useState<AnalysisResult | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [isFetchingJd, setIsFetchingJd] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [savedResumes, setSavedResumes] = useState<SavedResume[]>([]);
  const [applicationHistory, setApplicationHistory] = useState<GeneratedResume[]>([]);
  const [jobApplications, setJobApplications] = useState<JobApplication[]>([]);
  const [isConfirmModalOpen, setIsConfirmModalOpen] = useState<boolean>(false);
  const [limitModalOpen, setLimitModalOpen] = useState<boolean>(false);
  const resultsRef = useRef<HTMLDivElement>(null);
  const [warningModalOpen, setWarningModalOpen] = useState<boolean>(false);
  const [warningMessage, setWarningMessage] = useState<string>('');
  const [conflictModalOpen, setConflictModalOpen] = useState<boolean>(false);
  const [conflictData, setConflictData] = useState<CompanyConflictResult | null>(null);
  // Set while a Job Search "Auto Apply" click is paused on the company
  // conflict confirmation; tells the modal's onConfirm to resume the
  // auto-apply pipeline instead of the manual Optimizer flow.
  const [pendingAutoApplyJob, setPendingAutoApplyJob] = useState<JobPosting | null>(null);
  const [adminViewMode, setAdminViewMode] = useState<'admin' | 'user'>('admin');
  const [activeLegalModal, setActiveLegalModal] = useState<'privacy' | 'terms' | null>(null);
  // Once a user completes a Health Check in this session, the tab is masked
  // (hidden from the nav) so they don't re-run it repeatedly; it reappears
  // automatically after they log out and back in, since this state resets
  // on a fresh App mount.
  const [healthCheckUsed, setHealthCheckUsed] = useState<boolean>(false);

  useEffect(() => {
    try {
      const storedResumes = localStorage.getItem('savedResumes');
      let loadedResumes: SavedResume[] = [];
      if (storedResumes) loadedResumes = JSON.parse(storedResumes);
      if (user.isAdmin) {
         const defaultResumeId = 999999999;
         if (!loadedResumes.some(r => r.id === defaultResumeId)) {
             const defaultResume: SavedResume = { id: defaultResumeId, name: "Default Profile", content: DEFAULT_RESUME_CONTENT, status: 'ACTIVE' };
             loadedResumes = [defaultResume, ...loadedResumes];
             localStorage.setItem('savedResumes', JSON.stringify(loadedResumes));
         }
      }
      // Migrate resumes saved before the "primary" concept existed: if none
      // is flagged, treat the most recent one (array's first entry) as
      // primary so existing users keep a sensible default.
      if (loadedResumes.length > 0 && !loadedResumes.some(r => r.isPrimary)) {
          loadedResumes = loadedResumes.map((r, idx) => ({ ...r, isPrimary: idx === 0 }));
          localStorage.setItem('savedResumes', JSON.stringify(loadedResumes));
      }
      setSavedResumes(loadedResumes);
      // Pre-fill the working resume with the primary one so Health Check and
      // the Optimizer default to it without requiring a re-upload/re-paste.
      const primary = loadedResumes.find(r => r.isPrimary);
      if (primary) setResumeText(primary.content);
      const storedHistory = localStorage.getItem('generated_resumes_history');
      if (storedHistory) setApplicationHistory(JSON.parse(storedHistory));
      const storedApps = localStorage.getItem(`job_tracker_${user.email}`);
      if (storedApps) {
        // Drop any auto-created (Job Search apply/track) Tracker entries
        // whose 21-day retention window has passed. Manually added entries
        // have no expiresAt and are kept indefinitely.
        const now = Date.now();
        const parsed: JobApplication[] = JSON.parse(storedApps);
        const alive = parsed.filter(a => !a.expiresAt || a.expiresAt > now);
        setJobApplications(alive);
        if (alive.length !== parsed.length) localStorage.setItem(`job_tracker_${user.email}`, JSON.stringify(alive));
      }
    } catch (error) { console.error(error); }
  }, [user.email]);

  // SIMULATED WHATSAPP NURTURING CYCLE
  useEffect(() => {
      const settings = getCompanySettings();
      if (settings.isWhatsAppIntegrated && settings.whatsAppEncouragementCycle) {
          const now = Date.now();
          const day = 24 * 60 * 60 * 1000;
          const userJoinDate = user.subscription.startDate || now;
          const timeSinceJoin = now - userJoinDate;
          
          if (timeSinceJoin > day && (!user.lastWhatsAppMessageSent || now - user.lastWhatsAppMessageSent > day)) {
              console.log(`[WhatsApp Nurturing] Sending reminder to ${user.phoneNumber}: Did you know all your optimized resumes are available anytime in your history? Secure your future now with ScaleupResume!`);
              onUpdateUser({ ...user, lastWhatsAppMessageSent: now });
          }
      }
  }, [user, onUpdateUser]);

  // Adding a resume (paste, upload, or otherwise) makes it the new primary
  // (default) resume for Health Check / Optimizer going forward. Previously
  // primary resumes are demoted but stay ACTIVE and visible further down the
  // saved list — nothing is ever deleted by this promotion.
  const handleSaveResume = useCallback((newResume: SavedResume) => {
    setSavedResumes(prevResumes => {
      const existing = prevResumes.find(r => r.content === newResume.content && r.status === 'ACTIVE');
      let updatedResumes: SavedResume[];
      if (existing) {
        // Re-using an already-saved resume just promotes it to primary and
        // moves it to the top; it isn't duplicated in the list.
        const rest = prevResumes.filter(r => r.id !== existing.id).map(r => ({ ...r, isPrimary: false }));
        updatedResumes = [{ ...existing, isPrimary: true }, ...rest];
      } else {
        const rest = prevResumes.map(r => ({ ...r, isPrimary: false }));
        updatedResumes = [{ ...newResume, status: 'ACTIVE', isPrimary: true }, ...rest];
      }
      localStorage.setItem('savedResumes', JSON.stringify(updatedResumes));
      return updatedResumes;
    });
  }, []);

  // Lets the user explicitly tick a different saved resume as primary
  // (default) without editing its content or status.
  const handleSetPrimaryResume = useCallback((resumeId: number) => {
    setSavedResumes(prevResumes => {
      const target = prevResumes.find(r => r.id === resumeId);
      if (!target) return prevResumes;
      const rest = prevResumes.filter(r => r.id !== resumeId).map(r => ({ ...r, isPrimary: false }));
      const updatedResumes: SavedResume[] = [{ ...target, isPrimary: true }, ...rest];
      localStorage.setItem('savedResumes', JSON.stringify(updatedResumes));
      setResumeText(target.content);
      return updatedResumes;
    });
  }, []);

  const handleSuspendResume = useCallback((resumeId: number) => {
    setSavedResumes(prevResumes => {
      const updatedResumes: SavedResume[] = prevResumes.map(r => r.id === resumeId ? { ...r, status: 'SUSPENDED' as const } : r);
      localStorage.setItem('savedResumes', JSON.stringify(updatedResumes));
      return updatedResumes;
    });
  }, []);

  const handleToggleResumeStatus = useCallback((resumeId: number) => {
      setSavedResumes(prevResumes => {
          const updatedResumes: SavedResume[] = prevResumes.map(r => r.id === resumeId ? { ...r, status: r.status === 'ACTIVE' ? 'SUSPENDED' : 'ACTIVE' } : r);
          localStorage.setItem('savedResumes', JSON.stringify(updatedResumes));
          return updatedResumes;
      });
  }, []);

  const saveTrackerData = (apps: JobApplication[]) => {
      // Prune expired auto-created entries (21-day retention) and cap the
      // board at MAX_JOB_ROWS, keeping the most recently touched entries.
      const now = Date.now();
      const alive = apps.filter(a => !a.expiresAt || a.expiresAt > now);
      const capped = alive.length > MAX_JOB_ROWS
          ? [...alive].sort((a, b) => b.lastUpdated - a.lastUpdated).slice(0, MAX_JOB_ROWS)
          : alive;
      setJobApplications(capped);
      localStorage.setItem(`job_tracker_${user.email}`, JSON.stringify(capped));
  };

  const handleUpdateApplication = useCallback((updatedApp: JobApplication) => {
      const newApps = jobApplications.map(app => app.id === updatedApp.id ? updatedApp : app);
      saveTrackerData(newApps);
  }, [jobApplications, user.email]);

  const handleDeleteApplication = useCallback((id: string) => {
      const newApps = jobApplications.filter(app => app.id !== id);
      saveTrackerData(newApps);
  }, [jobApplications, user.email]);

  const handleAddApplication = useCallback((newApp: Omit<JobApplication, 'id' | 'dateAdded' | 'lastUpdated'>) => {
      const app: JobApplication = { ...newApp, id: `JOB_${Date.now()}`, dateAdded: Date.now(), lastUpdated: Date.now() };
      saveTrackerData([app, ...jobApplications]);
  }, [jobApplications, user.email]);

  const TRACKER_ENTRY_TTL_MS = 21 * 24 * 60 * 60 * 1000;

  const handleTrackJobFromSearch = useCallback((job: JobPosting) => {
      const newApp: JobApplication = { id: `JOB_${Date.now()}`, company: job.company, position: job.title, location: job.location, status: 'BOOKMARKED', dateAdded: Date.now(), lastUpdated: Date.now(), url: job.applyUrl, notes: `Source: ${job.source}`, sourceJobId: job.id, expiresAt: Date.now() + TRACKER_ENTRY_TTL_MS };
      saveTrackerData([newApp, ...jobApplications]);
  }, [jobApplications, user.email]);

  const handleFetchJd = useCallback(async (url: string) => {
    if (!url) return setError('URL required.');
    setIsFetchingJd(true);
    try { setJobDescriptionText(await fetchJdFromUrl(url)); } catch (err: any) { setError(err.message); } finally { setIsFetchingJd(false); }
  }, []);
  
  const handleAnalyze = useCallback(async () => {
    if (!resumeText || !jobDescriptionText || !companyName) return setError('Missing info.');
    const resumeLimit = user.subscription.planType === 'free' ? 1 : user.subscription.resumeLimit ?? getPlanQuota(user.subscription.planType) ?? 1;
    if (!user.isAdmin && user.subscription.usageCount >= resumeLimit) {
      setLimitModalOpen(true);
      return;
    }
    setIsLoading(true);
    try {
        const historyCompanies: string[] = Array.from(new Set(applicationHistory.map(h => h.companyName)));
        const conflict = await detectCompanyConflict(companyName, historyCompanies);
        setIsLoading(false);
        if (conflict.hasConflict) { setConflictData(conflict); setConflictModalOpen(true); } else { setIsConfirmModalOpen(true); }
    } catch (e) { setIsLoading(false); setIsConfirmModalOpen(true); }
  }, [resumeText, jobDescriptionText, metricContext, companyName, user.subscription, user.isAdmin, applicationHistory]);

  const checkNameMatch = (accountName: string, resumeName: string): boolean => {
      if (resumeName === "Candidate") return true;
      const normalize = (s: string) => s.toLowerCase().trim().replace(/[^a-z ]/g, '');
      const accParts = normalize(accountName).split(' ');
      const resParts = normalize(resumeName).split(' ');
      return accParts.some(part => part.length > 2 && resParts.includes(part));
  };

  const handleConfirmAnalyze = useCallback(async () => {
    setIsConfirmModalOpen(false); setConflictModalOpen(false); setIsLoading(true); setError(null);
    const currentCompanyName = companyName; const currentJobDescription = jobDescriptionText;
    try {
      let currentUserState = { ...user };
      const result = await analyzeAndOptimizeResume(resumeText, jobDescriptionText, metricContext);
      if (!user.isAdmin) {
          currentUserState = { ...currentUserState, subscription: { ...currentUserState.subscription, usageCount: currentUserState.subscription.usageCount + 1 } };
          onUpdateUser(currentUserState);
      }
      if (!checkNameMatch(currentUserState.name, result.candidateName)) {
          const newCount = (currentUserState.resumeMismatchCount || 0) + 1;
          currentUserState = { ...currentUserState, resumeMismatchCount: newCount };
          onUpdateUser(currentUserState);
          if (newCount >= 5) { setWarningMessage("Fraudulent activity detected. Account at risk."); setWarningModalOpen(true); }
      }
      setAnalysisResult(result); setAnalyzedCompanyName(currentCompanyName); setCompanyName('');
      const newHistoryItem: GeneratedResume = { id: Date.now().toString(), userId: user.email, timestamp: Date.now(), companyName: currentCompanyName, jobTitle: jobTitle, analysisResult: result, jobDescription: currentJobDescription };
      setApplicationHistory(prev => {
          const updated = [newHistoryItem, ...prev];
          localStorage.setItem('generated_resumes_history', JSON.stringify(updated));
          return updated;
      });
      if (user.isAdmin) { handleSaveResume({ id: Date.now(), name: `Optimized - ${currentCompanyName}`, content: result.optimizedResume, status: 'ACTIVE' }); }
    } catch (err: any) { setError(err.message); } finally { setIsLoading(false); }
  }, [resumeText, jobDescriptionText, user, onUpdateUser, companyName, jobTitle, handleSaveResume]);

  const handleScanOnly = useCallback(async () => {
    if (!resumeText || !jobDescriptionText || !companyName) return setError('Missing info.');
    setIsLoading(true);
    try { const result = await analyzeResumeOnly(resumeText, jobDescriptionText); setAnalysisResult(result); setAnalyzedCompanyName(companyName); } catch (err: any) { setError(err.message); } finally { setIsLoading(false); }
  }, [resumeText, jobDescriptionText, companyName]);

  const handleHealthCheck = useCallback(async () => {
      if (!resumeText) return setError('Resume required.');
      setError(null);
      setIsLoading(true); setCompanyName(''); setJobDescriptionText(''); setAnalyzedCompanyName('Health Check');
      try {
        setAnalysisResult(await analyzeResumeGeneralHealth(resumeText));
        setHealthCheckUsed(true);
        // Whichever resume the user just ran a Health Check with becomes the
        // primary (default) one for next time — either promoting it if it's
        // already saved, or saving it fresh if it's newly pasted text.
        handleSaveResume({ id: Date.now(), name: `Health Check - ${new Date().toLocaleDateString()}`, content: resumeText, status: 'ACTIVE' });
      } catch (err: any) { setError(err.message); } finally { setIsLoading(false); }
  }, [resumeText, handleSaveResume]);

  // Builds the Tracker entry created after an auto-apply attempt. Auto-applied
  // entries expire after 21 days (see TRACKER_ENTRY_TTL_MS) and are linked
  // back to the source JobPosting via sourceJobId (used for export-log
  // retention checks in JobSearchSection).
  const buildAutoApplyTrackerEntry = (job: JobPosting, status: JobApplication['status'], notes: string): JobApplication => ({
      id: `JOB_${Date.now()}`,
      company: job.company,
      position: job.title,
      location: job.location,
      status,
      dateAdded: Date.now(),
      lastUpdated: Date.now(),
      url: job.applyUrl,
      notes,
      sourceJobId: job.id,
      expiresAt: Date.now() + TRACKER_ENTRY_TTL_MS,
      contacts: job.recruiterName ? [{ name: job.recruiterName, role: job.recruiterTitle || 'Recruiter', email: job.applyEmail || '' }] : undefined,
  });

  // Runs the actual Optimizer generation for a job, then either auto-sends
  // the tailored resume + cover letter to the hiring contact's email, or
  // opens the employer's apply page when only a website link is available
  // (we cannot auto-fill arbitrary third-party application forms).
  const performAutoApply = useCallback(async (job: JobPosting) => {
      setIsLoading(true); setError(null);
      try {
          let currentUserState = { ...user };
          const result = await analyzeAndOptimizeResume(resumeText, job.description, metricContext);
          if (!user.isAdmin) {
              currentUserState = { ...currentUserState, subscription: { ...currentUserState.subscription, usageCount: currentUserState.subscription.usageCount + 1 } };
              onUpdateUser(currentUserState);
          }
          setAnalysisResult(result);
          setAnalyzedCompanyName(job.company);
          setCompanyName('');
          const newHistoryItem: GeneratedResume = { id: Date.now().toString(), userId: user.email, timestamp: Date.now(), companyName: job.company, jobTitle: job.title, analysisResult: result, jobDescription: job.description };
          setApplicationHistory(prev => {
              const updated = [newHistoryItem, ...prev];
              localStorage.setItem('generated_resumes_history', JSON.stringify(updated));
              return updated;
          });

          const candidateName = result.candidateName || user.name;
          if (job.applyType === 'email' && job.applyEmail) {
              const resumeAttachment = buildResumeAttachment(result.optimizedResume, candidateName, job.company, user.subscription.planType);
              const coverLetterAttachment = buildCoverLetterAttachment(result.coverLetter, candidateName, job.company, user.subscription.planType);
              const subject = `Application for ${job.title} - ${candidateName}`;
              const htmlBody = `<p>Dear ${job.recruiterName || 'Hiring Team'},</p><p>${(result.coverLetter || '').replace(/\n/g, '<br/>')}</p>`;
              await sendTransactionalEmail(job.applyEmail, job.recruiterName || job.company, subject, htmlBody, [resumeAttachment, coverLetterAttachment]);
              const newApp = buildAutoApplyTrackerEntry(job, 'APPLIED', `Auto-applied via ScaleupResume on ${new Date().toLocaleString()} — resume + cover letter emailed to ${job.applyEmail}.`);
              saveTrackerData([newApp, ...jobApplications]);
          } else if (job.applyUrl) {
              window.open(job.applyUrl, '_blank', 'noopener,noreferrer');
              const newApp = buildAutoApplyTrackerEntry(job, 'APPLYING', `Tailored resume + cover letter generated via ScaleupResume on ${new Date().toLocaleString()}. No hiring contact email was found, so the employer's apply page was opened for you to finish submitting.`);
              saveTrackerData([newApp, ...jobApplications]);
          }
      } catch (err: any) {
          setError(err.message || 'Failed to auto-apply to this job.');
      } finally {
          setIsLoading(false);
      }
  }, [resumeText, metricContext, user, onUpdateUser, jobApplications]);

  const handleApplyFromJob = useCallback(async (job: JobPosting) => {
      // Switch to the Optimizer immediately so the user sees the job's
      // description/company/title while generation runs.
      setJobDescriptionText(job.description);
      setCompanyName(job.company);
      setJobTitle(job.title);
      setAnalysisResult(null);
      setActiveView('optimizer');
      setTimeout(() => resultsRef.current?.scrollIntoView({ behavior: 'smooth' }), 100);

      if (!resumeText.trim()) {
          setError('Add your resume in the Optimizer (or complete a Health Check) before applying to jobs.');
          return;
      }
      const resumeLimit = user.subscription.planType === 'free' ? 1 : user.subscription.resumeLimit ?? getPlanQuota(user.subscription.planType) ?? 1;
      if (!user.isAdmin && user.subscription.usageCount >= resumeLimit) {
          setLimitModalOpen(true);
          return;
      }
      try {
          const historyCompanies: string[] = Array.from(new Set(applicationHistory.map(h => h.companyName)));
          const conflict = await detectCompanyConflict(job.company, historyCompanies);
          if (conflict.hasConflict) {
              setConflictData(conflict);
              setPendingAutoApplyJob(job);
              setConflictModalOpen(true);
              return;
          }
      } catch {
          // Non-fatal: proceed with auto-apply if the conflict check itself fails.
      }
      await performAutoApply(job);
  }, [resumeText, user, applicationHistory, performAutoApply]);
  
  const handleLoadHistory = useCallback((item: GeneratedResume) => {
      setAnalysisResult(item.analysisResult); setAnalyzedCompanyName(item.companyName); setJobTitle(item.jobTitle);
      if (item.jobDescription) setJobDescriptionText(item.jobDescription);
      setActiveView('optimizer');
      setTimeout(() => resultsRef.current?.scrollIntoView({ behavior: 'smooth' }), 100);
  }, []);

  const isFreePlan = user.subscription.planType === 'free';
  const canSeePricing = !isFreePlan || user.subscription.usageCount >= 1 || user.isAdmin;

  return (
    <div className="min-h-screen bg-transparent text-slate-200 font-sans flex flex-col pt-safe pb-safe pl-safe pr-safe">
      <div className="sticky top-0 z-20">
         <Header userName={user.name} isAdmin={user.isAdmin} onLogout={onLogout} viewMode={adminViewMode} onToggleViewMode={() => setAdminViewMode(prev => prev === 'admin' ? 'user' : 'admin')} onManageSubscription={canSeePricing ? onManageSubscription : undefined} onChangePassword={updatePassword} />
      </div>
      <div className="bg-gradient-to-r from-emerald-700 via-teal-600 to-cyan-600 shadow-xl border-b border-emerald-400/30 sticky top-[72px] z-10">
          <div className="container mx-auto px-4 py-3 flex space-x-4 overflow-x-auto pb-2 scrollbar-hide">
              {!healthCheckUsed && <button onClick={() => setActiveView('health-check')} className={`flex-shrink-0 px-6 py-3 rounded-full font-bold shadow-lg transition-all duration-300 ${activeView === 'health-check' ? 'bg-white text-emerald-700 scale-105 ring-4 ring-emerald-300' : 'bg-emerald-800/40 text-emerald-100 hover:bg-emerald-500 hover:text-white'}`}>Health Check</button>}
              {healthCheckUsed && <span title="Log out and back in to run another Health Check" className="flex-shrink-0 px-6 py-3 rounded-full font-bold bg-emerald-950/40 text-emerald-800 cursor-not-allowed select-none">Health Check ✓</span>}
              <button onClick={() => setActiveView('jobs')} className={`flex-shrink-0 px-6 py-3 rounded-full font-bold shadow-lg transition-all duration-300 ${activeView === 'jobs' ? 'bg-white text-emerald-700 scale-105 ring-4 ring-emerald-300' : 'bg-emerald-800/40 text-emerald-100 hover:bg-emerald-500 hover:text-white'}`}>Jobs</button>
              <button onClick={() => setActiveView('optimizer')} className={`flex-shrink-0 px-6 py-3 rounded-full font-bold shadow-lg transition-all duration-300 ${activeView === 'optimizer' ? 'bg-gradient-to-r from-pink-500 to-rose-500 text-white scale-105 ring-4 ring-pink-300' : 'bg-emerald-800/40 text-emerald-100 hover:bg-emerald-500 hover:text-white'}`}>Optimizer</button>
              <button onClick={() => setActiveView('tracker')} className={`flex-shrink-0 px-6 py-3 rounded-full font-bold shadow-lg transition-all duration-300 ${activeView === 'tracker' ? 'bg-white text-emerald-700 scale-105 ring-4 ring-emerald-300' : 'bg-emerald-800/40 text-emerald-100 hover:bg-emerald-500 hover:text-white'}`}>Tracker</button>
              <button onClick={() => setActiveView('trends')} className={`flex-shrink-0 px-6 py-3 rounded-full font-bold shadow-lg transition-all duration-300 ${activeView === 'trends' ? 'bg-white text-emerald-700 scale-105 ring-4 ring-emerald-300' : 'bg-emerald-800/40 text-emerald-100 hover:bg-emerald-500 hover:text-white'}`}>Trends</button>
          </div>
      </div>
      {isFreePlan && !user.isAdmin && <div className="bg-gradient-to-r from-emerald-900/90 to-teal-900/90 border-b border-teal-500/30 text-center py-2 px-4 backdrop-blur-md"><p className="text-sm text-teal-200"><strong>{Math.max(0, 1 - user.subscription.usageCount)}</strong> free resume build remaining. {canSeePricing && <button onClick={onManageSubscription} className="ml-3 font-bold underline">Upgrade for more resume builds</button>}</p></div>}
      <main className="container mx-auto p-4 md:p-8 flex-grow">
        {activeView === 'health-check' && <HealthCheckView resumeText={resumeText} setResumeText={setResumeText} onAnalyze={handleHealthCheck} isLoading={isLoading} error={error} result={analysisResult} onContinueToOptimizer={() => setActiveView('optimizer')} onReset={() => { setResumeText(''); setAnalysisResult(null); setError(null); }} userEmail={user.email} isAdmin={user.isAdmin} savedResumes={savedResumes.filter(r => r.status === 'ACTIVE')} onSetPrimaryResume={handleSetPrimaryResume} />}
        {activeView === 'jobs' && <JobSearchSection candidateName={user.name} userEmail={user.email} resumeText={resumeText} onTrackJob={handleTrackJobFromSearch} onApplyToJob={handleApplyFromJob} />}
        {activeView === 'optimizer' && <>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                <InputSection resumeText={resumeText} setResumeText={setResumeText} jobDescriptionText={jobDescriptionText} setJobDescriptionText={setJobDescriptionText} metricContext={metricContext} setMetricContext={setMetricContext} companyName={companyName} setCompanyName={setCompanyName} jobTitle={jobTitle} setJobTitle={setJobTitle} onAnalyze={handleAnalyze} onScan={handleScanOnly} onHealthCheck={handleHealthCheck} onFetchJd={handleFetchJd} isLoading={isLoading} isFetchingJd={isFetchingJd} savedResumes={savedResumes.filter(r => r.status === 'ACTIVE')} onSaveResume={handleSaveResume} onDeleteResume={handleSuspendResume} onSetPrimaryResume={handleSetPrimaryResume} />
                <div className="flex flex-col space-y-8" ref={resultsRef}>{isLoading && <div className="flex flex-col items-center justify-center p-8 h-full"><Loader /><p className="text-lg text-emerald-400 mt-4">Securing your future...</p></div>}
                {error && <div className="bg-red-900/90 border border-red-700 text-red-100 px-4 py-3 rounded-lg"><strong>Error: </strong>{error}</div>}
                {analysisResult && !isLoading && <ResultsSection result={analysisResult} candidateName={analysisResult.candidateName} companyName={analyzedCompanyName || companyName} planType={user.subscription.planType} jobDescription={jobDescriptionText} showDeepDive={user.isAdmin} onSaveToProfile={(content, name) => handleSaveResume({ id: Date.now(), name, content, status: 'ACTIVE' })} />}
                {!analysisResult && !isLoading && <div className="flex flex-col items-center justify-center bg-slate-900/85 border-2 border-dashed border-slate-600 rounded-lg p-8 h-full text-center"><h3>Optimize for stronger ATS compatibility</h3><p className="text-slate-400 mt-2">Enter the Job Description to tailor your resume. ATS compatibility varies by employer and software provider.</p></div>}</div>
            </div>
            {!user.isAdmin && <FinancialDashboard user={user} />}
            {user.isAdmin && adminViewMode === 'admin' && <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mt-8"><AdminDbView savedResumes={savedResumes} onToggleStatus={handleToggleResumeStatus} /><AdminFinanceView /></div>}
            <div className="mt-12"><HistorySection history={applicationHistory} currentUserEmail={user.email} onLoadHistory={handleLoadHistory} /></div>
            <div className="mt-12"><GuideSection /></div>
        </>}
        {activeView === 'tracker' && <JobTrackerBoard applications={jobApplications} onAddApplication={handleAddApplication} onUpdateApplication={handleUpdateApplication} onDeleteApplication={handleDeleteApplication} />}
        {activeView === 'trends' && <MarketAnalysisSection />}
      </main>
      <ChatBot user={user} />
      <ConfirmationModal isOpen={isConfirmModalOpen} onClose={() => setIsConfirmModalOpen(false)} onConfirm={handleConfirmAnalyze} title="Confirm Company Name"><p className="text-sm text-slate-400">Optimizing for: <strong className="text-emerald-400 block text-lg my-2 bg-slate-800 p-2 rounded text-center">{companyName}</strong></p></ConfirmationModal>
      <CompanyConflictModal
        isOpen={conflictModalOpen}
        onClose={() => { setConflictModalOpen(false); setPendingAutoApplyJob(null); }}
        onConfirm={() => {
          setConflictModalOpen(false);
          if (pendingAutoApplyJob) {
            const job = pendingAutoApplyJob;
            setPendingAutoApplyJob(null);
            performAutoApply(job);
          } else {
            handleConfirmAnalyze();
          }
        }}
        conflictData={conflictData}
      />
      {limitModalOpen && (
        <div className="fixed inset-0 bg-black/80 z-[70] flex items-center justify-center p-4">
          <div className="bg-slate-800 border border-indigo-500/50 rounded-xl shadow-2xl max-w-lg w-full p-6">
            <h2 className="text-xl font-bold text-white mb-3">Your free resume build is complete</h2>
            <p className="text-slate-300 text-sm leading-relaxed">
              Your first resume generation is completely free. Continued access to our premium resume building services—including the ability to generate multiple resumes tailored to specific Job Descriptions—requires an active paid subscription. By upgrading to a premium plan, you agree to our recurring billing terms as outlined in our Pricing Policy.
            </p>
            <div className="mt-6 flex justify-end gap-3">
              <button onClick={() => setLimitModalOpen(false)} className="px-4 py-2 rounded bg-slate-700 text-slate-200">Close</button>
              <button onClick={() => { setLimitModalOpen(false); onManageSubscription(); }} className="px-4 py-2 rounded bg-indigo-600 hover:bg-indigo-500 text-white font-bold">View paid plans</button>
            </div>
          </div>
        </div>
      )}
      <ReviewsSection />
      <footer className="text-center p-6 bg-slate-900/80 border-t border-slate-800 text-slate-500 text-xs mb-safe">
        <p className="mb-2">Powered by ScaleupResume AI</p>
        <p>ATS compatibility varies by employer and software provider. We do not guarantee employment or interviews.</p>
        <button onClick={() => setActiveLegalModal('terms')} className="mt-2 text-indigo-300 hover:text-indigo-200 underline">Terms of Service</button>
      </footer>
      <LegalModal isOpen={activeLegalModal !== null} onClose={() => setActiveLegalModal(null)} type={activeLegalModal || 'terms'} />
    </div>
  );
};

export default App;
