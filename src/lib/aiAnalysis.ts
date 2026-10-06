import { Startup, MonthlyMetrics, InvestibilityScore } from '@/types';

export function computeInvestibilityScore(startup: Startup, metrics?: MonthlyMetrics[]): InvestibilityScore {
  const tracker = startup.fittTracker;
  const latestMetric = metrics && metrics.length > 0 ? metrics[metrics.length - 1] : undefined;
  const lastCheckin = tracker?.monthlyCheckins?.[tracker.monthlyCheckins.length - 1];

  let teamScore = 12; // base
  let marketScore = 14;
  let technologyScore = 12;
  let financialScore = 10;
  let tractionScore = 8;

  const strengths: string[] = [];
  const risks: string[] = [];

  // 1. Team evaluation (max 20)
  if (tracker?.baseline?.founders && tracker.baseline.founders.length > 0) {
    const fullTimeFounders = tracker.baseline.founders.filter(f => f.commitment === 'FULL_TIME');
    const founderPct = fullTimeFounders.length / tracker.baseline.founders.length;
    teamScore = Math.min(20, Math.round(8 + founderPct * 8 + 4));

    if (founderPct >= 0.6) {
      strengths.push('Dedicated leadership team with majority full-time commitment');
    } else {
      risks.push('Core technical/founding members operating on part-time basis');
    }
  }

  // 2. Market evaluation (max 25)
  if (tracker?.sixMonthReviews && tracker.sixMonthReviews.length > 0) {
    const lastReview = tracker.sixMonthReviews[tracker.sixMonthReviews.length - 1];
    const ms = lastReview.marketSizing;
    let msScore = 8;
    if (ms) {
      if (ms.tamCr >= 1000) msScore += 5;
      else if (ms.tamCr >= 200) msScore += 3;
      if (ms.cagrPct >= 10) msScore += 4;
      else msScore += 2;
    }
    const porterTotal = lastReview.porter?.reduce((acc, p) => acc + p.score, 0) || 15;
    const porterMax = lastReview.porter?.reduce((acc, p) => acc + p.max, 0) || 25;
    const porterRatio = porterTotal / porterMax;
    marketScore = Math.min(25, Math.round(msScore + porterRatio * 8));

    if (ms && ms.cagrPct >= 10) {
      strengths.push(`High-growth target market (₹${ms.tamCr} Cr TAM expanding at ${ms.cagrPct}% CAGR)`);
    }
  } else {
    marketScore = 16;
  }

  // 3. Technology & IP (max 20)
  let techPoints = 4;
  if (startup.trl >= 7) techPoints += 8;
  else if (startup.trl >= 5) techPoints += 6;
  else techPoints += 3;

  if (startup.ipStatus === 'GRANTED') techPoints += 6;
  else if (startup.ipStatus === 'FILED') techPoints += 4;
  else if (startup.ipStatus === 'TRADE_SECRET') techPoints += 3;

  if (startup.ipOwnershipClear) {
    techPoints += 2;
    strengths.push(`High Technology Readiness (TRL ${startup.trl}) with proprietary IP portfolio`);
  } else {
    risks.push('IP ownership not fully assigned or subject to institutional licensing terms');
  }
  technologyScore = Math.min(20, techPoints);

  // 4. Financial discipline & Runway (max 20)
  let finPoints = 4;
  const cash = latestMetric?.cashBalance ?? 500000;
  const burn = latestMetric?.monthlyBurn ?? 500000;
  const runway = burn > 0 ? cash / burn : 6;

  if (runway >= 12) finPoints += 8;
  else if (runway >= 6) finPoints += 6;
  else if (runway >= 3) finPoints += 3;
  else {
    risks.push(`Immediate liquidity pressure: Runway under 3 months (${runway.toFixed(1)}m)`);
  }

  if (tracker?.baseline?.roundPostMoneyCr && tracker?.baseline?.currentPreMoneyCr) {
    if (tracker.baseline.currentPreMoneyCr < tracker.baseline.roundPostMoneyCr) {
      risks.push('Down-round repricing pressure in current capital raise');
    } else {
      finPoints += 4;
      strengths.push('Disciplined capital allocation with healthy valuation expansion');
    }
  } else {
    finPoints += 3;
  }

  if (lastCheckin?.grossMarginPct && lastCheckin.grossMarginPct >= 40) {
    finPoints += 4;
    strengths.push(`Strong unit economics (${lastCheckin.grossMarginPct}% gross margin)`);
  }
  financialScore = Math.min(20, finPoints);

  // 5. Commercial Traction (max 15)
  let tracPoints = 3;
  if (startup.commercialSignal === 'PAYING') {
    tracPoints += 7;
    strengths.push('Active commercial monetization with paying B2B customers');
  } else if (startup.commercialSignal === 'PILOT_LOI') {
    tracPoints += 5;
    strengths.push('Validated customer demand with active pilots and signed LOIs');
  } else {
    tracPoints += 2;
  }

  if (lastCheckin?.orderPipeline && lastCheckin.orderPipeline.length > 0) {
    const executed = lastCheckin.orderPipeline.filter(o => o.tone === 'strong');
    if (executed.length > 0) tracPoints += 4;
  }

  if (lastCheckin?.customerConcentrationPct && lastCheckin.customerConcentrationPct > 50) {
    risks.push(`High customer concentration risk (${lastCheckin.customerConcentrationPct}% from single buyer)`);
  }
  tractionScore = Math.min(15, tracPoints);

  const total = Math.min(100, Math.max(20, teamScore + marketScore + technologyScore + financialScore + tractionScore));

  let grade: 'A+' | 'A' | 'B' | 'C' | 'D';
  if (total >= 88) grade = 'A+';
  else if (total >= 75) grade = 'A';
  else if (total >= 60) grade = 'B';
  else if (total >= 45) grade = 'C';
  else grade = 'D';

  let recommendation = '';
  if (total >= 75) {
    recommendation = 'Strong institutional investibility. Recommend advancing to Demo Day and fast-tracking investor syndication.';
  } else if (total >= 60) {
    recommendation = 'Moderate investibility with strong technical fundamentals. Recommend addressing key customer concentration and completing IP grant milestones.';
  } else {
    recommendation = 'Early stage investibility. Focus on extending cash runway, formalizing IP ownership, and securing initial paying customer commitments.';
  }

  return {
    total,
    grade,
    breakdown: {
      teamScore,
      marketScore,
      technologyScore,
      financialScore,
      tractionScore,
    },
    strengths: strengths.slice(0, 3),
    risks: risks.slice(0, 3),
    recommendation,
  };
}

export function detectRedFlags(startup: Startup, metrics?: MonthlyMetrics[]): string[] {
  const flags: string[] = [];
  const latestMetric = metrics && metrics.length > 0 ? metrics[metrics.length - 1] : undefined;
  const tracker = startup.fittTracker;
  const lastCheckin = tracker?.monthlyCheckins?.[tracker.monthlyCheckins.length - 1];

  // Runway check
  if (latestMetric && latestMetric.monthlyBurn > 0) {
    const runway = latestMetric.cashBalance / latestMetric.monthlyBurn;
    if (runway < 3) {
      flags.push(`Critical Runway: Less than ${runway.toFixed(1)} months of operational cash available.`);
    }
  }

  // Down round check
  if (tracker?.baseline?.roundPostMoneyCr && tracker?.baseline?.currentPreMoneyCr) {
    if (tracker.baseline.currentPreMoneyCr < tracker.baseline.roundPostMoneyCr) {
      flags.push(`Down-Round Repricing: Current valuation (₹${tracker.baseline.currentPreMoneyCr} Cr) is lower than previous post-money round (₹${tracker.baseline.roundPostMoneyCr} Cr).`);
    }
  }

  // Customer concentration check
  if (lastCheckin?.customerConcentrationPct && lastCheckin.customerConcentrationPct >= 50) {
    flags.push(`Customer Concentration: Single customer accounts for ${lastCheckin.customerConcentrationPct}% of pipeline revenue.`);
  }

  // Founder full-time commitment
  if (tracker?.baseline?.founders) {
    const partTime = tracker.baseline.founders.filter(f => f.commitment === 'PART_TIME');
    if (partTime.length > 0) {
      flags.push(`Key Personnel Risk: ${partTime.map(p => `${p.name} (${p.role})`).join(', ')} is part-time.`);
    }
  }

  // IP Ownership
  if (!startup.ipOwnershipClear) {
    flags.push('IP Ownership Ambiguity: Patent assignment or institutional revenue-share terms pending resolution.');
  }

  // Production bottleneck
  if (tracker?.valueChain) {
    const bottlenecks = tracker.valueChain.filter(v => v.bottleneck);
    if (bottlenecks.length > 0) {
      flags.push(`Operational Bottleneck: Severe constraint flagged in ${bottlenecks.map(b => b.stage).join(', ')}.`);
    }
  }

  return flags;
}

export function generateAIAnalysis(startup: Startup, metrics?: MonthlyMetrics[]) {
  const investibility = computeInvestibilityScore(startup, metrics);
  const redFlags = detectRedFlags(startup, metrics);

  const actionItems: string[] = [];
  if (redFlags.some(f => f.includes('Runway'))) {
    actionItems.push('Accelerate bridge grant disbursement and open convertible note discussions with incubation angels.');
  }
  if (redFlags.some(f => f.includes('Customer Concentration'))) {
    actionItems.push('Target 3 alternate enterprise pilot partners to diversify pipeline exposure below 40%.');
  }
  if (redFlags.some(f => f.includes('IP Ownership'))) {
    actionItems.push('Execute formal MoU amendment with institutional technology transfer office to secure clear title.');
  }
  if (actionItems.length === 0) {
    actionItems.push('Prepare institutional investor pitch deck and data room for Series Seed syndication.');
    actionItems.push('Complete prototype clinical validation or pilot production milestone.');
  }

  const thesis = `${startup.name} represents a high-potential ${startup.sector} venture at ${startup.stage.replace(/_/g, ' ').toLowerCase()} with a Technology Readiness Level of ${startup.trl}. Unit economics are fundamentally sound, but capital runway and commercial diversification require proactive governance.`;

  return {
    summary: `AI Portfolio Assessment: Investibility rated at ${investibility.total}/100 (${investibility.grade}). ${redFlags.length} active red flags detected requiring manager intervention.`,
    thesis,
    redFlags,
    actionItems,
    lastAnalyzed: new Date().toISOString().split('T')[0],
  };
}
