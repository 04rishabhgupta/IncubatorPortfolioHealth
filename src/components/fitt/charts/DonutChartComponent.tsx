'use client';

import React, { useState } from 'react';
import {
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Tooltip,
} from 'recharts';

export interface DonutSegment {
  name: string;
  value: number;
  color: string;
  subtitle?: string;
}

interface DonutChartProps {
  data: DonutSegment[];
  centerLabel?: string;
  centerValue?: string;
  height?: number;
  innerRadius?: number;
  outerRadius?: number;
  showLegend?: boolean;
}

export function DonutChartComponent({
  data,
  centerLabel = 'Total',
  centerValue = '100%',
  height = 240,
  innerRadius = 60,
  outerRadius = 88,
  showLegend = true,
}: DonutChartProps) {
  const [activeIndex, setActiveIndex] = useState<number | null>(null);

  const activeSegment = activeIndex !== null ? data[activeIndex] : null;

  return (
    <div className="w-full flex flex-col md:flex-row items-center gap-6 py-2">
      <div style={{ width: height, height }} className="relative shrink-0">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Tooltip
              content={({ active, payload }) => {
                if (active && payload && payload.length) {
                  const item = payload[0].payload as DonutSegment;
                  return (
                    <div className="bg-white px-3 py-1.5 border border-[#E4E4E7] rounded-lg shadow-sm text-xs">
                      <p className="font-semibold text-gray-900">{item.name}</p>
                      <p className="font-bold font-mono" style={{ color: item.color }}>
                        {item.value}%
                      </p>
                    </div>
                  );
                }
                return null;
              }}
            />
            <Pie
              data={data}
              cx="50%"
              cy="50%"
              innerRadius={innerRadius}
              outerRadius={outerRadius}
              paddingAngle={2}
              dataKey="value"
              onMouseEnter={(_, index) => setActiveIndex(index)}
              onMouseLeave={() => setActiveIndex(null)}
            >
              {data.map((entry, index) => (
                <Cell
                  key={`cell-${index}`}
                  fill={entry.color}
                  stroke="#fff"
                  strokeWidth={2}
                  style={{
                    opacity: activeIndex === null || activeIndex === index ? 1 : 0.45,
                    transition: 'opacity 0.2s ease, transform 0.2s ease',
                    cursor: 'pointer',
                  }}
                />
              ))}
            </Pie>
          </PieChart>
        </ResponsiveContainer>

        {/* Center Typography */}
        <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none text-center">
          <span className="text-[11px] font-semibold text-black/50 uppercase tracking-wider">
            {activeSegment ? activeSegment.name : centerLabel}
          </span>
          <span className="text-xl font-bold font-mono text-gray-900">
            {activeSegment ? `${activeSegment.value}%` : centerValue}
          </span>
        </div>
      </div>

      {showLegend && (
        <div className="flex-1 w-full grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
          {data.map((item, idx) => {
            const isHovered = activeIndex === idx;
            return (
              <div
                key={item.name}
                onMouseEnter={() => setActiveIndex(idx)}
                onMouseLeave={() => setActiveIndex(null)}
                className={`flex items-center justify-between p-2 rounded-lg border transition-all cursor-pointer ${
                  isHovered
                    ? 'border-gray-400 bg-gray-50 shadow-xs'
                    : 'border-[#E4E4E7] bg-white hover:bg-gray-50/50'
                }`}
              >
                <div className="flex items-center gap-2 overflow-hidden">
                  <span
                    className="w-3 h-3 rounded-md shrink-0"
                    style={{ backgroundColor: item.color }}
                  />
                  <div className="truncate">
                    <p className="font-semibold text-gray-800 truncate">{item.name}</p>
                    {item.subtitle && (
                      <p className="text-[10px] text-gray-500 truncate">{item.subtitle}</p>
                    )}
                  </div>
                </div>
                <span className="font-bold font-mono text-gray-900 shrink-0 ml-2">
                  {item.value}%
                </span>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
