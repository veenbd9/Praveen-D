
export interface AnalysisResult {
  initialScore: number;
  initialSummary: string;
  optimizedResume: string;
  changes: string[];
  optimizedScore: number;
  coverLetter: string;
  candidateName: string;
  inferredRole?: string; // New field for Health Check mode
  // New Detailed Analysis Fields
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
  keywordScore: number; // 40%
  semanticScore: number; // 30%
  experienceScore: number; // 15%
  skillSectionScore: number; // 10%
  formattingScore: number; // 5%
  explanation: string; // "Matched 8/10 required keywords..."
}

export interface VendorScore {
  vendorName: string; // 'Workday', 'Taleo', 'Greenhouse', 'Lever'
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
  id: number; // Using timestamp for simplicity
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
  jobDescription?: string; // Added for context when reloading/refining
}

export interface SubscriptionDetails {
  isActive: boolean;
  planType: 'free' | '1-month' | '3-month' | '6-month' | 'renewal' | 'none';
  startDate: number; // timestamp
  expiryDate: number; // timestamp
  hasCompletedThreeMonthPlan: boolean; // To track eligibility for the 399 offer
  usageCount: number; // Number of scans used in the current period
  lastUsageReset: number; // Timestamp of last usage reset
}

export interface Transaction {
  id: string;
  userId: string;
  userName: string;
  amount: number; // Total amount paid by user
  taxAmount?: number; // 18% GST component (deducted from amount)
  netAmount?: number; // Revenue after tax
  currency: string;
  type: 'CREDIT' | 'DEBIT'; // Credit = Money In (Subscription), Debit = Money Out (Salary)
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

export interface User {
  name: string;
  email: string;
  isAdmin: boolean;
  countryCode: string;
  phoneNumber: string;
  subscription: SubscriptionDetails;
  status: 'ACTIVE' | 'SUSPENDED';
  resumeMismatchCount: number; // Tracks how many times user uploaded a resume with a different name
}

// "Green Light" Feature: Job Posting Interface
export interface JobPosting {
  id: string;
  title: string;
  company: string;
  location: string;
  description: string;
  postedAt: string;
  // Green Light Vendors
  source: 'Adzuna' | 'ZipRecruiter' | 'Greenhouse' | 'Lever' | 'Direct';
  // Green Light Apply Flows
  applyType: 'redirect' | 'email'; 
  applyUrl?: string; 
  applyEmail?: string; 
}

// --- Market Trends & Technical Analysis ---

export interface MarketDataPoint {
  year: number;
  salary: number; // Average salary in local currency units (e.g., Lakhs or K)
  demandScore: number; // 0-100 index
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

// --- Job Tracker (TealHQ Replication) ---

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
    nextActionDate?: string; // ISO Date string
}