'use client';

import { useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { useStore } from '@/store';
import { Startup, Sector, Stage, IPStatus, CommercialSignal } from '@/types';
import { parseStartupExcel, generateStartupExcel } from '@/lib/excelService';
import { computeInvestibilityScore, generateAIAnalysis } from '@/lib/aiAnalysis';
import { uploadAuditExcelAction } from '@/app/actions/storage';
import {
  Upload,
  FileSpreadsheet,
  Download,
  CheckCircle2,
  X,
  FileCheck,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';

interface StartupUploadModalProps {
  isOpen: boolean;
  onClose: () => void;
  defaultManagerId?: string;
  defaultAssociateId?: string;
}

const SECTORS: Sector[] = [
  'AI_ML',
  'MEDTECH',
  'AGRITECH',
  'CYBERSECURITY',
  'UAV',
  'SEMICONDUCTOR',
  'ADVANCED_MATERIALS',
];

const STAGES: Stage[] = [
  'PRE_INCUBATION',
  'EARLY_INCUBATION',
  'MID_INCUBATION',
  'LATE_INCUBATION',
  'ACCELERATION',
  'GRADUATED',
];

export function StartupUploadModal({
  isOpen,
  onClose,
  defaultManagerId,
  defaultAssociateId,
}: StartupUploadModalProps) {
  const router = useRouter();
  const { createStartup, startups, users } = useStore();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [fileName, setFileName] = useState<string | null>(null);
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);
  const [parsing, setParsing] = useState(false);

  // Form State
  const [name, setName] = useState('');
  const [oneLiner, setOneLiner] = useState('');
  const [sector, setSector] = useState<Sector>('ADVANCED_MATERIALS');
  const [stage, setStage] = useState<Stage>('LATE_INCUBATION');
  const [cohort, setCohort] = useState('FITT-2026');
  const [city, setCity] = useState('New Delhi');
  const [website, setWebsite] = useState('https://');
  const [trl, setTrl] = useState(7);
  const [ipStatus, setIpStatus] = useState<IPStatus>('FILED');
  const [ipOwnershipClear, setIpOwnershipClear] = useState(true);
  const [commercialSignal, setCommercialSignal] = useState<CommercialSignal>('PAYING');
  const [grantSanctioned, setGrantSanctioned] = useState(5000000);
  const [grantDisbursed, setGrantDisbursed] = useState(3000000);
  const managers = users.filter((u) => u.role === 'INVESTMENT_MANAGER');
  const defaultMgr = defaultManagerId || managers[0]?.id || '';
  const [managerId, setManagerId] = useState(defaultMgr);
  const [associateId, setAssociateId] = useState<string | null>(defaultAssociateId || null);

  // Preserved parsed FITT tracker if uploaded via Excel
  const [parsedTracker, setParsedTracker] = useState<Startup['fittTracker'] | undefined>(undefined);

  if (!isOpen) return null;

  // File Upload & Parsing Handler: Automatically reads and populates all parameters
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setParsing(true);
    setFileName(file.name);
    setUploadedFile(file);

    const reader = new FileReader();
    reader.onload = (evt) => {
      try {
        const buffer = evt.target?.result as ArrayBuffer;
        const parsed = parseStartupExcel(buffer);

        if (parsed.name) setName(parsed.name);
        if (parsed.oneLiner) setOneLiner(parsed.oneLiner);
        if (parsed.sector) setSector(parsed.sector);
        if (parsed.stage) setStage(parsed.stage);
        if (parsed.cohort) setCohort(parsed.cohort);
        if (parsed.city) setCity(parsed.city);
        if (parsed.website) setWebsite(parsed.website);
        if (parsed.trl !== undefined) setTrl(parsed.trl);
        if (parsed.ipStatus) setIpStatus(parsed.ipStatus);
        if (parsed.ipOwnershipClear !== undefined) setIpOwnershipClear(parsed.ipOwnershipClear);
        if (parsed.commercialSignal) setCommercialSignal(parsed.commercialSignal);
        if (parsed.grantSanctioned !== undefined) setGrantSanctioned(parsed.grantSanctioned);
        if (parsed.grantDisbursed !== undefined) setGrantDisbursed(parsed.grantDisbursed);
        if (parsed.fittTracker) setParsedTracker(parsed.fittTracker);

        toast.success(`Excel file "${file.name}" parsed! All parameters automatically populated.`);
      } catch (err) {
        console.error('Failed to parse Excel:', err);
        toast.error('Failed to parse file. Please verify sheet format.');
      } finally {
        setParsing(false);
      }
    };
    reader.readAsArrayBuffer(file);
  };

  // Download Sample Template Handler
  const handleDownloadTemplate = () => {
    try {
      const templateStartup = startups.find((s) => s.id === 's31') || startups[0];
      const buffer = generateStartupExcel(templateStartup);
      const blob = new Blob([buffer as Uint8Array<ArrayBuffer>], {
        type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `Indigotex_FITT_Tracker_Template.xlsx`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      toast.success('Downloaded Indigotex multi-sheet template');
    } catch (err) {
      console.error(err);
      toast.error('Error generating template');
    }
  };

  // Form Submit Handler
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      toast.error('Startup name is required');
      return;
    }

    const newId = `s-${Date.now().toString(36)}`;
    const baseStartup: Startup = {
      id: newId,
      name: name.trim(),
      oneLiner: oneLiner.trim() || `${sector} venture at ${stage.toLowerCase()}`,
      sector,
      stage,
      cohort,
      foundedOn: '2024-01-15',
      city,
      website,
      managerId,
      associateId,
      trl,
      trlUpdatedOn: new Date().toISOString().split('T')[0],
      ipStatus,
      ipOwnershipClear,
      commercialSignal,
      grantSanctioned: Number(grantSanctioned) || 0,
      grantDisbursed: Number(grantDisbursed) || 0,
      founderToken: `token-${Date.now()}`,
      archived: false,
      regTags: [],
      fittTracker: parsedTracker,
    };

    // Calculate initial investibility and AI analysis for the startup section
    const finalStartup: Startup = {
      ...baseStartup,
      investibility: computeInvestibilityScore(baseStartup),
      aiAnalysis: generateAIAnalysis(baseStartup),
    };

    const res = await createStartup(finalStartup);
    if (res?.error) {
      toast.error(`Failed to create startup: ${res.error}`);
      return;
    }

    const targetId = res?.data?.id || finalStartup.id;

    if (uploadedFile) {
      try {
        const formData = new FormData();
        formData.append('startupId', targetId);
        formData.append('file', uploadedFile);
        const uploadRes = await uploadAuditExcelAction(formData);
        if (!uploadRes.error) {
          toast.success('Excel audit file securely archived in private storage');
        }
      } catch (uploadErr) {
        console.warn('Failed to archive audit Excel:', uploadErr);
      }
    }

    toast.success(`Startup "${finalStartup.name}" created! Redirecting to startup section...`);
    onClose();
    router.push(`/startups/${targetId}`);
  };

  const associates = users.filter((u) => u.role === 'INVESTMENT_ASSOCIATE' && u.managerId === managerId);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 overflow-y-auto">
      <div className="bg-white rounded-2xl shadow-2xl border border-[#E4E4E7] w-full max-w-3xl max-h-[90vh] flex flex-col overflow-hidden animate-in fade-in-50 zoom-in-95 duration-150">
        {/* Header */}
        <div className="px-6 py-4 bg-gradient-to-r from-blue-600 to-indigo-600 text-white flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-white/10 rounded-lg">
              <FileSpreadsheet className="h-5 w-5 text-white" />
            </div>
            <div>
              <h2 className="text-lg font-bold">Add Startup</h2>
              <p className="text-xs text-white/80">
                Upload an Excel sheet (.xlsx/.csv) to auto-fill parameters, or enter details manually.
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-white/70 hover:text-white hover:bg-white/10 transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Excel Upload Strip */}
        <div className="bg-[#FAFAFA] px-6 py-3.5 border-b border-[#E4E4E7] flex flex-wrap items-center justify-between gap-3 shrink-0">
          <div className="flex items-center gap-3">
            <input
              ref={fileInputRef}
              type="file"
              accept=".xlsx,.xls,.csv"
              onChange={handleFileUpload}
              className="hidden"
            />
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => fileInputRef.current?.click()}
              disabled={parsing}
              className="bg-white border-blue-600 text-blue-600 hover:bg-blue-600 hover:text-white font-medium gap-1.5 shadow-2xs"
            >
              <Upload className="h-3.5 w-3.5" />
              {parsing ? 'Parsing Excel...' : 'Upload Startup Excel (.xlsx)'}
            </Button>

            {fileName && (
              <div className="flex items-center gap-1.5 text-xs font-semibold text-blue-700 bg-blue-50 border border-blue-200 px-2.5 py-1 rounded-md">
                <CheckCircle2 className="h-3.5 w-3.5 text-blue-600" />
                <span className="truncate max-w-[200px]">{fileName}</span>
              </div>
            )}
          </div>

          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={handleDownloadTemplate}
            className="text-xs text-zinc-600 hover:text-blue-600 hover:bg-white gap-1.5"
          >
            <Download className="h-3.5 w-3.5" />
            Download Indigotex Template (.xlsx)
          </Button>
        </div>

        {/* Ingested confirmation badge if parsed */}
        {parsedTracker && (
          <div className="mx-6 mt-4 p-3 bg-blue-50 border border-blue-200 rounded-xl flex items-center justify-between text-xs text-blue-900">
            <div className="flex items-center gap-2">
              <FileCheck className="h-4 w-4 text-blue-600" />
              <span>
                <b>Multi-Sheet Ingestion Active:</b> {parsedTracker.baseline.founders.length} founders,{' '}
                {parsedTracker.baseline.capTable.length} cap table entries,{' '}
                {parsedTracker.monthlyCheckins.length} monthly check-ins loaded into startup section.
              </span>
            </div>
          </div>
        )}

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-6 space-y-5">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label htmlFor="startup-name" className="text-xs font-bold text-zinc-700">
                Startup Name *
              </Label>
              <Input
                id="startup-name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g. Indigotex Private Limited"
                className="focus-visible:ring-blue-600"
                required
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="one-liner" className="text-xs font-bold text-zinc-700">
                One Liner Pitch
              </Label>
              <Input
                id="one-liner"
                value={oneLiner}
                onChange={(e) => setOneLiner(e.target.value)}
                placeholder="Sustainable bio-indigo dyeing solution for denim"
                className="focus-visible:ring-blue-600"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-1.5">
              <Label className="text-xs font-bold text-zinc-700">Sector</Label>
              <select
                value={sector}
                onChange={(e) => setSector(e.target.value as Sector)}
                className="w-full text-sm border border-zinc-200 rounded-lg p-2 bg-white focus:outline-hidden focus:ring-2 focus:ring-blue-600"
              >
                {SECTORS.map((s) => (
                  <option key={s} value={s}>
                    {s.replace(/_/g, ' ')}
                  </option>
                ))}
              </select>
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs font-bold text-zinc-700">Incubation Stage</Label>
              <select
                value={stage}
                onChange={(e) => setStage(e.target.value as Stage)}
                className="w-full text-sm border border-zinc-200 rounded-lg p-2 bg-white focus:outline-hidden focus:ring-2 focus:ring-blue-600"
              >
                {STAGES.map((s) => (
                  <option key={s} value={s}>
                    {s.replace(/_/g, ' ')}
                  </option>
                ))}
              </select>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="cohort" className="text-xs font-bold text-zinc-700">
                Cohort / Batch
              </Label>
              <Input
                id="cohort"
                value={cohort}
                onChange={(e) => setCohort(e.target.value)}
                placeholder="e.g. FITT-2026"
                className="focus-visible:ring-blue-600"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-1.5">
              <Label htmlFor="trl" className="text-xs font-bold text-zinc-700">
                Technology Readiness (TRL 1-9)
              </Label>
              <Input
                id="trl"
                type="number"
                min={1}
                max={9}
                value={trl}
                onChange={(e) => setTrl(Number(e.target.value) || 1)}
                className="focus-visible:ring-blue-600"
              />
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs font-bold text-zinc-700">IP Status</Label>
              <select
                value={ipStatus}
                onChange={(e) => setIpStatus(e.target.value as IPStatus)}
                className="w-full text-sm border border-zinc-200 rounded-lg p-2 bg-white focus:outline-hidden focus:ring-2 focus:ring-blue-600"
              >
                <option value="GRANTED">GRANTED</option>
                <option value="FILED">FILED</option>
                <option value="PROVISIONAL">PROVISIONAL</option>
                <option value="TRADE_SECRET">TRADE SECRET</option>
                <option value="NONE">NONE</option>
              </select>
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs font-bold text-zinc-700">Commercial Signal</Label>
              <select
                value={commercialSignal}
                onChange={(e) => setCommercialSignal(e.target.value as CommercialSignal)}
                className="w-full text-sm border border-zinc-200 rounded-lg p-2 bg-white focus:outline-hidden focus:ring-2 focus:ring-blue-600"
              >
                <option value="PAYING">PAYING CUSTOMERS</option>
                <option value="PILOT">LOI / ACTIVE PILOT</option>
                <option value="PRE_REVENUE">PRE-REVENUE</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label htmlFor="grant-sanctioned" className="text-xs font-bold text-zinc-700">
                Grant Sanctioned (₹)
              </Label>
              <Input
                id="grant-sanctioned"
                type="number"
                value={grantSanctioned}
                onChange={(e) => setGrantSanctioned(Number(e.target.value) || 0)}
                className="focus-visible:ring-blue-600"
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="grant-disbursed" className="text-xs font-bold text-zinc-700">
                Grant Disbursed (₹)
              </Label>
              <Input
                id="grant-disbursed"
                type="number"
                value={grantDisbursed}
                onChange={(e) => setGrantDisbursed(Number(e.target.value) || 0)}
                className="focus-visible:ring-blue-600"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label className="text-xs font-bold text-zinc-700">Assigned Portfolio Head</Label>
              <select
                value={managerId}
                onChange={(e) => {
                  setManagerId(e.target.value);
                  setAssociateId(null);
                }}
                className="w-full text-sm border border-zinc-200 rounded-lg p-2 bg-white focus:outline-hidden focus:ring-2 focus:ring-blue-600"
              >
                {managers.map((m) => (
                  <option key={m.id} value={m.id}>
                    {m.label} ({m.email})
                  </option>
                ))}
              </select>
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs font-bold text-zinc-700">Assigned Portfolio Manager</Label>
              <select
                value={associateId || ''}
                onChange={(e) => setAssociateId(e.target.value || null)}
                className="w-full text-sm border border-zinc-200 rounded-lg p-2 bg-white focus:outline-hidden focus:ring-2 focus:ring-blue-600"
              >
                <option value="">Unassigned</option>
                {associates.map((a) => (
                  <option key={a.id} value={a.id}>
                    {a.label}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Footer Controls */}
          <div className="flex items-center justify-between pt-4 border-t border-[#E4E4E7] shrink-0">
            <Button type="button" variant="ghost" onClick={onClose} className="text-zinc-600">
              Cancel
            </Button>
            <Button
              type="submit"
              className="bg-blue-600 hover:bg-blue-700 text-white font-semibold px-6 shadow-sm"
            >
              Create Startup
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
