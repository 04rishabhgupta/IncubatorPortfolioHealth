export type Role = 'ADMIN' | 'INVESTMENT_MANAGER' | 'INVESTMENT_ASSOCIATE';

export interface User {
  id: string;
  email: string;
  role: Role;
  label: string;
  managerId?: string; // portfolio managers only: the Portfolio Head they report to
}

export type Sector = 'AI_ML' | 'MEDTECH' | 'AGRITECH' | 'CYBERSECURITY' | 'UAV' | 'SEMICONDUCTOR' | 'ADVANCED_MATERIALS';
export type Stage = 'PRE_INCUBATION' | 'EARLY_INCUBATION' | 'MID_INCUBATION' | 'LATE_INCUBATION' | 'ACCELERATION' | 'GRADUATED';
export type CommercialSignal = 'NONE' | 'INTEREST' | 'PILOT_LOI' | 'PAYING';
export type IPStatus = 'NONE' | 'TRADE_SECRET' | 'FILED' | 'GRANTED';
export type Band = 'HEALTHY' | 'WATCH' | 'AT_RISK' | 'CRITICAL';

export type RegTag = 'MEDICAL_DEVICE' | 'IVD' | 'HEALTH_DATA' | 'PERSONAL_DATA' | 'AI_MODEL' | 'FARMER_DATA' | 'SEED_SUPPLY' | 'IOT_DEVICE' | 'DRONE_OPERATIONS' | 'IMPORTED_COMPONENTS' | 'GOVT_BUYER' | 'CRITICAL_INFRA' | 'CHIP_DESIGN' | 'FINANCIAL_SECTOR_CLIENT';

export interface Startup {
  id: string;
  name: string;
  oneLiner: string;
  sector: Sector;
  stage: Stage;
  cohort: string;
  foundedOn: string;
  website?: string;
  city: string;
  managerId: string; // supervising Portfolio Head
  associateId: string | null; // assigned Portfolio Manager (must report to managerId)
  trl: number;
  trlUpdatedOn: string;
  ipStatus: IPStatus;
  ipOwnershipClear: boolean;
  commercialSignal: CommercialSignal;
  grantSanctioned: number; // ₹ (rupees)
  grantDisbursed: number; // ₹ (rupees)
  founderToken: string;
  archived: boolean;
  regTags: RegTag[];
  excelAuditPath?: string;
  fittTracker?: FittTracker;
  investibility?: InvestibilityScore;
  aiAnalysis?: {
    summary: string;
    thesis: string;
    redFlags: string[];
    actionItems: string[];
    lastAnalyzed: string;
  };
}

export interface InvestibilityScore {
  total: number; // 0 - 100
  grade: 'A+' | 'A' | 'B' | 'C' | 'D';
  breakdown: {
    teamScore: number; // max 20
    marketScore: number; // max 25
    technologyScore: number; // max 20
    financialScore: number; // max 20
    tractionScore: number; // max 15
  };
  strengths: string[];
  risks: string[];
  recommendation: string;
}

export interface AppNotification {
  id: string;
  title: string;
  message: string;
  type: 'MENTOR_REQUEST' | 'MENTOR_MATCH' | 'MENTOR_RESPONSE' | 'STARTUP_UPDATE' | 'RED_FLAG' | 'DATA_REQUEST';
  startupId?: string;
  startupName?: string;
  createdAt: string;
  read: boolean;
  targetRole?: Role;
  targetUserId?: string; // manager or associate
  actionUrl?: string;
}

// ---- FITT tracker (Indigotex-style real-company data model) ----
// All of this is optional on Startup, so existing demo startups (which have no
// fittTracker) are entirely unaffected and keep using the generic startup page.

export interface FittFounder {
  name: string;
  role: string;
  commitment: 'FULL_TIME' | 'PART_TIME';
  note: string;
  flag?: string;
}

export interface FittCapTableEntry {
  holder: string;
  pct: number;
  color: string;
}

export interface FittFundingEntry {
  label: string;
  amountCr: number;
  kind: 'GRANT' | 'EQUITY' | 'SIGNING';
}

export interface FittUseOfFundsEntry {
  label: string;
  pct: number;
  color: string;
}

export interface FittBaseline {
  tags: string[]; // extra header chips, e.g. 'Deeptech', 'B2B'
  dpiitRecognised: boolean;
  cin: string;
  roc: string;
  incorporatedOn: string;
  locations: string;
  ipStatusNote: string;
  techTransferNote: string;
  totalRaisedNote: string;
  founders: FittFounder[];
  capTable: FittCapTableEntry[];
  capTableNote: string;
  funding: FittFundingEntry[];
  fundingWidthDenominatorCr: number;
  roundPostMoneyCr: number;
  previousPreMoneyCr: number;
  currentPreMoneyCr: number;
  useOfFunds: FittUseOfFundsEntry[];
}

export interface FittOrderPipelineEntry {
  name: string;
  amountLakh: number;
  capLakh: number;
  tone: 'strong' | 'moderate' | 'neutral';
}

export interface FittMonthlyCheckin {
  month: string; // 'YYYY-MM'
  monthlyRevenue: number;
  monthlyRevenueNote: string;
  monthlyBurn: number;
  cashNote: string;
  runwayPmViewNote: string;
  q1RevenueLakh: number;
  q1RevenueTargetLakh: number;
  payingCustomers: number;
  payingCustomersNote: string;
  grossMarginPct: number;
  grossMarginNote: string;
  productStage: string;
  productStageNote: string;
  orderPipeline: FittOrderPipelineEntry[];
  customerConcentrationPct: number;
  customerConcentrationNote: string;
  fundraisingStage: 'Deck' | 'Pitching' | 'Term sheet' | 'Closed';
  fundraisingNote: string;
  technology: string;
  pitchMaterials: string;
  gtmProgress: string;
  pmNotes: string;
}

export interface FittScoredParam {
  label: string;
  score: number;
  max: number;
  evidence: string;
}

export interface FittSection {
  label: string;
  weightPct: number;
  total: number;
  max: number;
  params: FittScoredParam[];
}

export interface FittMarketSizing {
  tamCr: number;
  samCr: number;
  somCr: number;
  cagrPct: number;
  note: string;
}

export interface FittSixMonthReview {
  cycle: string; // e.g. 'April 2026'
  overallPct: number;
  sections: FittSection[];
  supporting: FittScoredParam[];
  porter: FittScoredParam[];
  marketSizing: FittMarketSizing;
}

export interface FittSwot {
  strengths: string[];
  weaknesses: string[];
  opportunities: string[];
  threats: string[];
}

export interface FittValueChainStage {
  stage: string;
  score: number;
  max: number;
  bottleneck: boolean;
}

export interface FittDDItem {
  item: string;
  status: 'COMPLIANT' | 'ISSUE' | 'WAIVED';
  reference: string;
  notes: string;
}

export interface FittDDSection {
  label: string;
  items: FittDDItem[];
}

export interface FittSupportTask {
  n: number;
  date: string;
  type: string;
  title: string;
  action: string;
  outcome: string;
  status: 'Pending' | 'In Progress' | 'Done';
  owner: string;
  source: string;
  heldReason?: string;
}

export interface FittMentorSuggestion {
  mentorId: string;
  fit: 'h' | 'm' | 'l';
  why: string;
}

export interface FittRedFlag {
  text: string;
  value: boolean;
  evidence: string;
}

export interface FittNeedsAttentionItem {
  key: string;
  issue: string;
  critical: boolean;
  tag: string;
  cause: string;
  effect: string;
  fix: string;
}

export interface FittNextAction {
  label: string;
  note: string;
}

export interface FittTracker {
  checkedOn: string; // 'YYYY-MM-DD'
  nextPmActions: FittNextAction[];
  baseline: FittBaseline;
  monthlyCheckins: FittMonthlyCheckin[];
  sixMonthReviews: FittSixMonthReview[];
  swot: FittSwot;
  valueChain: FittValueChainStage[];
  dueDiligence: FittDDSection[];
  supportLog: FittSupportTask[];
  mentorSuggestions: Record<number, FittMentorSuggestion[]>;
  mentorGaps: Record<number, string>;
  redFlags: FittRedFlag[];
  needsAttention: FittNeedsAttentionItem[];
}

export interface TeamMember {
  id: string;
  startupId: string;
  name: string;
  role: string;
  isFounder: boolean;
  fullTime: boolean;
  equityPct?: number;
  email: string;
  phone?: string;
}

export interface MonthlyMetrics {
  id: string;
  startupId: string;
  month: string; // 'YYYY-MM'
  cashBalance: number;
  monthlyBurn: number;
  monthlyRevenue: number;
  customerConversations: number;
  pilots: number;
  lois: number;
  payingCustomers: number;
  teamFullTime: number;
  teamPartTime: number;
  keyLearnings?: string;
  source: 'SEED' | 'FOUNDER_SUBMISSION' | 'STAFF_EDIT';
  recordedOn: string;
}

export type MilestoneStatus = 'NOT_STARTED' | 'IN_PROGRESS' | 'COMPLETED' | 'DELAYED' | 'AT_RISK';
export type MilestoneCategory = 'TECHNOLOGY' | 'PRODUCT' | 'CUSTOMER' | 'REGULATORY' | 'FUNDRAISING' | 'TEAM' | 'IP';

export interface Milestone {
  id: string;
  startupId: string;
  title: string;
  category: MilestoneCategory;
  targetDate: string;
  revisedDate?: string;
  delayReason?: string;
  status: MilestoneStatus;
  percentComplete: number;
  evidenceNote?: string;
  evidenceLink?: string;
  completedOn?: string;
  lastUpdatedBy: 'STAFF' | 'FOUNDER';
  lastUpdatedOn: string;
}

export type RequestType = 'MONTHLY_FINANCIALS' | 'MILESTONE_STATUS' | 'TRACTION' | 'CUSTOM';

export interface DataRequest {
  id: string;
  startupId: string;
  type: RequestType;
  title: string;
  message?: string;
  customQuestions?: { id: string; label: string; kind: 'TEXT' | 'NUMBER' | 'DATE' | 'YES_NO' }[];
  milestoneIds?: string[];
  month?: string;
  dueDate: string;
  createdBy: string;
  createdOn: string;
  status: 'OPEN' | 'SUBMITTED' | 'ACCEPTED' | 'RETURNED';
}

export interface FounderSubmission {
  id: string;
  requestId: string;
  startupId: string;
  submittedOn: string;
  payload: Record<string, unknown>;
  status: 'PENDING_REVIEW' | 'ACCEPTED' | 'RETURNED';
  reviewedBy?: string;
  reviewedOn?: string;
  reviewComment?: string;
}

export type Dimension = 'TECH' | 'TEAM' | 'DISCOVERY' | 'CASH' | 'EXECUTION' | 'IP' | 'ENGAGEMENT' | 'REVENUE';

export interface HealthAssessment {
  id: string;
  startupId: string;
  month: string;
  profile: 'PRE_REVENUE' | 'ACCELERATION';
  dimensions: Record<Dimension, { autoScore: number; autoReason: string; finalScore: number; comment?: string }>;
  total: number;
  band: Band;
  delta3m: number | null;
  strengths: string;
  concerns: string;
  actions: { text: string; owner: 'STARTUP' | 'FITT'; dueDate: string }[];
  status: 'DRAFT' | 'AWAITING_APPROVAL' | 'APPROVED' | 'RETURNED';
  preparedBy: string;
  submittedOn?: string;
  approvedBy?: string;
  approvedOn?: string;
  returnComment?: string;
}

export type MCSector = 'AgriTech' | 'AI/ML' | 'Healthcare' | 'Cybersecurity' | 'DeepTech' | 'Defence' | 'Sustainability' | 'Green Mobility' | 'Fintech' | 'EdTech' | 'Other';
export type MCExpertise = 'Fundraising' | 'Technology / Product' | 'Go-to-Market' | 'B2B Sales' | 'Regulatory & Compliance' | 'IP & Patents' | 'Marketing' | 'Product Strategy' | 'Strategic Partnerships' | 'Government Contracts' | 'Supply Chain' | 'ESG & Impact' | 'Clinical Strategy' | 'Legal' | 'HR & Talent' | 'Financial Modelling';
export type MCStage = 'Ideation' | 'Pre-Seed' | 'Seed' | 'Series A' | 'Series B+';

export interface Mentor {
  id: string;
  name: string;
  title: string;
  phone?: string;
  linkedin?: string;
  sectors: MCSector[];
  expertise: MCExpertise[];
  stages: MCStage[];
  geography: 'DELHI_NCR' | 'NORTH' | 'SOUTH' | 'WEST' | 'EAST' | 'PAN_INDIA' | 'INTERNATIONAL';
  availability: 'LOW' | 'MEDIUM' | 'HIGH';
  maxActiveMatches: number;
  bio: string;
  active: boolean;
}

export interface MentorRequest {
  id: string;
  startupId: string;
  challenge: string;
  expertiseNeeded: MCExpertise[];
  raisedBy: 'STAFF' | 'FOUNDER';
  createdOn: string;
  ranked?: { mentorId: string; score: number; reasoning: string }[];
  recommendedMentorId?: string;
  status: 'PENDING' | 'MATCHED' | 'DECLINED';
  mentorId?: string; // set once a specific mentor is picked (e.g. from a support log task)
  note?: string;
  fittTaskN?: number; // links back to a FittSupportTask.n on the requesting startup
}

export interface MentorMatch {
  id: string;
  requestId: string;
  startupId: string;
  mentorId: string;
  confirmedBy: string;
  confirmedOn: string;
  status: 'ACTIVE' | 'CLOSED';
  sessions: { id: string; date: string; topic: string; nextStep: string; rating?: 1 | 2 | 3 | 4 | 5 }[];
}

export interface FounderActionItem {
  id: string;
  startupId: string;
  title: string;
  cause: string;
  effect: string;
  fix: string;
  note?: string;
  sharedBy: string;
  sharedOn: string;
}

export interface ActivityLog {
  id: string;
  startupId: string;
  at: string;
  actor: string;
  text: string;
}

export type InsightType = 'RUNWAY' | 'BURN_SPIKE' | 'GRANT_TRANCHE' | 'HEALTH_DECLINE' | 'MILESTONE' | 'FOUNDER_SILENCE' | 'TRL_STALL' | 'TEAM' | 'IP' | 'MENTOR_GAP' | 'REGULATORY' | 'MOMENTUM';

export interface Insight {
  id: string;
  startupId: string;
  type: InsightType;
  severity: 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'INFO' | 'POSITIVE';
  title: string;
  summary: string;
  whyItMatters: string;
  evidence: { label: string; value: string }[];
  actions: { label: string; kind: 'DATA_REQUEST' | 'MENTOR_REQUEST' | 'START_ASSESSMENT' | 'NOTE'; prefill?: Record<string, unknown> }[];
  impact?: 'DIRECT' | 'INDIRECT';
  regulatoryItemId?: string;
  keyDate?: string;
  source: 'PORTFOLIO_DATA' | 'REGULATORY_FEED';
  fingerprint: string;
  generatedOn: string;
  status: 'NEW' | 'ACKNOWLEDGED' | 'ACTIONED' | 'DISMISSED';
  statusBy?: string;
  statusOn?: string;
  dismissReason?: string;
}

export interface RegulatoryItem {
  id: string;
  title: string;
  authority: string;
  kind: 'RISK' | 'OPPORTUNITY';
  status: 'CONSULTATION' | 'NOTIFIED' | 'EFFECTIVE';
  publishedOn: string;
  consultationClosesOn?: string;
  effectiveOn?: string;
  summary: string; // 2–3 sentences, plain language
  sectors: Sector[]; // sectors directly regulated
  directTags: RegTag[]; // startup activities directly covered
  indirectTags: RegTag[]; // activities affected through customers, suppliers or data
  whatToCheck: string[]; // 2–3 checks the manager should raise with the founder
  isSample: true;
}
