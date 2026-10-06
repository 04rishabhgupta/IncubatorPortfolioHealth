'use client';

import React from 'react';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  Cell,
  ReferenceLine,
} from 'recharts';

export interface HorizontalBarItem {
  label: string;
  value: number;
  max: number;
  color?: string;
  unit?: string;
  category?: string;
  badge?: string;
}

interface HorizontalBarChartProps {
  data: HorizontalBarItem[];
  height?: number;
  showTicks?: boolean;
  valuePrefix?: string;
  valueSuffix?: string;
  referenceLines?: { value: number; label: string; stroke: string }[];
}

export function HorizontalBarChartComponent({
  data,
  height,
  showTicks = false,
  valuePrefix = '',
  valueSuffix = '',
  referenceLines,
}: HorizontalBarChartProps) {
  const chartHeight = height || Math.max(160, data.length * 36 + 40);

  // Band color resolver if no custom color provided
  const resolveColor = (val: number, max: number) => {
    const pct = (val / max) * 100;
    if (pct >= 75) return '#16A34A'; // Strong
    if (pct >= 60) return '#D97706'; // Moderate
    if (pct >= 45) return '#EA580C'; // Watch
    return '#DC2626'; // Weak
  };

  const chartData = data.map(d => ({
    ...d,
    pct: Math.round((d.value / d.max) * 100),
    resolvedColor: d.color || resolveColor(d.value, d.max),
  }));

  const maxScale = Math.max(...data.map(d => d.max));

  return (
    <div className="w-full py-1">
      <div style={{ width: '100%', height: chartHeight }}>
        <ResponsiveContainer width="100%" height="100%">
          <BarChart
            layout="vertical"
            data={chartData}
            margin={{ top: 8, right: 30, left: 10, bottom: 8 }}
          >
            <XAxis
              type="number"
              domain={[0, maxScale]}
              tick={{ fill: '#71717A', fontSize: 11 }}
              tickLine={false}
              axisLine={{ stroke: '#E4E4E7' }}
            />
            <YAxis
              dataKey="label"
              type="category"
              width={140}
              tick={{ fill: '#18181B', fontSize: 11, fontWeight: 500 }}
              tickLine={false}
              axisLine={false}
            />
            <Tooltip
              content={({ active, payload }) => {
                if (active && payload && payload.length) {
                  const item = payload[0].payload as HorizontalBarItem & { pct: number; resolvedColor: string };
                  return (
                    <div className="bg-white px-3 py-2 border border-[#E4E4E7] rounded-lg shadow-sm text-xs">
                      <p className="font-semibold text-zinc-900">{item.label}</p>
                      <p className="font-mono font-bold mt-0.5" style={{ color: item.resolvedColor }}>
                        {valuePrefix}{item.value}{valueSuffix} / {item.max}{item.unit || ''} ({item.pct}%)
                      </p>
                      {item.badge && (
                        <span className="inline-block mt-1 text-[10px] uppercase font-bold text-red-600 bg-red-50 px-1.5 py-0.5 rounded">
                          {item.badge}
                        </span>
                      )}
                    </div>
                  );
                }
                return null;
              }}
            />
            {referenceLines?.map((ref, idx) => (
              <ReferenceLine
                key={idx}
                x={ref.value}
                stroke={ref.stroke}
                strokeDasharray="3 3"
                label={{
                  value: ref.label,
                  fill: ref.stroke,
                  fontSize: 10,
                  position: 'top',
                }}
              />
            ))}
            <Bar dataKey="value" radius={[0, 6, 6, 0]} barSize={16}>
              {chartData.map((entry, index) => (
                <Cell key={`bar-${index}`} fill={entry.resolvedColor} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>

      {showTicks && (
        <div className="flex flex-wrap items-center justify-between text-[11px] text-zinc-500 pt-2 border-t border-[#E4E4E7] px-2">
          <span className="flex items-center gap-1.5 font-medium">
            <span className="w-2.5 h-2.5 rounded-xs bg-[#16A34A]" /> Strong &ge;75%
          </span>
          <span className="flex items-center gap-1.5 font-medium">
            <span className="w-2.5 h-2.5 rounded-xs bg-[#D97706]" /> Moderate 60-74%
          </span>
          <span className="flex items-center gap-1.5 font-medium">
            <span className="w-2.5 h-2.5 rounded-xs bg-[#EA580C]" /> Watch 45-59%
          </span>
          <span className="flex items-center gap-1.5 font-medium">
            <span className="w-2.5 h-2.5 rounded-xs bg-[#DC2626]" /> Weak &lt;45%
          </span>
        </div>
      )}
    </div>
  );
}
