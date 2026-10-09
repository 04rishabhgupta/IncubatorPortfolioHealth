'use client';

import { useState } from 'react';
import { useStore } from '@/store';
import { can, scopeStartups } from '@/lib/rbac';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
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
import { Mentor, MentorRequest, MentorMatch, MCExpertise, MCSector, MCStage } from '@/types';
import {
  Plus,
  CheckCircle2,
  X,
  ExternalLink,
  Users,
  UserCheck,
  UserPlus,
  Clock,
  Phone,
  Globe,
} from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';

const ALL_EXPERTISE: MCExpertise[] = [
  'Fundraising',
  'Technology / Product',
  'Go-to-Market',
  'B2B Sales',
  'Regulatory & Compliance',
  'IP & Patents',
  'Marketing',
  'Product Strategy',
  'Strategic Partnerships',
  'Government Contracts',
  'Supply Chain',
  'Financial Modelling',
  'ESG & Impact',
  'Clinical Strategy',
  'Legal',
  'HR & Talent',
];

const ALL_SECTORS: MCSector[] = [
  'DeepTech',
  'AI/ML',
  'Healthcare',
  'AgriTech',
  'Cybersecurity',
  'Defence',
  'Sustainability',
  'Green Mobility',
  'Fintech',
  'EdTech',
  'Other',
];

const ALL_STAGES: MCStage[] = [
  'Ideation',
  'Pre-Seed',
  'Seed',
  'Series A',
  'Series B+',
];

const ALL_GEOGRAPHIES: { value: Mentor['geography']; label: string }[] = [
  { value: 'PAN_INDIA', label: 'Pan-India' },
  { value: 'DELHI_NCR', label: 'Delhi NCR' },
  { value: 'NORTH', label: 'North India' },
  { value: 'SOUTH', label: 'South India' },
  { value: 'WEST', label: 'West India' },
  { value: 'EAST', label: 'East India' },
  { value: 'INTERNATIONAL', label: 'International' },
];

export default function MentorConnectPage() {
  const {
    currentUser,
    startups,
    mentors,
    mentorMatches,
    mentorRequests,
    addMentor,
    addMentorRequest,
    updateMentorRequest,
    addMentorMatch,
    updateMentorMatch,
    users,
  } = useStore();

  const [activeTab, setActiveTab] = useState<'matches' | 'requests' | 'pool'>('matches');
  const [requestModalOpen, setRequestModalOpen] = useState(false);
  const [respondingRequest, setRespondingRequest] = useState<MentorRequest | null>(null);
  const [sessionModalMatch, setSessionModalMatch] = useState<MentorMatch | null>(null);

  // New Request Form State
  const [selectedStartupId, setSelectedStartupId] = useState('');
  const [challenge, setChallenge] = useState('');
  const [selectedExpertise, setSelectedExpertise] = useState<MCExpertise[]>(['B2B Sales']);
  const [requestNote, setRequestNote] = useState('');

  // Propose/Respond Form State
  const [selectedMentorId, setSelectedMentorId] = useState('');
  const [responseNote, setResponseNote] = useState('');

  // Log Session Form State
  const [sessionTopic, setSessionTopic] = useState('');
  const [sessionNextStep, setSessionNextStep] = useState('');
  const [sessionRating, setSessionRating] = useState<1 | 2 | 3 | 4 | 5>(5);

  // Add Mentor Modal State
  const [addMentorModalOpen, setAddMentorModalOpen] = useState(false);
  const [isSubmittingMentor, setIsSubmittingMentor] = useState(false);
  const [mentorName, setMentorName] = useState('');
  const [mentorTitle, setMentorTitle] = useState('');
  const [mentorPhone, setMentorPhone] = useState('');
  const [mentorLinkedin, setMentorLinkedin] = useState('');
  const [mentorSectors, setMentorSectors] = useState<MCSector[]>(['DeepTech']);
  const [mentorExpertise, setMentorExpertise] = useState<MCExpertise[]>(['B2B Sales']);
  const [mentorStages, setMentorStages] = useState<MCStage[]>(['Seed']);
  const [mentorGeography, setMentorGeography] = useState<Mentor['geography']>('PAN_INDIA');
  const [mentorAvailability, setMentorAvailability] = useState<Mentor['availability']>('MEDIUM');
  const [mentorMaxActiveMatches, setMentorMaxActiveMatches] = useState<number>(3);
  const [mentorBio, setMentorBio] = useState('');

  if (!currentUser) return null;

  const canManageMentor = can(currentUser, 'manage_mentor');
  const accessibleStartups = scopeStartups(currentUser, startups);
  const startupIds = new Set(accessibleStartups.map((s) => s.id));

  const scopedMatches = mentorMatches.filter((m) => startupIds.has(m.startupId));
  const scopedRequests = mentorRequests.filter((r) => startupIds.has(r.startupId));

  const toggleMentorSector = (sec: MCSector) => {
    if (mentorSectors.includes(sec)) {
      if (mentorSectors.length > 1) {
        setMentorSectors(mentorSectors.filter((s) => s !== sec));
      }
    } else {
      setMentorSectors([...mentorSectors, sec]);
    }
  };

  const toggleMentorExpertise = (exp: MCExpertise) => {
    if (mentorExpertise.includes(exp)) {
      if (mentorExpertise.length > 1) {
        setMentorExpertise(mentorExpertise.filter((e) => e !== exp));
      }
    } else {
      setMentorExpertise([...mentorExpertise, exp]);
    }
  };

  const toggleMentorStage = (stg: MCStage) => {
    if (mentorStages.includes(stg)) {
      if (mentorStages.length > 1) {
        setMentorStages(mentorStages.filter((s) => s !== stg));
      }
    } else {
      setMentorStages([...mentorStages, stg]);
    }
  };

  const handleCreateMentor = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!mentorName.trim()) {
      toast.error('Please enter the mentor name');
      return;
    }
    if (!mentorTitle.trim()) {
      toast.error('Please enter the mentor professional title');
      return;
    }
    if (mentorExpertise.length === 0) {
      toast.error('Please select at least one area of expertise');
      return;
    }

    setIsSubmittingMentor(true);
    try {
      const newMentor: Mentor = {
        id: crypto.randomUUID(),
        name: mentorName.trim(),
        title: mentorTitle.trim(),
        phone: mentorPhone.trim() || undefined,
        linkedin: mentorLinkedin.trim() || undefined,
        sectors: mentorSectors.length > 0 ? mentorSectors : ['DeepTech'],
        expertise: mentorExpertise,
        stages: mentorStages.length > 0 ? mentorStages : ['Seed'],
        geography: mentorGeography,
        availability: mentorAvailability,
        maxActiveMatches: Number(mentorMaxActiveMatches) || 3,
        bio: mentorBio.trim() || `${mentorTitle.trim()} with deep domain expertise.`,
        active: true,
      };

      const res = await addMentor(newMentor);
      if (res?.error) {
        toast.error(res.error);
      } else {
        toast.success(`Mentor "${newMentor.name}" added to the network pool`);
        setAddMentorModalOpen(false);
        setMentorName('');
        setMentorTitle('');
        setMentorPhone('');
        setMentorLinkedin('');
        setMentorSectors(['DeepTech']);
        setMentorExpertise(['B2B Sales']);
        setMentorStages(['Seed']);
        setMentorGeography('PAN_INDIA');
        setMentorAvailability('MEDIUM');
        setMentorMaxActiveMatches(3);
        setMentorBio('');
      }
    } catch {
      toast.error('Failed to create mentor');
    } finally {
      setIsSubmittingMentor(false);
    }
  };

  // Handle New Mentor Request Submit
  const handleCreateRequest = async (e: React.FormEvent) => {
    e.preventDefault();
    const targetStartupId = selectedStartupId || accessibleStartups[0]?.id;
    if (!targetStartupId) {
      toast.error('Please select a startup');
      return;
    }
    if (!challenge.trim()) {
      toast.error('Please specify the challenge');
      return;
    }

    const newReq: MentorRequest = {
      id: crypto.randomUUID(),
      startupId: targetStartupId,
      challenge: challenge.trim(),
      expertiseNeeded: selectedExpertise,
      raisedBy: 'STAFF',
      createdOn: new Date().toISOString().split('T')[0],
      status: 'PENDING',
      note: requestNote.trim() || undefined,
    };

    const res = await addMentorRequest(newReq);
    if (res?.error) {
      toast.error(res.error);
      return;
    }

    toast.success('Mentor request logged & notification dispatched to dashboard');
    setRequestModalOpen(false);
    setChallenge('');
    setRequestNote('');
    setActiveTab('requests');
  };

  // Handle Match Response Submit
  const handleConfirmMatch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!respondingRequest) return;
    const mentorIdToMatch = selectedMentorId || mentors[0]?.id;
    if (!mentorIdToMatch) {
      toast.error('Please select a mentor');
      return;
    }

    const newMatch: MentorMatch = {
      id: crypto.randomUUID(),
      requestId: respondingRequest.id,
      startupId: respondingRequest.startupId,
      mentorId: mentorIdToMatch,
      confirmedBy: currentUser.id,
      confirmedOn: new Date().toISOString().split('T')[0],
      status: 'ACTIVE',
      sessions: [
        {
          id: crypto.randomUUID(),
          date: new Date().toISOString().split('T')[0],
          topic: responseNote.trim() || 'Initial orientation and technical deep dive',
          nextStep: 'Action items agreed with founding team',
          rating: 5,
        },
      ],
    };

    // Update Request
    await updateMentorRequest({
      ...respondingRequest,
      status: 'MATCHED',
      mentorId: mentorIdToMatch,
      note: responseNote.trim() || respondingRequest.note,
    });

    const res = await addMentorMatch(newMatch);
    if (res?.error) {
      toast.error(res.error);
      return;
    }

    toast.success('Mentor match confirmed! Both portfolio head & portfolio manager notified.');
    setRespondingRequest(null);
    setResponseNote('');
    setActiveTab('matches');
  };

  // Handle Log Session
  const handleLogSession = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!sessionModalMatch) return;

    const newSession = {
      id: crypto.randomUUID(),
      date: new Date().toISOString().split('T')[0],
      topic: sessionTopic.trim() || 'Strategic Review',
      nextStep: sessionNextStep.trim() || 'Follow up next week',
      rating: sessionRating,
    };

    const res = await updateMentorMatch({
      ...sessionModalMatch,
      sessions: [...sessionModalMatch.sessions, newSession],
    });

    if (res?.error) {
      toast.error(res.error);
      return;
    }

    toast.success('Mentoring session logged');
    setSessionModalMatch(null);
    setSessionTopic('');
    setSessionNextStep('');
  };

  const toggleExpertise = (exp: MCExpertise) => {
    if (selectedExpertise.includes(exp)) {
      if (selectedExpertise.length > 1) {
        setSelectedExpertise(selectedExpertise.filter((e) => e !== exp));
      }
    } else {
      setSelectedExpertise([...selectedExpertise, exp]);
    }
  };

  const activeEngagements = scopedMatches.filter((m) => m.status === 'ACTIVE').length;
  const pendingRequests = scopedRequests.filter((r) => r.status === 'PENDING').length;
  const totalSessions = scopedMatches.reduce((acc, cur) => acc + cur.sessions.length, 0);

  return (
    <div className="space-y-6 animate-in fade-in-50 duration-200">
      {/* Top Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between pb-4 border-b border-[#E4E4E7] gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="heading-display text-zinc-900 tracking-tight" style={{ fontSize: 'var(--type-display)' }}>
              Mentor Connect
            </h1>
            <Badge className="bg-[#2563EB] text-white text-[10px]">2-Way Request & Response</Badge>
          </div>
          <p className="text-xs sm:text-sm text-zinc-500 mt-1">
            Connect portfolio startups with elite industry mentors. Both Portfolio Heads and Portfolio Managers can raise
            requests and confirm matches.
          </p>
        </div>

        <div className="flex items-center gap-3">
          {canManageMentor && (
            <Button
              onClick={() => setAddMentorModalOpen(true)}
              variant="outline"
              className="text-xs font-semibold h-9 rounded-lg gap-1.5 border-[#2563EB] text-[#2563EB] hover:bg-blue-50"
            >
              <UserPlus className="h-3.5 w-3.5" />
              <span>Add Mentor</span>
            </Button>
          )}
          <Button
            onClick={() => setRequestModalOpen(true)}
            className="text-xs font-semibold h-9 rounded-lg gap-1.5 shadow-2xs"
          >
            <Plus className="h-3.5 w-3.5" />
            <span>New Mentor Request</span>
          </Button>
        </div>
      </div>

      {/* KPI Stats Strip */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="Active Matches"
          value={activeEngagements}
          icon={Users}
          trend="~ Live advisory tracks"
          subtitle="active engagements"
        />
        <StatCard
          title="Mentor Network"
          value={mentors.length}
          icon={UserCheck}
          trend="~ Vetted advisors"
          subtitle="deeptech leaders"
        />
        <StatCard
          title="Pending Requests"
          value={pendingRequests}
          icon={Clock}
          trend="~ Needs proposal"
          subtitle="awaiting match"
          valueClassName={pendingRequests > 0 ? "text-amber-600" : ""}
        />
        <StatCard
          title="Sessions Logged"
          value={totalSessions}
          icon={CheckCircle2}
          trend="~ High engagement"
          subtitle="completed interactions"
        />
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as 'matches' | 'requests' | 'pool')} className="w-full">
        <TabsList className="bg-muted p-1 rounded-lg">
          <TabsTrigger
            value="matches"
            className="text-xs font-semibold"
          >
            Active Matches ({scopedMatches.length})
          </TabsTrigger>
          <TabsTrigger
            value="requests"
            className="text-xs font-semibold"
          >
            Requests & Responses ({scopedRequests.length})
          </TabsTrigger>
          <TabsTrigger
            value="pool"
            className="text-xs font-semibold"
          >
            Mentor Network ({mentors.length})
          </TabsTrigger>
        </TabsList>

        {/* TAB 1: ACTIVE MATCHES */}
        <TabsContent value="matches" className="mt-4">
          <Card className="shadow-2xs overflow-hidden">
            <CardHeader className="p-4 sm:p-5 border-b border-border">
              <CardTitle className="text-base font-bold tracking-tight flex items-center justify-between">
                <span>Active Mentoring Engagements</span>
                <span className="text-xs font-normal text-muted-foreground">
                  {scopedMatches.length} engagements across your portfolio
                </span>
              </CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              <Table>
                <TableHeader className="bg-muted/50">
                  <TableRow>
                    <TableHead className="h-9 px-6 text-xs font-semibold text-muted-foreground uppercase tracking-wider">Startup</TableHead>
                    <TableHead className="h-9 px-6 text-xs font-semibold text-muted-foreground uppercase tracking-wider">Matched Mentor</TableHead>
                    <TableHead className="h-9 px-6 text-xs font-semibold text-muted-foreground uppercase tracking-wider">Confirmed By</TableHead>
                    <TableHead className="h-9 px-6 text-xs font-semibold text-muted-foreground uppercase tracking-wider">Status</TableHead>
                    <TableHead className="h-9 px-6 text-xs font-semibold text-muted-foreground uppercase tracking-wider">Sessions Logged</TableHead>
                    <TableHead className="h-9 px-6 text-xs font-semibold text-muted-foreground uppercase tracking-wider text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {scopedMatches.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={6} className="px-6 py-8 text-center text-sm text-muted-foreground">
                        No active mentor matches found. Propose a match from pending requests!
                      </TableCell>
                    </TableRow>
                  ) : (
                    scopedMatches.map((m) => {
                      const s = accessibleStartups.find((st) => st.id === m.startupId);
                      const mentor = mentors.find((mt) => mt.id === m.mentorId);
                      const conf = users.find((u) => u.id === m.confirmedBy);
                      return (
                        <TableRow key={m.id} className="hover:bg-muted/50">
                          <TableCell className="px-6 py-3.5 font-semibold text-foreground">
                            {s ? (
                              <Link
                                href={`/startups/${s.id}`}
                                className="text-primary font-bold hover:underline flex items-center gap-1"
                              >
                                <span>{s.name}</span>
                                <ExternalLink className="h-3 w-3 text-muted-foreground" />
                              </Link>
                            ) : (
                              '-'
                            )}
                          </TableCell>
                          <TableCell className="px-6 py-3.5">
                            <div className="font-bold text-foreground">{mentor?.name || m.mentorId}</div>
                            <div className="text-xs text-muted-foreground">{mentor?.title}</div>
                          </TableCell>
                          <TableCell className="px-6 py-3.5 text-xs text-muted-foreground">{conf?.label || 'Staff'}</TableCell>
                          <TableCell className="px-6 py-3.5">
                            <Badge
                              className={
                                m.status === 'ACTIVE'
                                  ? 'bg-emerald-600 hover:bg-emerald-600 text-white text-[10px]'
                                  : 'bg-muted text-muted-foreground text-[10px]'
                              }
                            >
                              {m.status}
                            </Badge>
                          </TableCell>
                          <TableCell className="px-6 py-3.5 text-xs">
                            <span className="font-bold text-foreground font-mono">{m.sessions.length}</span> sessions
                          </TableCell>
                          <TableCell className="px-6 py-3.5 text-right">
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => setSessionModalMatch(m)}
                              className="h-7 text-xs"
                            >
                              Log Session
                            </Button>
                          </TableCell>
                        </TableRow>
                      );
                    })
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        {/* TAB 2: REQUESTS & RESPONSES */}
        <TabsContent value="requests" className="mt-4">
          <Card className="shadow-2xs overflow-hidden">
            <CardHeader className="p-4 sm:p-5 border-b border-border">
              <CardTitle className="text-base font-bold tracking-tight flex items-center justify-between">
                <span>Mentor Requests & Incoming Responses</span>
                <span className="text-xs font-normal text-muted-foreground">
                  {scopedRequests.filter((r) => r.status === 'PENDING').length} awaiting match
                </span>
              </CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              <Table>
                <TableHeader className="bg-muted/50">
                  <TableRow>
                    <TableHead className="h-9 px-6 text-xs font-semibold text-muted-foreground uppercase tracking-wider">Startup</TableHead>
                    <TableHead className="h-9 px-6 text-xs font-semibold text-muted-foreground uppercase tracking-wider">Challenge / Area</TableHead>
                    <TableHead className="h-9 px-6 text-xs font-semibold text-muted-foreground uppercase tracking-wider">Required Expertise</TableHead>
                    <TableHead className="h-9 px-6 text-xs font-semibold text-muted-foreground uppercase tracking-wider">Logged Date</TableHead>
                    <TableHead className="h-9 px-6 text-xs font-semibold text-muted-foreground uppercase tracking-wider">Status</TableHead>
                    <TableHead className="h-9 px-6 text-xs font-semibold text-muted-foreground uppercase tracking-wider text-right">Action</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {scopedRequests.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={6} className="px-6 py-8 text-center text-sm text-muted-foreground">
                        No mentor requests currently open.
                      </TableCell>
                    </TableRow>
                  ) : (
                    scopedRequests.map((r) => {
                      const s = accessibleStartups.find((st) => st.id === r.startupId);
                      const matchedMentor = r.mentorId ? mentors.find((m) => m.id === r.mentorId) : undefined;
                      return (
                        <TableRow key={r.id} className="hover:bg-muted/50">
                          <TableCell className="px-6 py-3.5 font-bold text-foreground">
                            {s ? (
                              <Link href={`/startups/${s.id}`} className="text-primary hover:underline">
                                {s.name}
                              </Link>
                            ) : (
                              '-'
                            )}
                          </TableCell>
                          <TableCell className="px-6 py-3.5 max-w-xs">
                            <div className="text-xs font-semibold text-foreground line-clamp-2">{r.challenge}</div>
                            {r.note && <div className="text-[11px] text-muted-foreground mt-0.5">{r.note}</div>}
                          </TableCell>
                          <TableCell className="px-6 py-3.5">
                            <div className="flex gap-1 flex-wrap">
                              {r.expertiseNeeded.map((e) => (
                                <Badge key={e} variant="outline" className="text-[10px]">
                                  {e}
                                </Badge>
                              ))}
                            </div>
                          </TableCell>
                          <TableCell className="px-6 py-3.5 text-xs text-muted-foreground font-mono">{r.createdOn}</TableCell>
                          <TableCell className="px-6 py-3.5">
                            <Badge
                              className={
                                r.status === 'PENDING'
                                  ? 'bg-amber-500 hover:bg-amber-500 text-white text-[10px]'
                                  : 'bg-emerald-600 hover:bg-emerald-600 text-white text-[10px]'
                              }
                            >
                              {r.status}
                            </Badge>
                            {matchedMentor && (
                              <span className="block text-[10px] text-muted-foreground mt-0.5">
                                Matched: {matchedMentor.name}
                              </span>
                            )}
                          </TableCell>
                          <TableCell className="px-6 py-3.5 text-right">
                            {r.status === 'PENDING' ? (
                              <Button
                                size="sm"
                                onClick={() => setRespondingRequest(r)}
                                className="h-7 text-xs font-medium"
                              >
                                Propose / Match
                              </Button>
                            ) : (
                              <span className="text-xs text-emerald-600 font-semibold flex items-center justify-end gap-1">
                                <CheckCircle2 className="h-3.5 w-3.5" /> Matched
                              </span>
                            )}
                          </TableCell>
                        </TableRow>
                      );
                    })
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        {/* TAB 3: MENTOR POOL */}
        <TabsContent value="pool" className="mt-4">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-base font-bold text-zinc-900">Vetted Mentor Network ({mentors.length})</h2>
              <p className="text-xs text-zinc-500">Domain experts, functional advisors, and institutional leaders</p>
            </div>
            {canManageMentor && (
              <Button
                size="sm"
                onClick={() => setAddMentorModalOpen(true)}
                className="text-xs font-semibold gap-1.5 bg-[#2563EB] hover:bg-blue-700 text-white shadow-2xs"
              >
                <UserPlus className="h-3.5 w-3.5" />
                <span>Add Mentor</span>
              </Button>
            )}
          </div>

          {mentors.length === 0 ? (
            <div className="bg-white border border-[#E4E4E7] rounded-2xl p-12 text-center shadow-xs">
              <div className="mx-auto w-12 h-12 rounded-full bg-blue-50 flex items-center justify-center text-blue-600 mb-3">
                <UserPlus className="h-6 w-6" />
              </div>
              <h3 className="font-bold text-base text-zinc-900">No mentors in network pool yet</h3>
              <p className="text-xs text-zinc-500 max-w-md mx-auto mt-1 mb-5">
                Portfolio Heads and Portfolio Managers can add mentors with their expertise, sectors, stage focus, and capacity to match with portfolio startups.
              </p>
              {canManageMentor && (
                <Button
                  onClick={() => setAddMentorModalOpen(true)}
                  className="text-xs font-semibold gap-1.5 bg-[#2563EB] hover:bg-blue-700 text-white shadow-2xs"
                >
                  <UserPlus className="h-3.5 w-3.5" />
                  <span>Add First Mentor</span>
                </Button>
              )}
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {mentors.map((m) => {
                const activeCount = mentorMatches.filter(
                  (match) => match.mentorId === m.id && match.status === 'ACTIVE'
                ).length;
                const isFull = activeCount >= m.maxActiveMatches;

                return (
                  <div
                    key={m.id}
                    className="bg-white border border-[#E4E4E7] rounded-2xl p-5 shadow-xs flex flex-col justify-between"
                  >
                    <div>
                      <div className="flex items-start justify-between">
                        <div>
                          <h3 className="font-bold text-base text-zinc-900">{m.name}</h3>
                          <p className="text-xs text-zinc-500">{m.title}</p>
                          {(m.phone || m.linkedin) && (
                            <div className="flex items-center gap-2 mt-1 text-[11px] text-zinc-500">
                              {m.phone && (
                                <span className="flex items-center gap-1 font-mono">
                                  <Phone className="h-2.5 w-2.5 text-zinc-400" />
                                  {m.phone}
                                </span>
                              )}
                              {m.linkedin && (
                                <a
                                  href={m.linkedin}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="text-blue-600 hover:underline flex items-center gap-0.5"
                                >
                                  <Globe className="h-2.5 w-2.5" />
                                  <span>LinkedIn</span>
                                </a>
                              )}
                            </div>
                          )}
                        </div>
                        <Badge
                          variant="outline"
                          className={`text-[10px] ${
                            isFull
                              ? 'bg-red-50 text-red-700 border-red-200'
                              : 'bg-green-50 text-[#16A34A] border-green-200'
                          }`}
                        >
                          {activeCount} / {m.maxActiveMatches} Active
                        </Badge>
                      </div>

                      {m.sectors && m.sectors.length > 0 && (
                        <div className="flex flex-wrap gap-1 mt-2 mb-1">
                          {m.sectors.map((sec) => (
                            <Badge key={sec} variant="outline" className="text-[9px] bg-blue-50 text-blue-700 border-blue-200">
                              {sec}
                            </Badge>
                          ))}
                        </div>
                      )}

                      <div className="flex flex-wrap gap-1.5 mt-2 mb-3">
                        {m.expertise.map((exp) => (
                          <Badge key={exp} variant="secondary" className="text-[10px] bg-[#F4F4F5] text-zinc-700">
                            {exp}
                          </Badge>
                        ))}
                      </div>

                      <p className="text-xs text-zinc-600 leading-relaxed line-clamp-3 mb-4">{m.bio}</p>
                    </div>

                    <div className="pt-3 border-t border-zinc-100 flex items-center justify-between text-xs text-zinc-500">
                      <span>{m.geography.replace('_', ' ')}</span>
                      <Button
                        size="sm"
                        variant="outline"
                        disabled={isFull}
                        onClick={() => {
                          setSelectedMentorId(m.id);
                          setRequestModalOpen(true);
                        }}
                        className="h-7 text-xs border-[#2563EB] text-[#2563EB] hover:bg-[#2563EB] hover:text-white"
                      >
                        {isFull ? 'Capacity Full' : 'Request Match'}
                      </Button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </TabsContent>
      </Tabs>

      {/* MODAL 1: CREATE NEW MENTOR REQUEST */}
      {requestModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4">
          <div className="bg-white rounded-2xl shadow-2xl border border-[#E4E4E7] w-full max-w-lg overflow-hidden animate-in fade-in-50 zoom-in-95">
            <div className="px-6 py-4 bg-gradient-to-r from-blue-600 to-indigo-600 text-white flex items-center justify-between">
              <h3 className="font-bold text-base">New Mentor Request</h3>
              <button onClick={() => setRequestModalOpen(false)} className="text-white/70 hover:text-white">
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleCreateRequest} className="p-6 space-y-4">
              <div className="space-y-1.5">
                <Label className="text-xs font-bold text-zinc-700">Target Startup</Label>
                <select
                  value={selectedStartupId}
                  onChange={(e) => setSelectedStartupId(e.target.value)}
                  className="w-full text-sm border border-zinc-300 rounded-lg p-2 bg-white"
                >
                  {accessibleStartups.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.name} ({s.sector})
                    </option>
                  ))}
                </select>
              </div>

              <div className="space-y-1.5">
                <Label className="text-xs font-bold text-zinc-700">Challenge / Problem Statement</Label>
                <textarea
                  value={challenge}
                  onChange={(e) => setChallenge(e.target.value)}
                  placeholder="e.g. Scaling B2B wool distribution channels or securing OEM clinical validation"
                  rows={3}
                  className="w-full text-sm border border-zinc-300 rounded-lg p-2.5 focus:outline-none focus:ring-2 focus:ring-blue-600"
                  required
                />
              </div>

              <div className="space-y-1.5">
                <Label className="text-xs font-bold text-zinc-700">Required Expertise Domains</Label>
                <div className="flex flex-wrap gap-1.5 max-h-36 overflow-y-auto p-1.5 bg-[#F4F4F5] rounded-lg border border-[#E4E4E7]">
                  {ALL_EXPERTISE.map((exp) => {
                    const isSelected = selectedExpertise.includes(exp);
                    return (
                      <button
                        key={exp}
                        type="button"
                        onClick={() => toggleExpertise(exp)}
                        className={`text-xs px-2.5 py-1 rounded-md transition-all ${
                          isSelected
                            ? 'bg-[#2563EB] text-white font-semibold shadow-2xs'
                            : 'bg-white text-zinc-700 border hover:bg-zinc-100'
                        }`}
                      >
                        {exp}
                      </button>
                    );
                  })}
                </div>
              </div>

              <div className="space-y-1.5">
                <Label className="text-xs font-bold text-zinc-700">Internal Portfolio Head / Manager Note</Label>
                <Input
                  value={requestNote}
                  onChange={(e) => setRequestNote(e.target.value)}
                  placeholder="e.g. Founder requested intro prior to next board meeting"
                />
              </div>

              <div className="flex items-center justify-between pt-3 border-t border-zinc-100">
                <Button type="button" variant="ghost" onClick={() => setRequestModalOpen(false)}>
                  Cancel
                </Button>
                <Button type="submit" className="bg-[#2563EB] hover:bg-blue-700 text-white font-semibold">
                  Submit Request & Notify
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 2: RESPOND & MATCH MENTOR */}
      {respondingRequest && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4">
          <div className="bg-white rounded-2xl shadow-2xl border border-[#E4E4E7] w-full max-w-lg overflow-hidden animate-in fade-in-50 zoom-in-95">
            <div className="px-6 py-4 bg-gradient-to-r from-blue-600 to-indigo-600 text-white flex items-center justify-between">
              <div>
                <h3 className="font-bold text-base">Match Mentor to Request</h3>
                <p className="text-xs text-white/80">
                  {accessibleStartups.find((s) => s.id === respondingRequest.startupId)?.name}
                </p>
              </div>
              <button onClick={() => setRespondingRequest(null)} className="text-white/70 hover:text-white">
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleConfirmMatch} className="p-6 space-y-4">
              <div className="p-3 bg-green-50 rounded-xl border border-green-200 text-xs text-green-900">
                <span className="font-bold block mb-1">Challenge Request:</span>
                {respondingRequest.challenge}
              </div>

              <div className="space-y-1.5">
                <Label className="text-xs font-bold text-zinc-700">Select Mentor from Network</Label>
                <select
                  value={selectedMentorId}
                  onChange={(e) => setSelectedMentorId(e.target.value)}
                  className="w-full text-sm border border-zinc-300 rounded-lg p-2.5 bg-white font-medium"
                >
                  {mentors.map((m) => (
                    <option key={m.id} value={m.id}>
                      {m.name} — {m.title} ({m.expertise.slice(0, 2).join(', ')})
                    </option>
                  ))}
                </select>
              </div>

              <div className="space-y-1.5">
                <Label className="text-xs font-bold text-zinc-700">Response / Match Note</Label>
                <textarea
                  value={responseNote}
                  onChange={(e) => setResponseNote(e.target.value)}
                  placeholder="e.g. Aligned on 3 initial advisory sessions focused on B2B supply contracts"
                  rows={3}
                  className="w-full text-sm border border-zinc-300 rounded-lg p-2.5"
                />
              </div>

              <div className="flex items-center justify-between pt-3 border-t border-zinc-100">
                <Button type="button" variant="ghost" onClick={() => setRespondingRequest(null)}>
                  Cancel
                </Button>
                <Button type="submit" className="bg-[#16A34A] hover:bg-green-700 text-white font-semibold">
                  Confirm Match & Notify Both
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 3: LOG MENTORING SESSION */}
      {sessionModalMatch && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4">
          <div className="bg-white rounded-2xl shadow-2xl border border-[#E4E4E7] w-full max-w-md overflow-hidden animate-in fade-in-50 zoom-in-95">
            <div className="px-6 py-4 bg-gradient-to-r from-blue-600 to-indigo-600 text-white flex items-center justify-between">
              <h3 className="font-bold text-base">Log Advisory Session</h3>
              <button onClick={() => setSessionModalMatch(null)} className="text-white/70 hover:text-white">
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleLogSession} className="p-6 space-y-4">
              <div className="space-y-1.5">
                <Label className="text-xs font-bold text-zinc-700">Session Discussion Topic</Label>
                <Input
                  value={sessionTopic}
                  onChange={(e) => setSessionTopic(e.target.value)}
                  placeholder="e.g. Cap table structuring & investor syndicate review"
                  required
                />
              </div>

              <div className="space-y-1.5">
                <Label className="text-xs font-bold text-zinc-700">Agreed Next Action</Label>
                <Input
                  value={sessionNextStep}
                  onChange={(e) => setSessionNextStep(e.target.value)}
                  placeholder="e.g. Founder to share updated financial model by Friday"
                  required
                />
              </div>

              <div className="space-y-1.5">
                <Label className="text-xs font-bold text-zinc-700">Session Rating (1 - 5)</Label>
                <div className="flex gap-2">
                  {[1, 2, 3, 4, 5].map((val) => (
                    <button
                      key={val}
                      type="button"
                      onClick={() => setSessionRating(val as 1 | 2 | 3 | 4 | 5)}
                      className={`p-2 rounded-lg flex-1 text-center font-bold text-sm border ${
                        sessionRating === val
                          ? 'bg-[#2563EB] text-white border-[#2563EB]'
                          : 'bg-white text-zinc-700 hover:bg-zinc-100'
                      }`}
                    >
                      {val} ★
                    </button>
                  ))}
                </div>
              </div>

              <div className="flex items-center justify-between pt-3 border-t border-zinc-100">
                <Button type="button" variant="ghost" onClick={() => setSessionModalMatch(null)}>
                  Cancel
                </Button>
                <Button type="submit" className="bg-[#2563EB] hover:bg-blue-700 text-white font-semibold">
                  Save Session
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 4: ADD NEW MENTOR */}
      {addMentorModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl shadow-2xl border border-[#E4E4E7] w-full max-w-2xl max-h-[90vh] flex flex-col overflow-hidden animate-in fade-in-50 zoom-in-95 my-auto">
            <div className="px-6 py-4 bg-gradient-to-r from-blue-600 to-indigo-600 text-white flex items-center justify-between shrink-0">
              <div>
                <h3 className="font-bold text-base flex items-center gap-2">
                  <UserPlus className="h-4 w-4" />
                  <span>Add Mentor</span>
                </h3>
                <p className="text-xs text-white/80">Register an industry mentor or advisor into the network pool</p>
              </div>
              <button onClick={() => setAddMentorModalOpen(false)} className="text-white/70 hover:text-white">
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleCreateMentor} className="p-6 space-y-4 overflow-y-auto flex-1">
              {/* Row 1: Name and Title */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <Label className="text-xs font-bold text-zinc-700">Full Name *</Label>
                  <Input
                    value={mentorName}
                    onChange={(e) => setMentorName(e.target.value)}
                    placeholder="e.g. Dr. Asha Rao"
                    required
                  />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs font-bold text-zinc-700">Professional Title *</Label>
                  <Input
                    value={mentorTitle}
                    onChange={(e) => setMentorTitle(e.target.value)}
                    placeholder="e.g. Ex-Director, HealthTech Corp | Angel Investor"
                    required
                  />
                </div>
              </div>

              {/* Row 2: Phone and LinkedIn */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <Label className="text-xs font-bold text-zinc-700">Phone Number (Optional)</Label>
                  <Input
                    value={mentorPhone}
                    onChange={(e) => setMentorPhone(e.target.value)}
                    placeholder="e.g. +91 98765 43210"
                  />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs font-bold text-zinc-700">LinkedIn Profile (Optional)</Label>
                  <Input
                    value={mentorLinkedin}
                    onChange={(e) => setMentorLinkedin(e.target.value)}
                    placeholder="e.g. https://linkedin.com/in/asharao"
                  />
                </div>
              </div>

              {/* Row 3: Geography, Availability, Max Matches */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="space-y-1.5">
                  <Label className="text-xs font-bold text-zinc-700">Geography</Label>
                  <select
                    value={mentorGeography}
                    onChange={(e) => setMentorGeography(e.target.value as Mentor['geography'])}
                    className="w-full text-sm border border-zinc-300 rounded-lg p-2 bg-white"
                  >
                    {ALL_GEOGRAPHIES.map((g) => (
                      <option key={g.value} value={g.value}>
                        {g.label}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs font-bold text-zinc-700">Availability</Label>
                  <select
                    value={mentorAvailability}
                    onChange={(e) => setMentorAvailability(e.target.value as Mentor['availability'])}
                    className="w-full text-sm border border-zinc-300 rounded-lg p-2 bg-white"
                  >
                    <option value="HIGH">High (2-4 hrs/wk)</option>
                    <option value="MEDIUM">Medium (1-2 hrs/wk)</option>
                    <option value="LOW">Low (Ad-hoc / On-demand)</option>
                  </select>
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs font-bold text-zinc-700">Max Active Matches</Label>
                  <Input
                    type="number"
                    min={1}
                    max={20}
                    value={mentorMaxActiveMatches}
                    onChange={(e) => setMentorMaxActiveMatches(Math.max(1, parseInt(e.target.value) || 1))}
                    required
                  />
                </div>
              </div>

              {/* Row 4: Areas of Expertise */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <Label className="text-xs font-bold text-zinc-700">
                    Areas of Expertise * ({mentorExpertise.length} selected)
                  </Label>
                  <span className="text-[11px] text-zinc-400">Click to select/deselect</span>
                </div>
                <div className="flex flex-wrap gap-1.5 max-h-36 overflow-y-auto p-2 border border-zinc-200 rounded-lg bg-zinc-50/50">
                  {ALL_EXPERTISE.map((exp) => {
                    const isSelected = mentorExpertise.includes(exp);
                    return (
                      <button
                        key={exp}
                        type="button"
                        onClick={() => toggleMentorExpertise(exp)}
                        className={`text-xs px-2.5 py-1 rounded-full border transition-all ${
                          isSelected
                            ? 'bg-blue-600 text-white border-blue-600 font-medium shadow-2xs'
                            : 'bg-white text-zinc-700 border-zinc-200 hover:border-zinc-400'
                        }`}
                      >
                        {isSelected ? '✓ ' : '+ '}{exp}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Row 5: Sectors */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <Label className="text-xs font-bold text-zinc-700">
                    Target Industry Sectors ({mentorSectors.length} selected)
                  </Label>
                  <span className="text-[11px] text-zinc-400">Click to select/deselect</span>
                </div>
                <div className="flex flex-wrap gap-1.5 p-2 border border-zinc-200 rounded-lg bg-zinc-50/50">
                  {ALL_SECTORS.map((sec) => {
                    const isSelected = mentorSectors.includes(sec);
                    return (
                      <button
                        key={sec}
                        type="button"
                        onClick={() => toggleMentorSector(sec)}
                        className={`text-xs px-2.5 py-1 rounded-full border transition-all ${
                          isSelected
                            ? 'bg-indigo-600 text-white border-indigo-600 font-medium shadow-2xs'
                            : 'bg-white text-zinc-700 border-zinc-200 hover:border-zinc-400'
                        }`}
                      >
                        {isSelected ? '✓ ' : '+ '}{sec}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Row 6: Stage Focus */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <Label className="text-xs font-bold text-zinc-700">
                    Stage Focus ({mentorStages.length} selected)
                  </Label>
                  <span className="text-[11px] text-zinc-400">Click to select/deselect</span>
                </div>
                <div className="flex flex-wrap gap-1.5 p-2 border border-zinc-200 rounded-lg bg-zinc-50/50">
                  {ALL_STAGES.map((stg) => {
                    const isSelected = mentorStages.includes(stg);
                    return (
                      <button
                        key={stg}
                        type="button"
                        onClick={() => toggleMentorStage(stg)}
                        className={`text-xs px-2.5 py-1 rounded-full border transition-all ${
                          isSelected
                            ? 'bg-emerald-600 text-white border-emerald-600 font-medium shadow-2xs'
                            : 'bg-white text-zinc-700 border-zinc-200 hover:border-zinc-400'
                        }`}
                      >
                        {isSelected ? '✓ ' : '+ '}{stg}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Row 7: Bio */}
              <div className="space-y-1.5">
                <Label className="text-xs font-bold text-zinc-700">Background & Biography</Label>
                <textarea
                  value={mentorBio}
                  onChange={(e) => setMentorBio(e.target.value)}
                  placeholder="Summarize the mentor's past achievements, executive leadership background, domain expertise, and advisory experience..."
                  rows={3}
                  className="w-full text-sm border border-zinc-300 rounded-lg p-2.5 bg-white text-zinc-900 focus:outline-hidden focus:ring-2 focus:ring-blue-500"
                />
              </div>

              {/* Footer */}
              <div className="flex items-center justify-between pt-4 border-t border-zinc-100 shrink-0">
                <Button
                  type="button"
                  variant="ghost"
                  onClick={() => setAddMentorModalOpen(false)}
                  disabled={isSubmittingMentor}
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  disabled={isSubmittingMentor}
                  className="bg-[#2563EB] hover:bg-blue-700 text-white font-semibold gap-1.5 shadow-2xs"
                >
                  {isSubmittingMentor ? (
                    'Adding Mentor...'
                  ) : (
                    <>
                      <UserPlus className="h-4 w-4" />
                      <span>Save & Add Mentor</span>
                    </>
                  )}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
