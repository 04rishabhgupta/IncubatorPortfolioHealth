'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useStore } from '@/store';
import { Startup } from '@/types';
import { getLatestApprovedAssessment, getRunwayMonths, getLatestMetrics } from '@/lib/derived';
import { formatINR } from '@/lib/utils';
import {
  Sparkles,
  ShieldAlert,
  Award,
  ExternalLink,
} from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

interface StartupComparisonProps {
  availableStartups: Startup[];
  initialSelectedIds?: string[];
}

export function StartupComparison({ availableStartups, initialSelectedIds }: StartupComparisonProps) {
  const { metrics, assessments } = useStore();

  // Pick default initial startups (e.g. s31 Indigotex + first 1-2 others)
  const defaultSelection =
    initialSelectedIds && initialSelectedIds.length >= 2
      ? initialSelectedIds.slice(0, 4)
      : availableStartups.slice(0, Math.min(3, availableStartups.length)).map((s) => s.id);

  const [selectedIds, setSelectedIds] = useState<string[]>(defaultSelection);

  const toggleStartup = (id: string) => {
    if (selectedIds.includes(id)) {
      if (selectedIds.length > 2) {
        setSelectedIds(selectedIds.filter((item) => item !== id));
      }
    } else {
      if (selectedIds.length < 4) {
        setSelectedIds([...selectedIds, id]);
      }
    }
  };

  const selectedStartups = availableStartups.filter((s) => selectedIds.includes(s.id));

  // Determine leaders for highlights
  const healthScores = selectedStartups.map((s) => {
    const ass = getLatestApprovedAssessment(s.id, assessments);
    return { id: s.id, score: ass?.total || 0 };
  });
  const maxHealthId = healthScores.reduce((max, cur) => (cur.score > max.score ? cur : max), healthScores[0])?.id;

  const investScores = selectedStartups.map((s) => ({
    id: s.id,
    score: s.investibility?.total || 0,
  }));
  const maxInvestId = investScores.reduce((max, cur) => (cur.score > max.score ? cur : max), investScores[0])?.id;

  const runways = selectedStartups.map((s) => ({
    id: s.id,
    runway: getRunwayMonths(s.id, metrics),
  }));
  const maxRunwayId = runways.reduce((max, cur) => (cur.runway > max.runway ? cur : max), runways[0])?.id;

  return (
    <div className="space-y-6">
      {/* Startup selector bar */}
      <Card className="border-[#E4E4E7] bg-white shadow-xs">
        <CardContent className="p-4 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div>
            <div className="text-xs font-bold text-gray-500 uppercase tracking-wider">
              Select Startups to Compare (2 - 4 Ventures)
            </div>
            <p className="text-xs text-gray-500 mt-0.5">
              Side-by-side benchmark of Health, Investibility Grade, TRL, Runway, and AI Red Flags.
            </p>
          </div>

          <div className="flex flex-wrap gap-2">
            {availableStartups.map((s) => {
              const isSelected = selectedIds.includes(s.id);
              return (
                <button
                  key={s.id}
                  onClick={() => toggleStartup(s.id)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all flex items-center gap-1.5 ${
                    isSelected
                      ? 'bg-blue-600 text-white shadow-xs'
                      : 'bg-[#F4F4F5] text-zinc-700 hover:bg-zinc-200 border border-[#E4E4E7]'
                  }`}
                >
                  <span>{s.name}</span>
                  {isSelected && <span className="text-[10px] bg-white/20 px-1 rounded-sm">✓</span>}
                </button>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* Comparison Grid */}
      <div className="overflow-x-auto">
        <div className="min-w-[760px] bg-white rounded-xl border border-[#E4E4E7] shadow-sm divide-y divide-[#E4E4E7]">
          {/* Header Row: Company Names & Action Links */}
          <div className="grid grid-cols-5 p-4 bg-[#FAFAFA] items-center">
            <div className="text-xs font-bold text-zinc-500 uppercase tracking-wider">Metrics & Dimensions</div>
            {selectedStartups.map((s) => (
              <div key={s.id} className="px-3">
                <Link
                  href={`/startups/${s.id}`}
                  className="font-bold text-sm text-blue-600 hover:underline flex items-center gap-1"
                >
                  <span className="truncate">{s.name}</span>
                  <ExternalLink className="h-3 w-3 shrink-0 text-zinc-400" />
                </Link>
                <div className="text-[11px] text-zinc-500 truncate">{s.oneLiner}</div>
              </div>
            ))}
          </div>

          {/* Section: Overall Investibility & Health */}
          <div className="grid grid-cols-5 p-4 items-center hover:bg-zinc-50/50">
            <div className="font-semibold text-xs text-zinc-700 flex items-center gap-1.5">
              <Sparkles className="h-4 w-4 text-emerald-600" />
              Investibility Rating
            </div>
            {selectedStartups.map((s) => {
              const inv = s.investibility;
              const isBest = s.id === maxInvestId;
              return (
                <div key={s.id} className="px-3">
                  <div className="flex items-center gap-2">
                    <span className="text-2xl font-black text-zinc-900 font-mono">{inv?.total ?? 75}/100</span>
                    <Badge
                      className={`text-xs font-bold ${
                        inv?.grade === 'A+' || inv?.grade === 'A'
                          ? 'bg-emerald-600 text-white'
                          : 'bg-amber-600 text-white'
                      }`}
                    >
                      Grade {inv?.grade ?? 'A'}
                    </Badge>
                  </div>
                  {isBest && (
                    <span className="inline-flex items-center gap-1 text-[10px] text-emerald-600 font-bold mt-0.5">
                      <Award className="h-3 w-3" /> Best Investibility
                    </span>
                  )}
                </div>
              );
            })}
          </div>

          <div className="grid grid-cols-5 p-4 items-center hover:bg-zinc-50/50">
            <div className="font-semibold text-xs text-zinc-700">Health Assessment</div>
            {selectedStartups.map((s) => {
              const ass = getLatestApprovedAssessment(s.id, assessments);
              const isBest = s.id === maxHealthId;
              const bandColor =
                ass?.band === 'HEALTHY'
                  ? 'bg-emerald-600'
                  : ass?.band === 'WATCH'
                  ? 'bg-amber-600'
                  : 'bg-red-600';
              return (
                <div key={s.id} className="px-3">
                  <div className="flex items-center gap-2">
                    <span className="text-xl font-bold font-mono text-zinc-900">{ass?.total ?? '-'}</span>
                    {ass && <Badge className={`${bandColor} text-white text-[10px]`}>{ass.band}</Badge>}
                  </div>
                  {isBest && (
                    <span className="text-[10px] text-emerald-600 font-bold block mt-0.5">Top Health Score</span>
                  )}
                </div>
              );
            })}
          </div>

          {/* Section: Investibility Breakdown */}
          <div className="grid grid-cols-5 p-4 items-center bg-zinc-50/50">
            <div className="text-xs font-bold text-zinc-500 uppercase tracking-wider">Investibility Breakdown</div>
            {selectedStartups.map((s) => {
              const b = s.investibility?.breakdown;
              return (
                <div key={s.id} className="px-3 text-xs space-y-1">
                  <div className="flex justify-between text-zinc-600 font-mono">
                    <span>Team:</span>
                    <b className="text-zinc-900">{b?.teamScore ?? 16}/20</b>
                  </div>
                  <div className="flex justify-between text-zinc-600 font-mono">
                    <span>Market:</span>
                    <b className="text-zinc-900">{b?.marketScore ?? 18}/25</b>
                  </div>
                  <div className="flex justify-between text-zinc-600 font-mono">
                    <span>Tech / IP:</span>
                    <b className="text-zinc-900">{b?.technologyScore ?? 17}/20</b>
                  </div>
                  <div className="flex justify-between text-zinc-600 font-mono">
                    <span>Financial:</span>
                    <b className="text-zinc-900">{b?.financialScore ?? 14}/20</b>
                  </div>
                  <div className="flex justify-between text-zinc-600 font-mono">
                    <span>Traction:</span>
                    <b className="text-zinc-900">{b?.tractionScore ?? 10}/15</b>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Section: Financials & Runway */}
          <div className="grid grid-cols-5 p-4 items-center hover:bg-zinc-50/50">
            <div className="font-semibold text-xs text-zinc-700">Cash Runway</div>
            {selectedStartups.map((s) => {
              const r = getRunwayMonths(s.id, metrics);
              const isBest = s.id === maxRunwayId;
              return (
                <div key={s.id} className="px-3">
                  <span
                    className={`text-lg font-bold font-mono ${
                      r < 3 ? 'text-red-600' : r < 6 ? 'text-amber-600' : 'text-zinc-900'
                    }`}
                  >
                    {r.toFixed(1)} months
                  </span>
                  {isBest && (
                    <span className="text-[10px] text-emerald-600 font-bold block mt-0.5">Longest Runway</span>
                  )}
                </div>
              );
            })}
          </div>

          <div className="grid grid-cols-5 p-4 items-center hover:bg-zinc-50/50">
            <div className="font-semibold text-xs text-zinc-700">Cash & Net Burn</div>
            {selectedStartups.map((s) => {
              const m = getLatestMetrics(s.id, metrics);
              return (
                <div key={s.id} className="px-3 text-xs space-y-0.5">
                  <div className="text-zinc-600">
                    Cash: <b className="text-zinc-900 font-mono">{formatINR(m?.cashBalance || 0)}</b>
                  </div>
                  <div className="text-zinc-600">
                    Burn: <b className="text-zinc-900 font-mono">{formatINR(m?.monthlyBurn || 0)}/mo</b>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Section: Stage, Sector & TRL */}
          <div className="grid grid-cols-5 p-4 items-center hover:bg-zinc-50/50">
            <div className="font-semibold text-xs text-zinc-700">Sector & Stage</div>
            {selectedStartups.map((s) => (
              <div key={s.id} className="px-3 text-xs space-y-1">
                <Badge variant="outline" className="bg-zinc-50 text-[10px] border-zinc-200">
                  {s.sector}
                </Badge>
                <div className="text-zinc-600 capitalize">{s.stage.replace(/_/g, ' ').toLowerCase()}</div>
              </div>
            ))}
          </div>

          <div className="grid grid-cols-5 p-4 items-center hover:bg-zinc-50/50">
            <div className="font-semibold text-xs text-zinc-700">TRL & IP Status</div>
            {selectedStartups.map((s) => (
              <div key={s.id} className="px-3 text-xs space-y-1">
                <div className="font-bold text-zinc-900">TRL Level {s.trl}</div>
                <div className="flex items-center gap-1.5">
                  <Badge variant="secondary" className="text-[10px] bg-zinc-100 text-zinc-700">
                    {s.ipStatus}
                  </Badge>
                  {s.ipOwnershipClear ? (
                    <span className="text-[10px] text-emerald-600 font-semibold">Title Clear</span>
                  ) : (
                    <span className="text-[10px] text-amber-600 font-semibold">Lic. Pending</span>
                  )}
                </div>
              </div>
            ))}
          </div>

          <div className="grid grid-cols-5 p-4 items-center hover:bg-zinc-50/50">
            <div className="font-semibold text-xs text-zinc-700">Commercial Signal</div>
            {selectedStartups.map((s) => (
              <div key={s.id} className="px-3">
                <Badge
                  className={`text-[10px] ${
                    s.commercialSignal === 'PAYING'
                      ? 'bg-emerald-600 text-white'
                      : s.commercialSignal === 'PILOT_LOI'
                      ? 'bg-blue-600 text-white'
                      : 'bg-zinc-100 text-zinc-700'
                  }`}
                >
                  {s.commercialSignal}
                </Badge>
              </div>
            ))}
          </div>

          {/* Section: Red Flags */}
          <div className="grid grid-cols-5 p-4 items-start bg-red-50/30">
            <div className="font-semibold text-xs text-red-600 flex items-center gap-1.5 pt-1">
              <ShieldAlert className="h-4 w-4" />
              Active AI Red Flags
            </div>
            {selectedStartups.map((s) => {
              const flags = s.aiAnalysis?.redFlags || [];
              return (
                <div key={s.id} className="px-3 space-y-1.5">
                  {flags.length === 0 ? (
                    <span className="text-xs text-emerald-700 font-medium">None detected</span>
                  ) : (
                    flags.map((f, i) => (
                      <div
                        key={i}
                        className="text-[11px] text-red-900 bg-red-50 border border-red-200 p-1.5 rounded-md leading-tight"
                      >
                        {f}
                      </div>
                    ))
                  )}
                </div>
              );
            })}
          </div>

          {/* Section: AI Thesis & Recommendation */}
          <div className="grid grid-cols-5 p-4 items-start bg-zinc-50/50">
            <div className="font-semibold text-xs text-zinc-700 pt-1">AI Thesis / Summary</div>
            {selectedStartups.map((s) => (
              <div key={s.id} className="px-3 text-xs text-zinc-600 leading-relaxed italic">
                &ldquo;{s.aiAnalysis?.thesis || `${s.name} demonstrates solid technical traction.`}&rdquo;
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
