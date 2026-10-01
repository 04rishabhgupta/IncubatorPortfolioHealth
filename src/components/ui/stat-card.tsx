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
      <CardContent className="p-5 sm:p-6">
        <div className="flex items-center justify-between">
          <span className="text-sm sm:text-base font-semibold text-zinc-900 tracking-normal">{title}</span>
          {Icon && <Icon className="h-4 w-4 sm:h-5 sm:w-5 text-zinc-400 stroke-[1.75]" />}
        </div>
        <div className={cn('text-metric font-extrabold tracking-tight text-zinc-950 mt-2 sm:mt-3 tabular-nums', valueClassName)}>
          {value}
        </div>
        {(trend || subtitle) && (
          <div className="text-xs sm:text-sm text-zinc-500 font-normal mt-1.5 sm:mt-2 flex items-center gap-1.5 flex-wrap">
            {trend && <span className="text-emerald-600 font-semibold">{trend}</span>}
            {subtitle && <span>{subtitle}</span>}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
