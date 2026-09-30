import * as XLSX from 'xlsx';
import {
  Startup,
  FittTracker,
  Sector,
  Stage,
  IPStatus,
  CommercialSignal,
  FittFounder,
  FittCapTableEntry,
  FittOrderPipelineEntry,
  FittValueChainStage,
} from '@/types';
import { computeInvestibilityScore, generateAIAnalysis } from './aiAnalysis';

export function generateStartupExcel(startup: Startup): Uint8Array {
  const wb = XLSX.utils.book_new();
  const tracker = startup.fittTracker;
  const b = tracker?.baseline;
  const lastCheckin = tracker?.monthlyCheckins?.[tracker.monthlyCheckins.length - 1];
  const lastReview = tracker?.sixMonthReviews?.[tracker.sixMonthReviews.length - 1];

  // Sheet 1: Overview
  const overviewData = [
    ['Field', 'Value', 'Instructions / Format'],
    ['Startup Name', startup.name, 'Company full legal name'],
    ['One Liner', startup.oneLiner, 'Brief 1-sentence value proposition'],
    ['Sector', startup.sector, 'AI_ML, MEDTECH, AGRITECH, CYBERSECURITY, UAV, SEMICONDUCTOR, ADVANCED_MATERIALS'],
    ['Stage', startup.stage, 'PRE_INCUBATION, EARLY_INCUBATION, MID_INCUBATION, LATE_INCUBATION, ACCELERATION, GRADUATED'],
    ['Cohort', startup.cohort, 'Cohort name / year'],
    ['Founded Date', startup.foundedOn, 'YYYY-MM-DD'],
    ['City', startup.city, 'City of registration'],
    ['Website', startup.website || '', 'URL'],
    ['TRL', startup.trl, 'Technology Readiness Level (1-9)'],
    ['IP Status', startup.ipStatus, 'NONE, TRADE_SECRET, FILED, GRANTED'],
    ['IP Ownership Clear', startup.ipOwnershipClear ? 'YES' : 'NO', 'YES or NO'],
    ['Commercial Signal', startup.commercialSignal, 'NONE, INTEREST, PILOT_LOI, PAYING'],
    ['Grant Sanctioned (INR)', startup.grantSanctioned, 'Total grant in rupees'],
    ['Grant Disbursed (INR)', startup.grantDisbursed, 'Total grant disbursed in rupees'],
    ['CIN', b?.cin || '', 'Corporate Identity Number'],
    ['ROC', b?.roc || '', 'Registrar of Companies'],
    ['Locations', b?.locations || '', 'Operational locations'],
    ['Round 1 Post Money (Cr)', b?.roundPostMoneyCr || 0, 'In Crore rupees'],
    ['Current Pre Money (Cr)', b?.currentPreMoneyCr || 0, 'In Crore rupees'],
  ];
  const wsOverview = XLSX.utils.aoa_to_sheet(overviewData);
  XLSX.utils.book_append_sheet(wb, wsOverview, 'Overview');

  // Sheet 2: Founders & Cap Table
  const foundersData = [
    ['Category', 'Name', 'Role / Stakeholder', 'Commitment / Equity %', 'Notes'],
    ...((b?.founders || []).map(f => ['FOUNDER', f.name, f.role, f.commitment, f.note])),
    ...((b?.capTable || []).map(c => ['CAP_TABLE', c.holder, 'Shareholder', `${c.pct}%`, 'Diluted equity %'])),
  ];
  const wsFounders = XLSX.utils.aoa_to_sheet(foundersData);
  XLSX.utils.book_append_sheet(wb, wsFounders, 'Founders & CapTable');

  // Sheet 3: Monthly Financials
  const checkinData = [
    ['Month', 'Monthly Revenue (INR)', 'Monthly Burn (INR)', 'Paying Customers', 'Gross Margin %', 'Concentration %', 'Fundraising Stage'],
    ...((tracker?.monthlyCheckins || []).map(m => [
      m.month,
      m.monthlyRevenue,
      m.monthlyBurn,
      m.payingCustomers,
      m.grossMarginPct,
      m.customerConcentrationPct,
      m.fundraisingStage,
    ])),
  ];
  const wsCheckin = XLSX.utils.aoa_to_sheet(checkinData);
  XLSX.utils.book_append_sheet(wb, wsCheckin, 'Monthly Financials');

  // Sheet 4: Order Pipeline
  const pipelineData = [
    ['Customer / Partner Name', 'Amount (Lakh INR)', 'Cap (Lakh INR)', 'Status / Tone (strong/moderate/neutral)'],
    ...((lastCheckin?.orderPipeline || []).map(o => [o.name, o.amountLakh, o.capLakh, o.tone])),
  ];
  const wsPipeline = XLSX.utils.aoa_to_sheet(pipelineData);
  XLSX.utils.book_append_sheet(wb, wsPipeline, 'Order Pipeline');

  // Sheet 5: Market Sizing & Review
  const ms = lastReview?.marketSizing;
  const reviewData = [
    ['Metric', 'Value', 'Unit / Note'],
    ['TAM (Total Addressable Market)', ms?.tamCr || 1000, 'Cr INR'],
    ['SAM (Serviceable Addressable Market)', ms?.samCr || 300, 'Cr INR'],
    ['SOM (Serviceable Obtainable Market)', ms?.somCr || 30, 'Cr INR'],
    ['CAGR %', ms?.cagrPct || 12, 'Annual compound growth rate %'],
    ['Market Note', ms?.note || '', 'Context / Driver'],
    ['Overall Evaluation Score %', lastReview?.overallPct || 75, '%'],
  ];
  const wsReview = XLSX.utils.aoa_to_sheet(reviewData);
  XLSX.utils.book_append_sheet(wb, wsReview, 'Market Sizing');

  // Sheet 6: Value Chain Diagnostics
  const vcData = [
    ['Stage Name', 'Score (1-5)', 'Max Score', 'Is Bottleneck (YES/NO)'],
    ...((tracker?.valueChain || []).map(v => [v.stage, v.score, v.max, v.bottleneck ? 'YES' : 'NO'])),
  ];
  const wsVc = XLSX.utils.aoa_to_sheet(vcData);
  XLSX.utils.book_append_sheet(wb, wsVc, 'Value Chain');

  const excelBuffer = XLSX.write(wb, { bookType: 'xlsx', type: 'array' });
  return new Uint8Array(excelBuffer);
}

export function parseStartupExcel(data: ArrayBuffer | Uint8Array, existingStartup?: Startup): Partial<Startup> {
  const wb = XLSX.read(data, { type: 'array' });

  // Read Overview sheet
  const wsOverview = wb.Sheets['Overview'] || wb.Sheets[wb.SheetNames[0]];
  const overviewRows = XLSX.utils.sheet_to_json<string[]>(wsOverview, { header: 1 });

  const overviewMap: Record<string, string> = {};
  for (const row of overviewRows) {
    if (row && row[0] && row[1] !== undefined) {
      overviewMap[String(row[0]).trim()] = String(row[1]).trim();
    }
  }

  const name = overviewMap['Startup Name'] || existingStartup?.name || 'New Ingested Startup';
  const oneLiner = overviewMap['One Liner'] || existingStartup?.oneLiner || 'Technology innovation startup';
  const sector = (overviewMap['Sector'] as Sector) || existingStartup?.sector || 'ADVANCED_MATERIALS';
  const stage = (overviewMap['Stage'] as Stage) || existingStartup?.stage || 'LATE_INCUBATION';
  const cohort = overviewMap['Cohort'] || existingStartup?.cohort || 'FITT 2026';
  const foundedOn = overviewMap['Founded Date'] || existingStartup?.foundedOn || new Date().toISOString().split('T')[0];
  const city = overviewMap['City'] || existingStartup?.city || 'New Delhi';
  const website = overviewMap['Website'] || existingStartup?.website || '';
  const trl = parseInt(overviewMap['TRL'] || String(existingStartup?.trl || '7'), 10);
  const ipStatus = (overviewMap['IP Status'] as IPStatus) || existingStartup?.ipStatus || 'FILED';
  const ipOwnershipClear = (overviewMap['IP Ownership Clear'] || 'YES').toUpperCase().startsWith('Y');
  const commercialSignal = (overviewMap['Commercial Signal'] as CommercialSignal) || existingStartup?.commercialSignal || 'PAYING';
  const grantSanctioned = parseFloat(overviewMap['Grant Sanctioned (INR)'] || String(existingStartup?.grantSanctioned || 0));
  const grantDisbursed = parseFloat(overviewMap['Grant Disbursed (INR)'] || String(existingStartup?.grantDisbursed || 0));

  // Parse Founders & Cap table
  const wsFounders = wb.Sheets['Founders & CapTable'];
  const foundersList = existingStartup?.fittTracker?.baseline?.founders ? [...existingStartup.fittTracker.baseline.founders] : [];
  const capTableList = existingStartup?.fittTracker?.baseline?.capTable ? [...existingStartup.fittTracker.baseline.capTable] : [];

  if (wsFounders) {
    const fRows = XLSX.utils.sheet_to_json<string[]>(wsFounders, { header: 1 });
    // Clear and reload if valid rows
    const newFounders: FittFounder[] = [];
    const newCap: FittCapTableEntry[] = [];
    fRows.slice(1).forEach(row => {
      const type = String(row[0] || '').trim().toUpperCase();
      if (type === 'FOUNDER') {
        newFounders.push({
          name: String(row[1] || 'Founder'),
          role: String(row[2] || 'Co-founder'),
          commitment: String(row[3] || 'FULL_TIME').toUpperCase().includes('PART') ? 'PART_TIME' : 'FULL_TIME',
          note: String(row[4] || ''),
        });
      } else if (type === 'CAP_TABLE') {
        const pctVal = parseFloat(String(row[3] || '0').replace('%', ''));
        newCap.push({
          holder: String(row[1] || 'Shareholder'),
          pct: isNaN(pctVal) ? 10 : pctVal,
          color: newCap.length === 0 ? '#2563EB' : newCap.length === 1 ? '#4F46E5' : '#D97706',
        });
      }
    });
    if (newFounders.length > 0) foundersList.splice(0, foundersList.length, ...newFounders);
    if (newCap.length > 0) capTableList.splice(0, capTableList.length, ...newCap);
  }

  // Parse Pipeline
  const wsPipeline = wb.Sheets['Order Pipeline'];
  const pipelineList: FittOrderPipelineEntry[] = [];
  if (wsPipeline) {
    const pRows = XLSX.utils.sheet_to_json<string[]>(wsPipeline, { header: 1 });
    pRows.slice(1).forEach(row => {
      if (row[0]) {
        const rawTone = String(row[3] || 'strong').toLowerCase();
        const tone: FittOrderPipelineEntry['tone'] =
          rawTone === 'moderate' || rawTone === 'neutral' ? rawTone : 'strong';
        pipelineList.push({
          name: String(row[0]),
          amountLakh: parseFloat(String(row[1] || '0')),
          capLakh: parseFloat(String(row[2] || '0')),
          tone,
        });
      }
    });
  }

  // Parse Market Sizing
  const wsReview = wb.Sheets['Market Sizing'];
  let tam = 1000;
  let sam = 300;
  let som = 30;
  let cagr = 14;
  let mNote = 'Growing domestic and export demand';
  let overallPct = 76;

  if (wsReview) {
    const rRows = XLSX.utils.sheet_to_json<string[]>(wsReview, { header: 1 });
    rRows.forEach(row => {
      const k = String(row[0] || '').toLowerCase();
      const v = String(row[1] || '');
      if (k.includes('tam')) tam = parseFloat(v) || tam;
      if (k.includes('sam')) sam = parseFloat(v) || sam;
      if (k.includes('som')) som = parseFloat(v) || som;
      if (k.includes('cagr')) cagr = parseFloat(v) || cagr;
      if (k.includes('market note')) mNote = v || mNote;
      if (k.includes('overall')) overallPct = parseFloat(v) || overallPct;
    });
  }

  // Parse Value Chain
  const wsVc = wb.Sheets['Value Chain'];
  const vcList: FittValueChainStage[] = [];
  if (wsVc) {
    const vcRows = XLSX.utils.sheet_to_json<string[]>(wsVc, { header: 1 });
    vcRows.slice(1).forEach(row => {
      if (row[0]) {
        vcList.push({
          stage: String(row[0]),
          score: parseInt(String(row[1] || '4'), 10),
          max: parseInt(String(row[2] || '5'), 10),
          bottleneck: String(row[3] || 'NO').toUpperCase().startsWith('Y'),
        });
      }
    });
  }

  // Assemble base tracker
  const baseTracker: FittTracker = existingStartup?.fittTracker || {
    checkedOn: new Date().toISOString().split('T')[0],
    nextPmActions: [
      { label: 'Follow up on order', note: 'Coordinate pilot shipment delivery' },
      { label: 'Review IP filing', note: 'Verify patent office response' },
    ],
    baseline: {
      tags: ['Deeptech', 'B2B'],
      dpiitRecognised: true,
      cin: overviewMap['CIN'] || 'U17299DL2024PTC426388',
      roc: overviewMap['ROC'] || 'ROC Delhi',
      incorporatedOn: foundedOn,
      locations: overviewMap['Locations'] || 'Delhi & Haryana',
      ipStatusNote: 'Core patent filed, utility models pending',
      techTransferNote: 'Standard incubation technology transfer terms',
      totalRaisedNote: '₹90.4L Grant sanctioned',
      founders: foundersList.length ? foundersList : [
        { name: 'Founder & CEO', role: 'CEO', commitment: 'FULL_TIME', note: 'Operations & GTM' },
      ],
      capTable: capTableList.length ? capTableList : [
        { holder: 'Founders', pct: 80, color: '#2563EB' },
        { holder: 'ESOP Pool', pct: 20, color: '#4F46E5' },
      ],
      capTableNote: 'Fully diluted as-converted cap table',
      funding: [
        { label: 'Incubation Grant', amountCr: grantSanctioned / 10000000, kind: 'GRANT' },
      ],
      fundingWidthDenominatorCr: 2.0,
      roundPostMoneyCr: parseFloat(overviewMap['Round 1 Post Money (Cr)'] || '10.0'),
      previousPreMoneyCr: parseFloat(overviewMap['Current Pre Money (Cr)'] || '10.0'),
      currentPreMoneyCr: parseFloat(overviewMap['Current Pre Money (Cr)'] || '8.5'),
      useOfFunds: [
        { label: 'R&D / Equipment', pct: 45, color: '#2563EB' },
        { label: 'Pilot Production', pct: 35, color: '#16A34A' },
        { label: 'Working Capital', pct: 20, color: '#D97706' },
      ],
    },
    monthlyCheckins: [
      {
        month: new Date().toISOString().slice(0, 7),
        monthlyRevenue: 0,
        monthlyRevenueNote: 'Pre-revenue pilot stage',
        monthlyBurn: 750000,
        cashNote: 'Cash in institutional bank account',
        runwayPmViewNote: 'Liquidity adequate for next 6 months',
        q1RevenueLakh: 5.0,
        q1RevenueTargetLakh: 12.0,
        payingCustomers: 1,
        payingCustomersNote: 'Initial enterprise commercial pilot',
        grossMarginPct: 55,
        grossMarginNote: 'Attractive gross contribution margin',
        productStage: 'TRL ' + trl + ' Production',
        productStageNote: 'Scale batch manufacturing underway',
        orderPipeline: pipelineList.length ? pipelineList : [
          { name: 'Enterprise Client A', amountLakh: 18.0, capLakh: 25.0, tone: 'strong' },
          { name: 'Distribution Partner B', amountLakh: 8.5, capLakh: 15.0, tone: 'moderate' },
        ],
        customerConcentrationPct: 50,
        customerConcentrationNote: 'Top customer accounts for 50% of volume',
        fundraisingStage: 'Pitching',
        fundraisingNote: 'Engaged with incubation seed investors',
        technology: 'Proprietary core intellectual property',
        pitchMaterials: 'Updated investment memorandum and deck ready',
        gtmProgress: 'B2B institutional partnership outreach',
        pmNotes: 'Execution is progressing on track.',
      },
    ],
    sixMonthReviews: [
      {
        cycle: 'Current Review',
        overallPct,
        sections: [
          { label: 'Team', weightPct: 20, total: 16, max: 20, params: [] },
          { label: 'Technology', weightPct: 25, total: 20, max: 25, params: [] },
          { label: 'Market Opportunity', weightPct: 20, total: 16, max: 20, params: [] },
          { label: 'Financials', weightPct: 20, total: 15, max: 20, params: [] },
          { label: 'Traction', weightPct: 15, total: 11, max: 15, params: [] },
        ],
        supporting: [
          { label: 'Governance & Board', score: 4, max: 5, evidence: 'Regular board updates' },
          { label: 'Regulatory Adherence', score: 4, max: 5, evidence: 'Statutory filings up to date' },
        ],
        porter: [
          { label: 'Threat of New Entrants', score: 4, max: 5, evidence: 'High technical moat' },
          { label: 'Bargaining Power of Buyers', score: 3, max: 5, evidence: 'Moderate enterprise leverage' },
          { label: 'Threat of Substitutes', score: 4, max: 5, evidence: 'Patented formulation' },
          { label: 'Bargaining Power of Suppliers', score: 4, max: 5, evidence: 'Diversified source material' },
          { label: 'Competitive Rivalry', score: 3, max: 5, evidence: 'Niche specialized category' },
        ],
        marketSizing: {
          tamCr: tam,
          samCr: sam,
          somCr: som,
          cagrPct: cagr,
          note: mNote,
        },
      },
    ],
    swot: {
      strengths: ['Proprietary IP and patents', 'Deep domain expertise', 'High gross margins'],
      weaknesses: ['Capital intensive expansion', 'Single supplier dependency'],
      opportunities: ['Export demand across EU & US', 'Sustainable consumer shift'],
      threats: ['Regulatory delays', 'Macro supply chain volatility'],
    },
    valueChain: vcList.length ? vcList : [
      { stage: 'Raw Material Sourcing', score: 4, max: 5, bottleneck: false },
      { stage: 'Core Processing', score: 2, max: 5, bottleneck: true },
      { stage: 'Quality Testing', score: 4, max: 5, bottleneck: false },
      { stage: 'Distribution Logistics', score: 3, max: 5, bottleneck: false },
    ],
    dueDiligence: [
      {
        label: 'Corporate & Legal',
        items: [
          { item: 'Certificate of Incorporation', status: 'COMPLIANT', reference: 'ROC Document', notes: 'Verified' },
          { item: 'Founders Agreement', status: 'COMPLIANT', reference: 'Signed Agreement', notes: 'Reverse vesting included' },
        ],
      },
    ],
    supportLog: [],
    mentorSuggestions: {},
    mentorGaps: {},
    redFlags: [],
    needsAttention: [],
  };

  const updatedStartup: Startup = {
    id: existingStartup?.id || `s_${Date.now()}`,
    name,
    oneLiner,
    sector,
    stage,
    cohort,
    foundedOn,
    city,
    website,
    managerId: existingStartup?.managerId || 'im1',
    associateId: existingStartup?.associateId ?? null,
    trl,
    trlUpdatedOn: new Date().toISOString().split('T')[0],
    ipStatus,
    ipOwnershipClear,
    commercialSignal,
    grantSanctioned,
    grantDisbursed,
    founderToken: existingStartup?.founderToken || `tok_${Math.random().toString(36).substring(2, 9)}`,
    archived: false,
    regTags: existingStartup?.regTags || [],
    fittTracker: baseTracker,
  };

  // Run AI analysis
  const investibility = computeInvestibilityScore(updatedStartup);
  const aiAnalysis = generateAIAnalysis(updatedStartup);

  updatedStartup.investibility = investibility;
  updatedStartup.aiAnalysis = aiAnalysis;

  return updatedStartup;
}

export function downloadFile(buffer: Uint8Array, filename: string) {
  const blob = new Blob([buffer.buffer as ArrayBuffer], {
    type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}
