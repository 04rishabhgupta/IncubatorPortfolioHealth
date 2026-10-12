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
  FittDDSection,
  FittDDItem,
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

function normalizeSector(val?: string): Sector {
  const s = String(val || '').toLowerCase();
  if (s.includes('health') || s.includes('med') || s.includes('bio') || s.includes('pharma') || s.includes('doctor') || s.includes('clinical')) return 'MEDTECH';
  if (s.includes('ai') || s.includes('ml') || s.includes('neural') || s.includes('data') || s.includes('deeptech') || s.includes('software') || s.includes('saas') || s.includes('vision') || s.includes('cloud')) return 'AI_ML';
  if (s.includes('agri') || s.includes('farm') || s.includes('crop') || s.includes('food')) return 'AGRITECH';
  if (s.includes('cyber') || s.includes('security') || s.includes('crypto') || s.includes('defense') || s.includes('defence')) return 'CYBERSECURITY';
  if (s.includes('uav') || s.includes('drone') || s.includes('aero') || s.includes('space') || s.includes('satellite')) return 'UAV';
  if (s.includes('semi') || s.includes('chip') || s.includes('vlsi') || s.includes('hardware')) return 'SEMICONDUCTOR';
  if (s.includes('material') || s.includes('textile') || s.includes('chemical') || s.includes('clean') || s.includes('energy') || s.includes('denim')) return 'ADVANCED_MATERIALS';
  return 'ADVANCED_MATERIALS';
}

function normalizeStage(val?: string): Stage {
  const s = String(val || '').toLowerCase();
  if (s.includes('pre')) return 'PRE_INCUBATION';
  if (s.includes('early') || s.includes('seed')) return 'EARLY_INCUBATION';
  if (s.includes('mid') || s.includes('normal') || s.includes('growth')) return 'MID_INCUBATION';
  if (s.includes('late') || s.includes('scale')) return 'LATE_INCUBATION';
  if (s.includes('accel')) return 'ACCELERATION';
  if (s.includes('grad')) return 'GRADUATED';
  return 'MID_INCUBATION';
}

function normalizeIP(val?: string): IPStatus {
  const s = String(val || '').toLowerCase();
  if (s.includes('grant')) return 'GRANTED';
  if (s.includes('trade') || s.includes('secret')) return 'TRADE_SECRET';
  if (s.includes('file') || s.includes('in-progress') || s.includes('applied') || s.includes('provisional')) return 'FILED';
  if (s.includes('none') || s.includes('no')) return 'NONE';
  return 'FILED';
}

function normalizeCommercialSignal(val?: string, payingCustomers?: number): CommercialSignal {
  if (payingCustomers && payingCustomers > 0) return 'PAYING';
  const s = String(val || '').toLowerCase();
  if (s.includes('paying') || s.includes('revenue') || s.includes('arr') || s.includes('mrr') || s.includes('sale')) return 'PAYING';
  if (s.includes('loi') || s.includes('pilot') || s.includes('poc')) return 'PILOT_LOI';
  if (s.includes('interest')) return 'INTEREST';
  return 'NONE';
}

export function parseStartupExcel(data: ArrayBuffer | Uint8Array, existingStartup?: Startup): Partial<Startup> {
  const wb = XLSX.read(data, { type: 'array' });
  const sheetNames = wb.SheetNames;

  // 1. Locate baseline / overview sheet
  const baselineSheetName =
    sheetNames.find((n) => /baseline/i.test(n)) ||
    sheetNames.find((n) => /overview/i.test(n)) ||
    sheetNames.find((n) => !/(_lists|instruction)/i.test(n)) ||
    sheetNames[0];

  const wsOverview = wb.Sheets[baselineSheetName] || wb.Sheets[wb.SheetNames[0]];
  const overviewRows = XLSX.utils.sheet_to_json<any[]>(wsOverview, { header: 1 });

  const overviewMap: Record<string, string> = {};
  for (const row of overviewRows) {
    if (row && row[0] !== undefined) {
      const key = String(row[0]).trim().toLowerCase();
      // Look for first non-empty value in row
      for (let c = 1; c < Math.min(row.length, 5); c++) {
        if (row[c] !== undefined && row[c] !== null && String(row[c]).trim() !== '' && String(row[c]).trim() !== '—') {
          overviewMap[key] = String(row[c]).trim();
          break;
        }
      }
    }
  }

  // Also check if row 0 was tabular header row
  if (overviewRows.length > 1 && overviewRows[0]) {
    const headerRow = overviewRows[0];
    const dataRow = overviewRows[1] || [];
    headerRow.forEach((col: any, idx: number) => {
      if (col && dataRow[idx] !== undefined) {
        overviewMap[String(col).trim().toLowerCase()] = String(dataRow[idx]).trim();
      }
    });
  }

  function getVal(...keys: string[]): string {
    for (const k of keys) {
      const kl = k.toLowerCase();
      if (overviewMap[kl] !== undefined) return overviewMap[kl];
      for (const mk of Object.keys(overviewMap)) {
        if (mk.includes(kl)) return overviewMap[mk];
      }
    }
    return '';
  }

  const name = getVal('venture name', 'startup name', 'company name', 'startup / venture name', 'name', 'entity name') || existingStartup?.name || 'New Ingested Startup';
  const oneLiner = getVal('sub-domain / core technology', 'core technology description', 'one liner pitch', 'one liner', 'one-liner', 'pitch', 'description', 'summary', 'about', 'product description', 'value proposition') || existingStartup?.oneLiner || 'Technology innovation startup';
  const rawSector = getVal('sector / domain', 'deeptech tag', 'industry', 'domain', 'sector', 'category');
  const sector = rawSector ? normalizeSector(rawSector) : (existingStartup?.sector || 'ADVANCED_MATERIALS');
  const rawStage = getVal('incubation status', 'incubation stage', 'stage', 'status', 'product stage');
  const stage = rawStage ? normalizeStage(rawStage) : (existingStartup?.stage || 'LATE_INCUBATION');
  const cohort = getVal('cohort', 'batch', 'program') || existingStartup?.cohort || 'FITT 2026';
  const foundedOn = getVal('founded date', 'incorporated on', 'year of incorporation', 'date') || existingStartup?.foundedOn || new Date().toISOString().split('T')[0];
  const rawCity = getVal('city / hq location', 'city', 'location', 'hq') || existingStartup?.city || 'New Delhi';
  const city = rawCity.split('/')[0].trim() || 'New Delhi';
  let website = getVal('website / linkedin / github', 'website', 'url', 'web') || existingStartup?.website || '';
  if (website && !website.startsWith('http')) website = `https://${website}`;

  const rawTrl = getVal('trl', 'technology readiness level', 'technology readiness');
  const trl = rawTrl ? parseInt(rawTrl.replace(/\D/g, '') || '7', 10) : (existingStartup?.trl || 7);
  const ipStatus = normalizeIP(getVal('ip status', 'patent status', 'ip'));
  const ipOwnershipRaw = getVal('ip ownership clear', 'ip ownership clearly with startup', 'ip ownership');
  const ipOwnershipClear = ipOwnershipRaw ? (ipOwnershipRaw.toUpperCase().startsWith('Y') || ipOwnershipRaw.toLowerCase().includes('compliant')) : true;

  // Scan funding rounds from baseline sheet
  let totalGrantsInr = 0;
  let totalFundingInr = 0;
  overviewRows.forEach((r) => {
    if (r && r[0] && String(r[0]).match(/^Round\s+\d+/i)) {
      const amountCr = parseFloat(String(r[1] || '0'));
      const text = (String(r[2] || '') + ' ' + String(r[4] || '')).toLowerCase();
      totalFundingInr += amountCr * 10000000;
      if (text.includes('grant') || text.includes('sisf') || text.includes('scheme') || text.includes('istart') || text.includes('prize')) {
        totalGrantsInr += amountCr * 10000000;
      }
    }
  });

  const rawGrantSanctioned = getVal('grant sanctioned (inr)', 'grant sanctioned', 'sanctioned grant', 'total funding raised to date');
  const grantSanctioned = totalGrantsInr > 0 ? totalGrantsInr : (parseFloat(rawGrantSanctioned) || existingStartup?.grantSanctioned || (totalFundingInr > 0 ? totalFundingInr : 5000000));
  const rawGrantDisbursed = getVal('grant disbursed (inr)', 'grant disbursed', 'disbursed');
  const grantDisbursed = parseFloat(rawGrantDisbursed) || (totalGrantsInr > 0 ? Math.round(totalGrantsInr * 0.65) : (existingStartup?.grantDisbursed || 3000000));

  // Parse Founders & Cap table
  const wsFounders = wb.Sheets['Founders & CapTable'];
  const foundersList = existingStartup?.fittTracker?.baseline?.founders ? [...existingStartup.fittTracker.baseline.founders] : [];
  const capTableList = existingStartup?.fittTracker?.baseline?.capTable ? [...existingStartup.fittTracker.baseline.capTable] : [];

  if (wsFounders) {
    const fRows = XLSX.utils.sheet_to_json<string[]>(wsFounders, { header: 1 });
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
  } else {
    // Check if Baseline sheet has horizontal founder columns
    const fNameRow = overviewRows.find((r) => r && r[0] && String(r[0]).trim().toLowerCase() === 'full name');
    const fRoleRow = overviewRows.find((r) => r && r[0] && String(r[0]).trim().toLowerCase() === 'role / title');
    const fCommitRow = overviewRows.find((r) => r && r[0] && String(r[0]).trim().toLowerCase() === 'full-time / part-time');
    const fExpRow = overviewRows.find((r) => r && r[0] && String(r[0]).trim().toLowerCase() === 'domain expertise');

    if (fNameRow) {
      const newFounders: FittFounder[] = [];
      for (let c = 1; c < fNameRow.length - 1; c++) {
        if (fNameRow[c] && String(fNameRow[c]).trim()) {
          newFounders.push({
            name: String(fNameRow[c]).trim(),
            role: fRoleRow && fRoleRow[c] ? String(fRoleRow[c]).trim() : 'Co-founder',
            commitment: fCommitRow && fCommitRow[c] && String(fCommitRow[c]).toUpperCase().includes('PART') ? 'PART_TIME' : 'FULL_TIME',
            note: fExpRow && fExpRow[c] ? String(fExpRow[c]).trim() : '',
          });
        }
      }
      if (newFounders.length > 0) foundersList.splice(0, foundersList.length, ...newFounders);
    }

    // Check Cap Table Summary in Baseline
    const capSummaryRow = overviewRows.find((r) => r && r[0] && String(r[0]).toLowerCase().includes('cap table summary'));
    if (capSummaryRow && capSummaryRow[1]) {
      const parts = String(capSummaryRow[1]).split('|');
      const colors = ['#2563EB', '#4F46E5', '#7C3AED', '#A1A1AA', '#D97706', '#06B6D4', '#EA580C'];
      const parsedCap: FittCapTableEntry[] = [];
      parts.forEach((p, idx) => {
        const match = p.trim().match(/([A-Za-z0-9\s]+?)\s*([\d\.]+)%/);
        if (match) {
          parsedCap.push({
            holder: match[1].trim(),
            pct: parseFloat(match[2]),
            color: colors[idx % colors.length],
          });
        }
      });
      if (parsedCap.length > 0) capTableList.splice(0, capTableList.length, ...parsedCap);
    }
  }

  // Parse Pipeline & Monthly Check-in
  const wsPipeline = wb.Sheets['Order Pipeline'];
  const wsCheckin = wb.Sheets['📅 Monthly Check-in'] || wb.Sheets[sheetNames.find((n) => /check-?in/i.test(n)) || ''];
  const pipelineList: FittOrderPipelineEntry[] = [];
  let checkinMonthlyRev = 0;
  let checkinMonthlyBurn = 750000;
  let checkinCashNote = 'Cash in institutional bank account';
  let checkinPayingCust = 1;
  let checkinGrossMargin = 55;
  let checkinPmNotes = 'Execution is progressing on track.';
  let checkinRunwayNote = 'Liquidity adequate for next 6 months';

  if (wsCheckin) {
    const cRows = XLSX.utils.sheet_to_json<any[]>(wsCheckin, { header: 1 });
    const cMap: Record<string, any> = {};
    cRows.forEach((r) => {
      if (r && r[0] && r[1] !== undefined) cMap[String(r[0]).trim().toLowerCase()] = r[1];
    });
    if (cMap['monthly revenue (₹ lakh)'] !== undefined) checkinMonthlyRev = (parseFloat(cMap['monthly revenue (₹ lakh)']) || 0) * 100000;
    if (cMap['monthly burn (₹ lakh)'] !== undefined) checkinMonthlyBurn = (parseFloat(cMap['monthly burn (₹ lakh)']) || 7.5) * 100000;
    if (cMap['cash in bank (₹ lakh)'] !== undefined) checkinCashNote = `₹${cMap['cash in bank (₹ lakh)']} Lakh in bank`;
    if (cMap['no. of paying customers'] !== undefined) checkinPayingCust = parseInt(String(cMap['no. of paying customers']), 10) || 1;
    if (cMap['gross margin %'] !== undefined) checkinGrossMargin = parseFloat(cMap['gross margin %']) || 55;
    if (cMap['pm notes / observations'] || cMap['pm notes']) checkinPmNotes = String(cMap['pm notes / observations'] || cMap['pm notes']);
    if (cMap['surviving runway (months)']) checkinRunwayNote = `Runway ~${Math.round(parseFloat(cMap['surviving runway (months)']) || 4)} months`;
  }

  if (wsPipeline) {
    const pRows = XLSX.utils.sheet_to_json<string[]>(wsPipeline, { header: 1 });
    pRows.slice(1).forEach((row) => {
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

  const commercialSignal = normalizeCommercialSignal(getVal('commercial signal', 'revenue status'), checkinPayingCust);

  // Parse Market Sizing & 6-Month Review
  const wsReview = wb.Sheets['Market Sizing'] || wb.Sheets['📊 6-Month Review'] || wb.Sheets[sheetNames.find((n) => /review/i.test(n)) || ''];
  let tam = 1000;
  let sam = 300;
  let som = 30;
  let cagr = 14;
  let mNote = 'Growing domestic and export demand';
  let overallPct = 76;

  if (wsReview) {
    const rRows = XLSX.utils.sheet_to_json<any[]>(wsReview, { header: 1 });
    rRows.forEach((row) => {
      const k = String(row[0] || '').toLowerCase();
      const v = String(row[1] || '');
      if (k.includes('tam')) tam = parseFloat(v) || tam;
      if (k.includes('sam')) sam = parseFloat(v) || sam;
      if (k.includes('som')) som = parseFloat(v) || som;
      if (k.includes('cagr')) cagr = parseFloat(v) || cagr;
      if (k.includes('market note')) mNote = v || mNote;
      if (k.includes('overall') || k.includes('score')) overallPct = parseFloat(v) || overallPct;
    });
  }

  // Parse Value Chain
  const wsVc = wb.Sheets['Value Chain'] || wb.Sheets['📊 Value Chain Matrix'] || wb.Sheets[sheetNames.find((n) => /value\s*chain/i.test(n)) || ''];
  const vcList: FittValueChainStage[] = [];
  if (wsVc) {
    const vcRows = XLSX.utils.sheet_to_json<any[]>(wsVc, { header: 1 });
    const startIdx = vcRows.findIndex((r) => r && r[0] && (String(r[0]).includes('1 —') || String(r[0]).includes('Raw Material') || String(r[0]).includes('Sourcing')));
    const rowsToParse = startIdx >= 0 ? vcRows.slice(startIdx) : vcRows.slice(1);
    rowsToParse.forEach((row) => {
      if (row && row[0] && !String(row[0]).toLowerCase().includes('bottleneck summary') && !String(row[0]).toLowerCase().includes('stage name')) {
        const stageName = String(row[0]).replace(/\r?\n/g, ' ').trim();
        const scoreVal = parseInt(String(row[2] !== undefined ? row[2] : row[1] || '3'), 10) || 3;
        const bottleneckVal = String(row[3] || 'NO').toUpperCase().startsWith('Y');
        vcList.push({
          stage: stageName,
          score: Math.min(Math.max(scoreVal, 1), 5),
          max: 5,
          bottleneck: bottleneckVal,
        });
      }
    });
  }

  // Parse SWOT Matrix
  const wsSwot = wb.Sheets['🔲 SWOT Matrix'] || wb.Sheets[sheetNames.find((n) => /swot/i.test(n)) || ''];
  const swotStrengths: string[] = [];
  const swotWeaknesses: string[] = [];
  const swotOpportunities: string[] = [];
  const swotThreats: string[] = [];

  if (wsSwot) {
    const sRows = XLSX.utils.sheet_to_json<any[]>(wsSwot, { header: 1 });
    sRows.slice(7).forEach((r) => {
      if (r[1] && String(r[1]).trim() && !String(r[1]).includes('◼') && !String(r[1]).includes('💡')) {
        swotStrengths.push(String(r[1]).trim());
      }
      if (r[2] && String(r[2]).trim() && !String(r[2]).includes('◼') && !String(r[2]).includes('💡')) {
        swotWeaknesses.push(String(r[2]).trim());
      }
    });
  }

  // Parse Due Diligence
  const wsDd = wb.Sheets['🔬 LDD-FDD'] || wb.Sheets[sheetNames.find((n) => /ldd|fdd|diligence/i.test(n)) || ''];
  const ddSections: FittDDSection[] = [];
  if (wsDd) {
    const ddRows = XLSX.utils.sheet_to_json<any[]>(wsDd, { header: 1 });
    let currentSection: FittDDSection = { label: 'Legal & Compliance', items: [] };
    ddRows.forEach((r) => {
      if (r && r[0]) {
        const txt = String(r[0]).trim();
        if (txt.includes('LDD') || txt.includes('FDD') || txt.includes('DILIGENCE')) {
          if (currentSection.items.length > 0) ddSections.push(currentSection);
          currentSection = { label: txt.replace(/[🔬🔍]/g, '').trim(), items: [] };
        } else if (r[1]) {
          const statusRaw = String(r[1]).toLowerCase();
          const status: FittDDItem['status'] = statusRaw.includes('issue') ? 'ISSUE' : statusRaw.includes('waiv') ? 'WAIVED' : 'COMPLIANT';
          currentSection.items.push({
            item: txt,
            status,
            reference: String(r[2] || ''),
            notes: String(r[3] || ''),
          });
        }
      }
    });
    if (currentSection.items.length > 0) ddSections.push(currentSection);
  }

  // Assemble base tracker
  const baseTracker: FittTracker = existingStartup?.fittTracker || {
    checkedOn: new Date().toISOString().split('T')[0],
    nextPmActions: [
      { label: 'Follow up on milestones', note: 'Coordinate quarterly progress review' },
      { label: 'Review IP filing', note: 'Verify patent office response' },
    ],
    baseline: {
      tags: ['Deeptech', sector === 'MEDTECH' ? 'HealthTech' : 'B2B'],
      dpiitRecognised: true,
      cin: getVal('cin') || 'U14101RJ2024PTC092556',
      roc: getVal('roc') || 'ROC Delhi',
      incorporatedOn: foundedOn,
      locations: city,
      ipStatusNote: getVal('patent numbers / claims', 'ip status') || 'Core patent filed, utility models pending',
      techTransferNote: getVal('tech transfer status') || 'Standard incubation technology transfer terms',
      totalRaisedNote: `₹${(grantSanctioned / 100000).toFixed(1)}L Funding/Grants recorded`,
      founders: foundersList.length ? foundersList : [
        { name: 'Founder & CEO', role: 'CEO', commitment: 'FULL_TIME', note: 'Operations & GTM' },
      ],
      capTable: capTableList.length ? capTableList : [
        { holder: 'Founders', pct: 80, color: '#2563EB' },
        { holder: 'ESOP Pool', pct: 20, color: '#4F46E5' },
      ],
      capTableNote: 'Cap table as per latest filing',
      funding: [
        { label: 'Incubation Grant', amountCr: grantSanctioned / 10000000, kind: 'GRANT' },
      ],
      fundingWidthDenominatorCr: 2.0,
      roundPostMoneyCr: parseFloat(getVal('last round post-money valuation (₹ cr)', 'round 1 post money') || '10.0'),
      previousPreMoneyCr: parseFloat(getVal('current pre money') || '10.0'),
      currentPreMoneyCr: parseFloat(getVal('current pre money') || '8.5'),
      useOfFunds: [
        { label: 'R&D / Equipment', pct: 45, color: '#2563EB' },
        { label: 'Pilot Production', pct: 35, color: '#16A34A' },
        { label: 'Working Capital', pct: 20, color: '#D97706' },
      ],
    },
    monthlyCheckins: [
      {
        month: new Date().toISOString().slice(0, 7),
        monthlyRevenue: checkinMonthlyRev,
        monthlyRevenueNote: checkinMonthlyRev > 0 ? 'Operating commercial revenue' : 'Pre-revenue / pilot stage',
        monthlyBurn: checkinMonthlyBurn,
        cashNote: checkinCashNote,
        runwayPmViewNote: checkinRunwayNote,
        q1RevenueLakh: (checkinMonthlyRev * 3) / 100000 || 5.0,
        q1RevenueTargetLakh: 12.0,
        payingCustomers: checkinPayingCust,
        payingCustomersNote: `${checkinPayingCust} verified commercial client(s)`,
        grossMarginPct: checkinGrossMargin,
        grossMarginNote: 'Gross contribution margin',
        productStage: `TRL ${trl} Production`,
        productStageNote: 'Active pilot deployments',
        orderPipeline: pipelineList.length ? pipelineList : [
          { name: 'Primary Client Pipeline', amountLakh: 18.0, capLakh: 25.0, tone: 'strong' },
          { name: 'Secondary Pipeline', amountLakh: 8.5, capLakh: 15.0, tone: 'moderate' },
        ],
        customerConcentrationPct: 50,
        customerConcentrationNote: 'Core pipeline concentration',
        fundraisingStage: 'Pitching',
        fundraisingNote: 'Engaged with incubation seed investors',
        technology: getVal('core technology description', 'primary tech stack') || 'Proprietary core intellectual property',
        pitchMaterials: 'Updated investment memorandum and deck ready',
        gtmProgress: 'B2B institutional partnership outreach',
        pmNotes: checkinPmNotes,
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
      strengths: swotStrengths.length ? swotStrengths.slice(0, 5) : ['Proprietary IP and patents', 'Deep domain expertise', 'High gross margins'],
      weaknesses: swotWeaknesses.length ? swotWeaknesses.slice(0, 5) : ['Capital intensive expansion', 'Single supplier dependency'],
      opportunities: swotOpportunities.length ? swotOpportunities.slice(0, 5) : ['Institutional procurement demand', 'Growing sector adoption'],
      threats: swotThreats.length ? swotThreats.slice(0, 5) : ['Regulatory delays', 'Macro supply chain volatility'],
    },
    valueChain: vcList.length ? vcList : [
      { stage: 'Raw Material Sourcing', score: 4, max: 5, bottleneck: false },
      { stage: 'Core Processing', score: 2, max: 5, bottleneck: true },
      { stage: 'Quality Testing', score: 4, max: 5, bottleneck: false },
      { stage: 'Distribution Logistics', score: 3, max: 5, bottleneck: false },
    ],
    dueDiligence: ddSections.length ? ddSections : [
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
