'use client';

import { useStore } from '@/store';
import { scopeStartups } from '@/lib/rbac';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import Link from 'next/link';
import { users } from '@/data/seed/users';

export default function MentorConnectPage() {
  const { currentUser, startups, mentors, mentorMatches, mentorRequests } = useStore();
  if (!currentUser) return null;

  const accessibleStartups = scopeStartups(currentUser, startups);
  const startupIds = new Set(accessibleStartups.map(s => s.id));

  const scopedMatches = mentorMatches.filter(m => startupIds.has(m.startupId));
  const scopedRequests = mentorRequests.filter(r => startupIds.has(r.startupId));

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold text-black">Mentor Connect</h1>
      </div>

      <Tabs defaultValue="matches" className="w-full">
        <TabsList>
          <TabsTrigger value="matches">Active Matches ({scopedMatches.length})</TabsTrigger>
          <TabsTrigger value="requests">Requests ({scopedRequests.length})</TabsTrigger>
          <TabsTrigger value="pool">Mentor Pool ({mentors.length})</TabsTrigger>
        </TabsList>

        <TabsContent value="matches" className="mt-4">
          <Card>
            <CardHeader><CardTitle>Active Matches</CardTitle></CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <table className="w-full text-sm text-left">
                  <thead className="text-xs text-black/60 uppercase bg-gray-50 border-b">
                    <tr>
                      <th className="px-4 py-3">Startup</th>
                      <th className="px-4 py-3">Mentor</th>
                      <th className="px-4 py-3">Confirmed By</th>
                      <th className="px-4 py-3">Confirmed On</th>
                      <th className="px-4 py-3">Status</th>
                      <th className="px-4 py-3">Sessions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {scopedMatches.map(m => {
                      const s = accessibleStartups.find(st => st.id === m.startupId);
                      const mentor = mentors.find(mt => mt.id === m.mentorId);
                      const conf = users.find(u => u.id === m.confirmedBy);
                      return (
                        <tr key={m.id} className="border-b">
                          <td className="px-4 py-3 font-medium">
                            {s ? <Link href={`/startups/${s.id}`} className="text-black hover:underline">{s.name}</Link> : '-'}
                          </td>
                          <td className="px-4 py-3 font-medium">{mentor?.name || m.mentorId}</td>
                          <td className="px-4 py-3">{conf?.label || '-'}</td>
                          <td className="px-4 py-3">{m.confirmedOn}</td>
                          <td className="px-4 py-3"><Badge className="bg-green-600 text-white">{m.status}</Badge></td>
                          <td className="px-4 py-3">{m.sessions.length}</td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="requests" className="mt-4">
          <Card>
            <CardHeader><CardTitle>Mentor Requests</CardTitle></CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <table className="w-full text-sm text-left">
                  <thead className="text-xs text-black/60 uppercase bg-gray-50 border-b">
                    <tr>
                      <th className="px-4 py-3">Startup</th>
                      <th className="px-4 py-3">Challenge</th>
                      <th className="px-4 py-3">Expertise Needed</th>
                      <th className="px-4 py-3">Raised By</th>
                      <th className="px-4 py-3">Created On</th>
                      <th className="px-4 py-3">Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {scopedRequests.map(r => {
                      const s = accessibleStartups.find(st => st.id === r.startupId);
                      return (
                        <tr key={r.id} className="border-b">
                          <td className="px-4 py-3 font-medium">
                            {s ? <Link href={`/startups/${s.id}`} className="text-black hover:underline">{s.name}</Link> : '-'}
                          </td>
                          <td className="px-4 py-3 max-w-[200px] truncate" title={r.challenge}>{r.challenge}</td>
                          <td className="px-4 py-3 flex gap-1 flex-wrap">
                            {r.expertiseNeeded.map(e => <Badge key={e} variant="outline" className="text-[10px]">{e}</Badge>)}
                          </td>
                          <td className="px-4 py-3">{r.raisedBy}</td>
                          <td className="px-4 py-3">{r.createdOn}</td>
                          <td className="px-4 py-3">
                            <Badge variant={r.status === 'PENDING' ? 'destructive' : 'secondary'}>{r.status}</Badge>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="pool" className="mt-4">
          <Card>
            <CardHeader><CardTitle>Mentor Pool</CardTitle></CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {mentors.map(m => {
                  const activeM = mentorMatches.filter(match => match.mentorId === m.id && match.status === 'ACTIVE').length;
                  return (
                    <div key={m.id} className="border rounded-md p-4 bg-white shadow-sm">
                      <div className="font-bold text-lg text-black">{m.name}</div>
                      <div className="text-sm text-black/60 mb-2">{m.title}</div>
                      <div className="flex gap-2 flex-wrap mb-3">
                        {m.expertise.map(e => <Badge key={e} variant="secondary" className="text-[10px]">{e}</Badge>)}
                      </div>
                      <div className="text-xs text-black/60 space-y-1">
                        <div><span className="font-medium text-black/80">Sectors:</span> {m.sectors.join(', ')}</div>
                        <div><span className="font-medium text-black/80">Geography:</span> {m.geography}</div>
                        <div><span className="font-medium text-black/80">Capacity:</span> {activeM} / {m.maxActiveMatches}</div>
                      </div>
                      <Button className="w-full mt-4" variant="outline" size="sm" disabled={activeM >= m.maxActiveMatches}>
                        {activeM >= m.maxActiveMatches ? 'Full Capacity' : 'Match Startup'}
                      </Button>
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
