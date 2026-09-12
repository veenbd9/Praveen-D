
export interface AnalysisResult {
  initialScore: number;
  initialSummary: string;
  optimizedResume: string;
  changes: string[];
  optimizedScore: number;
  coverLetter: string;
  candidateName: string;
  inferredRole?: string;
  scoreBreakdown?: ScoreBreakdown;
  vendorScores?: VendorScore[];
  knockoutChecks?: KnockoutCheck[];
  structureAnalysis?: StructureAnalysis;
  bulletVariations?: string[];
}

export interface StructureAnalysis {
  rating: 'Critical' | 'Needs Improvement' | 'Good' | 'Excellent';
  issues: string[];
  recommendations: string[];
  whyStructureMatters: string;
}

export interface ScoreBreakdown {
  keywordScore: number;
  semanticScore: number;
  experienceScore: number;
  skillSectionScore: number;
  formattingScore: number;
  explanation: string;
}

export interface VendorScore {
  vendorName: string;
  score: number;
  rating: 'Low' | 'Medium' | 'High';
  reason: string;
}

export interface KnockoutCheck {
  requirement: string;
  status: 'PASS' | 'FAIL' | 'UNCLEAR';
  reason: string;
}

export interface SavedResume {
  id: number;
  name: string;
  content: string;
  status: 'ACTIVE' | 'SUSPENDED';
  // The single resume used by default for Health Check / Optimizer. Only one
  // resume in the list may have isPrimary true at a time; using a different
  // resume promotes it to primary while the previous one stays ACTIVE
  // (just no longer the default) rather than being deleted.
  isPrimary?: boolean;
}

export interface BrainstormResult {
  professionalSummary: string;
  achievementBullets: string[];
}

export interface GeneratedResume {
  id: string;
  userId: string;
  timestamp: number;
  companyName: string;
  jobTitle: string;
  analysisResult: AnalysisResult;
  jobDescription?: string;
}

export interface SubscriptionDetails {
  isActive: boolean;
  planType: 'free' | '1-month' | '3-month' | '6-month' | 'renewal' | 'none';
  startDate: number;
  expiryDate: number;
  hasCompletedThreeMonthPlan: boolean;
  usageCount: number;
  resumeLimit: number;
  lastUsageReset: number;
}

export interface Transaction {
  id: string;
  userId: string;
  userName: string;
  amount: number;
  taxAmount?: number;
  netAmount?: number;
  currency: string;
  type: 'CREDIT' | 'DEBIT';
  description: string;
  timestamp: number;
  method: 'UPI' | 'BANK_TRANSFER' | 'CARD' | 'INTERNAL';
  status: 'SUCCESS' | 'PENDING' | 'FAILED';
}

export interface AdminBankDetails {
  accountHolderName: string;
  accountNumber: string;
  ifscCode: string;
  bankName: string;
  upiId: string;
}

export interface CompanySettings {
  personalMobileNumber: string;
  businessWhatsAppNumber: string;
  isWhatsAppIntegrated: boolean;
  whatsAppWelcomeMessage: string;
  whatsAppEncouragementCycle: boolean;
  lastUpdatedBy: string;
}

export interface User {
  name: string;
  email: string;
  isAdmin: boolean;
  countryCode: string;
  phoneNumber: string;
  subscription: SubscriptionDetails;
  status: 'ACTIVE' | 'SUSPENDED';
  resumeMismatchCount: number;
  lastWhatsAppMessageSent?: number; // Timestamp of last gradual message
  whatsAppThreadId?: string; // Simulated thread ID
}

export interface JobPosting {
  id: string;
  title: string;
  company: string;
  location: string;
  description: string;
  postedAt: string;
  source: 'Adzuna' | 'ZipRecruiter' | 'Greenhouse' | 'Lever' | 'Direct' | 'LinkedIn';
  applyType: 'redirect' | 'email'; 
  applyUrl?: string; 
  applyEmail?: string; 
  // Hiring contact discovered from the source listing (e.g. the LinkedIn job poster).
  recruiterName?: string;
  recruiterTitle?: string;
  recruiterProfileUrl?: string;
  // Populated client-side by matching the job against the candidate's resume.
  matchScore?: number;
  matchSummary?: string;
  outreachMessage?: string;
}

export interface MarketDataPoint {
  year: number;
  salary: number;
  demandScore: number;
}

export interface MarketTrendAnalysis {
  role: string;
  location: string;
  currency: string;
  historicalData: MarketDataPoint[];
  emergingSkills: string[];
  decliningSkills: string[];
}

export interface RegressionResult {
  slope: number;
  intercept: number;
  rSquared: number;
  predictionNextYear: number;
  predictionTwoYears: number;
  trendDirection: 'Positive' | 'Negative' | 'Stable';
}

export type ApplicationStatus = 'BOOKMARKED' | 'APPLYING' | 'APPLIED' | 'INTERVIEWING' | 'NEGOTIATING' | 'OFFER' | 'REJECTED';

export interface ApplicationContact {
    name: string;
    role: string;
    email: string;
}

export interface JobApplication {
    id: string;
    company: string;
    position: string;
    location?: string;
    salary?: string;
    status: ApplicationStatus;
    dateAdded: number;
    lastUpdated: number;
    notes?: string;
    url?: string;
    contacts?: ApplicationContact[];
    nextAction?: string;
    nextActionDate?: string;
    // Links this Tracker entry back to the JobPosting.id it came from (set
    // when created via the Job Search "Apply"/"Track" flow).
    sourceJobId?: string;
    // Entries created automatically from a Job Search apply/track action
    // auto-expire after 21 days; manually added entries have no expiry.
    expiresAt?: number;
}

export interface JobMatchResult {
    id: string;
    matchScore: number;
    matchSummary: string;
    outreachMessage: string;
}

export interface CompanyConflictResult {
    hasConflict: boolean;
    conflictingCompanyName?: string;
    inputCompanyName?: string;
    confidence?: number;
    reason?: string;
}
