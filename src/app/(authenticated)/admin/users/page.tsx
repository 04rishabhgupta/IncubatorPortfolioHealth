'use client';

import { users } from '@/data/seed/users';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
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
  const adminCount = users.filter((u) => u.role === 'ADMIN').length;
  const imCount = users.filter((u) => u.role === 'INVESTMENT_MANAGER').length;
  const iaCount = users.filter((u) => u.role === 'INVESTMENT_ASSOCIATE').length;

  return (
    <div className="space-y-6 animate-in fade-in-50 duration-200">
      {/* Top Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between pb-4 border-b border-border gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-foreground tracking-tight">Users & Governance</h1>
          <p className="text-xs sm:text-sm text-muted-foreground mt-1">
            Incubator team hierarchy, investment manager portfolios, and associate venture assignments.
          </p>
        </div>
      </div>

      {/* Role Distribution Metric Strip */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <Card className="shadow-2xs">
          <CardContent className="p-4">
            <div className="flex items-center justify-between text-muted-foreground mb-1">
              <span className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">Total Users</span>
              <Users className="h-4 w-4 text-primary" />
            </div>
            <div className="text-2xl font-bold text-foreground font-mono tracking-tight">{users.length}</div>
            <span className="text-xs text-muted-foreground font-medium block mt-1">Active team members</span>
          </CardContent>
        </Card>

        <Card className="shadow-2xs">
          <CardContent className="p-4">
            <div className="flex items-center justify-between text-muted-foreground mb-1">
              <span className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">Admins</span>
              <Shield className="h-4 w-4 text-primary" />
            </div>
            <div className="text-2xl font-bold text-foreground font-mono tracking-tight">{adminCount}</div>
            <span className="text-xs text-muted-foreground font-medium block mt-1">Full governance control</span>
          </CardContent>
        </Card>

        <Card className="shadow-2xs">
          <CardContent className="p-4">
            <div className="flex items-center justify-between text-muted-foreground mb-1">
              <span className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">Investment Managers</span>
              <Briefcase className="h-4 w-4 text-emerald-600" />
            </div>
            <div className="text-2xl font-bold text-emerald-600 font-mono tracking-tight">{imCount}</div>
            <span className="text-xs text-emerald-600 font-medium block mt-1">Portfolio supervisors</span>
          </CardContent>
        </Card>

        <Card className="shadow-2xs">
          <CardContent className="p-4">
            <div className="flex items-center justify-between text-muted-foreground mb-1">
              <span className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">Associates</span>
              <UserCheck className="h-4 w-4 text-amber-500" />
            </div>
            <div className="text-2xl font-bold text-foreground font-mono tracking-tight">{iaCount}</div>
            <span className="text-xs text-muted-foreground font-medium block mt-1">Operational support</span>
          </CardContent>
        </Card>
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
                <TableHead className="h-9 px-5 text-xs font-semibold text-muted-foreground uppercase tracking-wider">Direct Manager</TableHead>
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
                        {u.role.replace(/_/g, ' ')}
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

