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

// startups/[id]/page.tsx
replaceInFile('src/app/(authenticated)/startups/[id]/page.tsx', [
  { from: `
  const [formData, setFormData] = useState({
    name: startup.name,
    oneLiner: startup.oneLiner,
    website: startup.website,
    city: startup.city
  });`, to: '' },
  { from: `  const startup = accessibleStartups.find(s => s.id === id);`, to: `  const startup = accessibleStartups.find(s => s.id === id);
  const [formData, setFormData] = useState({
    name: startup?.name || '',
    oneLiner: startup?.oneLiner || '',
    website: startup?.website || '',
    city: startup?.city || ''
  });` }
]);

// founder/[token]/page.tsx
replaceInFile('src/app/founder/[token]/page.tsx', [
  { from: "import { useParams, useRouter } from 'next/navigation';", to: "import { useParams } from 'next/navigation';" },
  { from: "  const latestMetrics = sMetrics[sMetrics.length - 1];\n", to: "" }
]);

// insights.ts
replaceInFile('src/lib/insights.ts', [
  { from: "  _demoToday: string\n", to: "  // eslint-disable-next-line @typescript-eslint/no-unused-vars\n  _demoToday: string\n" }
]);

// rbac.test.ts
replaceInFile('src/lib/rbac.test.ts', [
  { from: "  const im1 = users.find(u => u.id === 'im1')!;\n\n", to: "  const im1 = users.find(u => u.id === 'im1')!;\n" }
]);
