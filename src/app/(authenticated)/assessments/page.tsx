'use client';

import { useStore } from '@/store';
import { scopeStartups } from '@/lib/rbac';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { users } from '@/data/seed/users';

export default function AssessmentsPage() {
  const { currentUser, startups, assessments } = useStore();
  if (!currentUser) return null;

  const accessibleStartups = scopeStartups(currentUser, startups);
  const startupIds = new Set(accessibleStartups.map(s => s.id));
  
  const scopedAssessments = assessments.filter(a => startupIds.has(a.startupId)).sort((a, b) => b.month.localeCompare(a.month));

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold text-black">Health Assessments</h1>
        {currentUser.role === 'INVESTMENT_ASSOCIATE' && (
          <Button className="bg-[#1E4133] text-white hover:bg-[#144B3B]">+ New Assessment</Button>
        )}
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Assessments History</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left">
              <thead className="text-xs text-black/60 uppercase bg-gray-50 border-b">
                <tr>
                  <th className="px-4 py-3">Startup</th>
                  <th className="px-4 py-3">Month</th>
                  <th className="px-4 py-3">Status</th>
                  <th className="px-4 py-3">Score & Band</th>
                  <th className="px-4 py-3">Prepared By</th>
                  <th className="px-4 py-3">Approved By</th>
                  <th className="px-4 py-3">Action</th>
                </tr>
              </thead>
              <tbody>
                {scopedAssessments.map(a => {
                  const s = accessibleStartups.find(s => s.id === a.startupId);
                  if (!s) return null;
                  
                  const preparer = users.find(u => u.id === a.preparedBy);
                  const approver = users.find(u => u.id === a.approvedBy);
                  
                  return (
                    <tr key={a.id} className="border-b hover:bg-gray-50">
                      <td className="px-4 py-3 font-medium">
                        <Link href={`/startups/${s.id}`} className="text-black hover:underline">{s.name}</Link>
                      </td>
                      <td className="px-4 py-3">{a.month}</td>
                      <td className="px-4 py-3">
                        <Badge variant="outline" className={`
                          ${a.status === 'APPROVED' ? 'border-green-600 text-green-600' : ''}
                          ${a.status === 'AWAITING_APPROVAL' ? 'border-amber-600 text-amber-600' : ''}
                          ${a.status === 'DRAFT' ? 'border-gray-400 text-gray-500' : ''}
                        `}>
                          {a.status.replace('_', ' ')}
                        </Badge>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          <span className="font-semibold">{a.total}</span>
                          <Badge className={`${a.band === 'HEALTHY' ? 'bg-[#2E7D4F]' : a.band === 'WATCH' ? 'bg-[#B8860B]' : a.band === 'AT_RISK' ? 'bg-[#D2691E]' : 'bg-[#B42318]'} text-white`}>
                            {a.band}
                          </Badge>
                          {a.delta3m !== null && (
                            <span className={`text-xs ${a.delta3m >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                              {a.delta3m > 0 ? '▲' : '▼'} {Math.abs(a.delta3m)}
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="px-4 py-3">{preparer?.label || '-'}</td>
                      <td className="px-4 py-3">{approver?.label || '-'}</td>
                      <td className="px-4 py-3">
                        <Button variant="ghost" size="sm">
                          {a.status === 'DRAFT' && currentUser.role === 'INVESTMENT_ASSOCIATE' ? 'Edit' : 
                           a.status === 'AWAITING_APPROVAL' && currentUser.role === 'INVESTMENT_MANAGER' ? 'Review' : 'View'}
                        </Button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
            {scopedAssessments.length === 0 && (
              <div className="p-4 text-center text-black/60">No assessments found.</div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
