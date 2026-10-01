'use client';

import * as React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { cn } from '@/lib/utils';

export interface StatCardProps {
  title: string;
  value: React.ReactNode;
  icon?: React.ComponentType<{ className?: string }>;
  trend?: string;
  subtitle?: string;
  className?: string;
  valueClassName?: string;
}

export function StatCard({
  title,
  value,
  icon: Icon,
  trend,
  subtitle,
  className,
  valueClassName,
}: StatCardProps) {
  return (
    <Card className={cn('bg-white border border-[#E4E4E7] rounded-xl shadow-xs hover:border-zinc-300 transition-colors', className)}>
      <CardContent className="p-6 sm:p-7 flex flex-col justify-between">
        <div className="flex items-center justify-between gap-2">
          <span className="text-base sm:text-lg font-bold text-zinc-900 tracking-tight">{title}</span>
          {Icon && <Icon className="h-5 w-5 sm:h-6 sm:w-6 text-zinc-400 stroke-[2] shrink-0" />}
        </div>
        <div
          className={cn(
            'text-metric font-extrabold tracking-tight text-zinc-950 mt-3 sm:mt-4 tabular-nums leading-none',
            valueClassName
          )}
          style={{
            fontSize:
              typeof value === 'string' && value.length > 12
                ? 'clamp(2rem, 2.5vw, 2.625rem)'
                : 'var(--type-metric, 42px)',
          }}
        >
          {value}
        </div>
        {(trend || subtitle) && (
          <div className="text-xs sm:text-sm text-zinc-500 font-medium mt-2.5 flex items-center gap-1.5 flex-wrap">
            {trend && <span className="text-emerald-600 font-semibold">{trend}</span>}
            {subtitle && <span>{subtitle}</span>}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
