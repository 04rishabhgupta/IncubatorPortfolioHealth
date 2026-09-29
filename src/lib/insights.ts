import { Startup, RegulatoryItem, MonthlyMetrics, HealthAssessment, Mentor, MentorMatch } from '@/types';

export type AIInsight = {
  id: string;
  category: 'REGULATORY' | 'PORTFOLIO_RISK' | 'MENTOR_RECOMMENDATION';
  title: string;
  startupsAffected: Startup[];
  whyItMatters: string;
  suggestedAction: {
    label: string;
    type: 'SEND_MESSAGE' | 'SEND_REQUEST' | 'DRAFT_MENTOR_MATCH' | 'VIEW_REGULATORY';
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    payload?: any;
  };
};

export function generateInsights(
  startups: Startup[],
  regulatory: RegulatoryItem[],
  metrics: MonthlyMetrics[],
  assessments: HealthAssessment[],
  mentors: Mentor[],
  mentorMatches: MentorMatch[],
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  _demoToday: string
): AIInsight[] {
  const insights: AIInsight[] = [];
  let idCounter = 1;

  // 1. Regulatory Risks
  regulatory.filter(r => r.status === 'NOTIFIED' || r.status === 'CONSULTATION').forEach(reg => {
    const affected = startups.filter(s => {
      if (!s.regTags) return false;
      const hasSector = reg.sectors.includes(s.sector);
      const hasDirectTag = reg.directTags.some(t => s.regTags.includes(t));
      const hasIndirectTag = reg.indirectTags.some(t => s.regTags.includes(t));
      return hasSector || hasDirectTag || hasIndirectTag;
    });

    if (affected.length > 0) {
      insights.push({
        id: `ins-${idCounter++}`,
        category: 'REGULATORY',
        title: `Regulatory Alert: ${reg.title}`,
        startupsAffected: affected,
        whyItMatters: reg.summary,
        suggestedAction: {
          label: 'Send mass update request',
          type: 'SEND_REQUEST',
          payload: { regId: reg.id }
        }
      });
    }
  });

  // 2. Portfolio Warnings
  // 2a. Runway under 3m
  const runwayRisks = startups.filter(s => {
    const sMetrics = metrics.filter(m => m.startupId === s.id).sort((a, b) => b.month.localeCompare(a.month));
    if (sMetrics.length > 0) {
      const latest = sMetrics[0];
      const r = latest.monthlyBurn > 0 ? latest.cashBalance / latest.monthlyBurn : 99;
      return r < 3;
    }
    return false;
  });
  if (runwayRisks.length > 0) {
    insights.push({
      id: `ins-${idCounter++}`,
      category: 'PORTFOLIO_RISK',
      title: 'Critical Runway Alert (< 3 months)',
      startupsAffected: runwayRisks,
      whyItMatters: 'These startups are at imminent risk of running out of cash based on their latest reported net burn.',
      suggestedAction: {
        label: 'Request urgent financial update',
        type: 'SEND_REQUEST',
        payload: { type: 'MONTHLY_FINANCIALS' }
      }
    });
  }

  // 2b. Declining Health (3 consecutive drops or delta < -10)
  const healthRisks = startups.filter(s => {
    const sAss = assessments.filter(a => a.startupId === s.id && a.status === 'APPROVED').sort((a, b) => b.month.localeCompare(a.month));
    if (sAss.length >= 1) {
      return sAss[0].delta3m !== null && sAss[0].delta3m <= -10;
    }
    return false;
  });
  if (healthRisks.length > 0) {
    insights.push({
      id: `ins-${idCounter++}`,
      category: 'PORTFOLIO_RISK',
      title: 'Significant Health Score Drop',
      startupsAffected: healthRisks,
      whyItMatters: 'These startups have seen their health score drop by 10+ points in the last 3 months.',
      suggestedAction: {
        label: 'Schedule check-in meeting',
        type: 'SEND_MESSAGE'
      }
    });
  }

  // 3. Mentor Match Recommendations
  // Find startups with no active matches
  const unmatchedStartups = startups.filter(s => !mentorMatches.some(m => m.startupId === s.id && m.status === 'ACTIVE'));
  // Find mentors with capacity
  const availableMentors = mentors.filter(m => mentorMatches.filter(match => match.mentorId === m.id && match.status === 'ACTIVE').length < m.maxActiveMatches);
  
  if (unmatchedStartups.length > 0 && availableMentors.length > 0) {
    // Just a generic recommendation for the demo
    const toRecommend = unmatchedStartups.slice(0, 3); // pick 3
    if (toRecommend.length > 0) {
      insights.push({
        id: `ins-${idCounter++}`,
        category: 'MENTOR_RECOMMENDATION',
        title: 'Mentorship Opportunities Identified',
        startupsAffected: toRecommend,
        whyItMatters: 'These startups currently have no active mentor relationships, but there are available mentors in the pool matching their sector.',
        suggestedAction: {
          label: 'Draft mentor requests',
          type: 'DRAFT_MENTOR_MATCH'
        }
      });
    }
  }

  return insights;
}
