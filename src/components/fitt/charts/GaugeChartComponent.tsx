'use client';

import React from 'react';

interface GaugeChartProps {
  value: number; // 0 - 100
  title: string;
  subtitle?: string;
  threshold?: number;
  dangerAbove?: boolean;
  unit?: string;
}

export function GaugeChartComponent({
  value,
  title,
  subtitle,
  threshold = 50,
  dangerAbove = true,
  unit = '%',
}: GaugeChartProps) {
  const isDanger = dangerAbove ? value >= threshold : value <= threshold;
  const color = isDanger ? '#B42318' : '#2E7D4F';
  const bgColor = '#EFF2ED';

  // Semi-circle SVG coordinates
  // Radius = 65, stroke = 12
  const r = 65;
  const strokeWidth = 12;
  const circumference = Math.PI * r;
  const strokeDashoffset = circumference - (Math.min(100, Math.max(0, value)) / 100) * circumference;

  return (
    <div className="w-full flex flex-col items-center py-2">
      <div className="relative w-44 h-26 flex items-center justify-center">
        <svg viewBox="0 0 160 90" className="w-full h-full overflow-visible">
          {/* Background track */}
          <path
            d="M 15 80 A 65 65 0 0 1 145 80"
            fill="none"
            stroke={bgColor}
            strokeWidth={strokeWidth}
            strokeLinecap="round"
          />
          {/* Active progress */}
          <path
            d="M 15 80 A 65 65 0 0 1 145 80"
            fill="none"
            stroke={color}
            strokeWidth={strokeWidth}
            strokeDasharray={circumference}
            strokeDashoffset={strokeDashoffset}
            strokeLinecap="round"
            className="transition-all duration-700 ease-out"
          />
        </svg>

        {/* Center reading */}
        <div className="absolute bottom-1 left-0 right-0 flex flex-col items-center">
          <span className="text-2xl font-black font-mono tracking-tight" style={{ color }}>
            {value}{unit}
          </span>
          <span className="text-[11px] font-semibold text-black/50 uppercase tracking-wider">
            {title}
          </span>
        </div>
      </div>

      {subtitle && (
        <p className="text-xs text-center text-gray-600 mt-2 max-w-xs leading-relaxed">
          {subtitle}
        </p>
      )}

      {isDanger && (
        <div className="mt-2 inline-flex items-center gap-1.5 px-2.5 py-1 bg-[#FDECEA] text-[#B42318] text-[11px] font-bold rounded-full">
          <span>⚠️</span> High Concentration Risk
        </div>
      )}
    </div>
  );
}
