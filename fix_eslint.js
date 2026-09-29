const fs = require('fs');

function replaceInFile(file, replacements) {
  let content = fs.readFileSync(file, 'utf8');
  let original = content;
  replacements.forEach(r => {
    content = content.replace(r.from, r.to);
  });
  if (content !== original) {
    fs.writeFileSync(file, content);
    console.log(`Fixed ${file}`);
  }
}

// admin/managers/[id]/page.tsx
replaceInFile('src/app/(authenticated)/admin/managers/[id]/page.tsx', [
  { from: 'mRunwayU3 = 0, mOverdueMilestones = 0', to: 'mRunwayU3 = 0' },
  { from: 'mOverdueMilestones += overdueM;', to: '' },
  { from: 'const mMedianRunway = mRunways.length', to: '// eslint-disable-next-line @typescript-eslint/no-unused-vars\n  const mMedianRunway = mRunways.length' }
]);

// admin/page.tsx
replaceInFile('src/app/(authenticated)/admin/page.tsx', [
  { from: 'import { getLatestMetrics, getLatestApprovedAssessment', to: 'import { getLatestApprovedAssessment' },
  { from: "import { Button } from '@/components/ui/button';\n", to: '' },
  { from: "import { Badge } from '@/components/ui/badge';\n", to: '' },
  { from: "import { AlertCircle } from 'lucide-react';\n", to: '' },
  { from: 'const prevMonthStr =', to: '// eslint-disable-next-line @typescript-eslint/no-unused-vars\n  const prevMonthStr =' }
]);

// assessments/page.tsx
replaceInFile('src/app/(authenticated)/assessments/page.tsx', [
  { from: 'import { scopeStartups, can } from', to: 'import { scopeStartups } from' },
  { from: "import { formatINR } from '@/lib/utils';\n", to: '' }
]);

// portfolio/columns.tsx
replaceInFile('src/app/(authenticated)/portfolio/columns.tsx', [
  { from: 'import { Startup, User } from', to: 'import { Startup } from' }
]);

// portfolio/page.tsx
replaceInFile('src/app/(authenticated)/portfolio/page.tsx', [
  { from: "import { Card, CardContent, CardHeader, CardTitle, CardDescription }", to: "import { Card, CardContent, CardHeader, CardTitle }" },
  { from: "import { Tabs, TabsContent, TabsList, TabsTrigger }", to: "import { Tabs, TabsList, TabsTrigger }" }
]);

// startups/[id]/page.tsx
replaceInFile('src/app/(authenticated)/startups/[id]/page.tsx', [
  { from: 'import { getLatestMetrics, getLatestApprovedAssessment', to: 'import { getLatestApprovedAssessment' },
  { from: "import { ArrowLeft, ExternalLink, AlertCircle, CheckCircle2, Clock, XCircle } from 'lucide-react';\n", to: "import { ArrowLeft, ExternalLink, AlertCircle, CheckCircle2, Clock, XCircle } from 'lucide-react';\n" },
  { from: "import Link from 'next/link';\n", to: '' },
  { from: "  const [formData, setFormData] = useState({\n    name: startup.name,\n    oneLiner: startup.oneLiner,\n    website: startup.website,\n    city: startup.city\n  });", to: '' },
  { from: '  const manager = users.find(u => u.id === startup.managerId);', to: `
  const [formData, setFormData] = useState({
    name: startup.name,
    oneLiner: startup.oneLiner,
    website: startup.website,
    city: startup.city
  });
  const manager = users.find(u => u.id === startup.managerId);` }
]);

// submissions/page.tsx
replaceInFile('src/app/(authenticated)/submissions/page.tsx', [
  { from: "You're all caught up!", to: "You&apos;re all caught up!" }
]);

// founder/[token]/page.tsx
replaceInFile('src/app/founder/[token]/page.tsx', [
  { from: "import { Textarea } from '@/components/ui/textarea';\n", to: '' },
  { from: "import { formatINR } from '@/lib/utils';\n", to: '' },
  { from: "  const router = useRouter();\n", to: '' }
]);

// data-table.tsx
replaceInFile('src/components/ui/data-table.tsx', [
  { from: "import { DropdownMenu, DropdownMenuCheckboxItem, DropdownMenuContent, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';\n", to: '' }
]);

// derived.ts
replaceInFile('src/lib/derived.ts', [
  { from: 'import { Startup, MonthlyMetrics, HealthAssessment, Milestone, DataRequest, FounderSubmission, MentorMatch }', to: 'import { MonthlyMetrics, HealthAssessment, Milestone, DataRequest, FounderSubmission }' }
]);

// insights.ts
replaceInFile('src/lib/insights.ts', [
  { from: 'import { Startup, RegulatoryItem, MonthlyMetrics, HealthAssessment, Mentor, MentorMatch, Milestone }', to: 'import { Startup, RegulatoryItem, MonthlyMetrics, HealthAssessment, Mentor, MentorMatch }' },
  { from: 'suggestedAction: {\n    label: string;\n    type: \'SEND_MESSAGE\' | \'SEND_REQUEST\' | \'DRAFT_MENTOR_MATCH\' | \'VIEW_REGULATORY\';\n    payload?: any;\n  };', to: 'suggestedAction: {\n    label: string;\n    type: \'SEND_MESSAGE\' | \'SEND_REQUEST\' | \'DRAFT_MENTOR_MATCH\' | \'VIEW_REGULATORY\';\n    // eslint-disable-next-line @typescript-eslint/no-explicit-any\n    payload?: any;\n  };' },
  { from: 'demoToday: string', to: '_demoToday: string' }
]);

// rbac.test.ts
replaceInFile('src/lib/rbac.test.ts', [
  { from: "const im2 = users.find(u => u.id === 'im2')!;", to: "" }
]);
