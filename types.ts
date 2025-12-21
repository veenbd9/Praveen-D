
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
  source: 'Adzuna' | 'ZipRecruiter' | 'Greenhouse' | 'Lever' | 'Direct';
  applyType: 'redirect' | 'email'; 
  applyUrl?: string; 
  applyEmail?: string; 
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
}

export interface CompanyConflictResult {
    hasConflict: boolean;
    conflictingCompanyName?: string;
    inputCompanyName?: string;
    confidence?: number;
    reason?: string;
}
