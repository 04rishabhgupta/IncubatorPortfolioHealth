'use client';

import React from 'react';

export interface FunnelStage {
  label: string;
  name: string;
  value: number; // in Cr or currency
  unit?: string;
  percentage?: number;
  description?: string;
  color?: string;
}

interface FunnelChartProps {
  stages: FunnelStage[];
  cagr?: number;
  note?: string;
}

export function FunnelChartComponent({ stages, cagr, note }: FunnelChartProps) {
  const maxVal = Math.max(...stages.map(s => s.value));

  // Default color palette in Bklit forest/emerald style
  const defaultColors = [
    '#1E4133', // Deep emerald
    '#2A624A', // Mid emerald
    '#3D8365', // Light emerald
  ];

  return (
    <div className="w-full flex flex-col gap-3 py-2">
      <div className="flex flex-col gap-2.5">
        {stages.map((stage, idx) => {
          const widthPct = Math.max(25, Math.round((stage.value / maxVal) * 100));
          const color = stage.color || defaultColors[idx % defaultColors.length];
          const prevVal = idx > 0 ? stages[idx - 1].value : null;
          const convRate = prevVal ? Math.round((stage.value / prevVal) * 100) : null;

          return (
            <div key={stage.label} className="group relative">
              <div className="flex items-center justify-between text-xs mb-1">
                <span className="font-semibold text-gray-800 tracking-wide flex items-center gap-1.5">
                  <span
                    className="inline-block w-2.5 h-2.5 rounded-full"
                    style={{ backgroundColor: color }}
                  />
                  {stage.label} · {stage.name}
                </span>
                <span className="font-bold text-gray-900 font-mono">
                  {stage.unit ? `${stage.unit} ` : '₹ '}{stage.value.toLocaleString('en-IN')} Cr
                </span>
              </div>

              {/* Funnel segment */}
              <div className="w-full bg-[#EFF2ED] rounded-lg h-9 overflow-hidden p-1 flex items-center relative">
                <div
                  className="h-full rounded-md transition-all duration-500 ease-out flex items-center justify-end px-3 shadow-xs"
                  style={{
                    width: `${widthPct}%`,
                    backgroundColor: color,
                  }}
                >
                  <span className="text-white text-xs font-semibold tracking-wider font-mono opacity-90">
                    {Math.round((stage.value / maxVal) * 100)}%
                  </span>
                </div>
              </div>

              {/* Conversion badge */}
              {convRate !== null && (
                <div className="text-[11px] text-gray-500 mt-1 pl-4 flex items-center gap-1 font-mono">
                  <span className="text-gray-400">└</span> {convRate}% of {stages[idx - 1].label}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {(cagr !== undefined || note) && (
        <div className="mt-2 pt-2 border-t border-[#E3E7E0] flex flex-wrap items-center justify-between gap-2 text-xs text-gray-600">
          {cagr !== undefined && (
            <span className="inline-flex items-center gap-1 bg-[#EAF4EE] text-[#1E4133] font-semibold px-2 py-0.5 rounded-md text-[11px]">
              CAGR {cagr}%
            </span>
          )}
          {note && <span className="text-gray-500 italic text-[11px]">{note}</span>}
        </div>
      )}
    </div>
  );
}
