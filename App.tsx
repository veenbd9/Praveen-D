
import React, { useState, useCallback, useEffect, useRef } from 'react';
import { Header } from './components/Header';
import { InputSection } from './components/InputSection';
import { ResultsSection } from './components/ResultsSection';
import { Loader } from './components/Loader';
import { AnalysisResult, SavedResume, User, GeneratedResume, JobApplication, JobPosting, CompanyConflictResult } from './types';
import { analyzeAndOptimizeResume, fetchJdFromUrl, analyzeResumeOnly, analyzeResumeGeneralHealth, detectCompanyConflict } from './services/geminiService';
import { GuideSection } from './components/GuideSection';
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
  const [activeView, setActiveView] = useState<'health-check' | 'optimizer' | 'tracker' | 'jobs' | 'trends'>('health-check');
  const [resumeText, setResumeText] = useState<string>('');
  const [jobDescriptionText, setJobDescriptionText] = useState<string>('');
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
  const [adminViewMode, setAdminViewMode] = useState<'admin' | 'user'>('admin');
  const [activeLegalModal, setActiveLegalModal] = useState<'privacy' | 'terms' | null>(null);

  useEffect(() => {
    try {
      const storedResumes = localStorage.getItem('savedResumes');
      let loadedResumes: SavedResume[] = [];
      if (storedResumes) loadedResumes = JSON.parse(storedResumes);
      if (user.email === 'veenbd9@gmail.com' || user.email.startsWith('Test')) {
         const defaultResumeId = 999999999;
         if (!loadedResumes.some(r => r.id === defaultResumeId)) {
             const defaultResume: SavedResume = { id: defaultResumeId, name: "Default Profile", content: DEFAULT_RESUME_CONTENT, status: 'ACTIVE' };
             loadedResumes = [defaultResume, ...loadedResumes];
             localStorage.setItem('savedResumes', JSON.stringify(loadedResumes));
         }
      }
      setSavedResumes(loadedResumes);
      const storedHistory = localStorage.getItem('generated_resumes_history');
      if (storedHistory) setApplicationHistory(JSON.parse(storedHistory));
      const storedApps = localStorage.getItem(`job_tracker_${user.email}`);
      if (storedApps) setJobApplications(JSON.parse(storedApps));
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

  const handleSaveResume = useCallback((newResume: SavedResume) => {
    setSavedResumes(prevResumes => {
      if (prevResumes.some(r => r.content === newResume.content && r.status === 'ACTIVE')) return prevResumes;
      const updatedResumes: SavedResume[] = [{ ...newResume, status: 'ACTIVE' }, ...prevResumes]; 
      localStorage.setItem('savedResumes', JSON.stringify(updatedResumes));
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
          const updatedResumes: SavedResume[] = prevResumes.map(r => r.id === resumeId ? { ...r, status: (r.status === 'ACTIVE' ? 'SUSPEND' : 'ACTIVE') as 'ACTIVE' | 'SUSPENDED' } : r);
          localStorage.setItem('savedResumes', JSON.stringify(updatedResumes));
          return updatedResumes;
      });
  }, []);

  const saveTrackerData = (apps: JobApplication[]) => {
      setJobApplications(apps);
      localStorage.setItem(`job_tracker_${user.email}`, JSON.stringify(apps));
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

  const handleTrackJobFromSearch = useCallback((job: JobPosting) => {
      const newApp: JobApplication = { id: `JOB_${Date.now()}`, company: job.company, position: job.title, location: job.location, status: 'BOOKMARKED', dateAdded: Date.now(), lastUpdated: Date.now(), url: job.applyUrl, notes: `Source: ${job.source}` };
      saveTrackerData([newApp, ...jobApplications]);
  }, [jobApplications, user.email]);

  const handleFetchJd = useCallback(async (url: string) => {
    if (!url) return setError('URL required.');
    setIsFetchingJd(true);
    try { setJobDescriptionText(await fetchJdFromUrl(url)); } catch (err: any) { setError(err.message); } finally { setIsFetchingJd(false); }
  }, []);
  
  const handleAnalyze = useCallback(async () => {
    if (!resumeText || !jobDescriptionText || !companyName) return setError('Missing info.');
    if (user.subscription.planType === 'free' && user.subscription.usageCount >= 3 && !user.isAdmin) return setLimitModalOpen(true);
    setIsLoading(true);
    try {
        const historyCompanies: string[] = Array.from(new Set(applicationHistory.map(h => h.companyName)));
        const conflict = await detectCompanyConflict(companyName, historyCompanies);
        setIsLoading(false);
        if (conflict.hasConflict) { setConflictData(conflict); setConflictModalOpen(true); } else { setIsConfirmModalOpen(true); }
    } catch (e) { setIsLoading(false); setIsConfirmModalOpen(true); }
  }, [resumeText, jobDescriptionText, companyName, user.subscription, user.isAdmin, applicationHistory]);

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
      if (!user.isAdmin && user.subscription.planType === 'free') {
          currentUserState = { ...currentUserState, subscription: { ...currentUserState.subscription, usageCount: currentUserState.subscription.usageCount + 1 } };
          onUpdateUser(currentUserState);
      }
      const result = await analyzeAndOptimizeResume(resumeText, jobDescriptionText);
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
      if (user.isAdmin || user.email.startsWith('Test')) { handleSaveResume({ id: Date.now(), name: `Optimized - ${currentCompanyName}`, content: result.optimizedResume, status: 'ACTIVE' }); }
    } catch (err: any) { setError(err.message); } finally { setIsLoading(false); }
  }, [resumeText, jobDescriptionText, user, onUpdateUser, companyName, jobTitle, handleSaveResume]);

  const handleScanOnly = useCallback(async () => {
    if (!resumeText || !jobDescriptionText || !companyName) return setError('Missing info.');
    setIsLoading(true);
    try { const result = await analyzeResumeOnly(resumeText, jobDescriptionText); setAnalysisResult(result); setAnalyzedCompanyName(companyName); } catch (err: any) { setError(err.message); } finally { setIsLoading(false); }
  }, [resumeText, jobDescriptionText, companyName]);

  const handleHealthCheck = useCallback(async () => {
      if (!resumeText) return setError('Resume required.');
      setIsLoading(true); setCompanyName(''); setJobDescriptionText(''); setAnalyzedCompanyName('Health Check');
      try { setAnalysisResult(await analyzeResumeGeneralHealth(resumeText)); } catch (err: any) { setError(err.message); } finally { setIsLoading(false); }
  }, [resumeText]);
  
  const handleLoadHistory = useCallback((item: GeneratedResume) => {
      setAnalysisResult(item.analysisResult); setAnalyzedCompanyName(item.companyName); setJobTitle(item.jobTitle);
      if (item.jobDescription) setJobDescriptionText(item.jobDescription);
      setActiveView('optimizer');
      setTimeout(() => resultsRef.current?.scrollIntoView({ behavior: 'smooth' }), 100);
  }, []);

  const isFreePlan = user.subscription.planType === 'free';
  const canSeePricing = !isFreePlan || user.subscription.usageCount >= 3 || user.isAdmin;

  return (
    <div className="min-h-screen bg-transparent text-slate-200 font-sans flex flex-col pt-safe pb-safe pl-safe pr-safe">
      <div className="sticky top-0 z-20">
         <Header userName={user.name} isAdmin={user.isAdmin} onLogout={onLogout} viewMode={adminViewMode} onToggleViewMode={() => setAdminViewMode(prev => prev === 'admin' ? 'user' : 'admin')} onManageSubscription={canSeePricing ? onManageSubscription : undefined} />
      </div>
      <div className="bg-gradient-to-r from-emerald-700 via-teal-600 to-cyan-600 shadow-xl border-b border-emerald-400/30 sticky top-[72px] z-10">
          <div className="container mx-auto px-4 py-3 flex space-x-4 overflow-x-auto pb-2 scrollbar-hide">
              <button onClick={() => setActiveView('health-check')} className={`flex-shrink-0 px-6 py-3 rounded-full font-bold shadow-lg transition-all duration-300 ${activeView === 'health-check' ? 'bg-white text-emerald-700 scale-105 ring-4 ring-emerald-300' : 'bg-emerald-800/40 text-emerald-100 hover:bg-emerald-500 hover:text-white'}`}>Health Check</button>
              <button onClick={() => setActiveView('optimizer')} className={`flex-shrink-0 px-6 py-3 rounded-full font-bold shadow-lg transition-all duration-300 ${activeView === 'optimizer' ? 'bg-gradient-to-r from-pink-500 to-rose-500 text-white scale-105 ring-4 ring-pink-300' : 'bg-emerald-800/40 text-emerald-100 hover:bg-emerald-500 hover:text-white'}`}>Optimizer</button>
              <button onClick={() => setActiveView('tracker')} className={`flex-shrink-0 px-6 py-3 rounded-full font-bold shadow-lg transition-all duration-300 ${activeView === 'tracker' ? 'bg-white text-emerald-700 scale-105 ring-4 ring-emerald-300' : 'bg-emerald-800/40 text-emerald-100 hover:bg-emerald-500 hover:text-white'}`}>Tracker</button>
              <button onClick={() => setActiveView('jobs')} className={`flex-shrink-0 px-6 py-3 rounded-full font-bold shadow-lg transition-all duration-300 ${activeView === 'jobs' ? 'bg-white text-emerald-700 scale-105 ring-4 ring-emerald-300' : 'bg-emerald-800/40 text-emerald-100 hover:bg-emerald-500 hover:text-white'}`}>Jobs</button>
              <button onClick={() => setActiveView('trends')} className={`flex-shrink-0 px-6 py-3 rounded-full font-bold shadow-lg transition-all duration-300 ${activeView === 'trends' ? 'bg-white text-emerald-700 scale-105 ring-4 ring-emerald-300' : 'bg-emerald-800/40 text-emerald-100 hover:bg-emerald-500 hover:text-white'}`}>Trends</button>
          </div>
      </div>
      {isFreePlan && !user.isAdmin && <div className="bg-gradient-to-r from-emerald-900/90 to-teal-900/90 border-b border-teal-500/30 text-center py-2 px-4 backdrop-blur-md"><p className="text-sm text-teal-200"><strong>{3 - user.subscription.usageCount}</strong> free scans remaining. {canSeePricing && <button onClick={onManageSubscription} className="ml-3 font-bold underline">Upgrade for Unlimited</button>}</p></div>}
      <main className="container mx-auto p-4 md:p-8 flex-grow">
        {activeView === 'health-check' && <HealthCheckView resumeText={resumeText} setResumeText={setResumeText} onAnalyze={handleHealthCheck} isLoading={isLoading} result={analysisResult} onContinueToOptimizer={() => setActiveView('optimizer')} onReset={() => { setResumeText(''); setAnalysisResult(null); }} userEmail={user.email} isAdmin={user.isAdmin} />}
        {activeView === 'optimizer' && <>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                <InputSection resumeText={resumeText} setResumeText={setResumeText} jobDescriptionText={jobDescriptionText} setJobDescriptionText={setJobDescriptionText} companyName={companyName} setCompanyName={setCompanyName} jobTitle={jobTitle} setJobTitle={setJobTitle} onAnalyze={handleAnalyze} onScan={handleScanOnly} onHealthCheck={handleHealthCheck} onFetchJd={handleFetchJd} isLoading={isLoading} isFetchingJd={isFetchingJd} savedResumes={savedResumes.filter(r => r.status === 'ACTIVE')} onSaveResume={handleSaveResume} onDeleteResume={handleSuspendResume} />
                <div className="flex flex-col space-y-8" ref={resultsRef}>{isLoading && <div className="flex flex-col items-center justify-center p-8 h-full"><Loader /><p className="text-lg text-emerald-400 mt-4">Securing your future...</p></div>}
                {error && <div className="bg-red-900/90 border border-red-700 text-red-100 px-4 py-3 rounded-lg"><strong>Error: </strong>{error}</div>}
                {analysisResult && !isLoading && <ResultsSection result={analysisResult} candidateName={analysisResult.candidateName} companyName={analyzedCompanyName || companyName} planType={user.subscription.planType} jobDescription={jobDescriptionText} showDeepDive={user.isAdmin || user.email.startsWith('Test')} onSaveToProfile={(content, name) => handleSaveResume({ id: Date.now(), name, content, status: 'ACTIVE' })} />}
                {!analysisResult && !isLoading && <div className="flex flex-col items-center justify-center bg-slate-900/85 border-2 border-dashed border-slate-600 rounded-lg p-8 h-full text-center"><h3>Optimize for 95%+ Success</h3><p className="text-slate-400 mt-2">Enter the Job Description to secure your future.</p></div>}</div>
            </div>
            {!user.isAdmin && <FinancialDashboard user={user} />}
            {user.isAdmin && adminViewMode === 'admin' && <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mt-8"><AdminDbView savedResumes={savedResumes} onToggleStatus={handleToggleResumeStatus} /><AdminFinanceView /></div>}
            <div className="mt-12"><HistorySection history={applicationHistory} currentUserEmail={user.email} onLoadHistory={handleLoadHistory} /></div>
            <div className="mt-12"><GuideSection /></div>
        </>}
        {activeView === 'tracker' && <JobTrackerBoard applications={jobApplications} onAddApplication={handleAddApplication} onUpdateApplication={handleUpdateApplication} onDeleteApplication={handleDeleteApplication} />}
        {activeView === 'jobs' && <JobSearchSection candidateName={user.name} onTrackJob={handleTrackJobFromSearch} />}
        {activeView === 'trends' && <MarketAnalysisSection />}
      </main>
      <ChatBot user={user} />
      <ConfirmationModal isOpen={isConfirmModalOpen} onClose={() => setIsConfirmModalOpen(false)} onConfirm={handleConfirmAnalyze} title="Confirm Company Name"><p className="text-sm text-slate-400">Optimizing for: <strong className="text-emerald-400 block text-lg my-2 bg-slate-800 p-2 rounded text-center">{companyName}</strong></p></ConfirmationModal>
      <CompanyConflictModal isOpen={conflictModalOpen} onClose={() => setConflictModalOpen(false)} onConfirm={handleConfirmAnalyze} conflictData={conflictData} />
      <footer className="text-center p-6 bg-slate-900/80 border-t border-slate-800 text-slate-500 text-xs mb-safe"><p className="mb-2">Powered by ScaleupResume AI</p></footer>
    </div>
  );
};

export default App;
