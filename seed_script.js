const fs = require('fs');

const startupsData = [
  { id: 's1', name: 'Sanjeevani Diagnostics', oneLiner: 'point-of-care anaemia screening', sector: 'MEDTECH', stage: 'MID_INCUBATION', trl: 5, mgr: 'im1', assoc: 'ia1', cash: 22.0, burn: 7.8, rev: 0, signal: 'NONE', ip: 'FILED', h: [71, 64, 58] },
  { id: 's2', name: 'KrishiSense', oneLiner: 'soil moisture advisory for smallholders', sector: 'AGRITECH', stage: 'MID_INCUBATION', trl: 6, mgr: 'im1', assoc: 'ia1', cash: 48.0, burn: 5.5, rev: 0.6, signal: 'PILOT_LOI', ip: 'TRADE_SECRET', h: [57, 62, 68] },
  { id: 's3', name: 'SiliconVeda', oneLiner: 'low-power edge AI chip', sector: 'SEMICONDUCTOR', stage: 'EARLY_INCUBATION', trl: 3, mgr: 'im1', assoc: 'ia1', cash: 9.0, burn: 3.0, rev: 0, signal: 'NONE', ip: 'NONE', h: [45, 38, 31] },
  { id: 's4', name: 'NeuroLens AI', oneLiner: 'diabetic retinopathy screening model', sector: 'AI_ML', stage: 'LATE_INCUBATION', trl: 6, mgr: 'im1', assoc: 'ia1', cash: 95.0, burn: 8.0, rev: 2.0, signal: 'PILOT_LOI', ip: 'FILED', h: [70, 74, 77] },
  { id: 's5', name: 'VajraSec', oneLiner: 'firmware security testing', sector: 'CYBERSECURITY', stage: 'MID_INCUBATION', trl: 5, mgr: 'im1', assoc: 'ia1', cash: 18.0, burn: 4.5, rev: 0, signal: 'INTEREST', ip: 'NONE', h: [52, 49, 44] }, // ownership unclear
  { id: 's6', name: 'TensorGrid', oneLiner: 'grid load forecasting', sector: 'AI_ML', stage: 'EARLY_INCUBATION', trl: 4, mgr: 'im1', assoc: 'ia2', cash: 30.0, burn: 5.0, rev: 0, signal: 'INTEREST', ip: 'TRADE_SECRET', h: [55, 50, 47] },
  { id: 's7', name: 'AgroNexa', oneLiner: 'farm-gate grain quality testing', sector: 'AGRITECH', stage: 'EARLY_INCUBATION', trl: 4, mgr: 'im1', assoc: 'ia2', cash: 25.0, burn: 3.5, rev: 0, signal: 'INTEREST', ip: 'NONE', h: [58, 60, 61] },
  { id: 's8', name: 'MedAxis Robotics', oneLiner: 'tele-operated physiotherapy arm', sector: 'MEDTECH', stage: 'LATE_INCUBATION', trl: 6, mgr: 'im1', assoc: 'ia2', cash: 85.0, burn: 9.0, rev: 0.8, signal: 'PILOT_LOI', ip: 'FILED', h: [69, 71, 73] },
  { id: 's9', name: 'QuantaShield', oneLiner: 'post-quantum VPN for banks', sector: 'CYBERSECURITY', stage: 'EARLY_INCUBATION', trl: 4, mgr: 'im1', assoc: 'ia2', cash: 14.0, burn: 3.2, rev: 0, signal: 'NONE', ip: 'TRADE_SECRET', h: [50, 48, 46] },
  { id: 's10', name: 'DhruvNav', oneLiner: 'GPS-denied navigation for drones', sector: 'UAV', stage: 'MID_INCUBATION', trl: 5, mgr: 'im1', assoc: 'ia2', cash: 40.0, burn: 5.0, rev: 0, signal: 'INTEREST', ip: 'FILED', h: [63, 64, 62] },
  { id: 's11', name: 'CipherNest', oneLiner: 'anomaly detection for industrial networks', sector: 'CYBERSECURITY', stage: 'ACCELERATION', trl: 7, mgr: 'im2', assoc: 'ia3', cash: 180.0, burn: 14.0, rev: 9.5, signal: 'PAYING', ip: 'FILED', h: [78, 80, 82] },
  { id: 's12', name: 'Rakshak Aero', oneLiner: 'drone inspection of power lines', sector: 'UAV', stage: 'LATE_INCUBATION', trl: 6, mgr: 'im2', assoc: 'ia3', cash: 35.0, burn: 6.0, rev: 0, signal: 'INTEREST', ip: 'FILED', h: [66, 60, 55] },
  { id: 's13', name: 'BioSutra', oneLiner: 'biodegradable wound dressing', sector: 'MEDTECH', stage: 'EARLY_INCUBATION', trl: 4, mgr: 'im2', assoc: 'ia3', cash: 40.0, burn: 4.0, rev: 0, signal: 'NONE', ip: 'FILED', h: [60, 58, 56] },
  { id: 's14', name: 'FasalGuard', oneLiner: 'crop disease early warning', sector: 'AGRITECH', stage: 'ACCELERATION', trl: 7, mgr: 'im2', assoc: 'ia3', cash: 120.0, burn: 10.0, rev: 6.0, signal: 'PAYING', ip: 'GRANTED', h: [81, 83, 85] },
  { id: 's15', name: 'GaganDrishti', oneLiner: 'swarm mapping drones', sector: 'UAV', stage: 'PRE_INCUBATION', trl: 2, mgr: 'im2', assoc: 'ia3', cash: 12.0, burn: 1.5, rev: 0, signal: 'NONE', ip: 'NONE', h: [62, 63, 65] },
  { id: 's16', name: 'ChipKraft', oneLiner: 'power semiconductor modules', sector: 'SEMICONDUCTOR', stage: 'LATE_INCUBATION', trl: 6, mgr: 'im2', assoc: 'ia4', cash: 70.0, burn: 9.0, rev: 0, signal: 'PILOT_LOI', ip: 'FILED', h: [72, 75, 76] },
  { id: 's17', name: 'VisionKart AI', oneLiner: 'shelf analytics for retail', sector: 'AI_ML', stage: 'ACCELERATION', trl: 7, mgr: 'im2', assoc: 'ia4', cash: 150.0, burn: 12.0, rev: 8.0, signal: 'PAYING', ip: 'TRADE_SECRET', h: [76, 78, 79] },
  { id: 's18', name: 'NirogAI', oneLiner: 'TB detection from chest X-rays', sector: 'AI_ML', stage: 'MID_INCUBATION', trl: 5, mgr: 'im2', assoc: 'ia4', cash: 55.0, burn: 5.5, rev: 0, signal: 'PILOT_LOI', ip: 'FILED', h: [66, 68, 70] },
  { id: 's19', name: 'BeejBank', oneLiner: 'seed traceability for FPOs', sector: 'AGRITECH', stage: 'LATE_INCUBATION', trl: 6, mgr: 'im2', assoc: 'ia4', cash: 60.0, burn: 6.5, rev: 1.2, signal: 'PILOT_LOI', ip: 'TRADE_SECRET', h: [64, 66, 69] },
  { id: 's20', name: 'WaferWorks', oneLiner: 'wafer defect inspection', sector: 'SEMICONDUCTOR', stage: 'MID_INCUBATION', trl: 5, mgr: 'im2', assoc: 'ia4', cash: 45.0, burn: 7.0, rev: 0, signal: 'INTEREST', ip: 'FILED', h: [61, 62, 63] },
  { id: 's21', name: 'PranaSense', oneLiner: 'wearable COPD monitor', sector: 'MEDTECH', stage: 'MID_INCUBATION', trl: 4, mgr: 'im3', assoc: 'ia5', cash: 15.0, burn: 4.5, rev: 0, signal: 'NONE', ip: 'FILED', h: [60, 55, 49] },
  { id: 's22', name: 'KavachNet', oneLiner: 'SOC automation for SMEs', sector: 'CYBERSECURITY', stage: 'LATE_INCUBATION', trl: 6, mgr: 'im3', assoc: 'ia5', cash: 28.0, burn: 6.8, rev: 0.5, signal: 'INTEREST', ip: 'TRADE_SECRET', h: [64, 58, 53] }, // September awaiting
  { id: 's23', name: 'HelioDrone', oneLiner: 'solar long-endurance drone', sector: 'UAV', stage: 'EARLY_INCUBATION', trl: 3, mgr: 'im3', assoc: 'ia5', cash: 8.0, burn: 2.8, rev: 0, signal: 'NONE', ip: 'NONE', h: [52, 45, 40] },
  { id: 's24', name: 'GramSetu', oneLiner: 'rural cold-chain marketplace', sector: 'AGRITECH', stage: 'MID_INCUBATION', trl: 5, mgr: 'im3', assoc: 'ia5', cash: 32.0, burn: 4.0, rev: 0, signal: 'PILOT_LOI', ip: 'NONE', h: [62, 60, 57] },
  { id: 's25', name: 'NanoCore Labs', oneLiner: 'MEMS gas sensors', sector: 'SEMICONDUCTOR', stage: 'LATE_INCUBATION', trl: 6, mgr: 'im3', assoc: 'ia5', cash: 20.0, burn: 8.5, rev: 0, signal: 'INTEREST', ip: 'FILED', h: [58, 51, 46] },
  { id: 's26', name: 'ClinixAI', oneLiner: 'clinical note summarisation', sector: 'AI_ML', stage: 'LATE_INCUBATION', trl: 6, mgr: 'im3', assoc: 'ia6', cash: 70.0, burn: 7.0, rev: 1.5, signal: 'PILOT_LOI', ip: 'FILED', h: [74, 73, 72] },
  { id: 's27', name: 'OrthoPrint', oneLiner: '3D-printed orthopaedic implants', sector: 'MEDTECH', stage: 'EARLY_INCUBATION', trl: 4, mgr: 'im3', assoc: 'ia6', cash: 26.0, burn: 3.0, rev: 0, signal: 'NONE', ip: 'FILED', h: [57, 54, 52] },
  { id: 's28', name: 'SentinelOT', oneLiner: 'OT asset visibility', sector: 'CYBERSECURITY', stage: 'ACCELERATION', trl: 7, mgr: 'im3', assoc: 'ia6', cash: 90.0, burn: 11.0, rev: 5.0, signal: 'PAYING', ip: 'FILED', h: [77, 75, 71] },
  { id: 's29', name: 'AgriVolt', oneLiner: 'agrivoltaic yield optimiser', sector: 'AGRITECH', stage: 'EARLY_INCUBATION', trl: 3, mgr: 'im3', assoc: 'ia6', cash: 6.0, burn: 2.5, rev: 0, signal: 'NONE', ip: 'NONE', h: [44, 37, 33] },
  { id: 's30', name: 'LiDARix', oneLiner: 'LiDAR mapping payloads', sector: 'UAV', stage: 'MID_INCUBATION', trl: 5, mgr: 'im3', assoc: 'ia6', cash: 38.0, burn: 5.5, rev: 0, signal: 'INTEREST', ip: 'TRADE_SECRET', h: [60, 59, 56] }
];

const tagsBySector = {
  MEDTECH: ['MEDICAL_DEVICE', 'HEALTH_DATA', 'PERSONAL_DATA'],
  AI_ML: ['AI_MODEL', 'PERSONAL_DATA'],
  AGRITECH: ['FARMER_DATA'],
  CYBERSECURITY: ['PERSONAL_DATA'],
  UAV: ['DRONE_OPERATIONS', 'IMPORTED_COMPONENTS'],
  SEMICONDUCTOR: ['CHIP_DESIGN', 'IMPORTED_COMPONENTS']
};

const specificTags = {
  's1': ['IVD'], 's21': ['IVD'],
  's4': ['HEALTH_DATA'], 's18': ['HEALTH_DATA'], 's26': ['HEALTH_DATA'],
  's2': ['IOT_DEVICE'], 's24': ['IOT_DEVICE'], 's29': ['IOT_DEVICE'], 's19': ['SEED_SUPPLY'],
  's11': ['CRITICAL_INFRA'], 's28': ['CRITICAL_INFRA'], 's22': ['CRITICAL_INFRA'],
  's9': ['FINANCIAL_SECTOR_CLIENT'],
  's5': ['GOVT_BUYER'], 's11': ['GOVT_BUYER'],
  's12': ['GOVT_BUYER'], 's10': ['GOVT_BUYER'], 's30': ['IOT_DEVICE'],
  's25': ['IOT_DEVICE']
};

const startups = startupsData.map(s => {
  const regTags = [...new Set([...(tagsBySector[s.sector] || []), ...(specificTags[s.id] || [])])];
  let ipOwnershipClear = true;
  if (s.id === 's5') ipOwnershipClear = false;
  
  let grantSanctioned = 0, grantDisbursed = 0;
  if (s.id === 's1') {
    grantSanctioned = 6000000;
    grantDisbursed = 2000000;
  }
  
  return {
    id: s.id,
    name: s.name,
    oneLiner: s.oneLiner,
    sector: s.sector,
    stage: s.stage,
    cohort: 'Cohort 4',
    foundedOn: '2024-01-15',
    website: `https://${s.name.replace(/ /g, '').toLowerCase()}.demo`,
    city: 'New Delhi',
    managerId: s.mgr,
    associateId: s.assoc,
    trl: s.trl,
    trlUpdatedOn: s.id === 's3' ? '2026-02-10' : '2026-08-01',
    ipStatus: s.ip,
    ipOwnershipClear,
    commercialSignal: s.signal,
    grantSanctioned,
    grantDisbursed,
    founderToken: `${s.id}-token-xyz`,
    archived: false,
    regTags
  };
});

fs.writeFileSync('src/data/seed/startups.ts', `import { Startup } from '@/types';\nexport const startups: Startup[] = ${JSON.stringify(startups, null, 2)};\n`);

// Generating Metrics (May - Oct)
const metrics = [];
startupsData.forEach(s => {
  ['2026-05', '2026-06', '2026-07', '2026-08', '2026-09', '2026-10'].forEach((month, idx) => {
    const isOct = month === '2026-10';
    let cash = s.cash + ((5 - idx) * s.burn * 1.1); // Smooth trend
    if (s.id === 's1' && isOct) cash = 22.0; // explicit from prompt
    let conv = Math.floor(Math.random() * 10) + 1;
    if (s.id === 's1' && isOct) conv = 6;
    
    metrics.push({
      id: `${s.id}-m-${month}`,
      startupId: s.id,
      month,
      cashBalance: cash * 100000,
      monthlyBurn: s.burn * 100000,
      monthlyRevenue: s.rev * 100000,
      customerConversations: conv,
      pilots: ['PILOT_LOI', 'PAYING'].includes(s.signal) ? 1 : 0,
      lois: s.signal === 'PILOT_LOI' ? 1 : 0,
      payingCustomers: s.signal === 'PAYING' ? 2 : 0,
      teamFullTime: 3,
      teamPartTime: 0,
      source: 'SEED',
      recordedOn: `${month}-05T10:00:00Z`
    });
  });
});
fs.writeFileSync('src/data/seed/metrics.ts', `import { MonthlyMetrics } from '@/types';\nexport const metrics: MonthlyMetrics[] = ${JSON.stringify(metrics, null, 2)};\n`);

// Assessments (Jun, Jul, Aug, Sep)
const assessments = [];
startupsData.forEach(s => {
  const t = s.h; // [Jul, Aug, Sep]
  ['2026-06', '2026-07', '2026-08', '2026-09'].forEach(month => {
    let total = 0;
    if (month === '2026-06') total = t[0];
    else if (month === '2026-07') total = t[0];
    else if (month === '2026-08') total = t[1];
    else if (month === '2026-09') total = t[2];
    
    let band = 'HEALTHY';
    if (total < 35) band = 'CRITICAL';
    else if (total < 55) band = 'AT_RISK';
    else if (total < 75) band = 'WATCH';
    
    let status = 'APPROVED';
    if (s.id === 's22' && month === '2026-09') status = 'AWAITING_APPROVAL';

    assessments.push({
      id: `${s.id}-a-${month}`,
      startupId: s.id,
      month,
      profile: ['ACCELERATION', 'GRADUATED'].includes(s.stage) ? 'ACCELERATION' : 'PRE_REVENUE',
      dimensions: {
        TECH: { autoScore: total, finalScore: total, autoReason: 'Seed data' },
        TEAM: { autoScore: total, finalScore: total, autoReason: 'Seed data' },
        DISCOVERY: { autoScore: total, finalScore: total, autoReason: 'Seed data' },
        CASH: { autoScore: total, finalScore: total, autoReason: 'Seed data' },
        EXECUTION: { autoScore: total, finalScore: total, autoReason: 'Seed data' },
        IP: { autoScore: total, finalScore: total, autoReason: 'Seed data' },
        ENGAGEMENT: { autoScore: total, finalScore: total, autoReason: 'Seed data' },
        REVENUE: { autoScore: total, finalScore: total, autoReason: 'Seed data' }
      },
      total,
      band,
      delta3m: month === '2026-09' ? (t[2] - t[0]) : null,
      strengths: 'Good progress.',
      concerns: 'Needs focus.',
      actions: [],
      status,
      preparedBy: s.assoc,
      approvedBy: s.mgr
    });
  });
});
fs.writeFileSync('src/data/seed/assessments.ts', `import { HealthAssessment } from '@/types';\nexport const assessments: HealthAssessment[] = ${JSON.stringify(assessments, null, 2)};\n`);

// Regulatory Feed
const regulatory = [
  { id: 'R1', title: 'Draft guidance on clinical performance evidence for point-of-care diagnostic devices', authority: 'CDSCO', kind: 'RISK', status: 'CONSULTATION', publishedOn: '2026-09-01', consultationClosesOn: '2026-11-15', summary: 'New documentation requirements for clinical evidence for IVDs.', sectors: ['MEDTECH'], directTags: ['IVD', 'MEDICAL_DEVICE'], indirectTags: [], whatToCheck: ['Review clinical validation protocol', 'Check sample sizes'], isSample: true },
  { id: 'R2', title: 'Phased deadline for consent management under personal data protection rules', authority: 'MeitY', kind: 'RISK', status: 'NOTIFIED', publishedOn: '2026-08-15', effectiveOn: '2027-01-01', summary: 'Mandatory consent managers for personal and health data.', sectors: ['AI_ML', 'MEDTECH', 'AGRITECH', 'CYBERSECURITY'], directTags: ['PERSONAL_DATA', 'HEALTH_DATA'], indirectTags: ['FARMER_DATA'], whatToCheck: ['Audit current consent flow', 'Identify data processors'], isSample: true },
  { id: 'R3', title: 'Revised type-certification requirements for small and medium drones', authority: 'DGCA', kind: 'RISK', status: 'NOTIFIED', publishedOn: '2026-09-10', effectiveOn: '2026-12-01', summary: 'Stricter type-certification processes for drones.', sectors: ['UAV'], directTags: ['DRONE_OPERATIONS'], indirectTags: [], whatToCheck: ['Check component origins', 'Prepare documentation'], isSample: true },
  { id: 'R4', title: 'Updated restricted list for imported drone components', authority: 'DGFT', kind: 'RISK', status: 'NOTIFIED', publishedOn: '2026-09-05', effectiveOn: '2026-11-01', summary: 'Ban on specific imported modules.', sectors: ['UAV'], directTags: ['IMPORTED_COMPONENTS'], indirectTags: ['IMPORTED_COMPONENTS'], whatToCheck: ['Review BOM'], isSample: true },
  { id: 'R5', title: 'Shorter incident-reporting timelines for vendors to critical infrastructure', authority: 'CERT-In', kind: 'RISK', status: 'NOTIFIED', publishedOn: '2026-09-20', effectiveOn: '2026-12-15', summary: 'Must report incidents within 6 hours.', sectors: ['CYBERSECURITY'], directTags: ['CRITICAL_INFRA'], indirectTags: ['FINANCIAL_SECTOR_CLIENT'], whatToCheck: ['Update incident response plan'], isSample: true },
  { id: 'R6', title: 'Advisory on testing and labelling of AI models used in high-risk domains', authority: 'MeitY', kind: 'RISK', status: 'CONSULTATION', publishedOn: '2026-09-15', consultationClosesOn: '2026-11-30', summary: 'Proposed mandatory bias testing.', sectors: ['AI_ML'], directTags: ['AI_MODEL'], indirectTags: ['HEALTH_DATA'], whatToCheck: ['Review testing pipelines'], isSample: true },
  { id: 'R7', title: 'Validation framework for AI-based diagnostic tools', authority: 'ICMR', kind: 'RISK', status: 'CONSULTATION', publishedOn: '2026-09-01', consultationClosesOn: '2026-10-31', summary: 'New standard for AI diagnostics.', sectors: ['AI_ML', 'MEDTECH'], directTags: ['AI_MODEL', 'HEALTH_DATA'], indirectTags: [], whatToCheck: ['Align with validation metrics'], isSample: true },
  { id: 'R8', title: 'Data-sharing standards for agri-advisory platforms', authority: 'Ministry of Agriculture', kind: 'RISK', status: 'NOTIFIED', publishedOn: '2026-08-20', effectiveOn: '2027-01-15', summary: 'Mandatory interoperability standards.', sectors: ['AGRITECH'], directTags: ['FARMER_DATA'], indirectTags: [], whatToCheck: ['Check API standards'], isSample: true },
  { id: 'R9', title: 'QR-based traceability for certified seed lots', authority: 'Ministry of Agriculture', kind: 'RISK', status: 'NOTIFIED', publishedOn: '2026-09-25', effectiveOn: '2026-12-01', summary: 'Mandatory QR tracking.', sectors: ['AGRITECH'], directTags: ['SEED_SUPPLY'], indirectTags: [], whatToCheck: ['Integrate QR generation'], isSample: true },
  { id: 'R10', title: 'New application window for chip-design incentive support', authority: 'MeitY', kind: 'OPPORTUNITY', status: 'NOTIFIED', publishedOn: '2026-09-01', consultationClosesOn: '2026-12-31', summary: 'Grants available for DLI.', sectors: ['SEMICONDUCTOR'], directTags: ['CHIP_DESIGN'], indirectTags: [], whatToCheck: ['Prepare proposal'], isSample: true },
  { id: 'R11', title: 'Mandatory certification for connected IoT sensors', authority: 'BIS', kind: 'RISK', status: 'CONSULTATION', publishedOn: '2026-09-10', consultationClosesOn: '2026-12-10', summary: 'New BIS standards.', sectors: ['SEMICONDUCTOR', 'AGRITECH'], directTags: ['IOT_DEVICE'], indirectTags: ['IOT_DEVICE'], whatToCheck: ['Check current certifications'], isSample: true },
  { id: 'R12', title: 'Relaxed prior-experience criteria for startups in defence procurement', authority: 'Ministry of Defence', kind: 'OPPORTUNITY', status: 'NOTIFIED', publishedOn: '2026-09-15', effectiveOn: '2026-11-20', summary: 'Startups exempted from turnover criteria.', sectors: ['UAV', 'CYBERSECURITY'], directTags: ['GOVT_BUYER'], indirectTags: [], whatToCheck: ['Identify upcoming tenders'], isSample: true }
];
fs.writeFileSync('src/data/seed/regulatory.ts', `import { RegulatoryItem } from '@/types';\nexport const regulatory: RegulatoryItem[] = ${JSON.stringify(regulatory, null, 2)};\n`);

// Write Milestones
const milestones = [];
startupsData.forEach(s => {
  if (s.id === 's1') {
    milestones.push({
      id: 'm-s1-1', startupId: 's1', title: 'Clinical validation at 2 hospitals', category: 'REGULATORY', targetDate: '2026-10-15', revisedDate: '2026-12-15', delayReason: 'Ethics committee approval pending', status: 'DELAYED', percentComplete: 40, lastUpdatedBy: 'STAFF', lastUpdatedOn: '2026-09-20'
    });
    milestones.push({
      id: 'm-s1-2', startupId: 's1', title: 'CDSCO Class B pre-submission meeting', category: 'REGULATORY', targetDate: '2026-09-01', status: 'NOT_STARTED', percentComplete: 0, lastUpdatedBy: 'STAFF', lastUpdatedOn: '2026-08-10'
    });
    milestones.push({ id: 'm-s1-3', startupId: 's1', title: 'Prototype v2', category: 'PRODUCT', targetDate: '2026-11-01', status: 'IN_PROGRESS', percentComplete: 50, lastUpdatedBy: 'STAFF', lastUpdatedOn: '2026-10-01' });
    milestones.push({ id: 'm-s1-4', startupId: 's1', title: 'Patent filing', category: 'IP', targetDate: '2026-05-01', status: 'COMPLETED', percentComplete: 100, lastUpdatedBy: 'STAFF', lastUpdatedOn: '2026-05-15' });
  } else {
    milestones.push({ id: `m-${s.id}-1`, startupId: s.id, title: 'MVP Launch', category: 'PRODUCT', targetDate: '2026-11-01', status: 'IN_PROGRESS', percentComplete: 50, lastUpdatedBy: 'STAFF', lastUpdatedOn: '2026-10-01' });
  }
});
fs.writeFileSync('src/data/seed/milestones.ts', `import { Milestone } from '@/types';\nexport const milestones: Milestone[] = ${JSON.stringify(milestones, null, 2)};\n`);

// Write Teams
const teams = [];
startupsData.forEach(s => {
  teams.push({ id: `t-${s.id}-1`, startupId: s.id, name: 'Founder 1', role: 'CEO', isFounder: true, fullTime: true, email: 'f1@demo' });
  if (s.id !== 's3') {
    teams.push({ id: `t-${s.id}-2`, startupId: s.id, name: 'Founder 2', role: 'CTO', isFounder: true, fullTime: s.id === 's15' ? false : true, email: 'f2@demo' });
  }
});
fs.writeFileSync('src/data/seed/teams.ts', `import { TeamMember } from '@/types';\nexport const teams: TeamMember[] = ${JSON.stringify(teams, null, 2)};\n`);

// Write Data Requests & Submissions
const dataRequests = [];
const submissions = [];
startupsData.forEach(s => {
  if (s.id === 's1') {
    dataRequests.push({ id: 'dr-s1', startupId: 's1', type: 'MONTHLY_FINANCIALS', title: 'October financials', month: '2026-10', dueDate: '2026-10-08', createdBy: 'ia1', createdOn: '2026-10-01', status: 'OPEN' });
  }
  if (s.id === 's2') {
    dataRequests.push({ id: 'dr-s2', startupId: 's2', type: 'TRACTION', title: 'September traction', month: '2026-09', dueDate: '2026-10-05', createdBy: 'ia1', createdOn: '2026-09-28', status: 'SUBMITTED' });
    submissions.push({ id: 'sub-s2', requestId: 'dr-s2', startupId: 's2', submittedOn: '2026-10-04', payload: { customerConversations: 12 }, status: 'PENDING_REVIEW' });
  }
  if (s.id === 's5') {
    dataRequests.push({ id: 'dr-s5', startupId: 's5', type: 'MILESTONE_STATUS', title: 'Milestone update', dueDate: '2026-09-15', createdBy: 'ia1', createdOn: '2026-09-08', status: 'OPEN' });
  }
  let silences = ['s3', 's23', 's25', 's29'];
  if (silences.includes(s.id)) {
    // leave them with no accepted submissions in last 35 days (since DEMO_TODAY is Oct 5, so no accepted sub since Aug 31)
  } else if (!['s1', 's2', 's5'].includes(s.id)) {
    dataRequests.push({ id: `dr-${s.id}`, startupId: s.id, type: 'MONTHLY_FINANCIALS', title: 'September financials', month: '2026-09', dueDate: '2026-10-07', createdBy: s.assoc, createdOn: '2026-10-01', status: 'ACCEPTED' });
    submissions.push({ id: `sub-${s.id}`, requestId: `dr-${s.id}`, startupId: s.id, submittedOn: '2026-10-03', payload: { cashBalance: 5000000 }, status: 'ACCEPTED', reviewedBy: s.assoc, reviewedOn: '2026-10-04' });
  }
});
fs.writeFileSync('src/data/seed/dataRequests.ts', `import { DataRequest } from '@/types';\nexport const dataRequests: DataRequest[] = ${JSON.stringify(dataRequests, null, 2)};\n`);
fs.writeFileSync('src/data/seed/submissions.ts', `import { FounderSubmission } from '@/types';\nexport const submissions: FounderSubmission[] = ${JSON.stringify(submissions, null, 2)};\n`);


// Mentors (15 fictional)
const mentors = [
  { id: 'm1', name: 'Dr. Asha Rao', title: 'Ex-Director, HealthTech Corp', sectors: ['Healthcare'], expertise: ['Regulatory & Compliance', 'Clinical Strategy'], stages: ['Pre-Seed', 'Seed'], geography: 'PAN_INDIA', availability: 'HIGH', maxActiveMatches: 3, bio: '30 years in healthtech.', active: true },
  { id: 'm2', name: 'Vikram Singh', title: 'Partner, FundX', sectors: ['DeepTech', 'AI/ML'], expertise: ['Fundraising', 'Financial Modelling'], stages: ['Seed', 'Series A'], geography: 'DELHI_NCR', availability: 'LOW', maxActiveMatches: 3, bio: 'Active deeptech investor.', active: true },
  { id: 'm3', name: 'Col. Rajesh', title: 'Retd. Defence Logistics', sectors: ['Defence', 'DeepTech'], expertise: ['Government Contracts', 'Supply Chain'], stages: ['Pre-Seed', 'Seed'], geography: 'PAN_INDIA', availability: 'MEDIUM', maxActiveMatches: 3, bio: 'Navigating MoD procurement.', active: true },
  { id: 'm4', name: 'Sunita Patel', title: 'IP Attorney', sectors: ['Other'], expertise: ['IP & Patents', 'Legal'], stages: ['Ideation', 'Pre-Seed', 'Seed'], geography: 'NORTH', availability: 'HIGH', maxActiveMatches: 5, bio: 'Patent strategy for startups.', active: true },
  { id: 'm5', name: 'Anil Kumar', title: 'Agri Expert', sectors: ['AgriTech'], expertise: ['Go-to-Market', 'B2B Sales'], stages: ['Seed', 'Series A'], geography: 'PAN_INDIA', availability: 'MEDIUM', maxActiveMatches: 3, bio: 'Scaling agritech.', active: true },
  { id: 'm6', name: 'Priya Sharma', title: 'CISO, BankZ', sectors: ['Cybersecurity'], expertise: ['Technology / Product', 'Strategic Partnerships'], stages: ['Pre-Seed', 'Seed'], geography: 'WEST', availability: 'HIGH', maxActiveMatches: 3, bio: 'Enterprise security architecture.', active: true },
  { id: 'm7', name: 'Rahul Dev', title: 'VP Engineering', sectors: ['AI/ML'], expertise: ['Technology / Product', 'HR & Talent'], stages: ['Seed', 'Series A'], geography: 'SOUTH', availability: 'LOW', maxActiveMatches: 3, bio: 'Building AI teams.', active: true },
  { id: 'm8', name: 'Dr. Meera', title: 'Chief Medical Officer', sectors: ['Healthcare'], expertise: ['Regulatory & Compliance', 'Clinical Strategy'], stages: ['Pre-Seed', 'Seed'], geography: 'PAN_INDIA', availability: 'HIGH', maxActiveMatches: 3, bio: 'Clinical trials expert.', active: true },
  { id: 'm9', name: 'Sanjay Gupta', title: 'Supply Chain Head', sectors: ['DeepTech'], expertise: ['Supply Chain', 'Strategic Partnerships'], stages: ['Seed'], geography: 'NORTH', availability: 'MEDIUM', maxActiveMatches: 3, bio: 'Hardware supply chains.', active: true },
  { id: 'm10', name: 'Neha Reddy', title: 'Fundraising Consultant', sectors: ['Healthcare', 'AgriTech'], expertise: ['Fundraising'], stages: ['Pre-Seed'], geography: 'SOUTH', availability: 'HIGH', maxActiveMatches: 4, bio: 'Early stage fundraising.', active: true },
  { id: 'm11', name: 'Amit Jain', title: 'Founder, EdTechPro', sectors: ['EdTech'], expertise: ['Product Strategy', 'B2B Sales'], stages: ['Seed', 'Series A'], geography: 'DELHI_NCR', availability: 'HIGH', maxActiveMatches: 3, bio: 'Edtech sales motion.', active: true },
  { id: 'm12', name: 'Dr. K. Iyer', title: 'Regulatory Head', sectors: ['Healthcare', 'Fintech'], expertise: ['Regulatory & Compliance'], stages: ['Seed'], geography: 'WEST', availability: 'MEDIUM', maxActiveMatches: 3, bio: 'Navigating CDSCO and RBI.', active: true },
  { id: 'm13', name: 'Manoj Tiwari', title: 'Angel Investor', sectors: ['Sustainability'], expertise: ['Fundraising', 'ESG & Impact'], stages: ['Pre-Seed', 'Seed'], geography: 'PAN_INDIA', availability: 'LOW', maxActiveMatches: 2, bio: 'Climate tech investor.', active: true },
  { id: 'm14', name: 'Kavita Singh', title: 'Marketing Dir', sectors: ['Other'], expertise: ['Marketing'], stages: ['Seed'], geography: 'NORTH', availability: 'HIGH', maxActiveMatches: 3, bio: 'Brand building.', active: true },
  { id: 'm15', name: 'Tariq Khan', title: 'Full Capacity Mentor', sectors: ['AI/ML'], expertise: ['Technology / Product'], stages: ['Pre-Seed'], geography: 'PAN_INDIA', availability: 'LOW', maxActiveMatches: 1, bio: 'Has 1 match, max is 1.', active: true }
];
fs.writeFileSync('src/data/seed/mentors.ts', `import { Mentor } from '@/types';\nexport const mentors: Mentor[] = ${JSON.stringify(mentors, null, 2)};\n`);

const mentorMatches = [];
const mentorRequests = [];
// 9 active matches (3 per manager)
mentorMatches.push(
  { id: 'match1', requestId: 'req1', startupId: 's4', mentorId: 'm2', confirmedBy: 'im1', confirmedOn: '2026-08-01', status: 'ACTIVE', sessions: [{ id: 'sess1', date: '2026-08-15', topic: 'Deck review', nextStep: 'Update sizing', rating: 4 }] },
  { id: 'match2', requestId: 'req2', startupId: 's8', mentorId: 'm1', confirmedBy: 'im1', confirmedOn: '2026-08-10', status: 'ACTIVE', sessions: [] },
  { id: 'match3', requestId: 'req3', startupId: 's7', mentorId: 'm5', confirmedBy: 'im1', confirmedOn: '2026-09-01', status: 'ACTIVE', sessions: [] },
  { id: 'match4', requestId: 'req4', startupId: 's11', mentorId: 'm6', confirmedBy: 'im2', confirmedOn: '2026-07-20', status: 'ACTIVE', sessions: [] },
  { id: 'match5', requestId: 'req5', startupId: 's14', mentorId: 'm5', confirmedBy: 'im2', confirmedOn: '2026-08-25', status: 'ACTIVE', sessions: [] },
  { id: 'match6', requestId: 'req6', startupId: 's17', mentorId: 'm7', confirmedBy: 'im2', confirmedOn: '2026-09-10', status: 'ACTIVE', sessions: [] },
  { id: 'match7', requestId: 'req7', startupId: 's28', mentorId: 'm6', confirmedBy: 'im3', confirmedOn: '2026-08-05', status: 'ACTIVE', sessions: [] },
  { id: 'match8', requestId: 'req8', startupId: 's26', mentorId: 'm7', confirmedBy: 'im3', confirmedOn: '2026-09-05', status: 'ACTIVE', sessions: [] },
  { id: 'match9', requestId: 'req9', startupId: 's24', mentorId: 'm5', confirmedBy: 'im3', confirmedOn: '2026-09-20', status: 'ACTIVE', sessions: [] },
  { id: 'match10', requestId: 'req10', startupId: 's6', mentorId: 'm15', confirmedBy: 'im1', confirmedOn: '2026-09-20', status: 'ACTIVE', sessions: [] } // mentor 15 full capacity
);
fs.writeFileSync('src/data/seed/mentorMatches.ts', `import { MentorMatch } from '@/types';\nexport const mentorMatches: MentorMatch[] = ${JSON.stringify(mentorMatches, null, 2)};\n`);

mentorRequests.push(
  { id: 'req_s1', startupId: 's1', challenge: 'Need help preparing for CDSCO submission', expertiseNeeded: ['Regulatory & Compliance', 'Clinical Strategy'], raisedBy: 'STAFF', createdOn: '2026-10-02', status: 'PENDING' },
  { id: 'req_s22', startupId: 's22', challenge: 'Founder requested mentor', expertiseNeeded: ['Fundraising'], raisedBy: 'FOUNDER', createdOn: '2026-10-01', status: 'PENDING' },
  { id: 'req_s13', startupId: 's13', challenge: 'Supply chain setup', expertiseNeeded: ['Supply Chain'], raisedBy: 'STAFF', createdOn: '2026-09-30', status: 'PENDING' }
);
fs.writeFileSync('src/data/seed/mentorRequests.ts', `import { MentorRequest } from '@/types';\nexport const mentorRequests: MentorRequest[] = ${JSON.stringify(mentorRequests, null, 2)};\n`);
