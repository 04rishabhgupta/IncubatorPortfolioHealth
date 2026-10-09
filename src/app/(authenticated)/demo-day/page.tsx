'use client';

import { useState } from 'react';
import { useStore } from '@/store';
import { can } from '@/lib/rbac';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { StatCard } from '@/components/ui/stat-card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import Link from 'next/link';
import { PitchConnection, PitchConnectionStatus, InvestorType } from '@/types';
import {
  Presentation,
  Briefcase,
  Calendar,
  Send,
  Plus,
  Search,
  Filter,
  ExternalLink,
  Building2,
  TrendingUp,
  Star,
  MapPin,
  Mail,
  Phone,
  Globe,
  DollarSign,
  Users,
} from 'lucide-react';
import { Input } from '@/components/ui/input';
import { ConnectStartupModal } from '@/components/demoday/ConnectStartupModal';
import { AddInvestorModal } from '@/components/demoday/AddInvestorModal';
import { ScheduleDemoDayModal } from '@/components/demoday/ScheduleDemoDayModal';
import { UpdatePitchConnectionModal } from '@/components/demoday/UpdatePitchConnectionModal';

export default function DemoDayPage() {
  const { currentUser, startups, investors, demoDays, pitchConnections, users } = useStore();

  const [activeTab, setActiveTab] = useState<'pipeline' | 'events' | 'investors'>('pipeline');
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('ALL');
  const [typeFilter, setTypeFilter] = useState<string>('ALL');

  // Modal States
  const [connectModalOpen, setConnectModalOpen] = useState(false);
  const [preselectedStartupId, setPreselectedStartupId] = useState<string | undefined>(undefined);
  const [preselectedInvestorId, setPreselectedInvestorId] = useState<string | undefined>(undefined);
  const [preselectedDemoDayId, setPreselectedDemoDayId] = useState<string | undefined>(undefined);

  const [addInvestorModalOpen, setAddInvestorModalOpen] = useState(false);
  const [scheduleModalOpen, setScheduleModalOpen] = useState(false);
  const [updateModalOpen, setUpdateModalOpen] = useState(false);
  const [selectedConnection, setSelectedConnection] = useState<PitchConnection | null>(null);

  if (!currentUser) return null;

  const canManage = can(currentUser, 'manage_investor');

  // Compute Stats
  const activePitches = pitchConnections.filter((p) => p.status !== 'PASSED').length;
  const inTermSheetOrCommitted = pitchConnections.filter(
    (p) => p.status === 'TERM_SHEET' || p.status === 'COMMITTED'
  ).length;
  const upcomingDemoDays = demoDays.filter((d) => d.status === 'UPCOMING' || d.status === 'LIVE').length;
  const totalInvestors = investors.length;

  // Filtered Connections
  const filteredConnections = pitchConnections.filter((conn) => {
    const startup = startups.find((s) => s.id === conn.startupId);
    const investor = investors.find((i) => i.id === conn.investorId);

    const matchesSearch =
      (startup?.name.toLowerCase().includes(searchQuery.toLowerCase()) ?? false) ||
      (investor?.firm.toLowerCase().includes(searchQuery.toLowerCase()) ?? false) ||
      (investor?.name.toLowerCase().includes(searchQuery.toLowerCase()) ?? false) ||
      (conn.notes.toLowerCase().includes(searchQuery.toLowerCase()) ?? false);

    const matchesStatus = statusFilter === 'ALL' || conn.status === statusFilter;

    return matchesSearch && matchesStatus;
  });

  // Filtered Investors
  const filteredInvestors = investors.filter((inv) => {
    const matchesSearch =
      inv.firm.toLowerCase().includes(searchQuery.toLowerCase()) ||
      inv.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      inv.thesis.toLowerCase().includes(searchQuery.toLowerCase()) ||
      inv.sectors.some((s) => s.toLowerCase().includes(searchQuery.toLowerCase()));

    const matchesType = typeFilter === 'ALL' || inv.type === typeFilter;

    return matchesSearch && matchesType;
  });

  const getStatusBadge = (status: PitchConnectionStatus) => {
    switch (status) {
      case 'COMMITTED':
        return <Badge className="bg-emerald-600 text-white font-semibold">Committed & Closed</Badge>;
      case 'TERM_SHEET':
        return <Badge className="bg-emerald-100 text-emerald-800 border-emerald-300 font-semibold">Term Sheet Offered</Badge>;
      case 'DUE_DILIGENCE':
        return <Badge className="bg-indigo-100 text-indigo-800 border-indigo-300 font-semibold">Due Diligence</Badge>;
      case 'PITCHED':
        return <Badge className="bg-blue-100 text-blue-800 border-blue-300 font-semibold">Pitched</Badge>;
      case 'PITCH_SCHEDULED':
        return <Badge className="bg-violet-100 text-violet-800 border-violet-300 font-semibold">Pitch Scheduled</Badge>;
      case 'INTRODUCED':
        return <Badge className="bg-amber-100 text-amber-800 border-amber-300 font-semibold">Introduced</Badge>;
      case 'PASSED':
        return <Badge className="bg-gray-100 text-gray-700 border-gray-300 font-medium">Passed</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  const getInvestorTypeLabel = (type: InvestorType) => {
    switch (type) {
      case 'VC_FUND':
        return 'VC Fund';
      case 'ANGEL_NETWORK':
        return 'Angel Syndicate';
      case 'FAMILY_OFFICE':
        return 'Family Office';
      case 'CORPORATE_VC':
        return 'Corporate VC';
      case 'MICRO_VC':
        return 'Micro VC';
      default:
        return type;
    }
  };

  const openConnectForInvestor = (invId: string) => {
    setPreselectedInvestorId(invId);
    setPreselectedStartupId(undefined);
    setPreselectedDemoDayId(undefined);
    setConnectModalOpen(true);
  };

  const openConnectForEvent = (eventId: string) => {
    setPreselectedDemoDayId(eventId);
    setPreselectedInvestorId(undefined);
    setPreselectedStartupId(undefined);
    setConnectModalOpen(true);
  };

  return (
    <div className="space-y-6 pb-12">
      {/* Header Banner */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-gradient-to-r from-blue-900 via-indigo-900 to-slate-900 p-6 md:p-8 rounded-2xl text-white shadow-lg">
        <div className="space-y-2 max-w-2xl">
          <div className="flex items-center gap-2.5">
            <span className="p-2 bg-blue-500/20 rounded-xl backdrop-blur-xs border border-blue-400/30">
              <Presentation className="h-6 w-6 text-blue-300" />
            </span>
            <Badge className="bg-blue-500/20 text-blue-200 border-blue-400/30 text-xs px-2.5 py-0.5">
              Investor Connect & Syndicate Showcase
            </Badge>
          </div>
          <h1 className="text-2xl md:text-3xl font-bold tracking-tight">Demo Day & Pitching</h1>
          <p className="text-sm text-slate-300 leading-relaxed">
            Connect incubation cohort startups directly with venture capital, angel syndicates, and institutional funds. Track pitch pipelines, due diligence, and scheduled demo days.
          </p>
        </div>

        {/* Global Action CTAs */}
        <div className="flex flex-wrap items-center gap-2.5 shrink-0">
          <Button
            onClick={() => {
              setPreselectedStartupId(undefined);
              setPreselectedInvestorId(undefined);
              setPreselectedDemoDayId(undefined);
              setConnectModalOpen(true);
            }}
            className="bg-blue-600 hover:bg-blue-500 text-white font-semibold flex items-center gap-2 shadow-sm"
          >
            <Send className="h-4 w-4" />
            Connect Startup to VC
          </Button>

          {canManage && (
            <>
              <Button
                onClick={() => setAddInvestorModalOpen(true)}
                variant="outline"
                className="bg-white/10 hover:bg-white/20 text-white border-white/20 font-medium flex items-center gap-1.5"
              >
                <Plus className="h-4 w-4" />
                Add Investor / VC
              </Button>
              <Button
                onClick={() => setScheduleModalOpen(true)}
                variant="outline"
                className="bg-white/10 hover:bg-white/20 text-white border-white/20 font-medium flex items-center gap-1.5"
              >
                <Calendar className="h-4 w-4" />
                Schedule Demo Day
              </Button>
            </>
          )}
        </div>
      </div>

      {/* Top Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="Active Pitch Tracks"
          value={activePitches}
          subtitle="Ventures actively pitching investors"
          icon={TrendingUp}
        />
        <StatCard
          title="Investor Directory"
          value={totalInvestors}
          subtitle="VC funds, syndicates & family offices"
          icon={Briefcase}
        />
        <StatCard
          title="Upcoming Demo Days"
          value={upcomingDemoDays}
          subtitle="Scheduled showcase events"
          icon={Calendar}
        />
        <StatCard
          title="Term Sheet / Committed"
          value={inTermSheetOrCommitted}
          subtitle="Advanced funding conversions"
          icon={DollarSign}
        />
      </div>

      {/* Main Tabs Navigation */}
      <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as 'pipeline' | 'events' | 'investors')} className="space-y-5">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 border-b border-gray-200 pb-3">
          <TabsList className="bg-gray-100 p-1 rounded-xl">
            <TabsTrigger value="pipeline" className="rounded-lg text-xs font-semibold px-4 py-2 data-[state=active]:bg-white data-[state=active]:text-blue-600 data-[state=active]:shadow-xs flex items-center gap-2">
              <TrendingUp className="h-3.5 w-3.5" />
              Pitch Pipeline & Introductions
              {pitchConnections.length > 0 && (
                <span className="ml-1 text-[11px] bg-blue-100 text-blue-800 px-1.5 py-0.2 rounded-full font-bold">
                  {pitchConnections.length}
                </span>
              )}
            </TabsTrigger>
            <TabsTrigger value="events" className="rounded-lg text-xs font-semibold px-4 py-2 data-[state=active]:bg-white data-[state=active]:text-blue-600 data-[state=active]:shadow-xs flex items-center gap-2">
              <Presentation className="h-3.5 w-3.5" />
              Demo Day Events
              {demoDays.length > 0 && (
                <span className="ml-1 text-[11px] bg-violet-100 text-violet-800 px-1.5 py-0.2 rounded-full font-bold">
                  {demoDays.length}
                </span>
              )}
            </TabsTrigger>
            <TabsTrigger value="investors" className="rounded-lg text-xs font-semibold px-4 py-2 data-[state=active]:bg-white data-[state=active]:text-blue-600 data-[state=active]:shadow-xs flex items-center gap-2">
              <Briefcase className="h-3.5 w-3.5" />
              Investor & VC Directory
              {investors.length > 0 && (
                <span className="ml-1 text-[11px] bg-emerald-100 text-emerald-800 px-1.5 py-0.2 rounded-full font-bold">
                  {investors.length}
                </span>
              )}
            </TabsTrigger>
          </TabsList>

          {/* Quick Search Input */}
          <div className="relative w-full sm:w-64">
            <Search className="absolute left-2.5 top-2.5 h-3.5 w-3.5 text-gray-400" />
            <Input
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search startup, VC, or thesis..."
              className="pl-8 text-xs bg-white h-9"
            />
          </div>
        </div>

        {/* TAB 1: PITCH PIPELINE */}
        <TabsContent value="pipeline" className="space-y-4">
          {/* Status Filter Buttons */}
          <div className="flex flex-wrap items-center gap-1.5 bg-white p-2.5 rounded-xl border border-gray-200">
            <span className="text-xs font-semibold text-gray-500 mr-2 flex items-center gap-1">
              <Filter className="h-3 w-3" /> Filter by Stage:
            </span>
            {[
              { id: 'ALL', label: 'All Connections' },
              { id: 'INTRODUCED', label: 'Introduced' },
              { id: 'PITCH_SCHEDULED', label: 'Pitch Scheduled' },
              { id: 'PITCHED', label: 'Pitched' },
              { id: 'DUE_DILIGENCE', label: 'Due Diligence' },
              { id: 'TERM_SHEET', label: 'Term Sheet' },
              { id: 'COMMITTED', label: 'Committed' },
              { id: 'PASSED', label: 'Passed' },
            ].map((f) => (
              <button
                key={f.id}
                onClick={() => setStatusFilter(f.id)}
                className={`text-xs px-2.5 py-1 rounded-lg font-medium transition-colors ${
                  statusFilter === f.id
                    ? 'bg-blue-600 text-white shadow-2xs'
                    : 'text-gray-600 hover:bg-gray-100'
                }`}
              >
                {f.label}
              </button>
            ))}
          </div>

          {filteredConnections.length === 0 ? (
            <Card className="border border-dashed border-gray-300 text-center py-12 px-4 shadow-none">
              <div className="max-w-md mx-auto space-y-3">
                <div className="w-12 h-12 rounded-full bg-blue-50 text-blue-600 flex items-center justify-center mx-auto">
                  <Presentation className="h-6 w-6" />
                </div>
                <h3 className="text-base font-bold text-gray-900">No Pitch Connections Found</h3>
                <p className="text-xs text-gray-500">
                  {searchQuery || statusFilter !== 'ALL'
                    ? 'No connections match the selected filters. Try clearing filters or search query.'
                    : 'Introduce cohort startups to angel networks and venture funds to build the institutional funding pipeline.'}
                </p>
                <div className="pt-2 flex justify-center gap-2">
                  <Button
                    onClick={() => {
                      setPreselectedStartupId(undefined);
                      setPreselectedInvestorId(undefined);
                      setConnectModalOpen(true);
                    }}
                    className="bg-blue-600 hover:bg-blue-700 text-white font-medium text-xs"
                  >
                    <Send className="h-3.5 w-3.5 mr-1.5" />
                    Connect Startup to VC
                  </Button>
                  {investors.length === 0 && (
                    <Button
                      onClick={() => setAddInvestorModalOpen(true)}
                      variant="outline"
                      className="text-xs"
                    >
                      <Plus className="h-3.5 w-3.5 mr-1.5" />
                      Add First Investor
                    </Button>
                  )}
                </div>
              </div>
            </Card>
          ) : (
            <Card className="shadow-2xs border border-[#E4E4E7] overflow-hidden">
              <Table>
                <TableHeader className="bg-gray-50/75">
                  <TableRow>
                    <TableHead className="text-xs font-semibold">Startup</TableHead>
                    <TableHead className="text-xs font-semibold">Investor / Fund</TableHead>
                    <TableHead className="text-xs font-semibold">Round & Ask</TableHead>
                    <TableHead className="text-xs font-semibold">Pipeline Status</TableHead>
                    <TableHead className="text-xs font-semibold">Interest & Rating</TableHead>
                    <TableHead className="text-xs font-semibold">Next Step / Notes</TableHead>
                    <TableHead className="text-xs font-semibold text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredConnections.map((conn) => {
                    const startup = startups.find((s) => s.id === conn.startupId);
                    const investor = investors.find((i) => i.id === conn.investorId);
                    const introducer = users.find((u) => u.id === conn.connectedBy);
                    const demoDay = demoDays.find((d) => d.id === conn.demoDayId);

                    return (
                      <TableRow key={conn.id} className="hover:bg-gray-50/50">
                        <TableCell>
                          <div className="space-y-0.5">
                            <Link
                              href={`/startups/${conn.startupId}`}
                              className="font-bold text-xs text-blue-600 hover:underline flex items-center gap-1"
                            >
                              {startup?.name || 'Unknown Startup'}
                              <ExternalLink className="h-2.5 w-2.5 text-gray-400" />
                            </Link>
                            <div className="flex items-center gap-1.5 text-[10px] text-gray-500">
                              <span>{startup?.sector.replace('_', ' ') || 'DeepTech'}</span>
                              <span>•</span>
                              <span>{startup?.stage.replace('_', ' ') || 'Seed'}</span>
                            </div>
                            {demoDay && (
                              <Badge className="bg-violet-50 text-violet-700 border-violet-200 text-[9px] px-1.5 py-0 font-medium">
                                📅 {demoDay.title}
                              </Badge>
                            )}
                          </div>
                        </TableCell>

                        <TableCell>
                          <div className="space-y-0.5">
                            <div className="font-bold text-xs text-gray-900">
                              {investor?.firm || 'Unknown Firm'}
                            </div>
                            <div className="text-[11px] text-gray-600 font-medium">
                              {investor?.name} ({investor?.title || 'Partner'})
                            </div>
                            <div className="text-[10px] text-gray-400">
                              {investor ? getInvestorTypeLabel(investor.type) : 'VC'} • {investor?.ticketSize}
                            </div>
                          </div>
                        </TableCell>

                        <TableCell>
                          <div className="space-y-0.5">
                            <div className="font-bold text-xs text-gray-900">{conn.round}</div>
                            <div className="text-[11px] text-emerald-700 font-semibold flex items-center">
                              {conn.askAmount}
                            </div>
                          </div>
                        </TableCell>

                        <TableCell>
                          <div className="space-y-1">
                            {getStatusBadge(conn.status)}
                            <div className="text-[10px] text-gray-400">
                              Updated: {conn.updatedAt}
                            </div>
                          </div>
                        </TableCell>

                        <TableCell>
                          <div className="space-y-1">
                            {conn.rating ? (
                              <div className="flex items-center gap-0.5 text-amber-500">
                                {[1, 2, 3, 4, 5].map((s) => (
                                  <Star
                                    key={s}
                                    className={`h-3 w-3 ${
                                      s <= conn.rating! ? 'fill-amber-400 text-amber-400' : 'text-gray-200'
                                    }`}
                                  />
                                ))}
                              </div>
                            ) : (
                              <span className="text-[11px] text-gray-400 italic">Pending pitch</span>
                            )}
                            <div className="text-[10px] text-gray-500">
                              By {introducer?.label || 'Incubator Staff'}
                            </div>
                          </div>
                        </TableCell>

                        <TableCell className="max-w-xs">
                          <div className="space-y-1">
                            {conn.nextAction && (
                              <div className="text-xs font-semibold text-gray-800">
                                👉 {conn.nextAction}
                              </div>
                            )}
                            {conn.notes ? (
                              <p className="text-[11px] text-gray-600 line-clamp-2">
                                {conn.notes}
                              </p>
                            ) : (
                              <span className="text-[11px] text-gray-400 italic">No notes</span>
                            )}
                          </div>
                        </TableCell>

                        <TableCell className="text-right">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => {
                              setSelectedConnection(conn);
                              setUpdateModalOpen(true);
                            }}
                            className="text-xs font-semibold border-blue-200 text-blue-700 hover:bg-blue-50"
                          >
                            Update Progress
                          </Button>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </Card>
          )}
        </TabsContent>

        {/* TAB 2: DEMO DAY EVENTS */}
        <TabsContent value="events" className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-sm font-bold text-gray-900">Scheduled Demo Day Showcases</h2>
              <p className="text-xs text-gray-500">
                Incubator-curated pitch days connecting startups with participating investors
              </p>
            </div>
            {canManage && (
              <Button
                onClick={() => setScheduleModalOpen(true)}
                className="bg-violet-600 hover:bg-violet-700 text-white font-medium text-xs flex items-center gap-1.5"
              >
                <Plus className="h-3.5 w-3.5" />
                Schedule New Event
              </Button>
            )}
          </div>

          {demoDays.length === 0 ? (
            <Card className="border border-dashed border-gray-300 text-center py-12 px-4 shadow-none">
              <div className="max-w-md mx-auto space-y-3">
                <div className="w-12 h-12 rounded-full bg-violet-50 text-violet-600 flex items-center justify-center mx-auto">
                  <Calendar className="h-6 w-6" />
                </div>
                <h3 className="text-base font-bold text-gray-900">No Demo Days Scheduled</h3>
                <p className="text-xs text-gray-500">
                  Organize an annual or quarterly cohort showcase. Select participating ventures and invite investors from the directory.
                </p>
                {canManage && (
                  <Button
                    onClick={() => setScheduleModalOpen(true)}
                    className="bg-violet-600 hover:bg-violet-700 text-white font-medium text-xs"
                  >
                    <Calendar className="h-3.5 w-3.5 mr-1.5" />
                    Schedule First Demo Day
                  </Button>
                )}
              </div>
            </Card>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {demoDays.map((event) => {
                const participatingStartups = startups.filter((s) => event.startupIds.includes(s.id));
                const participatingInvestors = investors.filter((i) => event.investorIds.includes(i.id));

                return (
                  <Card key={event.id} className="border border-gray-200 shadow-2xs hover:shadow-md transition-shadow flex flex-col justify-between">
                    <CardHeader className="p-5 pb-3">
                      <div className="flex items-start justify-between gap-2">
                        <Badge className="bg-violet-100 text-violet-800 border-violet-200 text-xs font-semibold">
                          {event.status}
                        </Badge>
                        <span className="text-[11px] text-gray-500 font-medium">
                          Cohort: {event.cohort}
                        </span>
                      </div>
                      <CardTitle className="text-base font-bold text-gray-900 mt-2">
                        {event.title}
                      </CardTitle>
                      <CardDescription className="text-xs text-gray-600 mt-1 line-clamp-2">
                        {event.description}
                      </CardDescription>
                    </CardHeader>

                    <CardContent className="p-5 pt-0 space-y-3 flex-1 flex flex-col justify-between">
                      <div className="space-y-2 text-xs text-gray-600 pt-2 border-t border-gray-100">
                        <div className="flex items-center gap-2">
                          <Calendar className="h-3.5 w-3.5 text-violet-600 shrink-0" />
                          <span className="font-semibold text-gray-900">{event.date}</span>
                          {event.time && <span>• {event.time}</span>}
                        </div>
                        <div className="flex items-center gap-2">
                          <MapPin className="h-3.5 w-3.5 text-violet-600 shrink-0" />
                          <span className="truncate">{event.location}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <Building2 className="h-3.5 w-3.5 text-blue-600 shrink-0" />
                          <span>{participatingStartups.length} Pitching Startups</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <Users className="h-3.5 w-3.5 text-indigo-600 shrink-0" />
                          <span>{participatingInvestors.length} Attending Investors</span>
                        </div>
                      </div>

                      {/* Startups Lineup Preview */}
                      {participatingStartups.length > 0 && (
                        <div className="space-y-1">
                          <p className="text-[11px] font-semibold text-gray-700">Pitch Lineup:</p>
                          <div className="flex flex-wrap gap-1">
                            {participatingStartups.slice(0, 4).map((s) => (
                              <Badge key={s.id} variant="secondary" className="text-[10px] px-1.5 py-0">
                                {s.name}
                              </Badge>
                            ))}
                            {participatingStartups.length > 4 && (
                              <Badge variant="outline" className="text-[10px] px-1.5 py-0">
                                +{participatingStartups.length - 4} more
                              </Badge>
                            )}
                          </div>
                        </div>
                      )}

                      <div className="pt-3 border-t border-gray-100 flex items-center justify-between">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => openConnectForEvent(event.id)}
                          className="w-full text-xs font-semibold border-violet-200 text-violet-700 hover:bg-violet-50"
                        >
                          <Send className="h-3 w-3 mr-1.5" />
                          Introduce Pitch to Event
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          )}
        </TabsContent>

        {/* TAB 3: INVESTOR & VC DIRECTORY */}
        <TabsContent value="investors" className="space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            {/* Entity Type Filter */}
            <div className="flex flex-wrap items-center gap-1.5 bg-white p-2 rounded-xl border border-gray-200">
              <span className="text-xs font-semibold text-gray-500 mr-2 flex items-center gap-1">
                <Filter className="h-3 w-3" /> Entity Type:
              </span>
              {[
                { id: 'ALL', label: 'All' },
                { id: 'VC_FUND', label: 'VC Funds' },
                { id: 'ANGEL_NETWORK', label: 'Angel Networks' },
                { id: 'FAMILY_OFFICE', label: 'Family Offices' },
                { id: 'CORPORATE_VC', label: 'Corporate VC' },
                { id: 'MICRO_VC', label: 'Micro VCs' },
              ].map((f) => (
                <button
                  key={f.id}
                  onClick={() => setTypeFilter(f.id)}
                  className={`text-xs px-2.5 py-1 rounded-lg font-medium transition-colors ${
                    typeFilter === f.id
                      ? 'bg-emerald-600 text-white shadow-2xs'
                      : 'text-gray-600 hover:bg-gray-100'
                  }`}
                >
                  {f.label}
                </button>
              ))}
            </div>

            {canManage && (
              <Button
                onClick={() => setAddInvestorModalOpen(true)}
                className="bg-emerald-600 hover:bg-emerald-700 text-white font-medium text-xs flex items-center gap-1.5 shrink-0"
              >
                <Plus className="h-3.5 w-3.5" />
                Add Investor / VC
              </Button>
            )}
          </div>

          {filteredInvestors.length === 0 ? (
            <Card className="border border-dashed border-gray-300 text-center py-12 px-4 shadow-none">
              <div className="max-w-md mx-auto space-y-3">
                <div className="w-12 h-12 rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center mx-auto">
                  <Briefcase className="h-6 w-6" />
                </div>
                <h3 className="text-base font-bold text-gray-900">No Investors Found</h3>
                <p className="text-xs text-gray-500">
                  {searchQuery || typeFilter !== 'ALL'
                    ? 'No investors match your search criteria. Try clearing search filters.'
                    : 'Start building your investor directory by adding institutional venture capital funds, angel networks, and family offices.'}
                </p>
                {canManage && (
                  <Button
                    onClick={() => setAddInvestorModalOpen(true)}
                    className="bg-emerald-600 hover:bg-emerald-700 text-white font-medium text-xs"
                  >
                    <Plus className="h-3.5 w-3.5 mr-1.5" />
                    Add First Investor
                  </Button>
                )}
              </div>
            </Card>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredInvestors.map((inv) => (
                <Card key={inv.id} className="border border-gray-200 shadow-2xs hover:shadow-md transition-shadow flex flex-col justify-between">
                  <CardHeader className="p-5 pb-3">
                    <div className="flex items-start justify-between gap-2">
                      <Badge className="bg-emerald-50 text-emerald-800 border-emerald-200 text-xs font-semibold">
                        {getInvestorTypeLabel(inv.type)}
                      </Badge>
                      <Badge variant="outline" className="text-xs font-bold text-gray-700 bg-gray-50">
                        {inv.ticketSize}
                      </Badge>
                    </div>
                    <CardTitle className="text-base font-bold text-gray-900 mt-2">
                      {inv.firm}
                    </CardTitle>
                    <div className="text-xs font-semibold text-gray-700 flex items-center gap-1">
                      <span>{inv.name}</span>
                      <span className="text-gray-400 font-normal">• {inv.title}</span>
                    </div>
                  </CardHeader>

                  <CardContent className="p-5 pt-0 space-y-3 flex-1 flex flex-col justify-between">
                    <div className="space-y-2 text-xs">
                      {/* Investment Thesis */}
                      {inv.thesis && (
                        <p className="text-gray-600 italic bg-gray-50 p-2.5 rounded-lg border border-gray-100 line-clamp-2">
                          &ldquo;{inv.thesis}&rdquo;
                        </p>
                      )}

                      {/* Sectors */}
                      <div className="space-y-1">
                        <span className="text-[11px] font-semibold text-gray-500 uppercase tracking-wider">
                          Sectors:
                        </span>
                        <div className="flex flex-wrap gap-1">
                          {inv.sectors.slice(0, 3).map((s) => (
                            <Badge key={s} variant="secondary" className="text-[10px] px-1.5 py-0 bg-blue-50 text-blue-700 border-blue-200">
                              {s}
                            </Badge>
                          ))}
                          {inv.sectors.length > 3 && (
                            <Badge variant="outline" className="text-[10px] px-1.5 py-0 text-gray-500">
                              +{inv.sectors.length - 3}
                            </Badge>
                          )}
                        </div>
                      </div>

                      {/* Stages */}
                      <div className="space-y-1">
                        <span className="text-[11px] font-semibold text-gray-500 uppercase tracking-wider">
                          Stages:
                        </span>
                        <div className="flex flex-wrap gap-1">
                          {inv.stages.map((stg) => (
                            <Badge key={stg} variant="outline" className="text-[10px] px-1.5 py-0 text-emerald-800 border-emerald-300">
                              {stg}
                            </Badge>
                          ))}
                        </div>
                      </div>

                      {/* Contacts */}
                      <div className="flex flex-wrap items-center gap-3 pt-2 text-[11px] text-gray-500 border-t border-gray-100">
                        {inv.email && (
                          <a href={`mailto:${inv.email}`} className="hover:text-blue-600 flex items-center gap-1">
                            <Mail className="h-3 w-3" /> Email
                          </a>
                        )}
                        {inv.phone && (
                          <a href={`tel:${inv.phone}`} className="hover:text-blue-600 flex items-center gap-1">
                            <Phone className="h-3 w-3" /> Call
                          </a>
                        )}
                        {inv.website && (
                          <a href={inv.website} target="_blank" rel="noreferrer" className="hover:text-blue-600 flex items-center gap-1">
                            <Globe className="h-3 w-3" /> Web
                          </a>
                        )}
                        {inv.linkedin && (
                          <a href={inv.linkedin} target="_blank" rel="noreferrer" className="hover:text-blue-600 flex items-center gap-1">
                            <ExternalLink className="h-3 w-3" /> LinkedIn
                          </a>
                        )}
                      </div>
                    </div>

                    <div className="pt-3 border-t border-gray-100">
                      <Button
                        size="sm"
                        onClick={() => openConnectForInvestor(inv.id)}
                        className="w-full text-xs font-semibold bg-emerald-600 hover:bg-emerald-700 text-white flex items-center justify-center gap-1.5"
                      >
                        <Send className="h-3 w-3" />
                        Pitch a Startup to {inv.firm}
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>

      {/* Modals */}
      <ConnectStartupModal
        isOpen={connectModalOpen}
        onClose={() => setConnectModalOpen(false)}
        preselectedStartupId={preselectedStartupId}
        preselectedInvestorId={preselectedInvestorId}
        preselectedDemoDayId={preselectedDemoDayId}
      />

      <AddInvestorModal
        isOpen={addInvestorModalOpen}
        onClose={() => setAddInvestorModalOpen(false)}
      />

      <ScheduleDemoDayModal
        isOpen={scheduleModalOpen}
        onClose={() => setScheduleModalOpen(false)}
      />

      <UpdatePitchConnectionModal
        connection={selectedConnection}
        isOpen={updateModalOpen}
        onClose={() => {
          setUpdateModalOpen(false);
          setSelectedConnection(null);
        }}
      />
    </div>
  );
}
