'use client';

import { ColumnDef } from '@tanstack/react-table';
import { Startup } from '@/types';
import { Badge } from '@/components/ui/badge';
import Link from 'next/link';
import { ArrowUpDown, AlertTriangle, Download, ExternalLink } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { formatINR } from '@/lib/utils';
import { useStore } from '@/store';

export type PortfolioRow = {
  startup: Startup;
  health: { total: number; band: string; delta: number | null } | null;
  investibility: { total: number; grade: string } | null;
  redFlags: string[];
  runway: number;
  cash: number;
  burn: number;
  revenue: number;
  milestonesText: string;
  overdueMilestones: number;
  lastUpdateDays: number | null;
  openRequests: number;
  activeMentors: number;
  onEdit?: (startup: Startup) => void;
  onUpload?: (startup: Startup) => void;
  onDownload?: (startup: Startup) => void;
};

export const columns: ColumnDef<PortfolioRow>[] = [
  {
    accessorKey: 'name',
    header: ({ column }) => (
      <Button variant="ghost" onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}>
        Startup <ArrowUpDown className="ml-2 h-4 w-4" />
      </Button>
    ),
    accessorFn: (row) => row.startup.name,
    cell: ({ row }) => {
      const s = row.original.startup;
      return (
        <div className="flex flex-col">
          <Link href={`/startups/${s.id}`} className="font-semibold text-black hover:underline flex items-center gap-1">
            <span>{s.name}</span>
            <ExternalLink className="h-3 w-3 text-gray-400 opacity-0 group-hover:opacity-100" />
          </Link>
          <span className="text-xs text-black/60 truncate max-w-[200px]">{s.oneLiner}</span>
        </div>
      );
    },
  },
  {
    accessorKey: 'sector',
    accessorFn: (row) => row.startup.sector,
    header: 'Sector',
    cell: ({ row }) => <Badge variant="outline">{row.original.startup.sector}</Badge>,
    filterFn: (row, id, value: string[]) => {
      return value.includes(row.getValue(id));
    },
  },
  {
    accessorKey: 'stage',
    accessorFn: (row) => row.startup.stage,
    header: 'Stage',
    cell: ({ row }) => <span className="text-sm">{row.original.startup.stage.replace('_', ' ')}</span>,
    filterFn: (row, id, value: string[]) => {
      return value.includes(row.getValue(id));
    },
  },
  {
    accessorKey: 'trl',
    accessorFn: (row) => row.startup.trl,
    header: 'TRL',
    cell: ({ row }) => <span className="text-sm font-semibold">TRL {row.original.startup.trl}</span>,
  },
  {
    accessorKey: 'managerId',
    accessorFn: (row) => row.startup.managerId,
    header: 'Portfolio Head',
    cell: ({ row }) => {
      const u = useStore.getState().users.find((u) => u.id === row.original.startup.managerId);
      return <span className="text-sm whitespace-nowrap">{u ? u.label : '-'}</span>;
    },
    filterFn: (row, id, value: string[]) => {
      return value.includes(row.getValue(id));
    },
  },
  {
    accessorKey: 'associateId',
    accessorFn: (row) => row.startup.associateId,
    header: 'Portfolio Manager',
    cell: ({ row }) => {
      const u = useStore.getState().users.find((u) => u.id === row.original.startup.associateId);
      return <span className="text-sm whitespace-nowrap">{u ? u.label : 'Unassigned'}</span>;
    },
    filterFn: (row, id, value: string[]) => {
      return value.includes(row.getValue(id));
    },
  },
  {
    accessorKey: 'healthTotal',
    accessorFn: (row) => row.health?.total || 0,
    header: ({ column }) => (
      <Button variant="ghost" onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}>
        Health <ArrowUpDown className="ml-2 h-4 w-4" />
      </Button>
    ),
    cell: ({ row }) => {
      const h = row.original.health;
      if (!h) return '-';
      const bg =
        h.band === 'HEALTHY'
          ? 'bg-[#16A34A]'
          : h.band === 'WATCH'
          ? 'bg-[#D97706]'
          : h.band === 'AT_RISK'
          ? 'bg-[#EA580C]'
          : 'bg-[#DC2626]';
      return (
        <div className="flex items-center gap-2 whitespace-nowrap">
          <span className="font-semibold w-6">{h.total}</span>
          <Badge className={`${bg} text-white`}>{h.band}</Badge>
          {h.delta !== null && (
            <span className={`text-xs w-8 ${h.delta >= 0 ? 'text-[#16A34A]' : 'text-[#DC2626]'}`}>
              {h.delta > 0 ? '▲' : '▼'} {Math.abs(h.delta)}
            </span>
          )}
        </div>
      );
    },
  },
  {
    accessorKey: 'investibility',
    accessorFn: (row) => row.investibility?.total || 0,
    header: ({ column }) => (
      <Button variant="ghost" onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}>
        Investibility <ArrowUpDown className="ml-2 h-4 w-4" />
      </Button>
    ),
    cell: ({ row }) => {
      const inv = row.original.investibility;
      if (!inv) return '-';
      const bg =
        inv.grade === 'A+' || inv.grade === 'A'
          ? 'bg-[#16A34A]'
          : inv.grade === 'B'
          ? 'bg-[#D97706]'
          : 'bg-[#DC2626]';
      return (
        <div className="flex items-center gap-2 whitespace-nowrap">
          <span className="font-bold text-sm">{inv.total}/100</span>
          <Badge className={`${bg} text-white text-[10px]`}>Grade {inv.grade}</Badge>
        </div>
      );
    },
  },
  {
    accessorKey: 'redFlags',
    header: 'Red Flags',
    cell: ({ row }) => {
      const flags = row.original.redFlags || [];
      if (flags.length === 0) {
        return <span className="text-xs text-[#16A34A] font-semibold">0 Flags</span>;
      }
      return (
        <Badge className="bg-[#DC2626] text-white text-[10px] gap-1 shadow-2xs" title={flags.join('; ')}>
          <AlertTriangle className="h-3 w-3" />
          {flags.length} Flag{flags.length > 1 ? 's' : ''}
        </Badge>
      );
    },
  },
  {
    accessorKey: 'runway',
    header: ({ column }) => (
      <Button variant="ghost" onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}>
        Runway <ArrowUpDown className="ml-2 h-4 w-4" />
      </Button>
    ),
    cell: ({ row }) => {
      const r = row.original.runway;
      return (
        <span className={`font-medium ${r < 3 ? 'text-red-600' : r < 6 ? 'text-amber-600' : ''}`}>
          {r.toFixed(1)}m
        </span>
      );
    },
  },
  {
    accessorKey: 'cash',
    header: 'Cash',
    cell: ({ row }) => <span className="text-sm">{formatINR(row.original.cash)}</span>,
  },
  {
    accessorKey: 'burn',
    header: 'Net burn / mo',
    cell: ({ row }) => <span className="text-sm">{formatINR(row.original.burn)}</span>,
  },
  {
    accessorKey: 'revenue',
    header: 'Revenue / mo',
    cell: ({ row }) => (
      <span className="text-sm">
        {row.original.revenue > 0 ? formatINR(row.original.revenue) : 'Pre-revenue'}
      </span>
    ),
  },
  {
    accessorKey: 'milestonesText',
    header: 'Milestones',
    cell: ({ row }) => (
      <div className="flex flex-col whitespace-nowrap">
        <span className="text-sm">{row.original.milestonesText}</span>
        {row.original.overdueMilestones > 0 && (
          <span className="text-xs text-red-600">{row.original.overdueMilestones} overdue</span>
        )}
      </div>
    ),
  },
  {
    accessorKey: 'actions',
    header: 'Actions',
    cell: ({ row }) => {
      const s = row.original.startup;
      return (
        <div className="flex items-center gap-1 whitespace-nowrap">
          <Link href={`/startups/${s.id}`}>
            <Button
              variant="ghost"
              size="sm"
              className="h-7 px-2 text-xs font-semibold text-[#2563EB] hover:bg-blue-50"
            >
              View
            </Button>
          </Link>
          {row.original.onEdit && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => row.original.onEdit?.(s)}
              className="h-7 px-2 text-xs text-zinc-700 hover:bg-zinc-100"
            >
              Edit
            </Button>
          )}
          {row.original.onDownload && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => row.original.onDownload?.(s)}
              className="h-7 px-2 text-xs text-zinc-600 hover:text-[#2563EB] hover:bg-blue-50"
              title="Download Excel Template / Backup"
            >
              <Download className="h-3.5 w-3.5" />
            </Button>
          )}
        </div>
      );
    },
  },
];
