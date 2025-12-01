
import React, { useState, useCallback, useEffect, useRef } from 'react';
import { Header } from './components/Header';
import { InputSection } from './components/InputSection';
import { ResultsSection } from './components/ResultsSection';
import { Loader } from './components/Loader';
import { AnalysisResult, SavedResume, User, GeneratedResume, JobApplication, JobPosting } from './types';
import { analyzeAndOptimizeResume, fetchJdFromUrl, analyzeResumeOnly, analyzeResumeGeneralHealth } from './services/geminiService';
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

interface AppProps {
  user: User;
  onLogout: () => void;
  onManageSubscription: () => void;
  onUpdateUser: (user: User) => void;
}

const DEFAULT_RESUME_CONTENT = `Praveen Babu Dupaki +91 9849734395
Supply Chain/Procurement Manager | Strategic Leader veenbd9@gmail.com
| Operations | Driving Process Excellence Hyderabad, TS, 500050

Key Skills & Expertise
Procurement Powerhouse: Slashed supplier costs 20% by implementing value-driven sourcing strategies and negotiating win-win contracts. Boosted team productivity 15% by building high-performing units, fostering collaboration, and delegating effectively.
Project Execution Expert: Delivered 100% of projects on time and within budget, ensuring operational efficiency and cost control.
Lean Six Sigma Champion: Reduced process waste by 30% through Green Belt certified initiatives, optimizing efficiency and saving costs.
Process Improvement Innovator: Streamlined operations and gained 18% efficiency by identifying and implementing strategic process improvements.
Tech-Savvy & Results-Oriented: Proficient in MS Excel, business systems, and cybersecurity principles. Skilled in crafting contracts, setting up sourcing plans, and securing favorable negotiations.
Customer Advocate: Elevated customer satisfaction by 12% by resolving issues efficiently and maintaining positive Relationships.

SUMMARY
20+ Years Operations Mastermind: Orchestrate success across Supply Chain/Procurement projects, processes, & teams. Consistently delivered on business plans with 100% on-time, on-budget execution. Proven expertise in: Lean Management: Streamlined operations, boosted production, & slashed cycle times. Team Leadership: Built high- performing teams, exceeding goals & fostering collaboration. Innovation & Improvement: Implemented standardized processes, developed SOPs, & drove business excellence. Customer Service Champion: Cultivated positive relationships, enhancing satisfaction. Financial Acumen: Proficient in P&L management & business math, ensuring cost-effective operations. A reliable & collaborative leader passionate about driving results. Ready to elevate your organization.

EXPERIENCE
Site Procurement Manager- Amazon.com Portland, OR Oct 2021 to Dec 2024
● 15% Inventory Accuracy: Eliminated discrepancies with barcodes & revised counting, minimizing order errors.
● 20% Inventory Turnover Boost: ABC analysis & optimized safety stock sped sales, lowered carrying costs.
● 10% Cost Reduction: Redesigned layout with 3PLs, maximizing space & cutting unnecessary rentals.
● $50,000 Cost Savings: Unearthed hidden spending, negotiated better terms, optimized purchase orders.
● 25% Lead Time Improvement: Proactive vendor communication & logistics collaboration ensured on-time Deliveries.
● 95% Accurate Predictive Inventory Model: Machine learning prevented stockouts & optimized purchase orders.
● Mentored & Grew Team 10%: Onboarded and trained new analyst, boosting overall productivity.
● Secured Funding for Inventory Optimization Software: Presented compelling proposal, projected substantial ROI.
● 5+ years' experience managing project procurement, spanning equipment/materials and subcontracting, for warehouse construction projects exceeding $30M.
● Experienced in sourcing and managing critical equipment: Inverters, PCS & BESS
● Solid knowledge of contract management: Negotiation, drafting, change order management, and ensuring compliance.
● Skilled in supplier review and evaluation: Building strong relationships while securing optimal terms.
● Adept at problem-solving: Identifying, investigating, and resolving issues efficiently in a fast-paced environment.
● Purchasing: Queue, submissions, completeness, accuracy, documentation, prior pricing, historical spend analysis, pricing models, contracts, substitute, negotiations, reports, status, priorities.
● Collaboration: Internal users, departments, leadership, product requirements, alternatives.

Business Continuity Analyst, Amazon Inc. Jan 2019 to Oct 2021
● Slashed incident response time by 25% via efficient notification and action protocols.
● Enhanced crisis communication by 30% through clear updates and stakeholder transparency.
● Boosted risk mitigation and compliance by implementing new security risk assessment procedures.
● Streamlined critical incident reporting by 30%, reducing reporting times significantly.

Data Analyst, Amazon Inc. Sep 2017 to Dec 2018
● Compliance Champion: Defused SOX risks in the warehouse by identifying and resolving compliance issues, ensuring a successful audit.
● Operational Efficiency Architect: Unified data collection and reporting across centers, boosting operational efficiency and empowering data-driven decision-making.
● Process Optimization Dynamo: Crafted data-driven solutions for business process optimization unlocking a 10% productivity increase.
● Data Communication Ace: Clearly and concisely translated complex data insights to project teams and stakeholders, facilitating informed collaboration.

Additional Experience:
Logistics Project Manager, Grill Daddy Brush Company Apr 2017 - Jun 2017
● Streamlined workflows: Designed content, SOPs, and daily reports for improved efficiency.
● Optimized production: Managed brush designs, approvals, test activities, and production stages.
● Data-driven decisions: Coordinated and analyzed engineering test results to inform strategic planning.
● Logistics mastermind: Strategically managed warehouse, transportation, and customer services.
● Quality champion: Trained staff and tracked quality, quantity, stock levels, delivery times, and costs.

Xceed Technologies INC, Project Manager Trainee Dec 2016 - Mar 2017
● Gained valuable experience in SaaS and call center support, mastering best practices and exceeding customer expectations.
● Developed strong technical and problem-solving skills, tackling complex issues with a logical approach.
● Thrived in a fast-paced environment, collaborating effectively and owning product areas.
● Possess deep understanding of HME/DME, medical billing, and Home Health, adding valuable industry insights.

University of Bridgeport, Project Manager UB Bookstore Jul 2015 - Sep 2016
● Led bookstore operations for 3 semesters, managing web orders, stock registers, and customer service 
● Streamlined pre-ordering and invoice generation for sales and operations teams.

ICICI Securities – India, Product & Project Manager Feb 2004 - Oct 2007 & Jun 2010 - Dec 2014
● Analyzed customer needs and provided comprehensive financial guidance.
● Developed customized solutions for high-balance clients, fostering positive relationships.
● Headed 23 branch operations and managed a team of 250+, driving sales growth.
● Possess extensive training and motivational skills, effectively leading and empowering teams.

Reliance Capital – Cluster Head, Oct 2007 - Sep 2009
● Led a team of 70-85 across 7 branches, achieving revenue success in Andhra Pradesh.
● Oversaw KYC, equity accounts, insurance, mutual funds, gold retailing, and training programs.
● Developed process manuals, content for call centers, and training programs for derivatives trading.

EDUCATION
Ottawa University: MBA, IT (2019 – 2021), Cyber Security Professional Course September 2022. (Profession Course)
University of Bridgeport: Master of Science - MS, Supply Chain & Project Management (2015 – 2016)

Key Skills
Project Management: Project Execution, Budget Control, Timeline Management, ROI Analysis, Stakeholder Management, SOP Development, Resource Allocation, Agile Methodologies, Project Planning.
Process Improvement: Lean Six Sigma (Green Belt), Process Optimization, Workflow Streamlining, Business Process Re-engineering, Operational Efficiency, Continuous Improvement.
Data Analysis & Systems: MS Excel, Business Systems, Cybersecurity Principles, Predictive Modeling, Machine Learning Concepts, Data Collection, Reporting, Data Interpretation, ATS Optimization.
Leadership & Communication: Team Leadership, Mentoring, Cross-functional Collaboration, Crisis Communication, Stakeholder Transparency, Customer Advocacy, Financial Acumen, P&L Management, Business Math, Problem-Solving, Strategic Planning, Negotiation.
Risk Management: Business Continuity Planning, Incident Response, Risk Mitigation, Compliance (SOX), Security Risk Assessment and Negotiable
`;

const App: React.FC<AppProps> = ({ user, onLogout, onManageSubscription, onUpdateUser }) => {
  // CHANGED: Default view is now 'health-check'
  const [activeView, setActiveView] = useState<'health-check' | 'optimizer' | 'tracker' | 'jobs' | 'trends'>('health-check');

  const [resumeText, setResumeText] = useState<string>('');
  const [jobDescriptionText, setJobDescriptionText] = useState<string>('');
  const [companyName, setCompanyName] = useState<string>('');
  const [analyzedCompanyName, setAnalyzedCompanyName] = useState<string>(''); // Persist company name for results
  const [jobTitle, setJobTitle] = useState<string>('');
  const [analysisResult, setAnalysisResult] = useState<AnalysisResult | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [isFetchingJd, setIsFetchingJd] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [savedResumes, setSavedResumes] = useState<SavedResume[]>([]);
  const [applicationHistory, setApplicationHistory] = useState<GeneratedResume[]>([]);
  
  // Job Tracker State
  const [jobApplications, setJobApplications] = useState<JobApplication[]>([]);

  const [isConfirmModalOpen, setIsConfirmModalOpen] = useState<boolean>(false);
  const [limitModalOpen, setLimitModalOpen] = useState<boolean>(false);
  
  const resultsRef = useRef<HTMLDivElement>(null);

  // Warning Modals
  const [warningModalOpen, setWarningModalOpen] = useState<boolean>(false);
  const [warningMessage, setWarningMessage] = useState<string>('');

  // Admin View Mode Toggle (for Super User to switch between Admin and Test User view)
  const [adminViewMode, setAdminViewMode] = useState<'admin' | 'user'>('admin');

  // Legal Modals
  const [activeLegalModal, setActiveLegalModal] = useState<'privacy' | 'terms' | null>(null);

  useEffect(() => {
    try {
      const storedResumes = localStorage.getItem('savedResumes');
      let loadedResumes: SavedResume[] = [];
      if (storedResumes) {
        loadedResumes = JSON.parse(storedResumes);
      }

      // INJECT DEFAULT RESUME FOR SUPER USER AND TEST ACCOUNTS
      if (user.email === 'veenbd9@gmail.com' || user.email.startsWith('Test')) {
         const defaultResumeId = 999999999; // Fixed ID for default
         const exists = loadedResumes.some(r => r.id === defaultResumeId);
         
         if (!exists) {
             const defaultResume: SavedResume = {
                 id: defaultResumeId,
                 name: "Default Profile - Praveen Babu Dupaki",
                 content: DEFAULT_RESUME_CONTENT,
                 status: 'ACTIVE'
             };
             // Add to top
             loadedResumes = [defaultResume, ...loadedResumes];
             localStorage.setItem('savedResumes', JSON.stringify(loadedResumes));
         }
      }
      setSavedResumes(loadedResumes);

      // LOAD APPLICATION HISTORY
      const storedHistory = localStorage.getItem('generated_resumes_history');
      if (storedHistory) {
          setApplicationHistory(JSON.parse(storedHistory));
      }

      // LOAD JOB TRACKER DATA (Per User)
      const storedApps = localStorage.getItem(`job_tracker_${user.email}`);
      if (storedApps) {
          setJobApplications(JSON.parse(storedApps));
      }

    } catch (error) {
      console.error("Failed to load data from localStorage", error);
    }
  }, [user.email]);

  const handleSaveResume = useCallback((newResume: SavedResume) => {
    setSavedResumes(prevResumes => {
      if (prevResumes.some(r => r.content === newResume.content && r.status === 'ACTIVE')) {
        return prevResumes;
      }
      // Ensure new resume is active
      const resumeWithStatus: SavedResume = { ...newResume, status: 'ACTIVE' };
      const updatedResumes = [resumeWithStatus, ...prevResumes]; 
      localStorage.setItem('savedResumes', JSON.stringify(updatedResumes));
      return updatedResumes;
    });
  }, []);

  const handleSuspendResume = useCallback((resumeId: number) => {
    setSavedResumes(prevResumes => {
      const updatedResumes = prevResumes.map(r => 
        r.id === resumeId ? { ...r, status: 'SUSPENDED' as const } : r
      );
      localStorage.setItem('savedResumes', JSON.stringify(updatedResumes));
      return updatedResumes;
    });
  }, []);

  const handleToggleResumeStatus = useCallback((resumeId: number) => {
      setSavedResumes(prevResumes => {
          const updatedResumes = prevResumes.map(r => {
             if (r.id === resumeId) {
                 const newStatus: 'ACTIVE' | 'SUSPENDED' = r.status === 'ACTIVE' ? 'SUSPENDED' : 'ACTIVE';
                 return { ...r, status: newStatus };
             }
             return r;
          });
          localStorage.setItem('savedResumes', JSON.stringify(updatedResumes));
          return updatedResumes;
      });
  }, []);

  // --- JOB TRACKER HANDLERS ---
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
      const app: JobApplication = {
          ...newApp,
          id: `JOB_${Date.now()}`,
          dateAdded: Date.now(),
          lastUpdated: Date.now()
      };
      const newApps = [app, ...jobApplications];
      saveTrackerData(newApps);
  }, [jobApplications, user.email]);

  const handleTrackJobFromSearch = useCallback((job: JobPosting) => {
      const newApp: JobApplication = {
          id: `JOB_${Date.now()}`,
          company: job.company,
          position: job.title,
          location: job.location,
          status: 'BOOKMARKED',
          dateAdded: Date.now(),
          lastUpdated: Date.now(),
          url: job.applyUrl,
          notes: `Source: ${job.source}\nDescription: ${job.description.substring(0, 100)}...`
      };
      const newApps = [newApp, ...jobApplications];
      saveTrackerData(newApps);
  }, [jobApplications, user.email]);

  // ---------------------------

  const handleFetchJd = useCallback(async (url: string) => {
    if (!url) {
      setError('Please provide a valid URL.');
      return;
    }
    setIsFetchingJd(true);
    setError(null);
    try {
      const jdText = await fetchJdFromUrl(url);
      setJobDescriptionText(jdText);
    } catch (err: any) {
      console.error(err);
      setError(err.message || 'Failed to fetch job description.');
    } finally {
      setIsFetchingJd(false);
    }
  }, []);
  
  const handleAnalyze = useCallback(() => {
    if (!resumeText || !jobDescriptionText) {
      setError('Please provide both a resume and a job description.');
      return;
    }
    if (!companyName) {
      setError('Please provide a company name.');
      return;
    }

    // Check Free Tier Limits (Basic = 3 Limit)
    if (user.subscription.planType === 'free' && user.subscription.usageCount >= 3 && !user.isAdmin) {
        setLimitModalOpen(true);
        return;
    }

    setError(null);
    setIsConfirmModalOpen(true);
  }, [resumeText, jobDescriptionText, companyName, user.subscription, user.isAdmin]);

  const checkNameMatch = (accountName: string, resumeName: string): boolean => {
      // Simple fuzzy match: Check if First Name matches
      const normalize = (s: string) => s.toLowerCase().trim().replace(/[^a-z ]/g, '');
      const accParts = normalize(accountName).split(' ');
      const resParts = normalize(resumeName).split(' ');
      
      // If the resume name is "Candidate" (default fallback), ignore comparison
      if (resumeName === "Candidate") return true;

      // Check if any part of the account name is present in the resume name (or vice versa)
      // This handles "Praveen Dupaki" vs "Dupaki Praveen" vs "Mr. Praveen"
      const matchFound = accParts.some(part => part.length > 2 && resParts.includes(part));
      return matchFound;
  };

  const handleConfirmAnalyze = useCallback(async () => {
    setIsConfirmModalOpen(false);
    setIsLoading(true);
    setError(null);
    setAnalysisResult(null);

    const currentCompanyName = companyName; // Capture before clearing
    const currentJobDescription = jobDescriptionText; // Capture JD

    try {
      // Increment usage for free tier
      let currentUserState = { ...user };

      if (!user.isAdmin && user.subscription.planType === 'free') {
          currentUserState = { 
              ...currentUserState, 
              subscription: { 
                  ...currentUserState.subscription, 
                  usageCount: currentUserState.subscription.usageCount + 1 
              } 
          };
          onUpdateUser(currentUserState);
      }

      const result = await analyzeAndOptimizeResume(resumeText, jobDescriptionText);
      
      // --- SECURITY CHECK: Resume Name Mismatch ---
      const isMatch = checkNameMatch(currentUserState.name, result.candidateName);
      
      if (!isMatch) {
          const newCount = (currentUserState.resumeMismatchCount || 0) + 1;
          currentUserState = { ...currentUserState, resumeMismatchCount: newCount };
          onUpdateUser(currentUserState);

          if (newCount >= 5) {
              setWarningMessage("Please refrain using other resume to generate ATS resumes. This is a breach of contract and may lead to account termination.");
              setWarningModalOpen(true);
          }
      }

      setAnalysisResult(result);
      setAnalyzedCompanyName(currentCompanyName); // Persist for ResultsSection
      setCompanyName(''); // Clear company name on success
      
      // AUTO-SAVE TO HISTORY
      const newHistoryItem: GeneratedResume = {
          id: Date.now().toString(),
          userId: user.email,
          timestamp: Date.now(),
          companyName: currentCompanyName,
          jobTitle: jobTitle,
          analysisResult: result,
          jobDescription: currentJobDescription // Save JD for context
      };
      
      setApplicationHistory(prev => {
          const updated = [newHistoryItem, ...prev];
          localStorage.setItem('generated_resumes_history', JSON.stringify(updated));
          return updated;
      });

      // AUTO-SAVE Optimized Resume for Admin/Test users to Saved Resumes list
      if (user.isAdmin || user.email.startsWith('Test')) {
          const autoSaveName = `Optimized - ${currentCompanyName} (${new Date().toLocaleTimeString()})`;
          handleSaveResume({
              id: Date.now() + Math.floor(Math.random() * 1000), // Ensure distinct ID
              name: autoSaveName,
              content: result.optimizedResume,
              status: 'ACTIVE'
          });
      }

    } catch (err: any) {
      console.error(err);
      setError(err.message || 'Failed to analyze resume.');
    } finally {
      setIsLoading(false);
    }
  }, [resumeText, jobDescriptionText, user, onUpdateUser, companyName, jobTitle, handleSaveResume]);

  const handleScanOnly = useCallback(async () => {
    if (!resumeText || !jobDescriptionText || !companyName) {
        setError('Please provide a resume, job description, and company name.');
        return;
    }
    
    setIsLoading(true);
    setError(null);
    setAnalysisResult(null);
    
    try {
        const result = await analyzeResumeOnly(resumeText, jobDescriptionText);
        setAnalysisResult(result);
        setAnalyzedCompanyName(companyName);
        // Do not consume free credits for quick scan (or consume less if this was real prod)
    } catch (err: any) {
         console.error(err);
         setError(err.message || 'Failed to scan resume.');
    } finally {
        setIsLoading(false);
    }
  }, [resumeText, jobDescriptionText, companyName]);

  const handleHealthCheck = useCallback(async () => {
      if (!resumeText) {
          setError('Please upload or paste a resume first.');
          return;
      }

      setIsLoading(true);
      setError(null);
      setAnalysisResult(null);
      // Clear specific job fields for clarity in this mode
      setCompanyName('');
      setJobDescriptionText(''); 
      setAnalyzedCompanyName('General Health Check');

      try {
          const result = await analyzeResumeGeneralHealth(resumeText);
          setAnalysisResult(result);
      } catch (err: any) {
          console.error(err);
          setError(err.message || 'Failed to perform health check.');
      } finally {
          setIsLoading(false);
      }
  }, [resumeText]);
  
  const handleHealthCheckReset = useCallback(() => {
    setResumeText('');
    setAnalysisResult(null);
    setError(null);
  }, []);

  const handleLoadHistory = useCallback((item: GeneratedResume) => {
      setAnalysisResult(item.analysisResult);
      setAnalyzedCompanyName(item.companyName);
      setJobTitle(item.jobTitle);
      if (item.jobDescription) {
          setJobDescriptionText(item.jobDescription);
      }
      
      // Smooth scroll to results
      setActiveView('optimizer');
      if (resultsRef.current) {
          resultsRef.current.scrollIntoView({ behavior: 'smooth' });
      } else {
          // Fallback if ref isn't ready immediately
          setTimeout(() => {
               document.getElementById('results-section')?.scrollIntoView({ behavior: 'smooth' });
          }, 100);
      }
  }, []);

  const handleContinueToOptimizer = useCallback(() => {
      setAnalysisResult(null); // Clear the generic health check result
      setJobDescriptionText(''); // Ensure JD is empty for new input
      setActiveView('optimizer');
      window.scrollTo(0, 0);
  }, []);

  // For regular users, we only show ACTIVE resumes
  const activeResumes = savedResumes.filter(r => r.status === 'ACTIVE');
  
  // Is on Free Plan?
  const isFreePlan = user.subscription.planType === 'free';

  return (
    <div className="min-h-screen bg-slate-900 text-slate-200 font-sans flex flex-col">
      <Header 
        userName={user.name} 
        isAdmin={user.isAdmin} 
        onLogout={onLogout} 
        viewMode={adminViewMode}
        onToggleViewMode={() => setAdminViewMode(prev => prev === 'admin' ? 'user' : 'admin')}
        onManageSubscription={onManageSubscription}
      />
      
      {/* Navigation Bar */}
      <div className="bg-slate-900 border-b border-slate-800">
          <div className="container mx-auto px-4">
              <div className="flex space-x-8 overflow-x-auto">
                   <button 
                    onClick={() => setActiveView('health-check')}
                    className={`py-4 px-2 border-b-2 font-medium transition-colors whitespace-nowrap ${activeView === 'health-check' ? 'border-teal-500 text-teal-400' : 'border-transparent text-slate-400 hover:text-white'}`}
                  >
                      Resume Health Check
                  </button>
                  <button 
                    onClick={() => setActiveView('optimizer')}
                    className={`py-4 px-2 border-b-2 font-medium transition-colors whitespace-nowrap ${activeView === 'optimizer' ? 'border-indigo-500 text-indigo-400' : 'border-transparent text-slate-400 hover:text-white'}`}
                  >
                      Job-Specific Optimizer
                  </button>
                  <button 
                    onClick={() => setActiveView('tracker')}
                    className={`py-4 px-2 border-b-2 font-medium transition-colors whitespace-nowrap ${activeView === 'tracker' ? 'border-cyan-500 text-cyan-400' : 'border-transparent text-slate-400 hover:text-white'}`}
                  >
                      Job Tracker
                  </button>
                   <button 
                    onClick={() => setActiveView('jobs')}
                    className={`py-4 px-2 border-b-2 font-medium transition-colors whitespace-nowrap ${activeView === 'jobs' ? 'border-emerald-500 text-emerald-400' : 'border-transparent text-slate-400 hover:text-white'}`}
                  >
                      Find Jobs
                  </button>
                  <button 
                    onClick={() => setActiveView('trends')}
                    className={`py-4 px-2 border-b-2 font-medium transition-colors whitespace-nowrap ${activeView === 'trends' ? 'border-purple-500 text-purple-400' : 'border-transparent text-slate-400 hover:text-white'}`}
                  >
                      Market Trends
                  </button>
              </div>
          </div>
      </div>

      {/* Free Plan Banner */}
      {isFreePlan && !user.isAdmin && (
          <div className="bg-gradient-to-r from-purple-900/40 to-indigo-900/40 border-b border-indigo-500/30 text-center py-2 px-4">
              <p className="text-sm text-indigo-200">
                  <span className="font-bold bg-indigo-600 text-white text-xs px-2 py-0.5 rounded mr-2">FREE</span>
                  <strong>{3 - user.subscription.usageCount}</strong> free scans remaining.
                  <button onClick={onManageSubscription} className="ml-3 font-bold underline hover:text-white">Upgrade for Unlimited</button>
              </p>
          </div>
      )}

      <main className="container mx-auto p-4 md:p-8 flex-grow">

        {/* VIEW: HEALTH CHECK LANDING */}
        {activeView === 'health-check' && (
            <HealthCheckView 
                resumeText={resumeText}
                setResumeText={setResumeText}
                onAnalyze={handleHealthCheck}
                isLoading={isLoading}
                result={analysisResult}
                onContinueToOptimizer={handleContinueToOptimizer}
                onReset={handleHealthCheckReset}
                userEmail={user.email}
                isAdmin={user.isAdmin}
            />
        )}
        
        {/* VIEW: RESUME OPTIMIZER */}
        {activeView === 'optimizer' && (
            <>
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                <InputSection
                    resumeText={resumeText}
                    setResumeText={setResumeText}
                    jobDescriptionText={jobDescriptionText}
                    setJobDescriptionText={setJobDescriptionText}
                    companyName={companyName}
                    setCompanyName={setCompanyName}
                    jobTitle={jobTitle}
                    setJobTitle={setJobTitle}
                    onAnalyze={handleAnalyze}
                    onScan={handleScanOnly}
                    onHealthCheck={handleHealthCheck}
                    onFetchJd={handleFetchJd}
                    isFetchingJd={isFetchingJd}
                    isLoading={isLoading}
                    savedResumes={activeResumes}
                    onSaveResume={handleSaveResume}
                    onDeleteResume={handleSuspendResume} 
                />
                <div className="flex flex-col space-y-8" id="results-section" ref={resultsRef}>
                    {isLoading && (
                    <div className="flex flex-col items-center justify-center bg-slate-800/50 rounded-lg p-8 h-full">
                        <Loader />
                        <p className="text-lg text-indigo-400 mt-4 animate-pulse">
                        Analyzing your resume...
                        </p>
                        <p className="text-sm text-slate-400 mt-2">This may take a moment.</p>
                    </div>
                    )}
                    {error && (
                    <div className="bg-red-900/50 border border-red-700 text-red-300 px-4 py-3 rounded-lg" role="alert">
                        <strong className="font-bold">Error: </strong>
                        <span className="block sm:inline">{error}</span>
                    </div>
                    )}
                    {analysisResult && !isLoading && (
                    <ResultsSection 
                        result={analysisResult} 
                        candidateName={analysisResult.candidateName} 
                        companyName={analyzedCompanyName || companyName} // Use persisted name if available
                        planType={user.subscription.planType}
                        jobDescription={jobDescriptionText}
                        showDeepDive={user.isAdmin || user.email.startsWith('Test')}
                        onSaveToProfile={(content, name) => handleSaveResume({
                            id: Date.now(),
                            name: name,
                            content: content,
                            status: 'ACTIVE'
                        })}
                    />
                    )}
                    {!analysisResult && !isLoading && !error && (
                    <div className="flex flex-col items-center justify-center bg-slate-800/50 border-2 border-dashed border-slate-700 rounded-lg p-8 h-full text-center min-h-[200px]">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-16 w-16 text-slate-600 mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                        </svg>
                        <h3 className="text-xl font-semibold text-slate-300">Job-Specific Optimization</h3>
                        <p className="text-slate-400 mt-2">
                            Enter the specific <strong>Job Description (JD)</strong> and Company Name to tailor your resume for a 95%+ Match Score.
                        </p>
                    </div>
                    )}
                </div>
                </div>
                
                {/* Regular User Financial View */}
                {!user.isAdmin && <FinancialDashboard user={user} />}

                {/* Admin Views - Only show if Admin AND in Admin View Mode */}
                {user.isAdmin && adminViewMode === 'admin' && (
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mt-8">
                        <AdminDbView 
                            savedResumes={savedResumes} 
                            onToggleStatus={handleToggleResumeStatus}
                        />
                        <AdminFinanceView />
                    </div>
                )}

                {/* Application History Section - Show for all users */}
                <div className="mt-12">
                    <HistorySection 
                        history={applicationHistory} 
                        currentUserEmail={user.email} 
                        onLoadHistory={handleLoadHistory} 
                    />
                </div>

                <div className="mt-12">
                    <GuideSection />
                </div>
            </>
        )}

        {/* VIEW: JOB TRACKER (KANBAN) */}
        {activeView === 'tracker' && (
            <div className="h-[calc(100vh-200px)]">
                <JobTrackerBoard 
                    applications={jobApplications}
                    onAddApplication={handleAddApplication}
                    onUpdateApplication={handleUpdateApplication}
                    onDeleteApplication={handleDeleteApplication}
                />
            </div>
        )}

        {/* VIEW: JOB SEARCH */}
        {activeView === 'jobs' && (
            <div className="max-w-7xl mx-auto">
                <JobSearchSection 
                    candidateName={user.name} 
                    onTrackJob={handleTrackJobFromSearch}
                />
            </div>
        )}

        {/* VIEW: MARKET TRENDS (REGRESSION ANALYSIS) */}
        {activeView === 'trends' && (
            <div className="max-w-7xl mx-auto">
                <MarketAnalysisSection />
            </div>
        )}

      </main>
      
      <ChatBot user={user} />

      <ConfirmationModal
        isOpen={isConfirmModalOpen}
        onClose={() => setIsConfirmModalOpen(false)}
        onConfirm={handleConfirmAnalyze}
        title="Confirm Company Name"
      >
        <p className="text-sm text-slate-400">
            You are about to optimize your resume for the company:
            <strong className="text-indigo-400 block text-lg my-2 bg-slate-800 p-2 rounded text-center">{companyName}</strong>
            Please confirm you want to proceed.
        </p>
      </ConfirmationModal>

      {/* Limit Reached Modal */}
      <ConfirmationModal
          isOpen={limitModalOpen}
          onClose={() => setLimitModalOpen(false)}
          onConfirm={() => {
              setLimitModalOpen(false);
              onManageSubscription();
          }}
          title="Free Limit Reached"
      >
          <div className="text-center">
              <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-indigo-100 mb-4">
                  <svg className="h-6 w-6 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"></path>
                  </svg>
              </div>
              <p className="text-sm text-slate-400 mb-2">
                  You have used your <strong>3 free scans</strong>.
              </p>
              <p className="text-md text-slate-200 font-semibold">
                  Upgrade to a Premium Plan for unlimited optimizations and cover letters.
              </p>
          </div>
      </ConfirmationModal>

      {/* Breach of Contract Warning Modal */}
       <ConfirmationModal
          isOpen={warningModalOpen}
          onClose={() => setWarningModalOpen(false)}
          onConfirm={() => setWarningModalOpen(false)}
          title="⚠️ Account Warning"
      >
           <div className="text-center">
              <div className="mx-auto flex items-center justify-center h-16 w-16 rounded-full bg-red-900/50 border border-red-500 mb-4">
                  <svg className="h-8 w-8 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                  </svg>
              </div>
              <p className="text-lg text-red-300 font-bold mb-2">
                  Security Alert
              </p>
              <p className="text-sm text-slate-300 leading-relaxed">
                  {warningMessage}
              </p>
          </div>
      </ConfirmationModal>

      <LegalModal 
        isOpen={activeLegalModal !== null} 
        onClose={() => setActiveLegalModal(null)} 
        type={activeLegalModal || 'terms'} 
      />

      <footer className="text-center p-6 bg-slate-900/50 border-t border-slate-800 text-slate-500 text-xs">
        <p className="mb-2">Powered by Gemini API</p>
        <div className="flex justify-center space-x-4">
            <button onClick={() => setActiveLegalModal('terms')} className="hover:text-slate-300 transition-colors">Terms of Service</button>
            <button onClick={() => setActiveLegalModal('privacy')} className="hover:text-slate-300 transition-colors">Privacy Policy</button>
        </div>
      </footer>
    </div>
  );
};

export default App;
