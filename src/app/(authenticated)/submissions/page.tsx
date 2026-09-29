'use client';

import { useStore } from '@/store';
import { scopeStartups } from '@/lib/rbac';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import Link from 'next/link';

export default function SubmissionsPage() {
  const { currentUser, startups, submissions, dataRequests } = useStore();
  if (!currentUser) return null;

  const accessibleStartups = scopeStartups(currentUser, startups);
  const startupIds = new Set(accessibleStartups.map(s => s.id));

  const scopedSubmissions = submissions.filter(s => startupIds.has(s.startupId)).sort((a, b) => new Date(b.submittedOn).getTime() - new Date(a.submittedOn).getTime());
  const scopedRequests = dataRequests.filter(r => startupIds.has(r.startupId)).sort((a, b) => new Date(b.dueDate).getTime() - new Date(a.dueDate).getTime());

  const pending = scopedSubmissions.filter(s => s.status === 'PENDING_REVIEW');
  const accepted = scopedSubmissions.filter(s => s.status === 'ACCEPTED');

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold text-black">Founder Submissions</h1>
        {currentUser.role === 'INVESTMENT_ASSOCIATE' && (
          <Button className="bg-[#1E4133] text-white hover:bg-[#144B3B]">+ Request Data</Button>
        )}
      </div>

      <Tabs defaultValue="pending" className="w-full">
        <TabsList>
          <TabsTrigger value="pending">Pending Review ({pending.length})</TabsTrigger>
          <TabsTrigger value="accepted">Accepted ({accepted.length})</TabsTrigger>
          <TabsTrigger value="requests">Open Requests ({scopedRequests.filter(r => r.status === 'OPEN').length})</TabsTrigger>
        </TabsList>

        <TabsContent value="pending" className="mt-4">
          <Card>
            <CardHeader><CardTitle>Submissions Pending Review</CardTitle></CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <table className="w-full text-sm text-left">
                  <thead className="text-xs text-black/60 uppercase bg-gray-50 border-b">
                    <tr>
                      <th className="px-4 py-3">Startup</th>
                      <th className="px-4 py-3">Submitted On</th>
                      <th className="px-4 py-3">Request Title</th>
                      <th className="px-4 py-3">Type</th>
                      <th className="px-4 py-3">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {pending.map(sub => {
                      const s = accessibleStartups.find(st => st.id === sub.startupId);
                      const req = scopedRequests.find(r => r.id === sub.requestId);
                      return (
                        <tr key={sub.id} className="border-b bg-amber-50/30">
                          <td className="px-4 py-3 font-medium">
                            {s ? <Link href={`/startups/${s.id}`} className="text-black hover:underline">{s.name}</Link> : '-'}
                          </td>
                          <td className="px-4 py-3">{sub.submittedOn}</td>
                          <td className="px-4 py-3">{req?.title || '-'}</td>
                          <td className="px-4 py-3"><Badge variant="outline">{req?.type || '-'}</Badge></td>
                          <td className="px-4 py-3">
                            <Button variant="outline" size="sm" className="mr-2 border-green-600 text-green-600 hover:bg-green-50">Approve</Button>
                            <Button variant="outline" size="sm" className="border-red-600 text-red-600 hover:bg-red-50">Reject</Button>
                          </td>
                        </tr>
                      );
                    })}
                    {pending.length === 0 && (
                      <tr>
                        <td colSpan={5} className="px-4 py-8 text-center text-black/60">No pending submissions. You&apos;re all caught up!</td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="accepted" className="mt-4">
          <Card>
            <CardHeader><CardTitle>Accepted Submissions</CardTitle></CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <table className="w-full text-sm text-left">
                  <thead className="text-xs text-black/60 uppercase bg-gray-50 border-b">
                    <tr>
                      <th className="px-4 py-3">Startup</th>
                      <th className="px-4 py-3">Submitted On</th>
                      <th className="px-4 py-3">Request Title</th>
                      <th className="px-4 py-3">Reviewed By</th>
                    </tr>
                  </thead>
                  <tbody>
                    {accepted.map(sub => {
                      const s = accessibleStartups.find(st => st.id === sub.startupId);
                      const req = scopedRequests.find(r => r.id === sub.requestId);
                      return (
                        <tr key={sub.id} className="border-b">
                          <td className="px-4 py-3 font-medium">
                            {s ? <Link href={`/startups/${s.id}`} className="text-black hover:underline">{s.name}</Link> : '-'}
                          </td>
                          <td className="px-4 py-3">{sub.submittedOn}</td>
                          <td className="px-4 py-3">{req?.title || '-'}</td>
                          <td className="px-4 py-3">{sub.reviewedBy || '-'}</td>
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
            <CardHeader><CardTitle>Open Data Requests</CardTitle></CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <table className="w-full text-sm text-left">
                  <thead className="text-xs text-black/60 uppercase bg-gray-50 border-b">
                    <tr>
                      <th className="px-4 py-3">Startup</th>
                      <th className="px-4 py-3">Title</th>
                      <th className="px-4 py-3">Type</th>
                      <th className="px-4 py-3">Due Date</th>
                      <th className="px-4 py-3">Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {scopedRequests.filter(r => r.status === 'OPEN').map(req => {
                      const s = accessibleStartups.find(st => st.id === req.startupId);
                      const isOverdue = new Date().getTime() > new Date(req.dueDate).getTime();
                      return (
                        <tr key={req.id} className="border-b">
                          <td className="px-4 py-3 font-medium">
                            {s ? <Link href={`/startups/${s.id}`} className="text-black hover:underline">{s.name}</Link> : '-'}
                          </td>
                          <td className="px-4 py-3">{req.title}</td>
                          <td className="px-4 py-3"><Badge variant="outline">{req.type}</Badge></td>
                          <td className={`px-4 py-3 ${isOverdue ? 'text-red-600 font-bold' : ''}`}>{req.dueDate}</td>
                          <td className="px-4 py-3"><Badge variant="secondary">{req.status}</Badge></td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
