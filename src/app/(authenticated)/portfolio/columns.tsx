'use client';

import { ColumnDef } from '@tanstack/react-table';
import { Startup } from '@/types';
import { Badge } from '@/components/ui/badge';
import Link from 'next/link';
import { ArrowUpDown } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { formatINR } from '@/lib/utils';
import { users } from '@/data/seed/users';

export type PortfolioRow = {
  startup: Startup;
  health: { total: number; band: string; delta: number | null } | null;
  runway: number;
  cash: number;
  burn: number;
  revenue: number;
  milestonesText: string;
  overdueMilestones: number;
  lastUpdateDays: number | null;
  openRequests: number;
  activeMentors: number;
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
          <Link href={`/startups/${s.id}`} className="font-semibold text-black hover:underline">
            {s.name}
          </Link>
          <span className="text-xs text-black/60 truncate max-w-[200px]">{s.oneLiner}</span>
        </div>
      );
    }
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
    cell: ({ row }) => <span className="text-sm">{row.original.startup.trl}</span>,
  },
  {
    accessorKey: 'managerId',
    accessorFn: (row) => row.startup.managerId,
    header: 'Manager',
    cell: ({ row }) => {
      const u = users.find(u => u.id === row.original.startup.managerId);
      return <span className="text-sm whitespace-nowrap">{u ? u.label : '-'}</span>;
    },
    filterFn: (row, id, value: string[]) => {
      return value.includes(row.getValue(id));
    },
  },
  {
    accessorKey: 'associateId',
    accessorFn: (row) => row.startup.associateId,
    header: 'Associate',
    cell: ({ row }) => {
      const u = users.find(u => u.id === row.original.startup.associateId);
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
      const bg = h.band === 'HEALTHY' ? 'bg-[#2E7D4F]' : h.band === 'WATCH' ? 'bg-[#B8860B]' : h.band === 'AT_RISK' ? 'bg-[#D2691E]' : 'bg-[#B42318]';
      return (
        <div className="flex items-center gap-2 whitespace-nowrap">
          <span className="font-semibold w-6">{h.total}</span>
          <Badge className={`${bg} text-white`}>{h.band}</Badge>
          {h.delta !== null && (
            <span className={`text-xs w-8 ${h.delta >= 0 ? 'text-green-600' : 'text-red-600'}`}>
              {h.delta > 0 ? '▲' : '▼'} {Math.abs(h.delta)}
            </span>
          )}
        </div>
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
    }
  },
  {
    accessorKey: 'cash',
    header: 'Cash',
    cell: ({ row }) => <span className="text-sm">{formatINR(row.original.cash)}</span>
  },
  {
    accessorKey: 'burn',
    header: 'Net burn / mo',
    cell: ({ row }) => <span className="text-sm">{formatINR(row.original.burn)}</span>
  },
  {
    accessorKey: 'revenue',
    header: 'Revenue / mo',
    cell: ({ row }) => <span className="text-sm">{row.original.revenue > 0 ? formatINR(row.original.revenue) : 'Pre-revenue'}</span>
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
    )
  },
  {
    accessorKey: 'lastUpdateDays',
    header: 'Last Update',
    cell: ({ row }) => {
      const d = row.original.lastUpdateDays;
      if (d === null) return '-';
      return (
        <span className={`text-sm whitespace-nowrap ${d > 35 ? 'text-amber-600 font-medium' : ''}`}>
          {d} days ago
        </span>
      );
    }
  },
  {
    accessorKey: 'openRequests',
    header: 'Open Req',
    cell: ({ row }) => <span className="text-sm">{row.original.openRequests}</span>
  },
  {
    accessorKey: 'activeMentors',
    header: 'Mentors',
    cell: ({ row }) => <span className="text-sm">{row.original.activeMentors}</span>
  }
];
