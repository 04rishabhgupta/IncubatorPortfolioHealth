'use client';

import { useStore } from '@/store';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { StatCard } from '@/components/ui/stat-card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Users, Shield, Briefcase, UserCheck } from 'lucide-react';

export default function AdminUsersPage() {
  const { users } = useStore();
  const adminCount = users.filter((u) => u.role === 'ADMIN').length;
  const imCount = users.filter((u) => u.role === 'INVESTMENT_MANAGER').length;
  const iaCount = users.filter((u) => u.role === 'INVESTMENT_ASSOCIATE').length;

  return (
    <div className="space-y-6 animate-in fade-in-50 duration-200">
      {/* Top Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between pb-4 border-b border-border gap-4">
        <div>
          <h1 className="heading-display text-foreground tracking-tight" style={{ fontSize: 'var(--type-display)' }}>
            Users & Governance
          </h1>
          <p className="text-xs sm:text-sm text-muted-foreground mt-1">
            Incubator team hierarchy, portfolio head jurisdictions, and portfolio manager venture assignments.
          </p>
        </div>
      </div>

      {/* Role Distribution Metric Strip */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <StatCard
          title="Total Users"
          value={users.length}
          icon={Users}
          trend="~ Active team"
          subtitle="IIT Delhi FITT"
        />
        <StatCard
          title="Admins"
          value={adminCount}
          icon={Shield}
          trend="~ Full control"
          subtitle="supervisors"
        />
        <StatCard
          title="Portfolio Heads"
          value={imCount}
          icon={Briefcase}
          trend="~ Deal leads"
          subtitle="portfolio supervisors"
        />
        <StatCard
          title="Portfolio Managers"
          value={iaCount}
          icon={UserCheck}
          trend="~ Operations"
          subtitle="venture managers"
        />
      </div>

      {/* Users Table */}
      <Card className="shadow-2xs overflow-hidden">
        <CardHeader className="p-4 sm:p-5 border-b border-border">
          <CardTitle className="text-base font-bold tracking-tight">Active Team Directory</CardTitle>
          <CardDescription className="text-xs">Role based access levels and reporting hierarchy across IIT Delhi FITT.</CardDescription>
        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader className="bg-muted/50">
              <TableRow>
                <TableHead className="h-9 px-5 text-xs font-semibold text-muted-foreground uppercase tracking-wider">User</TableHead>
                <TableHead className="h-9 px-5 text-xs font-semibold text-muted-foreground uppercase tracking-wider">Email</TableHead>
                <TableHead className="h-9 px-5 text-xs font-semibold text-muted-foreground uppercase tracking-wider">Role</TableHead>
                <TableHead className="h-9 px-5 text-xs font-semibold text-muted-foreground uppercase tracking-wider">Direct Portfolio Head</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {users.map((u) => {
                const mgr = u.managerId ? users.find((m) => m.id === u.managerId) : null;
                return (
                  <TableRow key={u.id} className="hover:bg-muted/50">
                    <TableCell className="px-5 py-3.5 font-semibold text-foreground flex items-center gap-2.5">
                      <div className="w-7 h-7 rounded-full bg-primary/10 text-primary font-bold flex items-center justify-center text-xs">
                        {u.label.charAt(0)}
                      </div>
                      <span>{u.label}</span>
                    </TableCell>
                    <TableCell className="px-5 py-3.5 font-mono text-xs text-muted-foreground">{u.email}</TableCell>
                    <TableCell className="px-5 py-3.5">
                      <Badge
                        className={`text-[10px] font-semibold ${
                          u.role === 'ADMIN'
                            ? 'bg-primary text-primary-foreground'
                            : u.role === 'INVESTMENT_MANAGER'
                            ? 'bg-purple-600 text-white'
                            : 'bg-secondary text-secondary-foreground'
                        }`}
                      >
                        {u.role === 'ADMIN'
                          ? 'Admin'
                          : u.role === 'INVESTMENT_MANAGER'
                          ? 'Portfolio Head'
                          : 'Portfolio Manager'}
                      </Badge>
                    </TableCell>
                    <TableCell className="px-5 py-3.5 text-muted-foreground font-medium">
                      {mgr ? (
                        <span className="text-foreground font-medium">{mgr.label}</span>
                      ) : (
                        <span className="text-muted-foreground/60">—</span>
                      )}
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}

