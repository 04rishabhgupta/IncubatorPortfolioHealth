'use client';

import React from 'react';
import {
  ResponsiveContainer,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Radar,
  Tooltip,
} from 'recharts';

export interface RadarDataPoint {
  dimension: string;
  score: number;
  fullMark: number;
}

interface RadarChartProps {
  data: RadarDataPoint[];
  title?: string;
  height?: number;
  color?: string;
  fillColor?: string;
}

export function RadarChartComponent({
  data,
  title,
  height = 280,
  color = '#2563EB',
  fillColor = '#3B82F6',
}: RadarChartProps) {
  return (
    <div className="w-full flex flex-col items-center">
      {title && (
        <div className="text-xs font-semibold uppercase tracking-wider text-zinc-500 mb-2 self-start">
          {title}
        </div>
      )}
      <div style={{ width: '100%', height }} className="relative">
        <ResponsiveContainer width="100%" height="100%">
          <RadarChart cx="50%" cy="50%" outerRadius="75%" data={data}>
            <PolarGrid stroke="#E4E4E7" strokeDasharray="3 3" />
            <PolarAngleAxis
              dataKey="dimension"
              tick={{ fill: '#18181B', fontSize: 11, fontWeight: 500 }}
            />
            <PolarRadiusAxis
              angle={90}
              domain={[0, Math.max(...data.map(d => d.fullMark || 5))]}
              tick={{ fill: '#71717A', fontSize: 10 }}
              stroke="#E4E4E7"
            />
            <Tooltip
              content={({ active, payload }) => {
                if (active && payload && payload.length) {
                  const item = payload[0].payload as RadarDataPoint;
                  return (
                    <div className="bg-white px-3 py-2 border border-[#E4E4E7] rounded-lg shadow-sm text-xs">
                      <p className="font-semibold text-zinc-900">{item.dimension}</p>
                      <p className="text-blue-600 font-bold">
                        Score: {item.score} / {item.fullMark}
                      </p>
                    </div>
                  );
                }
                return null;
              }}
            />
            <Radar
              name="Score"
              dataKey="score"
              stroke={color}
              strokeWidth={2}
              fill={fillColor}
              fillOpacity={0.35}
              dot={{ r: 3, fill: color, strokeWidth: 1, stroke: '#fff' }}
              activeDot={{ r: 5, fill: color, stroke: '#fff', strokeWidth: 2 }}
            />
          </RadarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
